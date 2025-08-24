const mongoose = require('mongoose');

const hireSchema = new mongoose.Schema({
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
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Post ID is required'],
    refPath: 'postModel'
  },
  postModel: {
    type: String,
    required: [true, 'Post model is required'],
    enum: ['SeekerPost', 'ProviderPost']
  },
  status: {
    type: String,
    enum: ['confirmed', 'completed', 'cancelled'],
    default: 'confirmed'
  },
  notes: {
    type: String,
    trim: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  amount: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'BDT'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Hire', hireSchema);