const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  getSeekerHireHistory,
  getProviderHireHistory,
  updatePaymentStatus,
  updateHireStatus,
  getHire,
  getHiresByPost
} = require('../controllers/hireController');

// All routes are protected
router.use(protect);

// @route   GET /api/hires/seeker-history
// @desc    Get hire history for seeker (providers they hired)
// @access  Private (Seeker only)
router.get('/seeker-history', authorize('seeker'), getSeekerHireHistory);

// @route   GET /api/hires/provider-history
// @desc    Get hire history for provider (jobs they were hired for)
// @access  Private (Provider only)
router.get('/provider-history', authorize('provider'), getProviderHireHistory);

// @route   GET /api/hires/provider
// @desc    Get hire history for provider (alternative endpoint)
// @access  Private (Provider only)
router.get('/provider', authorize('provider'), getProviderHireHistory);

// @route   PATCH /api/hires/:id/payment
// @desc    Update payment status with ownership rules
// @access  Private
router.patch('/:id/payment', updatePaymentStatus);

// @route   PATCH /api/hires/:id/status
// @desc    Update hire status
// @access  Private (Hire participants only)
router.patch('/:id/status', updateHireStatus);

// @route   GET /api/hires/:id
// @desc    Get a single hire record
// @access  Private (Hire participants only)
router.get('/:id', getHire);

// @route   GET /api/hires/post/:postId
// @desc    Get all hires for a specific post
// @access  Private
router.get('/post/:postId', getHiresByPost);

module.exports = router;