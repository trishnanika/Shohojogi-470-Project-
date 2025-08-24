const Message = require('../models/Message');
const Provider = require('../models/Provider');
const Seeker = require('../models/Seeker');
const upload = require('../middlewares/upload');
const path = require('path');
const User = require('../models/User');
const crypto = require('crypto');

// Encryption and decryption functions
const encryptMessage = (content) => {
  try {
    if (!content) return content;
    const algorithm = 'aes-256-ctr';
    const secretKey = process.env.MESSAGE_ENCRYPTION_KEY || 'defaultSecretKey12345678901234567890';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    const encrypted = Buffer.concat([cipher.update(content), cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  } catch (error) {
    console.error('Encryption error:', error);
    return content; // Return original content if encryption fails
  }
};

const decryptMessage = (encryptedContent) => {
  try {
    if (!encryptedContent || !encryptedContent.includes(':')) return encryptedContent;
    
    const algorithm = 'aes-256-ctr';
    const secretKey = process.env.MESSAGE_ENCRYPTION_KEY || 'defaultSecretKey12345678901234567890';
    const [ivHex, encryptedHex] = encryptedContent.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedContent; // Return encrypted content if decryption fails
  }
};

// @desc    Send a message with optional file attachments
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { receiverId, content, messageType = 'text', relatedPost } = req.body;
    const { _id, role } = req.user;
    const files = req.files;

    if (!receiverId || (!content && !files)) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID and either content or files are required'
      });
    }

    // Determine sender and receiver models
    const senderModel = role === 'provider' ? 'Provider' : role === 'seeker' ? 'Seeker' : 'User';
    
    // Process file attachments if any
    let attachments = [];
    if (files && files.length > 0) {
      attachments = files.map(file => ({
        type: getFileType(file.mimetype),
        url: `/uploads/messages/${file.filename}`,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype
      }));
    }

    // Find receiver to determine their model
    let receiver = null;
    let receiverModel = '';
    
    // Try to find receiver in Provider collection first
    receiver = await Provider.findById(receiverId);
    if (receiver) {
      receiverModel = 'Provider';
    } else {
      // Try Seeker collection
      receiver = await Seeker.findById(receiverId);
      if (receiver) {
        receiverModel = 'Seeker';
      }
    }

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Generate conversation ID
    const conversationId = Message.generateConversationId(_id, receiverId);

    // Create message with encrypted content
    const message = new Message({
      senderId: _id,
      senderModel,
      receiverId,
      receiverModel,
      conversationId,
      content: content || '',
      encryptedContent: encryptMessage(content || ''),
      messageType: attachments.length > 0 ? attachments[0].type : messageType,
      attachments,
      relatedPost: relatedPost || null
    });

    await message.save();

    await message.populate([
      { path: 'sender', select: 'name email profileImage' },
      { path: 'receiver', select: 'name email profileImage' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};

// @desc    Get conversation between two users
// @route   GET /api/messages/conversation/:userId
// @access  Private
const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { _id } = req.user;
    const { page = 1, limit = 50 } = req.query;

    const conversationId = Message.generateConversationId(_id, userId);
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      conversationId,
      isDeleted: false,
      $nor: [
        { deletedBy: { $elemMatch: { userId: _id } } }
      ]
    })
    .populate('sender', 'name email profileImage')
    .populate('receiver', 'name email profileImage')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        receiverId: _id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    const total = await Message.countDocuments({
      conversationId,
      isDeleted: false,
      $nor: [
        { deletedBy: { $elemMatch: { userId: _id } } }
      ]
    });

    // Decrypt message content before sending to client
    const decryptedMessages = messages.map(message => {
      // Create a plain object from the mongoose document
      const plainMessage = message.toObject();
      
      // If there's encrypted content, decrypt it and use it instead of the original content
      if (plainMessage.encryptedContent) {
        plainMessage.content = decryptMessage(plainMessage.encryptedContent);
      }
      
      // Remove the encrypted content field from the response
      delete plainMessage.encryptedContent;
      
      return plainMessage;
    });

    res.status(200).json({
      success: true,
      data: decryptedMessages.reverse(), // Reverse to show oldest first
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching conversation',
      error: error.message
    });
  }
};

// @desc    Get all conversations for a user
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const { _id } = req.user;

    // Get all unique conversation partners
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: _id }, { receiverId: _id }],
          isDeleted: false,
          deletedBy: { $not: { $elemMatch: { userId: _id } } }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiverId', _id] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    // Populate user details for each conversation and decrypt messages
    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = conv.lastMessage;
        const partnerId = lastMessage.senderId.toString() === _id.toString() 
          ? lastMessage.receiverId 
          : lastMessage.senderId;
        
        const partnerModel = lastMessage.senderId.toString() === _id.toString()
          ? lastMessage.receiverModel
          : lastMessage.senderModel;

        let partner = null;
        if (partnerModel === 'Provider') {
          partner = await Provider.findById(partnerId).select('name email profileImage');
        } else if (partnerModel === 'Seeker') {
          partner = await Seeker.findById(partnerId).select('name email profileImage');
        } else {
          partner = await User.findById(partnerId).select('name email profileImage');
        }

        // Decrypt the message content if it's encrypted
        let messageContent = lastMessage.content;
        if (lastMessage.encryptedContent) {
          messageContent = decryptMessage(lastMessage.encryptedContent);
        }

        return {
          conversationId: conv._id,
          partner,
          lastMessage: {
            content: messageContent,
            createdAt: lastMessage.createdAt,
            senderId: lastMessage.senderId,
            messageType: lastMessage.messageType
          },
          unreadCount: conv.unreadCount
        };
      })
    );

    res.status(200).json({
      success: true,
      data: populatedConversations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching conversations',
      error: error.message
    });
  }
};

// @desc    Delete a conversation
// @route   DELETE /api/messages/conversation/:userId
// @access  Private
const deleteConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { _id } = req.user;

    const conversationId = Message.generateConversationId(_id, userId);

    // Add user to deletedBy array for all messages in conversation
    await Message.updateMany(
      { conversationId },
      {
        $addToSet: {
          deletedBy: {
            userId: _id,
            deletedAt: new Date()
          }
        }
      }
    );

    res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting conversation',
      error: error.message
    });
  }
};

// @desc    Search conversations
// @route   GET /api/messages/search
// @access  Private
const searchConversations = async (req, res) => {
  try {
    const { _id } = req.user;
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Search in providers
    const providers = await Provider.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('name email profileImage').limit(10);

    // Search in seekers
    const seekers = await Seeker.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('name email profileImage').limit(10);

    const results = [
      ...providers.map(p => ({ ...p.toObject(), userType: 'provider' })),
      ...seekers.map(s => ({ ...s.toObject(), userType: 'seeker' }))
    ];

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching conversations',
      error: error.message
    });
  }
};

module.exports = {
  sendMessage,
  getConversation,
  getConversations,
  deleteConversation,
  searchConversations
};
