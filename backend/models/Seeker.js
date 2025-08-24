const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const seekerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  role: {
    type: String,
    default: 'seeker',
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
  },
  location: {
    city: { type: String, required: true },
    area: { type: String, required: true },
  },
  profilePicture: { type: String, default: '' },
  preferences: [{ type: String, trim: true }],
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  notifications: [{
    message: { type: String, required: true },
    type: { type: String, enum: ['booking', 'status', 'general'], default: 'general' },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

seekerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

seekerSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Seeker', seekerSchema);
