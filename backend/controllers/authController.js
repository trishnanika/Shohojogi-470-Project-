const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Provider = require('../models/Provider');
const Seeker = require('../models/Seeker');

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'sohojogi_jwt_secret_key_2024', {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!['seeker', 'provider'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    const existingUser = await User.findOne({ email });
    const existingProvider = await Provider.findOne({ email });
    const existingSeeker = await Seeker.findOne({ email });

    if (existingUser || existingProvider || existingSeeker) {
      return res.status(400).json({ success: false, message: 'Email already in use.' });
    }

    let user;
    if (role === 'provider') {
      user = await Provider.create(req.body);
    } else {
      user = await Seeker.create(req.body);
    }

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    console.log('Login request received:', req.body);
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      console.log('Missing credentials');
      return res.status(400).json({ success: false, message: 'Please provide email, password, and role.' });
    }

    // Handle hardcoded admin login - ONLY check hardcoded credentials for admin
    if (role === 'admin') {
      if (email === 'admin.shohojogi@gmail.com' && password === 'admin123') {
        console.log('Admin login successful');
        const adminUser = {
          _id: 'default-admin-id',
          name: 'Admin User',
          email: 'admin.shohojogi@gmail.com',
          role: 'admin',
        };
        const token = generateToken(adminUser._id, adminUser.role);
        return res.status(200).json({
          success: true,
          message: 'Login successful',
          token,
          user: adminUser,
        });
      } else {
        console.log('Invalid admin credentials');
        return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
      }
    }

    let Model;

    switch (role) {
      case 'provider':
        Model = Provider;
        break;
      case 'seeker':
        Model = Seeker;
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid role specified.' });
    }

    const user = await Model.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      console.log('Invalid credentials');
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Check if user is banned
    if (user.isBanned) {
      console.log('User is banned');
      return res.status(403).json({ success: false, message: 'Your account has been banned. Please contact support.' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const { id, role } = req.user;

    // Handle hardcoded admin user
    if (id === 'default-admin-id' && role === 'admin') {
      return res.status(200).json({ 
        success: true, 
        data: {
          _id: 'default-admin-id',
          name: 'Admin User',
          email: 'admin.shohojogi@gmail.com',
          role: 'admin',
        }
      });
    }

    let user;

    switch (role) {
      case 'admin':
        user = await User.findById(id);
        break;
      case 'provider':
        user = await Provider.findById(id);
        break;
      case 'seeker':
        user = await Seeker.findById(id);
        break;
      default:
        return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

module.exports = {
  register,
  login,
  getMe,
  logout
}; 