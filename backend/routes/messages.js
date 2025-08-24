const express = require('express');
const { protect } = require('../middlewares/auth');
const { upload } = require('../middlewares/upload');
const {
  sendMessage,
  getConversation,
  getConversations,
  deleteConversation,
  searchConversations
} = require('../controllers/messageController');

const router = express.Router();

// All message routes require authentication
router.use(protect);

// @desc    Send a message with optional file attachments
// @route   POST /api/messages
// @access  Private
router.post('/', upload.array('attachments', 5), sendMessage);
router.get('/conversations', getConversations);
router.get('/conversation/:userId', getConversation);
router.delete('/conversation/:userId', deleteConversation);
router.get('/search', searchConversations);

module.exports = router;
