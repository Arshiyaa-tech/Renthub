const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createSession, getStatus, checkListing } = require('../controllers/identityController');

// Protected routes
router.post('/create-session', protect, createSession);
router.get('/status', protect, getStatus);
router.get('/check-listing/:listingId', protect, checkListing);

// Note: POST /api/identity/webhook is handled in server.js BEFORE express.json()
// for raw body access required by Stripe signature verification

module.exports = router;
