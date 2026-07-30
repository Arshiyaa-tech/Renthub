const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorMiddleware');
const notificationService = require('../services/notificationService');
const { sendAvailabilityAlerts } = require('../services/availabilityAlertService');

// ============================================================
// Admin Dashboard Controller
// ============================================================

/**
 * GET /api/admin/dashboard
 * Returns aggregated platform statistics for the admin dashboard overview.
 */
exports.getDashboard = async (req, res, next) => {
  try {
    // User stats
    const totalUsers = await prisma.user.count();
    const owners = await prisma.user.count({ where: { role: 'OWNER' } });
    const renters = await prisma.user.count({ where: { role: 'RENTER' } });
    const verifiedUsers = await prisma.user.count({ where: { isVerified: true } });
    const suspendedUsers = await prisma.user.count({ where: { isVerified: false } }); // Treated as suspended

    // Listing stats
    const totalListings = await prisma.listing.count();
    const activeListings = await prisma.listing.count({ where: { isAvailable: true } });
    const unavailableListings = await prisma.listing.count({ where: { isAvailable: false } });

    // Booking stats
    const totalBookings = await prisma.booking.count();
    const pendingBookings = await prisma.booking.count({ where: { status: 'PENDING' } });
    const confirmedBookings = await prisma.booking.count({ where: { status: 'CONFIRMED' } });
    const activeBookings = await prisma.booking.count({ where: { status: 'ACTIVE' } });
    const completedBookings = await prisma.booking.count({ where: { status: 'COMPLETED' } });
    const cancelledBookings = await prisma.booking.count({ where: { status: 'CANCELLED' } });
    const rejectedBookings = await prisma.booking.count({ where: { status: 'REJECTED' } });

    // Revenue stats
    const payments = await prisma.payment.findMany({ where: { status: 'CAPTURED' } });
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const platformEarnings = payments.reduce((sum, p) => sum + p.platformFee, 0);

    // Review stats
    const totalReviews = await prisma.review.count();
    const avgRatingResult = await prisma.review.aggregate({ _avg: { rating: true } });
    const averageRating = avgRatingResult._avg.rating || 0;

    // Dispute stats
    const totalDisputes = await prisma.dispute.count();
    const openDisputes = await prisma.dispute.count({ where: { status: 'OPEN' } });
    const underReviewDisputes = await prisma.dispute.count({ where: { status: 'UNDER_REVIEW' } });
    const resolvedDisputes = await prisma.dispute.count({ where: { status: { in: ['APPROVED', 'RESOLVED'] } } });
    const rejectedDisputes = await prisma.dispute.count({ where: { status: 'REJECTED' } });

    // Category distribution
    const categories = await prisma.listing.groupBy({
      by: ['category'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    // Recent activity (last 10 bookings)
    const recentBookings = await prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        listing: { select: { id: true, title: true } },
        renter: { select: { id: true, fullName: true } },
        owner: { select: { id: true, fullName: true } },
      },
    });

    // Monthly stats for the current year
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = [];
    const monthlyBookings = [];

    for (let month = 1; month <= 12; month++) {
      const startOfMonth = new Date(currentYear, month - 1, 1);
      const endOfMonth = new Date(currentYear, month, 0, 23, 59, 59, 999);

      const monthPayments = await prisma.payment.findMany({
        where: {
          status: 'CAPTURED',
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
      });
      const monthRevenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);

      const monthBookings = await prisma.booking.count({
        where: { createdAt: { gte: startOfMonth, lte: endOfMonth } },
      });

      monthlyRevenue.push(monthRevenue);
      monthlyBookings.push(monthBookings);
    }

    // Top owners by revenue
    const topOwners = await prisma.user.findMany({
      where: { role: 'OWNER' },
      include: {
        ownerPayments: { where: { status: 'CAPTURED' } },
        listings: { select: { id: true } },
        receivedReviews: { select: { rating: true } },
      },
    });

    const topOwnersData = topOwners.map(o => ({
      id: o.id,
      fullName: o.fullName,
      email: o.email,
      profileImage: o.profileImage,
      totalRevenue: o.ownerPayments.reduce((s, p) => s + p.amount, 0),
      listingCount: o.listings.length,
      reviewCount: o.receivedReviews.length,
      averageRating: o.receivedReviews.length > 0
        ? o.receivedReviews.reduce((s, r) => s + r.rating, 0) / o.receivedReviews.length
        : 0,
    })).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10);

    // Top rented listings
    const topListings = await prisma.listing.findMany({
      include: {
        _count: { select: { bookings: true } },
        owner: { select: { id: true, fullName: true } },
        reviews: { select: { rating: true } },
      },
      orderBy: { bookings: { _count: 'desc' } },
      take: 10,
    });

    const topListingsData = topListings.map(l => ({
      id: l.id,
      title: l.title,
      category: l.category,
      dailyRate: l.dailyRate,
      imageUrls: l.imageUrls,
      ownerName: l.owner.fullName,
      bookingCount: l._count.bookings,
      averageRating: l.reviews.length > 0
        ? l.reviews.reduce((s, r) => s + r.rating, 0) / l.reviews.length
        : 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        stats: {
          users: { total: totalUsers, owners, renters, verified: verifiedUsers, suspended: suspendedUsers },
          listings: { total: totalListings, active: activeListings, unavailable: unavailableListings },
          bookings: { total: totalBookings, pending: pendingBookings, confirmed: confirmedBookings, active: activeBookings, completed: completedBookings, cancelled: cancelledBookings, rejected: rejectedBookings },
          revenue: { total: totalRevenue, platformEarnings, currency: 'INR', totalPayments: payments.length },
          reviews: { total: totalReviews, averageRating: Math.round(averageRating * 10) / 10 },
          disputes: { total: totalDisputes, open: openDisputes, underReview: underReviewDisputes, resolved: resolvedDisputes, rejected: rejectedDisputes },
        },
        charts: {
          categoryDistribution: categories.map(c => ({ category: c.category, count: c._count.id })),
          monthlyRevenue,
          monthlyBookings,
        },
        topOwners: topOwnersData,
        topListings: topListingsData,
        recentBookings,
      },
    });
  } catch (error) { next(error); }
};

