const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  register,
  login,
  getMe,
  updateProfile,
  logout,
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/logout', protect, logout);

module.exports = router;
