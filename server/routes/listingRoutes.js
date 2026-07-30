const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createListing, getListings, getListingById,
  updateListing, deleteListing, getMyListings,
} = require('../controllers/listingController');

// Public routes
router.get('/', getListings);
router.get('/my', protect, authorize('OWNER'), getMyListings);
router.get('/:id', getListingById);

// Protected routes (OWNER only)
router.post('/', protect, authorize('OWNER'), createListing);
router.put('/:id', protect, authorize('OWNER'), updateListing);
router.delete('/:id', protect, authorize('OWNER'), deleteListing);

module.exports = router;