/**
 * GET /api/admin/users
 * Returns all users with search, filter, and pagination.
 */
exports.getUsers = async (req, res, next) => {
  try {
    const { search, role, isVerified, sort } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;
    if (isVerified !== undefined) where.isVerified = isVerified === 'true';

    let orderBy = { createdAt: 'desc' };
    if (sort === 'oldest') orderBy = { createdAt: 'asc' };
    if (sort === 'alphabetical') orderBy = { fullName: 'asc' };
    if (sort === 'email') orderBy = { email: 'asc' };

    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    // Run count and query in parallel
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          profileImage: true,
          role: true,
          isVerified: true,
          location: true,
          bio: true,
          createdAt: true,
          _count: {
            select: {
              listings: true,
              renterBookings: true,
              ownerBookings: true,
              receivedReviews: true,
              raisedDisputes: true,
              againstDisputes: true,
            },
          },
          receivedReviews: { select: { rating: true } },
        },
      }),
    ]);

    const usersWithStats = users.map(u => ({
      ...u,
      _count: undefined,
      receivedReviews: undefined,
      totalListings: u._count.listings,
      totalBookings: u._count.renterBookings + u._count.ownerBookings,
      totalReviews: u._count.receivedReviews,
      averageRating: u.receivedReviews.length > 0
        ? Math.round((u.receivedReviews.reduce((s, r) => s + r.rating, 0) / u.receivedReviews.length) * 10) / 10
        : 0,
      totalDisputes: u._count.raisedDisputes + u._count.againstDisputes,
    }));

    const totalPages = Math.ceil(total / pageSize);
    res.status(200).json({
      success: true,
      data: usersWithStats,
      pagination: { page, pageSize, total, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
    });
  } catch (error) { next(error); }
};

/**
 * PATCH /api/admin/users/:id/verify
 * Verify a user's identity.
 */
exports.verifyUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return next(new AppError('User not found', 404));

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isVerified: true },
      select: { id: true, fullName: true, email: true, isVerified: true, role: true },
    });

    // Notify user about verification (non-blocking)
    notificationService.createNotification({
      userId: user.id,
      type: 'SYSTEM',
      channels: ['IN_APP', 'EMAIL'],
      title: 'Account Verified',
      message: 'Your account has been verified. You now have access to all platform features.',
    }).catch(() => {});

    res.status(200).json({ success: true, message: 'User verified successfully', data: updated });
  } catch (error) { next(error); }
};

