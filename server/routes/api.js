const express = require('express');
const router = express.Router();
const { getHealth, getApiInfo } = require('../controllers/apiController');

/**
 * API Routes
 *
 * All routes are prefixed with /api (configured in server.js).
 * These are placeholder routes — actual business logic will be
 * implemented when the corresponding features are built.
 */

// Health check for API
router.get('/', getHealth);

// API information endpoint
router.get('/info', getApiInfo);

// ========== Placeholder Route Groups ==========
// These will be implemented with full CRUD in future sprints:

// Auth routes:     /api/auth/*
// Listing routes:  /api/listings/*
// Booking routes:  /api/bookings/*
// User routes:     /api/users/*
// Review routes:   /api/reviews/*
// Wishlist routes: /api/wishlist/*
// Payment routes:  /api/payments/*

module.exports = router;
