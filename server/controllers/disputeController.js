const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorMiddleware');
const notificationService = require('../services/notificationService');
const insuranceService = require('../services/insuranceService');

/**
 * Dispute Reasons
 */
const DISPUTE_REASONS = [
  'Item Damaged',
  'Item Missing',
  'Late Return',
  'Payment Issue',
  'Item Not As Described',
  'Other',
];

/**
 * Validate dispute reason against allowed list
 */
const isValidReason = (reason) => DISPUTE_REASONS.includes(reason);

/**
 * Create a dispute (requires COMPLETED booking, one per booking per user)
 * POST /api/disputes
 */
exports.createDispute = async (req, res, next) => {
  try {
    const { bookingId, reason, description, evidenceImages, damageAmount } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!bookingId || !reason || !description) {
      return next(new AppError('bookingId, reason, and description are required', 400));
    }

    // Validate reason
    if (!isValidReason(reason)) {
      return next(new AppError('Invalid dispute reason. Allowed: ' + DISPUTE_REASONS.join(', '), 400));
    }

    // Validate description length
    if (description.trim().length < 30) {
      return next(new AppError('Description must be at least 30 characters', 400));
    }
    if (description.trim().length > 2000) {
      return next(new AppError('Description must not exceed 2000 characters', 400));
    }

    // Validate damage amount
    if (damageAmount !== undefined && damageAmount !== null) {
      const amt = parseFloat(damageAmount);
      if (isNaN(amt) || amt < 0) {
        return next(new AppError('Damage amount must be a positive number', 400));
      }
    }

    // Validate evidence images (max 10)
    const images = Array.isArray(evidenceImages) ? evidenceImages : [];
    if (images.length > 10) {
      return next(new AppError('Maximum 10 evidence images allowed', 400));
    }

    // Fetch booking
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    // Booking must be COMPLETED
    if (booking.status !== 'COMPLETED') {
      return next(new AppError('Disputes can only be raised for completed bookings', 400));
    }

    // User must be a participant in the booking
    if (booking.renterId !== userId && booking.ownerId !== userId) {
      return next(new AppError('You are not a participant in this booking', 403));
    }

    // Determine the other party
    const againstUserId = booking.renterId === userId ? booking.ownerId : booking.renterId;

    // Check for existing dispute by this user on this booking
    const existing = await prisma.dispute.findUnique({
      where: { bookingId_raisedById: { bookingId, raisedById: userId } },
    });
    if (existing) {
      return next(new AppError('You have already raised a dispute for this booking', 409));
    }

    // Check if booking has insurance
    const insurancePolicy = await insuranceService.getPolicyForBooking(bookingId);

    // Create dispute
    const dispute = await prisma.dispute.create({
      data: {
        bookingId,
        listingId: booking.listingId,
        raisedById: userId,
        againstUserId,
        reason,
        description: description.trim(),
        evidenceImages: images,
        damageAmount: damageAmount !== undefined && damageAmount !== null ? parseFloat(damageAmount) : null,
        status: 'OPEN',
      },
      include: {
        booking: {
          include: {
            listing: { select: { id: true, title: true, imageUrls: true } },
            renter: { select: { id: true, fullName: true, email: true } },
            owner: { select: { id: true, fullName: true, email: true } },
          },
        },
        raisedBy: { select: { id: true, fullName: true, profileImage: true } },
        againstUser: { select: { id: true, fullName: true, profileImage: true } },
      },
    });

    // Notify the other party about the dispute (non-blocking)
    notificationService.createNotification({
      userId: againstUserId,
      type: 'DISPUTE_CREATED',
      channels: ['IN_APP', 'EMAIL'],
      referenceType: 'dispute',
      referenceId: dispute.id,
      context: { dispute, booking, reason, listingTitle: dispute.booking?.listing?.title },
    }).catch(() => {});

    // Return insurance info with the response
    res.status(201).json({
      success: true,
      message: 'Dispute raised successfully',
      data: dispute,
      insurance: insurancePolicy ? {
        covered: true,
        policyNumber: insurancePolicy.policyNumber,
        coverageAmount: insurancePolicy.coverageAmount,
        coverageLabel: insurancePolicy.coverageLabel,
      } : { covered: false },
    });
  } catch (error) {
    // Handle Prisma unique constraint violation
    if (error.code === 'P2002') {
      return next(new AppError('You have already raised a dispute for this booking', 409));
    }
    next(error);
  }
};

