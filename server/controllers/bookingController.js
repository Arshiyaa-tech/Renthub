const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorMiddleware');
const notificationService = require('../services/notificationService');
const { isHighValue } = require('./identityController');
const insuranceService = require('../services/insuranceService');

const PLATFORM_FEE_PERCENT = 0.10;
const SERVICE_FEE_FIXED = 5;
const BLOCKING_STATUSES = ['PENDING', 'CONFIRMED', 'ACTIVE'];

exports.createBooking = async (req, res, next) => {
  try {
    const { listingId, startDate, endDate, insurancePlan } = req.body;
    if (!listingId || !startDate || !endDate) return next(new AppError('listingId, startDate, and endDate are required', 400));

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return next(new AppError('Invalid date format', 400));
    if (start < today) return next(new AppError('Start date cannot be in the past', 400));
    if (end <= start) return next(new AppError('End date must be after start date', 400));

    const numberOfDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
    if (numberOfDays < 1) return next(new AppError('Minimum rental period is 1 day', 400));

    const listing = await prisma.listing.findUnique({ where: { id: listingId }, include: { owner: { select: { id: true } } } });
    if (!listing) return next(new AppError('Listing not found', 404));
    if (!listing.isAvailable) return next(new AppError('This listing is currently not available for rent', 400));
    if (listing.ownerId === req.user.id) return next(new AppError('You cannot book your own listing', 400));

    // Check identity verification for high-value listings
    if (isHighValue(listing)) {
      const identity = await prisma.identityVerification.findFirst({
        where: { userId: req.user.id, status: 'VERIFIED' },
      });
      if (!identity) {
        return next(new AppError('Identity verification required. Please verify your identity before booking this high-value item.', 403));
      }
    }

    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        listingId,
        status: { in: BLOCKING_STATUSES },
        startDate: { lt: end },
        endDate: { gt: start },
      },
    });
    if (conflictingBooking) return next(new AppError('This listing is already booked for the selected dates', 409));

    const dailyRate = listing.dailyRate;
    const subtotal = dailyRate * numberOfDays;
    const platformFee = Math.round(subtotal * PLATFORM_FEE_PERCENT * 100) / 100;
    const serviceFee = SERVICE_FEE_FIXED;
    const securityDeposit = listing.securityDeposit;

    // Calculate insurance premium if selected
    let insurancePremium = 0;
    let insurancePolicy = null;
    if (insurancePlan) {
      const plans = await insuranceService.getPlans();
      const plan = plans.find((p) => p.id === insurancePlan);
      if (plan) insurancePremium = plan.premium;
    }

    const totalAmount = subtotal + platformFee + serviceFee + securityDeposit + insurancePremium;

    const booking = await prisma.booking.create({
      data: { listingId, renterId: req.user.id, ownerId: listing.ownerId, startDate: start, endDate: end, numberOfDays, dailyRate, subtotal, platformFee, serviceFee, securityDeposit, totalAmount, status: 'PENDING' },
      include: { listing: { select: { id: true, title: true, imageUrls: true, location: true, dailyRate: true } }, renter: { select: { id: true, fullName: true, profileImage: true } }, owner: { select: { id: true, fullName: true, profileImage: true } } },
    });

    // Purchase insurance policy if selected
    if (insurancePlan && insurancePremium > 0) {
      insuranceService.purchasePolicy({ bookingId: booking.id, planId: insurancePlan, userId: req.user.id }).catch((err) => {
        console.error('[Insurance] Purchase failed:', err.message);
      });
    }

    // Notify owner about new booking request (non-blocking)
    notificationService.notifyBookingParties(booking, 'BOOKING_REQUEST').catch(() => {});

    res.status(201).json({ success: true, message: 'Booking request submitted successfully', data: booking });
  } catch (error) { next(error); }
};

exports.getMyBookings = async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { renterId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: { listing: { select: { id: true, title: true, imageUrls: true, location: true, dailyRate: true, category: true } }, owner: { select: { id: true, fullName: true, profileImage: true } }, insurance: true },
    });
    const data = bookings.map((b) => ({ ...b, hasInsurance: !!b.insurance }));
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) { next(error); }
};

