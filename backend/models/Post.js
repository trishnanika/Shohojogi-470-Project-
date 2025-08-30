const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
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
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Author ID is required'],
    ref: 'User'
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: ['seeker', 'provider']
  },
  // For seeker posts only
  vacancy: {
    type: Number,
    required: function() {
      return this.role === 'seeker';
    },
    min: [1, 'Vacancy must be at least 1'],
    default: 1
  },
  hiredCount: {
    type: Number,
    default: 0,
    min: [0, 'Hired count cannot be negative']
  },
  minRate: {
    type: Number,
    required: function() {
      return this.role === 'seeker';
    },
    min: [0, 'Minimum rate cannot be negative']
  },
  maxRate: {
    type: Number,
    required: function() {
      return this.role === 'seeker';
    },
    min: [0, 'Maximum rate cannot be negative'],
    validate: {
      validator: function(value) {
        return !this.minRate || value >= this.minRate;
      },
      message: 'Maximum rate must be greater than or equal to minimum rate'
    }
  },
  // For provider posts only
  price: {
    type: Number,
    required: function() {
      return this.role === 'provider';
    },
    min: [0, 'Price cannot be negative']
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
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'deleted'],
    default: 'active'
  },
  tags: [{
    type: String,
    trim: true
  }],
  images: [{
    url: String,
    alt: String
  }],
  // For seeker posts - date when service is needed
  serviceDate: {
    type: Date,
    required: function() {
      return this.role === 'seeker';
    }
  },
  // For provider posts - availability status
  isAvailable: {
    type: Boolean,
    default: function() {
      return this.role === 'provider';
    }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for checking if vacancy is full
postSchema.virtual('isVacancyFull').get(function() {
  return this.hiredCount >= this.vacancy;
});

// Virtual for remaining vacancy
postSchema.virtual('remainingVacancy').get(function() {
  return Math.max(0, this.vacancy - this.hiredCount);
});

// Virtual for author details
postSchema.virtual('author', {
  ref: 'User',
  localField: 'authorId',
  foreignField: '_id',
  justOne: true
});

// Indexes for better query performance
postSchema.index({ authorId: 1, role: 1, status: 1, createdAt: -1 });
postSchema.index({ 'location.city': 1, category: 1, role: 1 });
postSchema.index({ status: 1, role: 1 });
postSchema.index({ role: 1, isAvailable: 1 });

// Pre-save middleware to ensure data consistency
postSchema.pre('save', function(next) {
  // Ensure hiredCount doesn't exceed vacancy
  if (this.hiredCount > this.vacancy) {
    this.hiredCount = this.vacancy;
  }
  
  // Set status to completed if vacancy is full for seeker posts
  if (this.role === 'seeker' && this.hiredCount >= this.vacancy && this.status === 'active') {
    this.status = 'completed';
  }
  
  next();
});

module.exports = mongoose.model('Post', postSchema);
