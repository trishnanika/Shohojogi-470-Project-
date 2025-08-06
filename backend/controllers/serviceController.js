const Service = require('../models/Service');
const User = require('../models/User');

// @desc    Create new service
// @route   POST /api/services
// @access  Private/Provider
const createService = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      price,
      priceType,
      location,
      images,
      tags
    } = req.body;

    const service = await Service.create({
      provider: req.user.id,
      title,
      description,
      category,
      price,
      priceType,
      location,
      images: images || [],
      tags: tags || []
    });

    // Populate provider info
    await service.populate('provider', 'name email phone profilePicture rating');

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating service',
      error: error.message
    });
  }
};

// @desc    Get all services with filters
// @route   GET /api/services
// @access  Public
const getServices = async (req, res) => {
  try {
    const {
      category,
      city,
      area,
      minPrice,
      maxPrice,
      priceType,
      page = 1,
      limit = 10,
      sort = 'createdAt'
    } = req.query;

    const query = {
      isAvailable: true
    };

    // Add filters
    if (category) {
      query.category = category;
    }
    
    if (city) {
      query['location.city'] = city;
    }
    
    if (area) {
      query['location.area'] = { $regex: area, $options: 'i' };
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    if (priceType) {
      query.priceType = priceType;
    }

    const skip = (page - 1) * limit;
    const sortOptions = {};

    // Handle sorting
    if (sort === 'price') {
      sortOptions.price = 1;
    } else if (sort === 'rating') {
      sortOptions.rating = -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const services = await Service.find(query)
      .populate('provider', 'name email phone profilePicture rating totalReviews')
      .sort(sortOptions)
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

// @desc    Get single service
// @route   GET /api/services/:id
// @access  Public
const getService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('provider', 'name email phone profilePicture rating totalReviews skills experience');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.status(200).json({
      success: true,
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching service',
      error: error.message
    });
  }
};

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private/Provider
const updateService = async (req, res) => {
  try {
    let service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Make sure user owns the service
    if (service.provider.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this service'
      });
    }

    service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('provider', 'name email phone profilePicture rating');

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating service',
      error: error.message
    });
  }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private/Provider
const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Make sure user owns the service
    if (service.provider.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this service'
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

// @desc    Get services by provider
// @route   GET /api/services/provider/:providerId
// @access  Public
const getServicesByProvider = async (req, res) => {
  try {
    const services = await Service.find({
      provider: req.params.providerId,
      isAvailable: true
    }).populate('provider', 'name email phone profilePicture rating');

    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching provider services',
      error: error.message
    });
  }
};

// @desc    Get my services (provider only)
// @route   GET /api/services/my-services
// @access  Private/Provider
const getMyServices = async (req, res) => {
  try {
    const services = await Service.find({ provider: req.user.id })
      .populate('provider', 'name email phone profilePicture rating');

    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching your services',
      error: error.message
    });
  }
};

// @desc    Toggle service availability
// @route   PUT /api/services/:id/toggle-availability
// @access  Private/Provider
const toggleServiceAvailability = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Make sure user owns the service
    if (service.provider.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this service'
      });
    }

    service.isAvailable = !service.isAvailable;
    await service.save();

    res.status(200).json({
      success: true,
      message: `Service ${service.isAvailable ? 'activated' : 'deactivated'} successfully`,
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling service availability',
      error: error.message
    });
  }
};

module.exports = {
  createService,
  getServices,
  getService,
  updateService,
  deleteService,
  getServicesByProvider,
  getMyServices,
  toggleServiceAvailability
}; 