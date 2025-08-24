const Hire = require('../models/Hire');
const SeekerPost = require('../models/SeekerPost');
const Provider = require('../models/Provider');
const Seeker = require('../models/Seeker');

// @desc    Create a new hire
// @route   POST /api/hires
// @access  Private (Seeker only)
const createHire = async (req, res) => {
  try {
    const { _id } = req.user;
    const { providerId, postId, notes } = req.body;

    // Validate that the post exists (SeekerPost)
    const post = await SeekerPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Prevent hiring on closed/non-active posts
    if (post.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This post is closed and cannot be hired against'
      });
    }

    // Validate that the provider exists
    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    // Create the hire record
    const hire = await Hire.create({
      seekerId: _id,
      providerId,
      postId,
      postModel: 'SeekerPost',
      notes,
      status: 'confirmed',
      paymentStatus: 'pending',
      amount: post.budget?.max || 0,
      currency: 'BDT'
    });

    // Mark the post as completed (no further applications/hiring)
    post.status = 'completed';
    post.closedBy = 'hired';
    await post.save();

    res.status(201).json({
      success: true,
      data: hire
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating hire record',
      error: error.message
    });
  }
};

// @desc    Get all hires for a seeker
// @route   GET /api/hires/my-hires
// @access  Private (Seeker only)
const getMyHires = async (req, res) => {
  try {
    const { _id } = req.user;
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { seekerId: _id };
    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const hires = await Hire.find(filter)
      .populate('providerId', 'name email profileImage')
      .populate('postId', 'title description category budget')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Hire.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: hires,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching hire records',
      error: error.message
    });
  }
};

// @desc    Get all hires for a provider
// @route   GET /api/hires/received
// @access  Private (Provider only)
const getReceivedHires = async (req, res) => {
  try {
    const { _id } = req.user;
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { providerId: _id };
    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const hires = await Hire.find(filter)
      .populate('seekerId', 'name email profileImage')
      .populate('postId', 'title description category budget')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Hire.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: hires,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching hire records',
      error: error.message
    });
  }
};

// @desc    Update hire status
// @route   PATCH /api/hires/:id
// @access  Private (Hire owner or provider only)
const updateHireStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;
    const { _id, role } = req.user;

    const hire = await Hire.findById(id);

    if (!hire) {
      return res.status(404).json({
        success: false,
        message: 'Hire record not found'
      });
    }

    // Check if user is authorized to update this hire
    if (role === 'seeker' && hire.seekerId.toString() !== _id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this hire record'
      });
    }

    if (role === 'provider' && hire.providerId.toString() !== _id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this hire record'
      });
    }

    // Update the hire record
    if (status) {
      hire.status = status;
    }

    if (paymentStatus) {
      hire.paymentStatus = paymentStatus;
    }

    await hire.save();

    res.status(200).json({
      success: true,
      data: hire
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating hire record',
      error: error.message
    });
  }
};

// @desc    Get a single hire record
// @route   GET /api/hires/:id
// @access  Private (Hire owner or provider only)
const getHire = async (req, res) => {
  try {
    const { id } = req.params;
    const { _id, role } = req.user;

    const hire = await Hire.findById(id)
      .populate('seekerId', 'name email profileImage')
      .populate('providerId', 'name email profileImage')
      .populate('postId', 'title description category budget');

    if (!hire) {
      return res.status(404).json({
        success: false,
        message: 'Hire record not found'
      });
    }

    // Check if user is authorized to view this hire
    if (role === 'seeker' && hire.seekerId._id.toString() !== _id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this hire record'
      });
    }

    if (role === 'provider' && hire.providerId._id.toString() !== _id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this hire record'
      });
    }

    res.status(200).json({
      success: true,
      data: hire
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching hire record',
      error: error.message
    });
  }
};

module.exports = {
  createHire,
  getMyHires,
  getReceivedHires,
  updateHireStatus,
  getHire
};