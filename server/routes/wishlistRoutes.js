const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { addToWishlist, getMyWishlist, removeFromWishlist, checkWishlist, getWishlistCount } = require('../controllers/wishlistController');

router.post('/', protect, addToWishlist);
router.get('/', protect, getMyWishlist);
router.get('/count', protect, getWishlistCount);
router.get('/check/:listingId', protect, checkWishlist);
router.delete('/:listingId', protect, removeFromWishlist);

module.exports = router;
