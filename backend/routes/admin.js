const express = require('express');
const { protect, adminOnly } = require('../middlewares/auth');
const User = require('../models/User');
const Service = require('../models/Service');

const router = express.Router();

// Apply admin middleware to all routes
router.use(protect, adminOnly);

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const totalProviders = await User.countDocuments({ role: 'provider' });
    const totalSeekers = await User.countDocuments({ role: 'seeker' });
    const totalServices = await Service.countDocuments();
    const activeServices = await Service.countDocuments({ isAvailable: true });
    const inactiveServices = await Service.countDocuments({ isAvailable: false });

    // Get recent users
    const recentUsers = await User.find({ role: { $ne: 'admin' } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt');

    // Get recent services
    const recentServices = await Service.find()
      .populate('provider', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title category provider createdAt');

    // Get users by city
    const usersByCity = await User.aggregate([
      { $match: { role: { $ne: 'admin' } } },
      { $group: { _id: '$location.city', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalProviders,
          totalSeekers,
          totalServices,
          activeServices,
          inactiveServices
        },
        recentUsers,
        recentServices,
        usersByCity
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
};

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

// Routes
router.get('/dashboard', getDashboardStats);
router.get('/services', getAllServices);
router.put('/services/:id/toggle-featured', toggleServiceFeatured);
router.delete('/services/:id', deleteService);

module.exports = router; 