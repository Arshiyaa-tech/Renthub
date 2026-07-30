const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token for the given user.
 *
 * @param {Object} user - User object (must have id, role, email)
 * @returns {string} Signed JWT token
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

/**
 * Sanitize user object — removes password and sensitive fields before sending to client.
 *
 * @param {Object} user - User document from database
 * @returns {Object} Clean user object safe for API responses
 */
const sanitizeUser = (user) => {
  if (!user) return null;

  const { password, ...safeUser } = user;
  return safeUser;
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Validate password strength:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
const isValidPassword = (password) => {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
};

module.exports = {
  generateToken,
  sanitizeUser,
  isValidEmail,
  isValidPassword,
};
