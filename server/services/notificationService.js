const prisma = require('../utils/prisma');
const emailService = require('./emailService');
const smsService = require('./smsService');
const prefService = require('./notificationPreferenceService');

/**
 * Centralized Notification Service.
 *
 * All modules (bookings, payments, reviews, disputes, admin) use this service
 * to create notifications. It handles:
 * - In-app notification creation
 * - Email dispatch (via emailService)
 * - SMS dispatch (via smsService)
 * - User preference checks
 * - Failed dispatch logging (never crashes the calling flow)
 */

const NOTIFICATION_META = {
  BOOKING_REQUEST: { title: 'New Booking Request', icon: '📅' },
  BOOKING_CONFIRMED: { title: 'Booking Confirmed', icon: '✅' },
  BOOKING_REJECTED: { title: 'Booking Rejected', icon: '❌' },
  BOOKING_CANCELLED: { title: 'Booking Cancelled', icon: '🚫' },
  BOOKING_COMPLETED: { title: 'Booking Completed', icon: '🎉' },
  PAYMENT_AUTHORIZED: { title: 'Payment Authorized', icon: '💳' },
  PAYMENT_CAPTURED: { title: 'Payment Captured', icon: '💰' },
  PAYMENT_REFUNDED: { title: 'Refund Issued', icon: '🔄' },
  REVIEW_RECEIVED: { title: 'New Review', icon: '⭐' },
  DISPUTE_CREATED: { title: 'Dispute Raised', icon: '⚠️' },
  DISPUTE_UPDATED: { title: 'Dispute Updated', icon: '📋' },
  LISTING_APPROVED: { title: 'Listing Approved', icon: '✅' },
  LISTING_DISABLED: { title: 'Listing Disabled', icon: '🔒' },
  SYSTEM: { title: 'System Notification', icon: '🔔' },
};

const getMessage = (type, context = {}) => {
  const msgs = {
    BOOKING_REQUEST: 'You have a new booking request for "' + (context.listingTitle || 'your item') + '".',
    BOOKING_CONFIRMED: 'Your booking for "' + (context.listingTitle || 'item') + '" has been confirmed.',
    BOOKING_REJECTED: 'Your booking request for "' + (context.listingTitle || 'item') + '" was rejected.',
    BOOKING_CANCELLED: 'Booking for "' + (context.listingTitle || 'item') + '" has been cancelled.',
    BOOKING_COMPLETED: 'Your rental of "' + (context.listingTitle || 'item') + '" is now complete.',
    PAYMENT_AUTHORIZED: 'Payment of ' + (context.amount || '') + ' has been authorized.',
    PAYMENT_CAPTURED: 'Payment of ' + (context.amount || '') + ' has been captured.',
    PAYMENT_REFUNDED: 'A refund of ' + (context.amount || '') + ' has been issued.',
    REVIEW_RECEIVED: 'You received a new ' + (context.rating || '') + '-star review!',
    DISPUTE_CREATED: 'A dispute has been raised regarding your booking.',
    DISPUTE_UPDATED: 'Dispute status has been updated to ' + (context.status || '') + '.',
    LISTING_APPROVED: 'Your listing "' + (context.listingTitle || '') + '" has been approved.',
    LISTING_DISABLED: 'Your listing "' + (context.listingTitle || '') + '" has been disabled.',
    SYSTEM: context.message || 'System notification.',
  };
  return msgs[type] || 'You have a new notification.';
};

/**
 * Create a notification for a user and dispatch to requested channels.
 *
 * @param {Object} params
 * @param {string} params.userId - Target user ID
 * @param {string} params.type - NotificationType enum value
 * @param {string} [params.title] - Override default title
 * @param {string} [params.message] - Override default message
 * @param {string[]} [params.channels] - Channels to dispatch ['IN_APP', 'EMAIL', 'SMS']
 * @param {string} [params.referenceType] - Entity type (booking, payment, etc.)
 * @param {string} [params.referenceId] - Entity ID
 * @param {Object} [params.context] - Context for message generation
 * @param {Object} [params.user] - User object (for email/SMS, fetched if not provided)
 *
 * @returns {Object} { notification, emailResult, smsResult }
 */
