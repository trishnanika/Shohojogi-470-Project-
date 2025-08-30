const express = require('express');
const { protect, authorize } = require('../middlewares/auth');
const {
  createSeekerPost,
  getSeekerPosts,
  getMySeekerPosts,
  getSeekerPost,
  applyToSeekerPost,
  updateSeekerPost,
  deleteSeekerPost,
  getSeekerStats,
  getPostApplicants,
  updateApplicationStatus
} = require('../controllers/seekerPostController');

const router = express.Router();

// Public routes
router.get('/', getSeekerPosts);

// Protected routes
router.get('/stats', protect, authorize('seeker'), getSeekerStats);
router.get('/my-posts', protect, authorize('seeker'), getMySeekerPosts);
router.post('/', protect, authorize('seeker'), createSeekerPost);
router.put('/:id', protect, authorize('seeker'), updateSeekerPost);
router.delete('/:id', protect, authorize('seeker'), deleteSeekerPost);
router.post('/:id/apply', protect, authorize('provider'), applyToSeekerPost);
router.get('/:id/applicants', protect, authorize('seeker'), getPostApplicants);
router.patch('/:postId/applicants/:applicantId', protect, authorize('seeker'), updateApplicationStatus);

// Public route for getting a single post by id
router.get('/:id', getSeekerPost);

module.exports = router;
