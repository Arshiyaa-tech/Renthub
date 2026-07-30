/**
 * SMS Service for RentHub notifications.
 * Uses Twilio for SMS delivery.
 */

let twilioClient = null;

const initSmsService = () => {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      const twilio = require('twilio');
      twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      console.log('  SMS: Twilio configured');
    } catch (err) {
      console.log('  SMS: Twilio not available (run: npm install twilio)');
    }
  } else {
    console.log('  SMS: No Twilio credentials configured');
  }
};

const sendSMS = async ({ to, message }) => {
  if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
    console.log('[SMS] Not configured - would send to', to, ':', message);
    return { success: false, message: 'SMS not configured' };
  }
  try {
    const result = await twilioClient.messages.create({
      body: message.substring(0, 160),
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });
    console.log('[SMS] Sent to', to, '| SID:', result.sid);
    return { success: true, sid: result.sid };
  } catch (err) {
    console.error('[SMS] Failed:', err.message);
    return { success: false, message: err.message };
  }
};

module.exports = { initSmsService, sendSMS };
