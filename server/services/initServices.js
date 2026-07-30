const emailService = require('./emailService');
const smsService = require('./smsService');

/**
 * Initialize all notification services on server startup.
 */
const initNotificationServices = () => {
  emailService.initTransporter();
  smsService.initSmsService();
  console.log('  Notification services initialized');
};

module.exports = { initNotificationServices };
