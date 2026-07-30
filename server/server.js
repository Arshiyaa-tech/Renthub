const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { securityHeaders, authLimiter, apiLimiter } = require('./middleware/securityMiddleware');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/authRoutes');
const listingRoutes = require('./routes/listingRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const disputeRoutes = require('./routes/disputeRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const identityRoutes = require('./routes/identityRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { handleWebhook } = require('./controllers/paymentController');
const { handleWebhook: identityWebhook } = require('./controllers/identityController');
const emailService = require('./services/emailService');
const smsService = require('./services/smsService');
const { initNotificationServices } = require('./services/initServices');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// Security Middleware
// ============================================================

// Apply Helmet security headers to all routes
app.use(securityHeaders);

// Apply API rate limiter to all /api routes
app.use('/api', apiLimiter);

// Apply strict rate limiting to auth endpoints
app.use('/api/auth', authLimiter);

// ============================================================
// CORS Configuration
// ============================================================

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// ============================================================
// Body Parsing
// ============================================================

// Stripe webhooks MUST come before express.json() — they need raw body
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), handleWebhook);
app.post('/api/identity/webhook', express.raw({ type: 'application/json' }), identityWebhook);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

// ============================================================
// Routes
// ============================================================

app.get('/', (req, res) => {
  res.json({ success: true, message: 'RentHub API Running Successfully', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/identity', identityRoutes);
app.use('/api/admin', adminRoutes);

// ============================================================
// Error Handling
// ============================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler — never leaks stack traces in production
app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV === 'development';
  console.error(`[${new Date().toISOString()}] Error:`, err.message);
  if (isDev) console.error(err.stack);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(isDev && { stack: err.stack }),
  });
});

// ============================================================
// Server Start
// ============================================================

// Initialize notification services
initNotificationServices();

app.listen(PORT, () => {
  console.log(`\n  RentHub Server`);
  console.log(`  Port: ${PORT}`);
  console.log(`  URL:  http://localhost:${PORT}\n`);
});
