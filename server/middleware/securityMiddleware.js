const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const securityHeaders = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many attempts. Please try again after 15 minutes.' },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});

module.exports = { securityHeaders, authLimiter, apiLimiter };
