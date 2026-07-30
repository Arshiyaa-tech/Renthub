const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createDispute,
  getMyDisputes,
  getDisputeById,
  updateDispute,
  deleteDispute,
} = require('../controllers/disputeController');

// User dispute routes (all require authentication)
router.post('/', protect, createDispute);
router.get('/my', protect, getMyDisputes);
router.get('/:id', protect, getDisputeById);
router.put('/:id', protect, updateDispute);
router.delete('/:id', protect, deleteDispute);

module.exports = router;
