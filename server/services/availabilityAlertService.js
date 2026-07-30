const prisma = require('../utils/prisma');
const notificationService = require('./notificationService');

/**
 * Availability Alert Service.
 *
 * When a listing transitions from unavailable → available,
 * this service finds all users who have wishlisted it and
 * sends them in-app, email, and SMS notifications.
 */

const sendAvailabilityAlerts = async (listingId, listingTitle) => {
  try {
    // Find all users who have wishlisted this listing
    const wishlistEntries = await prisma.wishlist.findMany({
      where: { listingId },
      select: { userId: true },
    });

    if (wishlistEntries.length === 0) return;

    const title = listingTitle || 'Item Available';
    const message = '"' + title + '" is now available for rent! Book it before someone else does.';

    // Send notification to each user who wishlisted
    const notificationParams = wishlistEntries.map((entry) => ({
      userId: entry.userId,
      type: 'LISTING_APPROVED',
      channels: ['IN_APP', 'EMAIL'],
      referenceType: 'listing',
      referenceId: listingId,
      title: 'Item Now Available: ' + title,
      message,
      context: { listingTitle: title, message },
    }));

    await notificationService.createBulkNotifications(notificationParams);
    console.log('[AvailabilityAlert] Notified ' + wishlistEntries.length + ' users about ' + title);
  } catch (err) {
    console.error('[AvailabilityAlert] Error:', err.message);
  }
};

module.exports = { sendAvailabilityAlerts };
