/**
 * Error Handling Middleware
 *
 * Provides centralized error handling for the Express API.
 * Includes custom AppError class and error handler middleware.
 */

/**
 * Custom application error class
 * Extends the built-in Error with a statusCode property
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not found handler — for routes that don't exist
 */
const notFound = (req, res, next) => {
  const error = new AppError(`Route not found: ${req.originalUrl}`, 404);
  next(error);
};

/**
 * Global error handler
 * Catches all errors and returns a standardized JSON response
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
    }),
  });
};

module.exports = {
  AppError,
  notFound,
  errorHandler,
};
