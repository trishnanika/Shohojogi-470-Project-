const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const { 
  getReceivedApplications,
  updateApplicationStatus,
  getSentApplications
} = require('../controllers/applicationController');

// Get applications received by a provider
router.get('/received', protect, authorize('provider'), getReceivedApplications);

// Get applications sent by a user
router.get('/sent', protect, getSentApplications);

// Update application status (accept/reject)
router.patch('/:applicationId', protect, authorize('provider'), updateApplicationStatus);

module.exports = router;