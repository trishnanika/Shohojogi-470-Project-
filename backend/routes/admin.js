const express = require('express');
const { protect, adminOnly } = require('../middlewares/auth');
const Provider = require('../models/Provider');
const Seeker = require('../models/Seeker');
const Service = require('../models/Service');
const {
  getAllUsers,
  deleteUser,
  getAllPosts,
  deletePost,
  banUser,
  unbanUser,
  getDashboardStats
} = require('../controllers/adminController');

const router = express.Router();

// Apply admin middleware to all routes
router.use(protect, adminOnly);


// @desc    Get all services (admin view)
// @route   GET /api/admin/services
// @access  Private/Admin
const getAllServices = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = {};
    if (status === 'active') {
      query.isAvailable = true;
    } else if (status === 'inactive') {
      query.isAvailable = false;
    }

    const skip = (page - 1) * limit;

    const services = await Service.find(query)
      .populate('provider', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Service.countDocuments(query);

    res.status(200).json({
      success: true,
      count: services.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      data: services
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching services',
      error: error.message
    });
  }
};

// @desc    Toggle service featured status
// @route   PUT /api/admin/services/:id/toggle-featured
// @access  Private/Admin
const toggleServiceFeatured = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    service.isFeatured = !service.isFeatured;
    await service.save();

    res.status(200).json({
      success: true,
      message: `Service ${service.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling service featured status',
      error: error.message
    });
  }
};

// @desc    Delete service (admin)
// @route   DELETE /api/admin/services/:id
// @access  Private/Admin
const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    await service.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting service',
      error: error.message
    });
  }
};

// Dashboard Route
router.get('/stats', getDashboardStats);

// User Management Routes
router.get('/users', getAllUsers);
router.delete('/users/:role/:id', deleteUser);
router.put('/users/:role/:id/ban', banUser);
router.put('/users/:role/:id/unban', unbanUser);
router.patch('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    
    // Find user in both Provider and Seeker collections
    let user = await Provider.findById(id);
    let Model = Provider;
    
    if (!user) {
      user = await Seeker.findById(id);
      Model = Seeker;
    }
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (action === 'ban') {
      user.isBanned = true;
      user.bannedAt = new Date();
    } else if (action === 'unban') {
      user.isBanned = false;
      user.bannedAt = undefined;
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: `User ${action}ned successfully`,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

// Post Management Routes
router.get('/posts', getAllPosts);
router.delete('/posts/:id', deletePost);

// Service Management Routes
router.get('/services', getAllServices);
router.put('/services/:id/toggle-featured', toggleServiceFeatured);
router.delete('/services/:id', deleteService);
router.patch('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    
    const service = await Service.findById(id);
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    
    if (action === 'delete') {
      await service.deleteOne();
      return res.status(200).json({
        success: true,
        message: 'Service deleted successfully'
      });
    }
    
    res.status(400).json({
      success: false,
      message: 'Invalid action'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating service',
      error: error.message
    });
  }
});

module.exports = router;