const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Provider is required']
  },
  title: {
    type: String,
    required: [true, 'Service title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Service category is required'],
    enum: [
      'Tutor',
      'Electrician',
      'Plumber',
      'Carpenter',
      'Painter',
      'Parcel Delivery',
      'Home Repair',
      'Cleaning',
      'Gardening',
      'Cooking',
      'Photography',
      'Event Management',
      'Transportation',
      'Beauty Services',
      'Pet Care',
      'Other'
    ]
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  priceType: {
    type: String,
    enum: ['hourly', 'fixed', 'negotiable'],
    required: [true, 'Price type is required']
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
  images: [{
    type: String
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
serviceSchema.index({ provider: 1 });
serviceSchema.index({ category: 1 });
serviceSchema.index({ 'location.city': 1 });
serviceSchema.index({ isAvailable: 1 });
serviceSchema.index({ isFeatured: 1 });
serviceSchema.index({ rating: -1 });
serviceSchema.index({ createdAt: -1 });

// Virtual for average rating
serviceSchema.virtual('averageRating').get(function() {
  return this.totalReviews > 0 ? this.rating / this.totalReviews : 0;
});

// Ensure virtual fields are serialized
serviceSchema.set('toJSON', { virtuals: true });
serviceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Service', serviceSchema); 