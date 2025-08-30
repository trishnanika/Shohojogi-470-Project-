const mongoose = require('mongoose');

const hireSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'postModel',
    required: [true, 'Post ID is required']
  },
  postModel: {
    type: String,
    required: false,
    enum: ['SeekerPost', 'ProviderPost'],
    default: 'ProviderPost'
  },
  seekerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seeker',
    required: [true, 'Seeker ID is required']
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: [true, 'Provider ID is required']
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: false // Not required for direct hires
  },
  offeredAmount: {
    type: Number,
    required: false, // Not required for direct hires, can use amount field
    min: [0, 'Offered amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['confirmed', 'completed', 'cancelled'],
    default: 'confirmed'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for post details
hireSchema.virtual('post', {
  ref: 'Post',
  localField: 'postId',
  foreignField: '_id',
  justOne: true
});

// Virtual for seeker details
hireSchema.virtual('seeker', {
  ref: 'Seeker',
  localField: 'seekerId',
  foreignField: '_id',
  justOne: true
});

// Virtual for provider details
hireSchema.virtual('provider', {
  ref: 'Provider',
  localField: 'providerId',
  foreignField: '_id',
  justOne: true
});

// Virtual for application details
hireSchema.virtual('application', {
  ref: 'Application',
  localField: 'applicationId',
  foreignField: '_id',
  justOne: true
});

// Indexes for better query performance
hireSchema.index({ postId: 1, seekerId: 1, providerId: 1 });
hireSchema.index({ seekerId: 1, paymentStatus: 1, createdAt: -1 });
hireSchema.index({ providerId: 1, paymentStatus: 1, createdAt: -1 });

module.exports = mongoose.model('Hire', hireSchema);