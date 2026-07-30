const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createReview, getListingReviews, getUserReviews, getMyReviews,
  getReviewById, updateReview, deleteReview,
} = require('../controllers/reviewController');

router.get('/listing/:listingId', getListingReviews);
router.get('/user/:userId', getUserReviews);
router.post('/', protect, createReview);
router.get('/my', protect, getMyReviews);
router.get('/:id', protect, getReviewById);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
