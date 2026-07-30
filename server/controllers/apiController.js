/**
 * API Controller
 *
 * Handles general API endpoints for health checks
 * and application information.
 */

/**
 * Health check endpoint
 * GET /api
 */
exports.getHealth = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'RentHub API is running',
    timestamp: new Date().toISOString(),
  });
};

/**
 * API information endpoint
 * GET /api/info
 */
exports.getApiInfo = (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: 'RentHub API',
      version: '1.0.0',
      description: 'Peer-to-Peer Rental Marketplace API',
      environment: process.env.NODE_ENV || 'development',
      features: [
        'User authentication (coming soon)',
        'Listing management (coming soon)',
        'Booking system (coming soon)',
        'Reviews & ratings (coming soon)',
        'Payment processing (coming soon)',
        'File uploads (coming soon)',
      ],
    },
  });
};