/**
 * PATCH /api/admin/users/:id/suspend
 * Suspend a user (set isVerified to false).
 */
exports.suspendUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return next(new AppError('User not found', 404));
    if (user.role === 'OWNER' && user.isVerified) {
      // Also need to check if this is an admin — can't suspend other admins
      if (user.isVerified && req.user.id !== req.params.id) {
        // Allow suspension
      }
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isVerified: false },
      select: { id: true, fullName: true, email: true, isVerified: true, role: true },
    });

    res.status(200).json({ success: true, message: 'User suspended successfully', data: updated });
  } catch (error) { next(error); }
};

/**
 * PATCH /api/admin/users/:id/reactivate
 * Reactivate a suspended user.
 */
exports.reactivateUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return next(new AppError('User not found', 404));

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isVerified: true },
      select: { id: true, fullName: true, email: true, isVerified: true, role: true },
    });

    res.status(200).json({ success: true, message: 'User reactivated successfully', data: updated });
  } catch (error) { next(error); }
};

/**
 * DELETE /api/admin/users/:id
 * Delete a user (admin only).
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return next(new AppError('User not found', 404));
    if (req.user.id === req.params.id) return next(new AppError('Cannot delete your own account', 400));

    await prisma.user.delete({ where: { id: req.params.id } });

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) { next(error); }
};

/**
 * GET /api/admin/listings
 * Returns all listings with search, filter, and pagination.
 */
exports.getAdminListings = async (req, res, next) => {
  try {
    const { search, category, isAvailable, sort } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category;
    if (isAvailable !== undefined) where.isAvailable = isAvailable === 'true';

    let orderBy = { createdAt: 'desc' };
    if (sort === 'oldest') orderBy = { createdAt: 'asc' };
    if (sort === 'price_asc') orderBy = { dailyRate: 'asc' };
    if (sort === 'price_desc') orderBy = { dailyRate: 'desc' };
    if (sort === 'alphabetical') orderBy = { title: 'asc' };

    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    // Run count and query in parallel
    const [total, listings] = await Promise.all([
      prisma.listing.count({ where }),
      prisma.listing.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          owner: { select: { id: true, fullName: true, email: true, profileImage: true, isVerified: true } },
          _count: { select: { bookings: true, reviews: true } },
          reviews: { select: { rating: true } },
        },
      }),
    ]);

    const listingsWithStats = listings.map(l => ({
      id: l.id,
      title: l.title,
      category: l.category,
      condition: l.condition,
      dailyRate: l.dailyRate,
      securityDeposit: l.securityDeposit,
      location: l.location,
      imageUrls: l.imageUrls,
      isAvailable: l.isAvailable,
      owner: l.owner,
      bookingCount: l._count.bookings,
      reviewCount: l._count.reviews,
      averageRating: l.reviews.length > 0
        ? Math.round((l.reviews.reduce((s, r) => s + r.rating, 0) / l.reviews.length) * 10) / 10
        : 0,
      createdAt: l.createdAt,
    }));

    const totalPages = Math.ceil(total / pageSize);
    res.status(200).json({
      success: true,
      data: listingsWithStats,
      pagination: { page, pageSize, total, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
    });
  } catch (error) { next(error); }
};

/**
 * DELETE /api/admin/listings/:id
 * Delete a listing (admin override).
 */
exports.deleteAdminListing = async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing) return next(new AppError('Listing not found', 404));

    // Delete associated bookings, payments, reviews first
    await prisma.booking.deleteMany({ where: { listingId: req.params.id } });
    await prisma.payment.deleteMany({ where: { listingId: req.params.id } });
    await prisma.review.deleteMany({ where: { listingId: req.params.id } });
    await prisma.listing.delete({ where: { id: req.params.id } });

    res.status(200).json({ success: true, message: 'Listing deleted successfully' });
  } catch (error) { next(error); }
};

/**
 * PATCH /api/admin/listings/:id/status
 * Toggle listing availability.
 */