exports.getOwnerBookings = async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { ownerId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: { listing: { select: { id: true, title: true, imageUrls: true, location: true, dailyRate: true, category: true } }, renter: { select: { id: true, fullName: true, profileImage: true, location: true } }, insurance: true },
    });
    const data = bookings.map((b) => ({ ...b, hasInsurance: !!b.insurance }));
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) { next(error); }
};

exports.getBookingById = async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { listing: { select: { id: true, title: true, imageUrls: true, location: true, dailyRate: true, category: true, description: true, securityDeposit: true } }, renter: { select: { id: true, fullName: true, profileImage: true, email: true, phone: true, location: true } }, owner: { select: { id: true, fullName: true, profileImage: true, email: true, phone: true, location: true } }, insurance: true },
    });
    if (!booking) return next(new AppError('Booking not found', 404));
    if (booking.renterId !== req.user.id && booking.ownerId !== req.user.id) return next(new AppError('Not authorized to view this booking', 403));

    // Attach insurance badge
    const data = { ...booking };
    if (booking.insurance) {
      data.hasInsurance = true;
      data.insuranceLabel = 'Covered up to $' + booking.insurance.coverageAmount;
    }

    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validTransitions = { PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED'], CONFIRMED: ['ACTIVE', 'CANCELLED'], ACTIVE: ['COMPLETED'], REJECTED: [], CANCELLED: [], COMPLETED: [] };
    if (!status || !validTransitions[status]) return next(new AppError('Invalid status', 400));

    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) return next(new AppError('Booking not found', 404));

    if (status === 'CANCELLED') {
      if (booking.renterId !== req.user.id && booking.ownerId !== req.user.id) return next(new AppError('Only the renter or owner can cancel', 403));
    } else {
      if (booking.ownerId !== req.user.id) return next(new AppError('Only the listing owner can update booking status', 403));
    }

    if (!validTransitions[booking.status].includes(status)) return next(new AppError('Cannot transition from ' + booking.status + ' to ' + status, 400));

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status },
      include: { listing: { select: { id: true, title: true, imageUrls: true, location: true } }, renter: { select: { id: true, fullName: true, profileImage: true } }, owner: { select: { id: true, fullName: true, profileImage: true } } },
    });

    // Send notifications for status changes (non-blocking)
    const statusTypeMap = {
      CONFIRMED: 'BOOKING_CONFIRMED',
      REJECTED: 'BOOKING_REJECTED',
      CANCELLED: 'BOOKING_CANCELLED',
      ACTIVE: 'BOOKING_REQUEST',
      COMPLETED: 'BOOKING_COMPLETED',
    };
    if (statusTypeMap[status]) {
      notificationService.notifyBookingParties(updated, statusTypeMap[status]).catch(() => {});
    }

    const msgs = { CONFIRMED: 'Booking confirmed', REJECTED: 'Booking rejected', CANCELLED: 'Booking cancelled', ACTIVE: 'Booking marked as active', COMPLETED: 'Booking marked as completed' };
    res.status(200).json({ success: true, message: msgs[status] || 'Status updated', data: updated });
  } catch (error) { next(error); }
};

exports.deleteBooking = async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) return next(new AppError('Booking not found', 404));
    if (booking.renterId !== req.user.id && booking.ownerId !== req.user.id) return next(new AppError('Not authorized', 403));
    await prisma.booking.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Booking deleted' });
  } catch (error) { next(error); }
};

exports.getBookedDates = async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { listingId: req.params.listingId, status: { in: BLOCKING_STATUSES } },
      select: { startDate: true, endDate: true },
    });
    const bookedDates = [];
    bookings.forEach((b) => {
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        bookedDates.push(new Date(d).toISOString().split('T')[0]);
      }
    });
    res.status(200).json({ success: true, data: bookedDates });
  } catch (error) { next(error); }
};
