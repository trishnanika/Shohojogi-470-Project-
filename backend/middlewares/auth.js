const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Provider = require('../models/Provider');
const Seeker = require('../models/Seeker');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sohojogi_jwt_secret_key_2024');

      const { id, role } = decoded;

      // Handle hardcoded admin user
      if (id === 'default-admin-id' && role === 'admin') {
        req.user = {
          _id: 'default-admin-id',
          name: 'Admin User',
          email: 'admin.shohojogi@gmail.com',
          role: 'admin',
        };
        return next();
      }

      let user;
      let Model;

      switch (role) {
        case 'admin':
          Model = User;
          break;
        case 'provider':
          Model = Provider;
          break;
        case 'seeker':
          Model = Seeker;
          break;
        default:
          return res.status(401).json({ success: false, message: 'Invalid token role' });
      }

      user = await Model.findById(id).select('-password');

      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      if (user.isActive === false) {
        return res.status(401).json({ success: false, message: 'Account is deactivated' });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Authorize specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
  };
};

// Admin only middleware
const adminOnly = authorize('admin');

// Provider only middleware
const providerOnly = authorize('provider');

// Seeker only middleware
const seekerOnly = authorize('seeker');

// Provider or Seeker middleware
const providerOrSeeker = authorize('provider', 'seeker');

module.exports = {
  protect,
  authorize,
  adminOnly,
  providerOnly,
  seekerOnly,
  providerOrSeeker
}; 