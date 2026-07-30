const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorMiddleware');
const notificationService = require('../services/notificationService');

const MIN_TITLE = 5; const MAX_TITLE = 100;
const MIN_COMMENT = 20; const MAX_COMMENT = 1000;

exports.createReview = async (req, res, next) => {
  try {
    const { bookingId, rating, title, comment } = req.body;
    if (!bookingId || rating === undefined || !title || !comment) {
      return next(new AppError('bookingId, rating, title, and comment are required', 400));
    }
    const rNum = parseInt(rating, 10);
    if (isNaN(rNum) || rNum < 1 || rNum > 5) return next(new AppError('Rating must be 1-5', 400));
    if (title.trim().length < MIN_TITLE) return next(new AppError('Title min ' + MIN_TITLE + ' chars', 400));
    if (title.trim().length > MAX_TITLE) return next(new AppError('Title max ' + MAX_TITLE + ' chars', 400));
    if (comment.trim().length < MIN_COMMENT) return next(new AppError('Comment min ' + MIN_COMMENT + ' chars', 400));
    if (comment.trim().length > MAX_COMMENT) return next(new AppError('Comment max ' + MAX_COMMENT + ' chars', 400));

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: { select: { id: true, title: true, ownerId: true } } },
    });
    if (!booking) return next(new AppError('Booking not found', 404));
    if (booking.status !== 'COMPLETED') return next(new AppError('Can only review completed bookings', 400));
    if (booking.renterId !== req.user.id && booking.ownerId !== req.user.id) {
      return next(new AppError('You did not participate in this booking', 403));
    }

    const revieweeId = booking.renterId === req.user.id ? booking.ownerId : booking.renterId;
    if (revieweeId === req.user.id) return next(new AppError('Cannot review yourself', 400));

    const existing = await prisma.review.findUnique({
      where: { bookingId_reviewerId: { bookingId, reviewerId: req.user.id } },
    });
    if (existing) return next(new AppError('Already reviewed this booking', 409));

    const review = await prisma.review.create({
      data: {
        bookingId, listingId: booking.listingId,
        reviewerId: req.user.id, revieweeId,
        rating: rNum, title: title.trim(), comment: comment.trim(),
      },
      include: {
        reviewer: { select: { id: true, fullName: true, profileImage: true } },
        reviewee: { select: { id: true, fullName: true, profileImage: true } },
        listing: { select: { id: true, title: true, imageUrls: true, category: true } },
        booking: { select: { id: true, startDate: true, endDate: true } },
      },
    });
    // Notify reviewee about new review (non-blocking)
    notificationService.createNotification({
      userId: revieweeId,
      type: 'REVIEW_RECEIVED',
      channels: ['IN_APP', 'EMAIL'],
      referenceType: 'review',
      referenceId: review.id,
      context: { rating: rNum, review, booking, listingTitle: booking.listing?.title },
    }).catch(() => {});

    res.status(201).json({ success: true, message: 'Review submitted', data: review });
  } catch (error) {
    if (error.code === 'P2002') return next(new AppError('Already reviewed this booking', 409));
    next(error);
  }
};

exports.getListingReviews = async (req, res, next) => {
  try {
    const { listingId } = req.params;
    let orderBy;
    switch (req.query.sort) {
      case 'highest': orderBy = { rating: 'desc' }; break;
      case 'lowest': orderBy = { rating: 'asc' }; break;
      case 'oldest': orderBy = { createdAt: 'asc' }; break;
      default: orderBy = { createdAt: 'desc' }; break;
    }
    const reviews = await prisma.review.findMany({
      where: { listingId }, orderBy,
      include: {
        reviewer: { select: { id: true, fullName: true, profileImage: true } },
        booking: { select: { id: true, startDate: true, endDate: true } },
      },
    });
    const total = reviews.length;
    const avg = total > 0 ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10 : 0;
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => { dist[r.rating]++; });
    res.json({ success: true, data: { reviews, stats: { totalReviews: total, averageRating: avg, distribution: dist } } });
  } catch (error) { next(error); }
};

exports.getUserReviews = async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { revieweeId: req.params.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewer: { select: { id: true, fullName: true, profileImage: true } },
        listing: { select: { id: true, title: true, imageUrls: true, category: true } },
        booking: { select: { id: true, startDate: true, endDate: true } },
      },
    });
    const total = reviews.length;
    const avg = total > 0 ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10 : 0;
    res.json({ success: true, data: { reviews, stats: { totalReviews: total, averageRating: avg } } });
  } catch (error) { next(error); }
};

exports.getMyReviews = async (req, res, next) => {
  try {
    const written = await prisma.review.findMany({
      where: { reviewerId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewee: { select: { id: true, fullName: true, profileImage: true } },
        listing: { select: { id: true, title: true, imageUrls: true, category: true } },
        booking: { select: { id: true, startDate: true, endDate: true } },
      },
    });
    const received = await prisma.review.findMany({
      where: { revieweeId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewer: { select: { id: true, fullName: true, profileImage: true } },
        listing: { select: { id: true, title: true, imageUrls: true, category: true } },
        booking: { select: { id: true, startDate: true, endDate: true } },
      },
    });
    const avg = received.length > 0
      ? Math.round((received.reduce((s, r) => s + r.rating, 0) / received.length) * 10) / 10 : 0;
    res.json({ success: true, data: { written, received, stats: { writtenCount: written.length, receivedCount: received.length, averageRating: avg } } });
  } catch (error) { next(error); }
};

exports.getReviewById = async (req, res, next) => {
  try {
    const review = await prisma.review.findUnique({
      where: { id: req.params.id },
      include: {
        reviewer: { select: { id: true, fullName: true, profileImage: true } },
        reviewee: { select: { id: true, fullName: true, profileImage: true } },
        listing: { select: { id: true, title: true, imageUrls: true, category: true, location: true } },
        booking: { select: { id: true, startDate: true, endDate: true, status: true } },
      },
    });
    if (!review) return next(new AppError('Review not found', 404));
    res.json({ success: true, data: review });
  } catch (error) { next(error); }
};

exports.updateReview = async (req, res, next) => {
  try {
    const review = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!review) return next(new AppError('Review not found', 404));
    if (review.reviewerId !== req.user.id) return next(new AppError('Only author can edit', 403));

    const data = {};
    if (req.body.rating !== undefined) {
      const r = parseInt(req.body.rating, 10);
      if (isNaN(r) || r < 1 || r > 5) return next(new AppError('Rating must be 1-5', 400));
      data.rating = r;
    }
    if (req.body.title !== undefined) {
      if (req.body.title.trim().length < MIN_TITLE) return next(new AppError('Title min ' + MIN_TITLE + ' chars', 400));
      if (req.body.title.trim().length > MAX_TITLE) return next(new AppError('Title max ' + MAX_TITLE + ' chars', 400));
      data.title = req.body.title.trim();
    }
    if (req.body.comment !== undefined) {
      if (req.body.comment.trim().length < MIN_COMMENT) return next(new AppError('Comment min ' + MIN_COMMENT + ' chars', 400));
      if (req.body.comment.trim().length > MAX_COMMENT) return next(new AppError('Comment max ' + MAX_COMMENT + ' chars', 400));
      data.comment = req.body.comment.trim();
    }

    const updated = await prisma.review.update({
      where: { id: req.params.id }, data,
      include: {
        reviewer: { select: { id: true, fullName: true, profileImage: true } },
        listing: { select: { id: true, title: true, imageUrls: true, category: true } },
      },
    });
    res.json({ success: true, message: '
