const Provider = require('../models/Provider');
const Seeker = require('../models/Seeker');
// @desc    Get my notifications
// @route   GET /api/users/notifications
// @access  Private
const getMyNotifications = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const Model = role === 'provider' ? Provider : Seeker;
    const user = await Model.findById(_id).select('notifications');
    res.status(200).json({ success: true, data: user?.notifications || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching notifications', error: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/users/notifications/:notificationId/read
// @access  Private
const markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { role, _id } = req.user;
    const Model = role === 'provider' ? Provider : Seeker;
    const user = await Model.findById(_id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const notif = user.notifications?.id(notificationId);
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
    notif.read = true;
    await user.save();
    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating notification', error: error.message });
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const providers = await Provider.find().select('-password');
    const seekers = await Seeker.find().select('-password');
    const users = [...providers, ...seekers];
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
const getUser = async (req, res) => {
  try {
    let user = await Provider.findById(req.params.id).select('-password');
    if (!user) {
      user = await Seeker.findById(req.params.id).select('-password');
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const Model = role === 'provider' ? Provider : Seeker;

    // Filter out undefined fields to avoid overwriting with null
    const updateData = Object.fromEntries(
      Object.entries(req.body).filter(([_, v]) => v != null)
    );

    const user = await Model.findByIdAndUpdate(
      _id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// @desc    Get providers by category and location
// @route   GET /api/users/providers
// @access  Public
const getProviders = async (req, res) => {
  try {
    const { category, city, area, page = 1, limit = 10 } = req.query;
    
    const query = {
      isActive: true
    };

    // Add filters
    if (category) {
      query.skills = { $in: [new RegExp(category, 'i')] };
    }
    
    if (city) {
      query['location.city'] = city;
    }
    
    if (area) {
      query['location.area'] = { $regex: area, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const providers = await Provider.find(query)
      .select('-password')
      .sort({ rating: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Provider.countDocuments(query);

    res.status(200).json({
      success: true,
      count: providers.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      data: providers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching providers',
      error: error.message
    });
  }
};

// @desc    Delete user (admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    let user = await Provider.findById(req.params.id);
    if (!user) {
      user = await Seeker.findById(req.params.id);
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// @desc    Toggle user active status (admin only)
// @route   PUT /api/users/:id/toggle-status
// @access  Private/Admin
const toggleUserStatus = async (req, res) => {
  try {
    let user = await Provider.findById(req.params.id);
    if (!user) {
      user = await Seeker.findById(req.params.id);
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling user status',
      error: error.message
    });
  }
};

module.exports = {
  getUsers,
  getUser,
  updateProfile,
  getProviders,
  deleteUser,
  toggleUserStatus,
  getMyNotifications,
  markNotificationRead
}; 