/**
 * Get disputes for the logged-in user (both raised and against)
 * GET /api/disputes/my
 */
exports.getMyDisputes = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const disputes = await prisma.dispute.findMany({
      where: {
        OR: [{ raisedById: userId }, { againstUserId: userId }],
      },
      include: {
        booking: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            totalAmount: true,
            status: true,
            listing: { select: { id: true, title: true, imageUrls: true } },
            renter: { select: { id: true, fullName: true } },
            owner: { select: { id: true, fullName: true } },
          },
        },
        raisedBy: { select: { id: true, fullName: true, profileImage: true } },
        againstUser: { select: { id: true, fullName: true, profileImage: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: disputes });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single dispute by ID
 * GET /api/disputes/:id
 */
exports.getDisputeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            listing: { select: { id: true, title: true, imageUrls: true, dailyRate: true, location: true } },
            renter: { select: { id: true, fullName: true, email: true, profileImage: true, phone: true } },
            owner: { select: { id: true, fullName: true, email: true, profileImage: true, phone: true } },
          },
        },
        listing: { select: { id: true, title: true, imageUrls: true, dailyRate: true, securityDeposit: true } },
        raisedBy: { select: { id: true, fullName: true, profileImage: true, email: true } },
        againstUser: { select: { id: true, fullName: true, profileImage: true, email: true } },
      },
    });

    if (!dispute) {
      return next(new AppError('Dispute not found', 404));
    }

    // Only participants or admins can view
    const isParticipant = dispute.raisedById === userId || dispute.againstUserId === userId;
    const isAdmin = req.user.role === 'OWNER' && req.user.isVerified;
    if (!isParticipant && !isAdmin) {
      return next(new AppError('Not authorized to view this dispute', 403));
    }

    res.json({ success: true, data: dispute });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a dispute (only creator, only while OPEN)
 * PUT /api/disputes/:id
 */