exports.toggleListingStatus = async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing) return next(new AppError('Listing not found', 404));

    const updated = await prisma.listing.update({
      where: { id: req.params.id },
      data: { isAvailable: !listing.isAvailable },
      select: { id: true, title: true, isAvailable: true },
    });

    // Notify listing owner when listing is disabled (non-blocking)
    // `listing.isAvailable` is the state BEFORE toggle; if it was true, we're going from enabled→disabled
    if (listing.isAvailable) {
      notificationService.createNotification({
        userId: listing.ownerId,
        type: 'LISTING_DISABLED',
        channels: ['IN_APP', 'EMAIL'],
        referenceType: 'listing',
        referenceId: listing.id,
        context: { listingTitle: listing.title },
      }).catch(() => {});
    }

    // If the listing became available (was disabled, now enabled), notify wishlisting users
    if (!listing.isAvailable && updated.isAvailable) {
      sendAvailabilityAlerts(updated.id, updated.title).catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: updated.isAvailable ? 'Listing enabled' : 'Listing disabled',
      data: updated,
    });
  } catch (error) { next(error); }
};

/**
 * GET /api/admin/bookings
 * Returns all bookings with search, filter, and pagination.
 */
exports.getAdminBookings = async (req, res, next) => {
  try {
    const { search, status, sort } = req.query;
    const where = {};

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { listing: { title: { contains: search, mode: 'insensitive' } } },
        { renter: { fullName: { contains: search, mode: 'insensitive' } } },
        { owner: { fullName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'oldest') orderBy = { createdAt: 'asc' };
    if (sort === 'status') orderBy = { status: 'asc' };
    if (sort === 'amount_desc') orderBy = { totalAmount: 'desc' };
    if (sort === 'amount_asc') orderBy = { totalAmount: 'asc' };

    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const [total, bookings] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          listing: { select: { id: true, title: true, imageUrls: true, category: true, dailyRate: true } },
          renter: { select: { id: true, fullName: true, email: true, profileImage: true } },
          owner: { select: { id: true, fullName: true, email: true, profileImage: true } },
          payment: { select: { id: true, status: true, amount: true } },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);
    res.status(200).json({
      success: true,
      data: bookings,
      pagination: { page, pageSize, total, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
    });
  } catch (error) { next(error); }
};

/**
 * PATCH /api/admin/bookings/:id
 * Admin update booking status (force complete, cancel, etc.).
 */
exports.updateAdminBooking = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'ACTIVE', 'COMPLETED'];
    if (!status || !validStatuses.includes(status)) return next(new AppError('Invalid status', 400));

    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) return next(new AppError('Booking not found', 404));

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        listing: { select: { id: true, title: true } },
        renter: { select: { id: true, fullName: true } },
        owner: { select: { id: true, fullName: true } },
        payment: { select: { id: true, status: true } },
      },
    });

    res.status(200).json({ success: true, message: 'Booking updated by admin', data: updated });
  } catch (error) { next(error); }
};

/**
 * GET /api/admin/payments
 * Returns all payments with search, filter, and pagination.
 */
exports.getAdminPayments = async (req, res, next) => {
  try {
    const { search, status, sort } = req.query;
    const where = {};

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { paymentIntentId: { contains: search, mode: 'insensitive' } },
        { booking: { listing: { title: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'oldest') orderBy = { createdAt: 'asc' };
    if (sort === 'amount_desc') orderBy = { amount: 'desc' };
    if (sort === 'amount_asc') orderBy = { amount: 'asc' };
    if (sort === 'status') orderBy = { status: 'asc' };

    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          booking: {
            select: { id: true, startDate: true, endDate: true, status: true, totalAmount: true },
            include: {
              listing: { select: { id: true, title: true, imageUrls: true, category: true } },
              renter: { select: { id: true, fullName: true, email: true } },
              owner: { select: { id: true, fullName: true, email: true } },
            },
          },
          listing: { select: { id: true, title: true } },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);
    res.status(200).json({
      success: true,
      data: payments,
      pagination: { page, pageSize, total, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
    });
  } catch (error) { next(error); }
};

/**
 * GET /api/admin/reviews
 * Returns all reviews with search, filter, and pagination.
 */
exports.getAdminReviews = async (req, res, next) => {
  try {
    const { search, rating, sort } = req.query;
    const where = {};

    if (rating) where.rating = parseInt(rating);
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { comment: { contains: search, mode: 'insensitive' } },
        { reviewer: { fullName: { contains: search, mode: 'insensitive' } } },
        { listing: { title: { contains: search, mode: 'insensitive' } } },
      ];
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'oldest') orderBy = { createdAt: 'asc' };
    if (sort === 'highest') orderBy = { rating: 'desc' };
    if (sort === 'lowest') orderBy = { rating: 'asc' };

    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const [total, reviews] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          reviewer: { select: { id: true, fullName: true, profileImage: true, email: true } },
          reviewee: { select: { id: true, fullName: true, profileImage: true } },
          listing: { select: { id: true, title: true, imageUrls: true } },
          booking: { select: { id: true, startDate: true, endDate: true } },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);
    res.status(200).json({
      success: true,
      data: reviews,
      pagination: { page, pageSize, total, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
    });
  } catch (error) { next(error); }
};

