const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createBooking, getMyBookings, getOwnerBookings, getBookingById,
  updateBookingStatus, deleteBooking, getBookedDates,
} = require('../controllers/bookingController');

// Protected routes
router.post('/', protect, createBooking);
router.get('/my', protect, getMyBookings);
router.get('/owner', protect, getOwnerBookings);
router.get('/booked-dates/:listingId', getBookedDates);
router.get('/:id', protect, getBookingById);
router.patch('/:id/status', protect, updateBookingStatus);
router.delete('/:id', protect, deleteBooking);

module.exports = router;
