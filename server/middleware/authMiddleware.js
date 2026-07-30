const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { AppError } = require('./errorMiddleware');

/**
 * Authentication Middleware
 *
 * protect   — Requires valid JWT token. Attaches user to req.user
 * authorize — Restricts access to specific roles (e.g., 'OWNER')
 */

/**
 * Middleware to protect routes — verifies JWT and loads user
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Not authorized — no token provided', 401));
    }

    // Verify JWT token — NO fallback secret in production
    if (!process.env.JWT_SECRET) {
      return next(new AppError('Server authentication configuration error', 500));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Load user from database (exclude password)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        profileImage: true,
        role: true,
        bio: true,
        location: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return next(new AppError('User belonging to this token no longer exists', 401));
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired — please login again', 401));
    }
    return next(new AppError('Not authorized', 401));
  }
};

/**
 * Middleware to restrict routes to specific user roles
 * @param  {...string} roles - Allowed roles (e.g., 'OWNER', 'RENTER')
 *
 * Usage:
 *   router.get('/create-listing', protect, authorize('OWNER'), controller)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authorized', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Role '${req.user.role}' is not authorized to access this resource`,
          403
        )
      );
    }

    next();
  };
};

/**
 * Middleware to restrict routes to administrators.
 * For now, any authenticated user with isVerified=true can act as admin.
 * In production, this should check an isAdmin flag on the User model.
 */
const adminOnly = async (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Not authorized', 401));
  }
  // For now, only OWNER role users with isVerified can be admins
  // In production, add an isAdmin field to the User model
  if (req.user.role !== 'OWNER' || !req.user.isVerified) {
    return next(new AppError('Admin access required', 403));
  }
  next();
};

module.exports = { protect, authorize, adminOnly };
