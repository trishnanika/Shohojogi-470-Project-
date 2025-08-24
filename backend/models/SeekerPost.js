const mongoose = require('mongoose');

const seekerPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Home Services', 'Technology', 'Education', 'Healthcare', 'Transportation', 'Events', 'Other']
  },
  budget: {
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'BDT'
    }
  },
  location: {
    city: {
      type: String,
      required: [true, 'City is required'],
      enum: ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh', 'Comilla', 'Noakhali']
    },
    area: {
      type: String,
      required: [true, 'Area is required'],
      trim: true
    }
  },
  seekerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seeker',
    required: [true, 'Seeker ID is required']
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'deleted'],
    default: 'active'
  },
  closedBy: {
    type: String,
    default: null // 'applied' or 'hired' when closed
  },
  tags: [{
    type: String,
    trim: true
  }],
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  deadline: {
    type: Date
  },
  applicants: [{
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    message: String,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    }
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for seeker details
seekerPostSchema.virtual('seeker', {
  ref: 'Seeker',
  localField: 'seekerId',
  foreignField: '_id',
  justOne: true
});

// Index for better query performance
seekerPostSchema.index({ seekerId: 1, status: 1, createdAt: -1 });
seekerPostSchema.index({ 'location.city': 1, category: 1 });

module.exports = mongoose.model('SeekerPost', seekerPostSchema);