/**
 * DELETE /api/admin/reviews/:id
 * Delete a review (admin moderation).
 */
exports.deleteAdminReview = async (req, res, next) => {
  try {
    const review = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!review) return next(new AppError('Review not found', 404));

    await prisma.review.delete({ where: { id: req.params.id } });

    res.status(200).json({ success: true, message: 'Review deleted successfully' });
  } catch (error) { next(error); }
};

/**
 * GET /api/admin/insurance-policies
 * Returns all insurance policies with search, filter, and pagination.
 */
exports.getInsurancePolicies = async (req, res, next) => {
  try {
    const { status, search, sort } = req.query;
    const where = {};

    if (status) where.status = status;
    if (search) {
      where.booking = {
        OR: [
          { listing: { title: { contains: search, mode: 'insensitive' } } },
          { renter: { fullName: { contains: search, mode: 'insensitive' } } },
          { owner: { fullName: { contains: search, mode: 'insensitive' } } },
        ],
      };
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'oldest') orderBy = { createdAt: 'asc' };
    if (sort === 'status') orderBy = { status: 'asc' };
    if (sort === 'premium_desc') orderBy = { premium: 'desc' };
    if (sort === 'premium_asc') orderBy = { premium: 'asc' };

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const [total, policies] = await Promise.all([
      prisma.insurancePolicy.count({ where }),
      prisma.insurancePolicy.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          booking: {
            select: { id: true, startDate: true, endDate: true, status: true, totalAmount: true },
            include: {
              listing: { select: { id: true, title: true, imageUrls: true, category: true } },
              renter: { select: { id: true, fullName: true, email: true, profileImage: true } },
              owner: { select: { id: true, fullName: true, email: true, profileImage: true } },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);
    res.status(200).json({
      success: true,
      data: policies,
      pagination: { page, pageSize, total, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
    });
  } catch (error) { next(error); }
};

/**
 * PATCH /api/admin/insurance-policies/:id/approve-claim
 * Admin approves an insurance claim for a damage protection policy.
 */
exports.approveInsuranceClaim = async (req, res, next) => {
  try {
    const { damageAmount } = req.body;

    if (damageAmount !== undefined && (damageAmount < 0 || typeof damageAmount !== 'number')) {
      return next(new AppError('Damage amount must be a positive number', 400));
    }

    const policy = await prisma.insurancePolicy.findUnique({
      where: { id: req.params.id },
      include: {
        booking: {
          select: { id: true, status: true, totalAmount: true },
          include: {
            listing: { select: { id: true, title: true, ownerId: true } },
            renter: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    if (!policy) return next(new AppError('Insurance policy not found', 404));
    if (policy.status !== 'ACTIVE') return next(new AppError('Policy is not active. Current status: ' + policy.status, 400));

    const updated = await prisma.insurancePolicy.update({
      where: { id: req.params.id },
      data: {
        status: 'CLAIM_APPROVED',
      },
    });

    // Notify renter about approved claim
    notificationService.createNotification({
      userId: policy.booking.renter.id,
      type: 'DISPUTE_UPDATED',
      channels: ['IN_APP', 'EMAIL'],
      title: 'Insurance Claim Approved',
      message: 'Your damage protection claim for "' + policy.booking.listing.title + '" has been approved.' + (damageAmount ? ' Coverage amount: $' + damageAmount : ''),
      referenceType: 'booking',
      referenceId: policy.booking.id,
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: 'Insurance claim approved successfully',
      data: updated,
    });
  } catch (error) { next(error); }
};

/**
 * GET /api/admin/identity-verifications
 * Returns all identity verification records with search, filter, and pagination.
 */
exports.getIdentityVerifications = async (req, res, next) => {
  try {
    const { status, search, sort } = req.query;
    const where = {};

    if (status && ['PENDING', 'PROCESSING', 'VERIFIED', 'FAILED', 'EXPIRED'].includes(status)) {
      where.status = status;
    }
    if (search) {
      where.user = {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'oldest') orderBy = { createdAt: 'asc' };
    if (sort === 'status') orderBy = { status: 'asc' };

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const [total, verifications] = await Promise.all([
      prisma.identityVerification.count({ where }),
      prisma.identityVerification.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          user: { select: { id: true, fullName: true, email: true, profileImage: true, role: true } },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);
    res.status(200).json({
      success: true,
      data: verifications,
      pagination: { page, pageSize, total, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
    });
  } catch (error) { next(error); }
};

/**
 * GET /api/admin/export/:type
 * Export data as CSV.
 */
exports.exportData = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { status, role } = req.query;

    let data = [];
    let headers = [];

    if (type === 'users') {
      const users = await prisma.user.findMany({
        where: role ? { role } : {},
        select: { id: true, fullName: true, email: true, phone: true, role: true, isVerified: true, location: true, createdAt: true },
      });
      headers = ['ID', 'Name', 'Email', 'Phone', 'Role', 'Verified', 'Location', 'Created At'];
      data = users.map(u => [u.id, u.fullName, u.email, u.phone || '', u.role, u.isVerified ? 'Yes' : 'No', u.location || '', u.createdAt.toISOString()]);
    } else if (type === 'bookings') {
      const bookings = await prisma.booking.findMany({
        where: status ? { status } : {},
        include: {
          listing: { select: { title: true } },
          renter: { select: { fullName: true } },
          owner: { select: { fullName: true } },
        },
      });
      headers = ['ID', 'Listing', 'Renter', 'Owner', 'Start Date', 'End Date', 'Total Amount', 'Status', 'Created At'];
      data = bookings.map(b => [b.id, b.listing.title, b.renter.fullName, b.owner.fullName, b.startDate.toISOString().split('T')[0], b.endDate.toISOString().split('T')[0], b.totalAmount.toString(), b.status, b.createdAt.toISOString()]);
    } else if (type === 'payments') {
      const payments = await prisma.payment.findMany({
        where: status ? { status } : {},
        include: { booking: { select: { listing: { select: { title: true } } } } },
      });
      headers = ['ID', 'Payment Intent', 'Booking', 'Amount', 'Currency', 'Platform Fee', 'Status', 'Created At'];
      data = payments.map(p => [p.id, p.paymentIntentId || '', p.booking.listing.title, p.amount.toString(), p.currency, p.platformFee.toString(), p.status, p.createdAt.toISOString()]);
    } else if (type === 'disputes') {
      const disputes = await prisma.dispute.findMany({
        where: status ? { status } : {},
        include: {
          raisedBy: { select: { fullName: true } },
          againstUser: { select: { fullName: true } },
          listing: { select: { title: true } },
        },
      });
      headers = ['ID', 'Listing', 'Raised By', 'Against', 'Reason', 'Status', 'Created At'];
      data = disputes.map(d => [d.id, d.listing.title, d.raisedBy.fullName, d.againstUser.fullName, d.reason, d.status, d.createdAt.toISOString()]);
    } else {
      return next(new AppError('Invalid export type. Use: users, bookings, payments, disputes', 400));
    }

    // Build CSV
    const csvContent = [headers.join(','), ...data.map(row => row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=renthub_' + type + '_' + new Date().toISOString().split('T')[0] + '.csv');
    res.status(200).send(csvContent);
  } catch (error) { next(error); }
};
