const SeekerPost = require('../models/SeekerPost');
const Hire = require('../models/Hire');

// @desc    Create a new seeker request post
// @route   POST /api/seeker-posts
// @access  Private (Seeker only)
const createSeekerPost = async (req, res) => {
  try {
    const { title, description, category, budget, location, tags, urgency, deadline } = req.body;
    const { _id } = req.user;

    const seekerPost = await SeekerPost.create({
      title,
      description,
      category,
      budget,
      location,
      seekerId: _id,
      tags: tags || [],
      urgency: urgency || 'medium',
      deadline: deadline ? new Date(deadline) : null
    });

    await seekerPost.populate('seeker', 'name email profileImage');

    res.status(201).json({
      success: true,
      message: 'Request post created successfully',
      data: seekerPost
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating request post',
      error: error.message
    });
  }
};

// @desc    Get all seeker request posts
// @route   GET /api/seeker-posts
// @access  Public
const getSeekerPosts = async (req, res) => {
  try {
    const { 
      category, 
      city, 
      search, 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeClosed
    } = req.query;

    // Build filter object
    const filter = {};
    if (!includeClosed || includeClosed === 'false') {
      filter.status = 'active';
    }
    
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

    const posts = await SeekerPost.find(filter)
      .populate('seeker', 'name email profileImage location')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SeekerPost.countDocuments(filter);

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
      message: 'Error fetching request posts',
      error: error.message
    });
  }
};

// @desc    Get seeker's own posts
// @route   GET /api/seeker-posts/my-posts
// @access  Private (Seeker only)
const getMySeekerPosts = async (req, res) => {
  try {
    const { _id } = req.user;
    const { status = 'active', page = 1, limit = 10 } = req.query;

    const filter = { seekerId: _id };
    
    if (status !== 'all') {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const posts = await SeekerPost.find(filter)
      .populate('seeker', 'name email profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SeekerPost.countDocuments(filter);

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

// @desc    Get single seeker post by ID
// @route   GET /api/seeker-posts/:id
// @access  Public
const getSeekerPost = async (req, res) => {
  try {
    const post = await SeekerPost.findById(req.params.id)
      .populate('seeker', 'name email profileImage location phone')
      .populate('applicants.providerId', 'name email profileImage');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Request post not found'
      });
    }

    // Check if current user has applied (if authenticated)
    let userStatus = null;
    if (req.user && req.user._id && req.user.role === 'provider') {
      const userApplication = post.applicants.find(
        app => app.providerId && app.providerId._id.toString() === req.user._id.toString()
      );
      if (userApplication) {
        userStatus = {
          hasApplied: true,
          applicationStatus: userApplication.status,
          appliedAt: userApplication.appliedAt
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
      message: 'Error fetching request post',
      error: error.message
    });
  }
};

// @desc    Apply to a seeker request
// @route   POST /api/seeker-posts/:id/apply
// @access  Private (Provider only)
const applyToSeekerPost = async (req, res) => {
  try {
    const { _id, role } = req.user;
    const { message } = req.body;
    const postId = req.params.id;

    if (role !== 'provider') {
      return res.status(400).json({
        success: false,
        message: 'Only providers can apply to seeker requests'
      });
    }

    const post = await SeekerPost.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Request post not found'
      });
    }

    // Prevent applying to closed/non-active posts
    if (post.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This post is closed and not accepting applications'
      });
    }

    // Check if already applied
    const existingApplication = post.applicants.find(
      app => app.providerId && app.providerId.toString() === _id.toString()
    );

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this request'
      });
    }

    // Add application
    post.applicants.push({
      providerId: _id,
      message: message || '',
      appliedAt: new Date()
    });

    // Close the post to prevent further applications/hiring
    post.status = 'completed';
    post.closedBy = 'applied';
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error applying to request',
      error: error.message
    });
  }
};

// @desc    Get seeker dashboard stats
// @route   GET /api/seeker-posts/stats
// @access  Private/Seeker
const getSeekerStats = async (req, res) => {
  try {
    const seekerId = req.user._id;

    const [totalPosts, seekerPosts, hires] = await Promise.all([
      SeekerPost.countDocuments({ seekerId }),
      SeekerPost.find({ seekerId }),
      Hire.find({ seekerId: seekerId })
    ]);

    const totalApplications = seekerPosts.reduce((acc, post) => acc + post.applicants.length, 0);

    const totalHires = hires.length;
    const totalSpending = hires
      .filter(h => h.status === 'completed')
      .reduce((acc, h) => acc + (h.amount || 0), 0);

    const stats = {
      posts: {
        total: totalPosts
      },
      applications: {
        total: totalApplications
      },
      hires: {
        total: totalHires
      },
      spending: {
        total: totalSpending
      }
    };

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching seeker stats',
      error: error.message
    });
  }
};

// @desc    Update a seeker post
// @route   PUT /api/seeker-posts/:id
// @access  Private (Seeker only - own posts)
const updateSeekerPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { _id } = req.user;
    const { title, description, category, budget, location, tags, urgency, deadline } = req.body;

    const post = await SeekerPost.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user owns this post
    if (post.seekerId.toString() !== _id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post'
      });
    }

    // Update the post
    post.title = title || post.title;
    post.description = description || post.description;
    post.category = category || post.category;
    post.budget = budget || post.budget;
    post.location = location || post.location;
    post.tags = tags || post.tags;
    post.urgency = urgency || post.urgency;
    post.deadline = deadline ? new Date(deadline) : post.deadline;

    await post.save();
    await post.populate('seeker', 'name email profileImage');

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      data: post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating post',
      error: error.message
    });
  }
};

// @desc    Delete a seeker post
// @route   DELETE /api/seeker-posts/:id
// @access  Private (Seeker only - own posts)
const deleteSeekerPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { _id } = req.user;

    const post = await SeekerPost.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user owns this post
    if (post.seekerId.toString() !== _id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    await SeekerPost.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting post',
      error: error.message
    });
  }
};

module.exports = {
  createSeekerPost,
  getSeekerPosts,
  getMySeekerPosts,
  getSeekerPost,
  applyToSeekerPost,
  updateSeekerPost,
  deleteSeekerPost,
  getSeekerStats
};
