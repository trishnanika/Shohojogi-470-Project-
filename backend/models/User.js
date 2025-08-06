const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'seeker', 'provider'],
    required: [true, 'Role is required']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^(\+880|880|0)?1[3-9]\d{8}$/, 'Please enter a valid Bangladeshi phone number']
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
  profilePicture: {
    type: String,
    default: ''
  },
  // Provider specific fields
  skills: [{
    type: String,
    trim: true
  }],
  experience: {
    type: Number,
    min: 0,
    default: 0
  },
  hourlyRate: {
    type: Number,
    min: 0,
    default: 0
  },
  // Seeker specific fields
  preferences: [{
    type: String,
    trim: true
  }],
  // Common fields
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
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

userSchema.index({ role: 1 });
userSchema.index({ 'location.city': 1 });
userSchema.index({ skills: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema); 