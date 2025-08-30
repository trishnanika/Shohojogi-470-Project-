const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'postModel',
    required: [true, 'Post ID is required']
  },
  postModel: {
    type: String,
    required: true,
    enum: ['Post', 'SeekerPost', 'ProviderPost']
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: [true, 'Provider ID is required']
  },
  seekerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seeker',
    required: false
  },
  offeredAmount: {
    type: Number,
    required: [true, 'Offered amount is required'],
    min: [0, 'Offered amount cannot be negative']
  },
  message: {
    type: String,
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for post details
applicationSchema.virtual('post', {
  ref: 'Post',
  localField: 'postId',
  foreignField: '_id',
  justOne: true
});

// Virtual for provider details
applicationSchema.virtual('provider', {
  ref: 'Provider',
  localField: 'providerId',
  foreignField: '_id',
  justOne: true
});

// Indexes for better query performance
applicationSchema.index({ postId: 1, providerId: 1 }, { unique: true }); // Prevent duplicate applications
applicationSchema.index({ providerId: 1, status: 1, createdAt: -1 });
applicationSchema.index({ postId: 1, status: 1, createdAt: -1 });

// Pre-save middleware to validate offered amount is within post's min/max range
applicationSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('offeredAmount')) {
    try {
      let post;
      
      // Try to find the post based on postModel
      if (this.postModel === 'SeekerPost') {
        const SeekerPost = mongoose.model('SeekerPost');
        post = await SeekerPost.findById(this.postId);
      } else {
        const Post = mongoose.model('Post');
        post = await Post.findById(this.postId);
      }
      
      if (!post) {
        return next(new Error('Post not found'));
      }
      
      // Handle both old minRate/maxRate structure and new budget structure
      let minRate, maxRate;
      if (post.budget) {
        minRate = post.budget.min;
        maxRate = post.budget.max;
      } else {
        minRate = post.minRate;
        maxRate = post.maxRate;
      }
      
      // Skip validation if no rate limits are set
      if (minRate && maxRate && this.offeredAmount) {
        if (this.offeredAmount < minRate || this.offeredAmount > maxRate) {
          return next(new Error(`Offered amount must be between ${minRate} and ${maxRate}`));
        }
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Application', applicationSchema);
