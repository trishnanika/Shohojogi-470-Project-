const express = require('express');
const router = express.Router();
const {
  createSeekerPost,
  createProviderPost,
  getAllPosts,
  getMyPosts,
  getPostById,
  updatePost,
  deletePost,
  applyToPost
} = require('../controllers/postController');
const { protect, authorize } = require('../middlewares/auth');

// Public routes
router.get('/', getAllPosts);

// Protected routes
router.use(protect);

// Post management - separate endpoints by role
router.post('/seeker', authorize('seeker'), createSeekerPost);
router.post('/provider', authorize('provider'), createProviderPost);
router.get('/my-posts', getMyPosts);
router.put('/:id', updatePost);
router.delete('/:id', deletePost);

// Public routes that need to be after protected routes to avoid conflicts
router.get('/:id', getPostById);

// Application routes
router.post('/:id/apply', authorize('provider'), applyToPost);

module.exports = router;
