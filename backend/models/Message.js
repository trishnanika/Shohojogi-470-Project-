const mongoose = require('mongoose');
const crypto = require('crypto');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Sender ID is required'],
    refPath: 'senderModel'
  },
  senderModel: {
    type: String,
    required: true,
    enum: ['Provider', 'Seeker', 'User']
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Receiver ID is required'],
    refPath: 'receiverModel'
  },
  receiverModel: {
    type: String,
    required: true,
    enum: ['Provider', 'Seeker', 'User']
  },
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  encryptedContent: {
    type: String,
    select: false // Don't include in query results by default
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'document'],
    default: 'text'
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'video', 'document'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    }
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  relatedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedBy: [{
    userId: mongoose.Schema.Types.ObjectId,
    deletedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for sender details
messageSchema.virtual('sender', {
  ref: function() {
    return this.senderModel;
  },
  localField: 'senderId',
  foreignField: '_id',
  justOne: true
});

// Virtual for receiver details
messageSchema.virtual('receiver', {
  ref: function() {
    return this.receiverModel;
  },
  localField: 'receiverId',
  foreignField: '_id',
  justOne: true
});

// Index for better query performance
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ isRead: 1 });

// Static method to generate conversation ID
messageSchema.statics.generateConversationId = function(userId1, userId2) {
  const ids = [userId1.toString(), userId2.toString()].sort();
  return ids.join('_');
};

// Pre-save middleware to ensure encryptedContent is populated
messageSchema.pre('save', function(next) {
  // If encryptedContent is not set but content is, we need to encrypt it
  if (!this.encryptedContent && this.content) {
    try {
      const algorithm = 'aes-256-ctr';
      const secretKey = process.env.MESSAGE_ENCRYPTION_KEY || 'defaultSecretKey12345678901234567890';
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
      const encrypted = Buffer.concat([cipher.update(this.content), cipher.final()]);
      this.encryptedContent = `${iv.toString('hex')}:${encrypted.toString('hex')}`;
    } catch (error) {
      console.error('Error encrypting message content:', error);
    }
  }
  next();
});

module.exports = mongoose.model('Message', messageSchema);
