const express = require('express');
const { protect, authorize } = require('../middlewares/auth');
const {
  createProviderPost,
  getProviderPosts,
  getMyProviderPosts,
  getProviderPost,
  hireProviderService,
  updateProviderPost,
  deleteProviderPost
} = require('../controllers/providerPostController');

const router = express.Router();

// Public routes
router.get('/', getProviderPosts);

// Protected routes (per-route protect to keep '/:id' public)
router.get('/my-posts', protect, authorize('provider'), getMyProviderPosts);
router.post('/', protect, authorize('provider'), createProviderPost);
router.post('/:id/hire', protect, authorize('seeker'), hireProviderService);
router.put('/:id', protect, authorize('provider'), updateProviderPost);
router.delete('/:id', protect, authorize('provider'), deleteProviderPost);

// Public route for getting a single post by id (placed after '/my-posts' to avoid conflicts)
router.get('/:id', getProviderPost);

module.exports = router;
