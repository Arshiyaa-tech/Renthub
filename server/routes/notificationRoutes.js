const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  getNotifications, getUnread, markRead, markAllRead, deleteNotification,
  getPreferences, updatePreferences,
} = require('../controllers/notificationController');

// User notification routes
router.get('/', protect, getNotifications);
router.get('/unread', protect, getUnread);
router.patch('/:id/read', protect, markRead);
router.patch('/read-all', protect, markAllRead);
router.delete('/:id', protect, deleteNotification);
router.get('/preferences', protect, getPreferences);
router.put('/preferences', protect, updatePreferences);

module.exports = router;
