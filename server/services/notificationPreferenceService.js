const prisma = require('../utils/prisma');

/**
 * Notification Preference Service.
 * Manages per-user notification channel and category preferences.
 */

const getDefaults = (userId) => ({
  userId,
  emailEnabled: true,
  smsEnabled: false,
  inAppEnabled: true,
  bookingNotifications: true,
  paymentNotifications: true,
  reviewNotifications: true,
  marketingEmails: false,
});

const getPreferences = async (userId) => {
  let prefs = await prisma.notificationPreference.findUnique({ where: { userId } });
  if (!prefs) {
    prefs = await prisma.notificationPreference.create({ data: getDefaults(userId) });
  }
  return prefs;
};

const updatePreferences = async (userId, data) => {
  let prefs = await prisma.notificationPreference.findUnique({ where: { userId } });
  if (!prefs) {
    prefs = await prisma.notificationPreference.create({ data: { ...getDefaults(userId), ...data } });
  } else {
    prefs = await prisma.notificationPreference.update({ where: { userId }, data });
  }
  return prefs;
};

const shouldSendChannel = async (userId, channel) => {
  const prefs = await getPreferences(userId);
  if (channel === 'IN_APP' && !prefs.inAppEnabled) return false;
  if (channel === 'EMAIL' && !prefs.emailEnabled) return false;
  if (channel === 'SMS' && !prefs.smsEnabled) return false;
  return true;
};

const shouldSendType = async (userId, type) => {
  const prefs = await getPreferences(userId);
  const typeCategory = type.startsWith('BOOKING') ? 'bookingNotifications'
    : type.startsWith('PAYMENT') ? 'paymentNotifications'
    : type.startsWith('REVIEW') ? 'reviewNotifications'
    : null;
  if (typeCategory && !prefs[typeCategory]) return false;
  return true;
};

module.exports = { getPreferences, updatePreferences, shouldSendChannel, shouldSendType };
