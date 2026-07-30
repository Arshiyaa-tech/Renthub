const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  getAllDisputes,
  updateDisputeStatus,
} = require('../controllers/disputeController');
const {
  getDashboard,
  getUsers,
  verifyUser,
  suspendUser,
  reactivateUser,
  deleteUser,
  getAdminListings,
  deleteAdminListing,
  toggleListingStatus,
  getAdminBookings,
  updateAdminBooking,
  getAdminPayments,
  getAdminReviews,
  deleteAdminReview,
  getIdentityVerifications,
  getInsurancePolicies,
  approveInsuranceClaim,
  exportData,
} = require('../controllers/adminController');
const { adminSendNotification } = require('../controllers/notificationController');

// ============================================================
// Admin Dashboard Routes — all require adminOnly
// ============================================================

// Dashboard overview
router.get('/dashboard', protect, adminOnly, getDashboard);

// User management
router.get('/users', protect, adminOnly, getUsers);
router.patch('/users/:id/verify', protect, adminOnly, verifyUser);
router.patch('/users/:id/suspend', protect, adminOnly, suspendUser);
router.patch('/users/:id/reactivate', protect, adminOnly, reactivateUser);
router.delete('/users/:id', protect, adminOnly, deleteUser);

// Listing management
router.get('/listings', protect, adminOnly, getAdminListings);
router.delete('/listings/:id', protect, adminOnly, deleteAdminListing);
router.patch('/listings/:id/status', protect, adminOnly, toggleListingStatus);

// Booking management
router.get('/bookings', protect, adminOnly, getAdminBookings);
router.patch('/bookings/:id', protect, adminOnly, updateAdminBooking);

// Payment management
router.get('/payments', protect, adminOnly, getAdminPayments);

// Review management
router.get('/reviews', protect, adminOnly, getAdminReviews);
router.delete('/reviews/:id', protect, adminOnly, deleteAdminReview);

// Dispute management (existing routes)
router.get('/disputes', protect, adminOnly, getAllDisputes);
router.patch('/disputes/:id/status', protect, adminOnly, updateDisputeStatus);

// Identity verification management
router.get('/identity-verifications', protect, adminOnly, getIdentityVerifications);

// Insurance policy management
router.get('/insurance-policies', protect, adminOnly, getInsurancePolicies);
router.patch('/insurance-policies/:id/approve-claim', protect, adminOnly, approveInsuranceClaim);

// Data export
router.get('/export/:type', protect, adminOnly, exportData);

// Admin notification
router.post('/notifications/send', protect, adminOnly, adminSendNotification);

module.exports = router;