const createNotification = async ({
  userId, type, title, message, channels = ['IN_APP'],
  referenceType, referenceId, context = {}, user: userData,
}) => {
  const result = { notification: null, emailResult: null, smsResult: null };

  try {
    // Check user preferences
    const canInApp = await prefService.shouldSendChannel(userId, 'IN_APP');
    const canEmail = channels.includes('EMAIL') && await prefService.shouldSendChannel(userId, 'EMAIL')
      && await prefService.shouldSendType(userId, type);
    const canSms = channels.includes('SMS') && await prefService.shouldSendChannel(userId, 'SMS')
      && await prefService.shouldSendType(userId, type);

    const meta = NOTIFICATION_META[type] || { title: 'Notification' };
    const finalTitle = title || meta.title;
    const finalMessage = message || getMessage(type, context);

    // Create in-app notification
    if (canInApp) {
      result.notification = await prisma.notification.create({
        data: {
          userId,
          title: finalTitle,
          message: finalMessage,
          type,
          channels,
          referenceType,
          referenceId,
        },
      });
    }

    // Fetch user data if needed for email/SMS
    let user = userData;
    if ((canEmail || canSms) && !user) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, fullName: true, email: true, phone: true },
      });
    }

    // Send email (non-blocking, errors are logged)
    if (canEmail && user?.email) {
      emailService.sendNotificationEmail({
        user,
        type,
        title: finalTitle,
        message: finalMessage,
        booking: context.booking,
        payment: context.payment,
        dispute: context.dispute,
        review: context.review,
      }).then(emailRes => {
        if (emailRes.success && result.notification) {
          prisma.notification.update({
            where: { id: result.notification.id },
            data: { emailSent: true },
          }).catch(() => {});
        }
      }).catch(err => console.error('[Notifications] Email dispatch error:', err.message));
    }

    // Send SMS (non-blocking)
    if (canSms && user?.phone) {
      const smsText = (finalTitle + ': ' + finalMessage).substring(0, 160);
      smsService.sendSMS({ to: user.phone, message: smsText }).then(smsRes => {
        if (smsRes.success && result.notification) {
          prisma.notification.update({
            where: { id: result.notification.id },
            data: { smsSent: true },
          }).catch(() => {});
        }
      }).catch(err => console.error('[Notifications] SMS dispatch error:', err.message));
    }
  } catch (err) {
    console.error('[Notifications] Failed to create notification:', err.message);
    // Never throw — notifications should not crash the calling flow
  }

  return result;
};

/**
 * Create notifications for multiple users.
 */
const createBulkNotifications = async (paramsArray) => {
  return Promise.all(paramsArray.map(p => createNotification(p)));
};

/**
 * Notify both parties of a booking event.
 */
const notifyBookingParties = async (booking, type, channels = ['IN_APP', 'EMAIL']) => {
  const listingTitle = booking.listing?.title || 'item';
  const context = { listingTitle, booking };
  const params = [];

  if (type === 'BOOKING_REQUEST') {
    // Owner gets booking request notification
    params.push({
      userId: booking.ownerId, type, channels, referenceType: 'booking',
      referenceId: booking.id, context,
    });
    // Renter gets confirmation that request was sent
    params.push({
      userId: booking.renterId, type: 'BOOKING_CONFIRMED', channels: ['IN_APP'],
      referenceType: 'booking', referenceId: booking.id, context,
      title: 'Booking Request Sent',
      message: 'Your booking request for "' + listingTitle + '" has been sent to the owner.',
    });
  } else if (type === 'BOOKING_CONFIRMED' || type === 'BOOKING_REJECTED') {
    params.push({ userId: booking.renterId, type, channels, referenceType: 'booking', referenceId: booking.id, context });
  } else if (type === 'BOOKING_CANCELLED') {
    params.push({ userId: booking.ownerId, type, channels, referenceType: 'booking', referenceId: booking.id, context });
    params.push({ userId: booking.renterId, type, channels, referenceType: 'booking', referenceId: booking.id, context });
  } else if (type === 'BOOKING_COMPLETED') {
    params.push({ userId: booking.ow
