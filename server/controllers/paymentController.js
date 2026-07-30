/**
 * Payment Controller — handles all Stripe payment operations:
 * createIntent, confirm, capture, refund, getMy, getById, webhook
 */
const prisma = require('../utils/prisma');
const stripe = require('../utils/stripe');
const { AppError } = require('../middleware/errorMiddleware');
const notificationService = require('../services/notificationService');

const PLATFORM_FEE_PERCENT = 0.10;
const SERVICE_FEE_FIXED = 5;

/**
 * Create a Payment Intent for an existing booking.
 * Authorizes the payment but does NOT capture it (Stripe best practice).
 */
exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return next(new AppError('bookingId is required', 400));

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: { select: { id: true, title: true, dailyRate: true, securityDeposit: true } },
        renter: { select: { id: true } },
        owner: { select: { id: true } },
        payment: true,
      },
    });

    if (!booking) return next(new AppError('Booking not found', 404));
    if (booking.renterId !== req.user.id) return next(new AppError('Only the renter can make payment', 403));
    if (booking.payment && !['PENDING', 'FAILED'].includes(booking.payment.status)) {
      return next(new AppError('Payment already completed for this booking', 400));
    }
    if (!stripe) return next(new AppError('Stripe is not configured. Set STRIPE_SECRET_KEY.', 500));

    const amountInCents = Math.round(booking.totalAmount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: {
        bookingId: booking.id,
        listingId: booking.listingId,
        renterId: booking.renterId,
        ownerId: booking.ownerId,
        securityDeposit: String(booking.securityDeposit),
      },
      capture_method: 'manual',
      description: `RentHub: ${booking.listing.title}`,
    });

    const payment = await prisma.payment.upsert({
      where: { bookingId: booking.id },
      update: {
        paymentIntentId: paymentIntent.id,
        amount: booking.totalAmount,
        securityDeposit: booking.securityDeposit,
        platformFee: Math.round(booking.subtotal * PLATFORM_FEE_PERCENT * 100) / 100,
        serviceFee: SERVICE_FEE_FIXED,
        status: 'PENDING',
      },
      create: {
        bookingId: booking.id, listingId: booking.listingId,
        renterId: booking.renterId, ownerId: booking.ownerId,
        paymentIntentId: paymentIntent.id,
        amount: booking.totalAmount, securityDeposit: booking.securityDeposit,
        platformFee: Math.round(booking.subtotal * PLATFORM_FEE_PERCENT * 100) / 100,
        serviceFee: SERVICE_FEE_FIXED, status: 'PENDING',
      },
    });

    res.status(200).json({
      success: true,
      data: { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id, payment, amount: booking.totalAmount },
    });
  } catch (error) {
    if (error.type === 'StripeCardError') return next(new AppError('Card declined: ' + error.message, 400));
    next(error);
  }
};

/**
 * Confirm payment authorization after frontend completes Stripe Elements.
 * Updates booking to CONFIRMED and payment to AUTHORIZED.
 */
exports.confirmPayment = async (req, res, next) => {
  try {
    const { bookingId, paymentIntentId } = req.body;
    if (!bookingId || !paymentIntentId) return next(new AppError('bookingId and paymentIntentId required', 400));

    const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { payment: true } });
    if (!booking) return next(new AppError('Booking not found', 404));
    if (booking.renterId !== req.user.id) return next(new AppError('Unauthorized', 403));

    if (stripe) {
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (!['requires_capture', 'succeeded'].includes(pi.status)) {
        await prisma.payment.update({ where: { bookingId }, data: { status: 'FAILED', paymentIntentId } });
        return next(new AppError('Payment not authorized. Status: ' + pi.status, 400));
      }
    }

    const [payment, updatedBooking] = await prisma.$transaction([
      prisma.payment.update({ where: { bookingId }, data: { status: 'AUTHORIZED', paymentIntentId } }),
      prisma.booking.update({ where: { id: bookingId }, data: { status: 'CONFIRMED' } }),
    ]);

    // Notify renter about authorized payment (non-blocking)
    notificationService.createNotification({
      userId: updatedBooking.renterId,
      type: 'PAYMENT_AUTHORIZED',
      channels: ['IN_APP', 'EMAIL'],
      referenceType: 'payment',
      referenceId: payment.id,
      context: { amount: '$' + payment.amount, booking: updatedBooking, payment },
    }).catch(() => {});

    res.status(200).json({ success: true, message: 'Payment authorized and booking confirmed', data: { payment, booking: updatedBooking } });
  } catch (error) {
    if (error.type === 'StripeCardError') return next(new AppError('Payment error: ' + error.message, 400));
    next(error);
  }
};

