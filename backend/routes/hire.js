const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  createHire,
  getMyHires,
  getReceivedHires,
  updateHireStatus,
  getHire
} = require('../controllers/hireController');

// Routes for seekers
router.post('/', protect, authorize('seeker'), createHire);
router.get('/my-hires', protect, authorize('seeker'), getMyHires);

// Routes for providers
router.get('/received', protect, authorize('provider'), getReceivedHires);

// Routes for both seekers and providers
router.get('/:id', protect, getHire);
router.patch('/:id', protect, updateHireStatus);

module.exports = router;