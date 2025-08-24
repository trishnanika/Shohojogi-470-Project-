const mongoose = require('mongoose');

const providerPostSchema = new mongoose.Schema({
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
  price: {
    type: Number,
    required: [true, 'Price is required'],
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
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: [true, 'Provider ID is required']
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
  isAvailable: {
    type: Boolean,
    default: true
  },
  hiredBy: [{
    seekerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seeker'
    },
    hiredAt: {
      type: Date,
      default: Date.now
    },
    message: String,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed'],
      default: 'pending'
    }
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for provider details
providerPostSchema.virtual('provider', {
  ref: 'Provider',
  localField: 'providerId',
  foreignField: '_id',
  justOne: true
});

// Index for better query performance
providerPostSchema.index({ providerId: 1, status: 1, createdAt: -1 });
providerPostSchema.index({ 'location.city': 1, category: 1 });
providerPostSchema.index({ isAvailable: 1 });

module.exports = mongoose.model('ProviderPost', providerPostSchema);