/**
 * Capture an authorized payment.
 * Only the listing owner can capture after item is returned.
 */
exports.capturePayment = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return next(new AppError('bookingId is required', 400));

    const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { payment: true } });
    if (!booking) return next(new AppError('Booking not found', 404));
    if (booking.ownerId !== req.user.id) return next(new AppError('Only the owner can capture payment', 403));
    if (!booking.payment || booking.payment.status !== 'AUTHORIZED') {
      return next(new AppError('Payment cannot be captured. Status: ' + (booking.payment?.status || 'NONE'), 400));
    }
    if (booking.status !== 'COMPLETED') {
      return next(new AppError('Booking must be marked as COMPLETED before capturing payment', 400));
    }
    if (!stripe || !booking.payment.paymentIntentId) return next(new AppError('Stripe not configured', 500));

    const paymentIntent = await stripe.paymentIntents.capture(booking.payment.paymentIntentId);

    const payment = await prisma.payment.update({
      where: { bookingId },
      data: { status: 'CAPTURED', chargeId: paymentIntent.charges?.data?.[0]?.id || null, capturedAt: new Date() },
    });

    // Notify owner that payment was captured (non-blocking)
    notificationService.createNotification({
      userId: booking.ownerId,
      type: 'PAYMENT_CAPTURED',
      channels: ['IN_APP', 'EMAIL'],
      referenceType: 'payment',
      referenceId: payment.id,
      context: { amount: '$' + payment.amount, booking, payment },
    }).catch(() => {});

    res.status(200).json({ success: true, message: 'Payment captured successfully', data: payment });
  } catch (error) {
    if (error.type === 'StripeInvalidRequestError') return next(new AppError('Capture failed: ' + error.message, 400));
    next(error);
  }
};

/**
 * Refund a captured payment.
 */
exports.refundPayment = async (req, res, next) => {
  try {
    const { bookingId, reason } = req.body;
    if (!bookingId) return next(new AppError('bookingId is required', 400));

    const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { payment: true } });
    if (!booking) return next(new AppError('Booking not found', 404));
    if (![booking.ownerId, booking.renterId].includes(req.user.id)) return next(new AppError('Unauthorized', 403));
    if (!booking.payment || booking.payment.status !== 'CAPTURED') {
      return next(new AppError('Payment cannot be refunded. Status: ' + (booking.payment?.status || 'NONE'), 400));
    }
    if (!stripe || !booking.payment.paymentIntentId) return next(new AppError('Stripe not configured', 500));

    await stripe.refunds.create({
      payment_intent: booking.payment.paymentIntentId,
      reason: reason === 'requested_by_customer' ? 'requested_by_customer' : undefined,
    });

    const payment = await prisma.payment.update({ where: { bookingId }, data: { status: 'REFUNDED', refundedAt: new Date() } });
    await prisma.booking.update({ where: { id: bookingId }, data: { status: 'CANCELLED' } });

    // Notify renter about refund (non-blocking)
    notificationService.createNotification({
      userId: booking.renterId,
      type: 'PAYMENT_REFUNDED',
      channels: ['IN_APP', 'EMAIL'],
      referenceType: 'payment',
      referenceId: payment.id,
      context: { amount: '$' + payment.amount, booking, payment },
    }).catch(() => {});

    res.status(200).json({ success: true, message: 'Payment refunded successfully', data: payment });
  } catch (error) {
    if (error.type === 'StripeInvalidRequestError') return next(new AppError('Refund failed: ' + error.message, 400));
    next(error);
  }
};

/**
 * Get current user's payment history (as renter or owner).
 */
exports.getMyPayments = async (req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { OR: [{ renterId: req.user.id }, { ownerId: req.user.id }] },
      orderBy: { createdAt: 'desc' },
      include: {
        booking: { select: { id: 
