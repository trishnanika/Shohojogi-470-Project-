const ProviderPost = require('../models/ProviderPost');
const Provider = require('../models/Provider');
const Hire = require('../models/Hire');

// @desc    Create a new provider service post
// @route   POST /api/provider-posts
// @access  Private (Provider only)
const createProviderPost = async (req, res) => {
  try {
    const { title, description, category, price, location, tags, images } = req.body;
    const { _id } = req.user;

    const providerPost = await ProviderPost.create({
      title,
      description,
      category,
      price,
      location,
      providerId: _id,
      tags: tags || [],
      images: images || []
    });

    await providerPost.populate('provider', 'name email profileImage');

    res.status(201).json({
      success: true,
      message: 'Service post created successfully',
      data: providerPost
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating service post',
      error: error.message
    });
  }
};

// @desc    Get all provider service posts
// @route   GET /api/provider-posts
// @access  Public
const getProviderPosts = async (req, res) => {
  try {
    const { 
      category, 
      city, 
      search, 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { status: 'active', isAvailable: true };
    
    if (category) {
      filter.category = category;
    }
    
    if (city) {
      filter['location.city'] = city;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const posts = await ProviderPost.find(filter)
      .populate('provider', 'name email profileImage location')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ProviderPost.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: posts,
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
      message: 'Error fetching service posts',
      error: error.message
    });
  }
};

// @desc    Get provider's own posts
// @route   GET /api/provider-posts/my-posts
// @access  Private (Provider only)
const getMyProviderPosts = async (req, res) => {
  try {
    const { _id } = req.user;
    const { status = 'active', page = 1, limit = 10 } = req.query;

    const filter = { providerId: _id };
    
    if (status !== 'all') {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const posts = await ProviderPost.find(filter)
      .populate('provider', 'name email profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ProviderPost.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: posts,
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
      message: 'Error fetching your posts',
      error: error.message
    });
  }
};

// @desc    Get single provider post by ID
// @route   GET /api/provider-posts/:id
// @access  Public
const getProviderPost = async (req, res) => {
  try {
    const post = await ProviderPost.findById(req.params.id)
      .populate('provider', 'name email profileImage location phone')
      .populate('hiredBy.seekerId', 'name email profileImage');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Service post not found'
      });
    }

    // Check if current user has hired this service (if authenticated)
    let userStatus = null;
    if (req.user && req.user._id && req.user.role === 'seeker') {
      const userHire = post.hiredBy.find(
        hire => hire.seekerId && hire.seekerId._id.toString() === req.user._id.toString()
      );
      if (userHire) {
        userStatus = {
          hasHired: true,
          hireStatus: userHire.status,
          hiredAt: userHire.hiredAt
        };
      }
    }

    res.status(200).json({
      success: true,
      data: {
        ...post.toObject(),
        userStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching service post',
      error: error.message
    });
  }
};

// @desc    Hire a provider service
// @route   POST /api/provider-posts/:id/hire
// @access  Private (Seeker only)
const hireProviderService = async (req, res) => {
  try {
    const { _id, role } = req.user;
    const { message } = req.body;
    const postId = req.params.id;

    if (role !== 'seeker') {
      return res.status(400).json({
        success: false,
        message: 'Only seekers can hire providers'
      });
    }

    const post = await ProviderPost.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Service post not found'
      });
    }

    // Check if already hired
    const existingHire = post.hiredBy.find(
      hire => hire.seekerId && hire.seekerId.toString() === _id.toString()
    );

    if (existingHire) {
      // Ensure a Hire row exists even if previously only ProviderPost.hiredBy was updated
      try {
        const existingHireDoc = await Hire.findOne({
          seekerId: _id,
          providerId: post.providerId,
          postId: post._id,
          postModel: 'ProviderPost'
        });
        if (!existingHireDoc) {
          await Hire.create({
            seekerId: _id,
            providerId: post.providerId,
            postId: post._id,
            postModel: 'ProviderPost',
            notes: existingHire.message || message || 'Hire request',
            status: 'confirmed',
            paymentStatus: 'pending',
            amount: post.price || 0,
            currency: 'BDT'
          });
        }
      } catch (e) {
        console.error('Failed to backfill Hire record for existing ProviderPost hire:', e.message);
      }
      return res.status(200).json({
        success: true,
        message: 'You have already hired this service'
      });
    }

    // Add hire request to ProviderPost
    post.hiredBy.push({
      seekerId: _id,
      message: message || 'Hire request',
      hiredAt: new Date(),
      status: 'pending'
    });

    await post.save();

    // Also create a Hire record to persist in hires collection
    try {
      await Hire.create({
        seekerId: _id,
        providerId: post.providerId,
        postId: post._id,
        postModel: 'ProviderPost',
        notes: message || 'Hire request',
        status: 'confirmed',
        paymentStatus: 'pending',
        amount: post.price || 0,
        currency: 'BDT'
      });
    } catch (e) {
      // Don't fail the request if Hire creation fails; log and continue
      console.error('Failed to create Hire record for ProviderPost hire:', e.message);
    }

    res.status(200).json({
      success: true,
      message: 'Service hired successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error hiring service',
      error: error.message
    });
  }
};

module.exports = {
  createProviderPost,
  getProviderPosts,
  getMyProviderPosts,
  getProviderPost,
  hireProviderService
};

// --- Added below: update and delete handlers for provider posts ---
// @desc    Update a provider service post
// @route   PUT /api/provider-posts/:id
// @access  Private (Provider only)
const updateProviderPost = async (req, res) => {
  try {
    const post = await ProviderPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Service post not found' });
    }

    // Ensure the authenticated provider owns this post
    if (String(post.providerId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this post' });
    }

    const updatable = ['title', 'description', 'category', 'price', 'location', 'tags', 'images', 'isAvailable', 'status'];
    const updates = {};
    for (const key of updatable) {
      if (key in req.body) updates[key] = req.body[key];
    }

    const updated = await ProviderPost.findByIdAndUpdate(post._id, updates, { new: true, runValidators: true })
      .populate('provider', 'name email profileImage');

    return res.status(200).json({ success: true, message: 'Post updated successfully', data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating post', error: error.message });
  }
};

// @desc    Delete a provider service post
// @route   DELETE /api/provider-posts/:id
// @access  Private (Provider only)
const deleteProviderPost = async (req, res) => {
  try {
    const post = await ProviderPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Service post not found' });
    }

    // Ensure the authenticated provider owns this post
    if (String(post.providerId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
    }

    await post.deleteOne();
    return res.status(200).json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error deleting post', error: error.message });
  }
};

// Re-export including new handlers
module.exports.updateProviderPost = updateProviderPost;
module.exports.deleteProviderPost = deleteProviderPost;