exports.updateDispute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { reason, description, evidenceImages, damageAmount } = req.body;

    const dispute = await prisma.dispute.findUnique({ where: { id } });
    if (!dispute) {
      return next(new AppError('Dispute not found', 404));
    }

    // Only creator can update
    if (dispute.raisedById !== userId) {
      return next(new AppError('Only the dispute creator can update this dispute', 403));
    }

    // Only OPEN disputes can be updated
    if (dispute.status !== 'OPEN' && dispute.status !== 'MORE_INFORMATION_REQUIRED') {
      return next(new AppError('Only OPEN disputes can be updated', 400));
    }

    const updateData = {};

    if (reason) {
      if (!isValidReason(reason)) {
        return next(new AppError('Invalid dispute reason', 400));
      }
      updateData.reason = reason;
    }

    if (description) {
      if (description.trim().length < 30) {
        return next(new AppError('Description must be at least 30 characters', 400));
      }
      updateData.description = description.trim();
    }

    if (evidenceImages !== undefined) {
      if (!Array.isArray(evidenceImages) || evidenceImages.length > 10) {
        return next(new AppError('Maximum 10 evidence images allowed', 400));
      }
      updateData.evidenceImages = evidenceImages;
    }

    if (damageAmount !== undefined && damageAmount !== null) {
      const amt = parseFloat(damageAmount);
      if (isNaN(amt) || amt < 0) {
        return next(new AppError('Damage amount must be a positive number', 400));
      }
      updateData.damageAmount = amt;
    }

    // If admin requested more info and user is updating, set back to UNDER_REVIEW
    if (dispute.status === 'MORE_INFORMATION_REQUIRED') {
      updateData.status = 'UNDER_REVIEW';
    }

    const updated = await prisma.dispute.update({
      where: { id },
      data: updateData,
      include: {
        booking: { select: { id: true, startDate: true, endDate: true, status: true, listing: { select: { title: true } } } },
        raisedBy: { select: { id: true, fullName: true } },
        againstUser: { select: { id: true, fullName: true } },
      },
    });

    res.json({ success: true, message: 'Dispute updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a dispute (only creator, only while OPEN)
 * DELETE /api/disputes/:id
 */
exports.deleteDispute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const dispute = await prisma.dispute.findUnique({ where: { id } });
    if (!dispute) {
      return next(new AppError('Dispute not found', 404));
    }

    if (dispute.raisedById !== userId) {
      return next(new AppError('Only the dispute creator can delete this dispute', 403));
    }

    if (dispute.status !== 'OPEN') {
      return next(new AppError('Only OPEN disputes can be deleted', 400));
    }

    await prisma.dispute.delete({ where: { id } });

    res.json({ success: true, message: 'Dispute deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Get all disputes (with filtering, sorting & pagination)
 * GET /api/admin/disputes
 */
exports.getAllDisputes = async (req, res, next) => {
  try {
    const { status, reason, sort } = req.query;

    const where = {};
    if (status && Object.values(prisma.DisputeStatus).includes(status)) {
      where.status = status;
    }
    if (reason) {
      where.reason = { contains: reason, mode: 'insensitive' };
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'oldest') orderBy = { createdAt: 'asc' };
    if (sort === 'status') orderBy = { status: 'asc' };

    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    // Run count + query + stats in parallel
    const [total, disputes, allStatuses] = await Promise.all([
      prisma.dispute.count({ where }),
      prisma.dispute.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          booking: {
            select: {
              id: true,
              startDate: true,
              endDate: true,
              totalAmount: true,
              status: true,
              listing: { select: { id: true, title: true, imageUrls: true } },
              renter: { select: { id: true, fullName: true, email: true } },
              owner: { select: { id: true, fullName: true, email: true } },
            },
          },
          listing: { select: { id: true, title: true } },
          raisedBy: { select: { id: true, fullName: true, email: true, profileImage: true } },
          againstUser: { select: { id: true, fullName: true, email: true, profileImage: true } },
        },
      }),
      prisma.dispute.findMany({ where, select: { status: true } }),
    ]);

    // Aggregate stats from all matching disputes (for AdminDisputes page)
    const stats = {
      total: allStatuses.length,
      open: allStatuses.filter(d => d.status === 'OPEN').length,
      underReview: allStatuses.filter(d => d.status === 'UNDER_REVIEW').length,
      approved: allStatuses.filter(d => d.status === 'APPROVED').length,
      rejected: allStatuses.filter(d => d.status === 'REJECTED').length,
      resolved: allStatuses.filter(d => d.status === 'RESOLVED').length,
    };

    const totalPages = Math.ceil(total / pageSize);
    // Destructure for clarity: [total, disputes] = result; stats from result[2]
    // But we keep the original destructure name and add stats calculation above.
    res.json({
      success: true,
      data: disputes,
      stats,
      pagination: { page, pageSize, total, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Update dispute status
 * PATCH /api/admin/disputes/:id/status
 */
exports.updateDisputeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, resolution, damageAmount } = req.body;

    if (!status) {
      return next(new AppError('Status is required', 400));
    }

    const validStatuses = ['OPEN', 'UNDER_REVIEW', 'MORE_INFORMATION_REQUIRED', 'APPROVED', 'REJECTED', 'RESOLVED'];
    if (!validStatuses.includes(status)) {
      return next(new AppError('Invalid status value', 400));
    }

    const dispute = await prisma.dispute.findUnique({ where: { id } });
    if (!dispute) {
      return next(new AppError('Dispute not found', 404));
    }

    const updateData = { status };

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    if (resolution !== undefined) {
      updateData.resolution = resolution;
    }

    if (damageAmount !== undefined && damageAmount !== null) {
      const amt = parseFloat(damageAmount);
      if (!isNaN(amt) && amt >= 0) {
        updateData.damageAmount = amt;
      }
    }

    const updated = await prisma.dispute.update({
      where: { id },
      data: updateData,
      include: {
        booking: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
            listing: { select: { title: true } },
            renter: { select: { id: true, fullName: true } },
            owner: { select: { id: true, fullName: true } },
          },
        },
        raisedBy: { select: { id: true, fullName: true } },
        againstUser: { select: { id: true, fullName: true } },
      },
    });

    const statusMessages = {
      UNDER_REVIEW: 'Dispute is now under review',
      MORE_INFORMATION_REQUIRED: 'More information requested from the disputant',
      APPROVED: 'Dispute has been approved',
      REJECTED: 'Dispute has been rejected',
      RESOLVED: 'Dispute has been resolved',
    };

    // Notify the dispute creator about the status change (non-blocking)
    notificationService.createNotification({
      userId: dispute.raisedById,
      type: 'DISPUTE_UPDATED',
      channels: ['IN_APP', 'EMAIL'],
      referenceType: 'dispute',
      referenceId: dispute.id,
      context: { status, dispute, booking: updated.booking },
    }).catch(() => {});

    res.json({
      success: true,
      message: statusMessages[status] || 'Dispute status updated',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports.DISPUTE_REASONS = DISPUTE_REASONS;
