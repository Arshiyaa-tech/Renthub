const nodemailer = require('nodemailer');

let transporter = null;

const initTransporter = () => {
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    console.log('  Email: SMTP configured (' + process.env.SMTP_HOST + ')');
  } else {
    console.log('  Email: No SMTP configured');
  }
};

const getTransporter = async () => {
  if (transporter) return transporter;
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email', port: 587, secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log('  Email: Using Ethereal (' + testAccount.user + ')');
    return transporter;
  } catch (err) { return null; }
};

const buildTemplate = ({ title, summary, actionLabel, actionUrl, recipientName }) => {
  const year = new Date().getFullYear();
  return '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif">'
    + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:20px 0"><tr><td align="center">'
    + '<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">'
    + '<tr><td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:32px 40px;text-align:center">'
    + '<h1 style="color:#fff;margin:0;font-size:24px;font-weight:700">RentHub</h1></td></tr>'
    + '<tr><td style="padding:40px">'
    + '<p style="color:#374151;font-size:16px;margin:0 0 8px">Hi ' + (recipientName || 'there') + ',</p>'
    + '<h2 style="color:#111827;font-size:22px;margin:0 0 16px">' + title + '</h2>'
    + '<p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px">' + summary + '</p>'
    + (actionLabel && actionUrl ? '<table cellpadding="0" cellspacing="0" style="margin:0 0 24px"><tr><td style="background:#2563eb;border-radius:12px;padding:0"><a href="' + actionUrl + '" style="display:inline-block;padding:14px 32px;color:#fff;font-size:15px;font-weight:600;text-decoration:none;border-radius:12px">' + actionLabel + '</a></td></tr></table>' : '')
    + '<p style="color:#9ca3af;font-size:13px;margin:0">If you have any questions, contact our support team.</p></td></tr>'
    + '<tr><td style="background:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb">'
    + '<p style="color:#9ca3af;font-size:12px;margin:0">&copy; ' + year + ' RentHub. All rights reserved.</p>'
    + '<p style="color:#9ca3af;font-size:12px;margin:4px 0 0">RentHub &mdash; Rent Anything, Anytime</p></td></tr>'
    + '</table></td></tr></table></body></html>';
};

const sendEmail = async ({ to, subject, title, summary, actionLabel, actionUrl, recipientName }) => {
  try {
    const t = await getTransporter();
    if (!t) return { success: false, message: 'No transporter' };
    const html = buildTemplate({ title, summary, actionLabel, actionUrl, recipientName });
    const info = await t.sendMail({
      from: '"RentHub" <' + (process.env.SMTP_FROM || 'noreply@renthub.com') + '>',
      to, subject, html,
    });
    const previewURL = nodemailer.getTestMessageUrl(info);
    if (previewURL) console.log('[Email] Preview:', previewURL);
    return { success: true, messageId: info.messageId, previewURL };
  } catch (err) {
    console.error('[Email] Failed:', err.message);
    return { success: false, message: err.message };
  }
};

const sendNotificationEmail = async ({ user, type, title, message, booking, payment, dispute, review }) => {
  if (!user || !user.email) return { success: false, message: 'No email' };
  let actionUrl = '';
  if (booking) actionUrl = (process.env.FRONTEND_URL || 'http://localhost:5173') + '/bookings/' + booking.id;
  else if (payment) actionUrl = (process.env.FRONTEND_URL || 'http://localhost:5173') + '/payments/' + payment.id;
  else if (review) actionUrl = (process.env.FRONTEND_URL || 'http://localhost:5173') + '/my-reviews';
  else if (dispute) actionUrl = (process.env.FRONTEND_URL || 'http://localhost:5173') + '/disputes/' + dispute.id;
  return sendEmail({
    to: user.email, subject: title, title, summary: message,
    actionLabel: 'View Details', actionUrl,
    recipientName: (user.fullName || '').split(' ')[0],
  });
};

module.exports = { initTransporter, sendEmail, sendNotificationEmail };
