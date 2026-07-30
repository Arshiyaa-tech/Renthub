/**
 * Payment Routes
 * All endpoints are protected except the webhook.
 */
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createPaymentIntent, confirmPayment, capturePayment,
  refundPayment, getMyPayments, getPaymentById,
} = require('../controllers/paymentController');

// Payment Intent
router.post('/create-intent', protect, createPaymentIntent);
router.post('/confirm', protect, confirmPayment);

// Capture & Refund (Owner for capture, both for refund)
router.post('/capture', protect, authorize('OWNER'), capturePayment);
router.post('/refund', protect, refundPayment);

// Payment History
router.get('/my', protect, getMyPayments);
router.get('/:id', protect, getPaymentById);

module.exports = router;
