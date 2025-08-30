const express = require('express');
const router = express.Router();
const {
  getMyApplications,
  getReceivedApplications,
  updateApplicationStatus,
  getSentApplications,
  reapplyToPost
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middlewares/auth');

// All routes are protected
router.use(protect);

// @route   GET /api/applications/my-applications
// @desc    Get applications submitted by provider
// @access  Private (Provider only)
router.get('/my-applications', authorize('provider'), getMyApplications);

// @route   GET /api/applications/received
// @desc    Get applications for posts owned by user
// @access  Private
router.get('/received', getReceivedApplications);

// @route   PATCH /api/applications/:applicationId/status
// @desc    Update application status (approve/reject)
// @access  Private (Post owner only)
router.patch('/:applicationId/status', updateApplicationStatus);

// @route   GET /api/applications/sent
// @desc    Get applications sent by a provider
// @access  Private (Provider only)
router.get('/sent', authorize('provider'), getSentApplications);

// @route   POST /api/applications/:applicationId/reapply
// @desc    Reapply to a post after rejection
// @access  Private (Provider only)
router.post('/:applicationId/reapply', authorize('provider'), reapplyToPost);

module.exports = router;