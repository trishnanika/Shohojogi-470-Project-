const Provider = require('../models/Provider');
const Seeker = require('../models/Seeker');
const Service = require('../models/Service');
const ProviderPost = require('../models/ProviderPost');
const SeekerPost = require('../models/SeekerPost');
const Hire = require('../models/Hire');
const User = require('../models/User');

// @desc    Get all users (providers and seekers)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const providers = await Provider.find().select('-password');
    const seekers = await Seeker.find().select('-password');
    
    const users = [...providers, ...seekers];
    
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Delete a user by ID and role
// @route   DELETE /api/admin/users/:role/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const { id, role } = req.params;
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

    const user = await Model.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get all posts for admin management
// @route   GET /api/admin/posts
// @access  Private/Admin
const getAllPosts = async (req, res) => {
  try {
    const { postType, status, page = 1, limit = 10 } = req.query;

    let posts = [];
    let total = 0;

    const providerPosts = await ProviderPost.find()
      .populate('providerId', 'name email')
      .sort({ createdAt: -1 });

    const seekerPosts = await SeekerPost.find()
      .populate('seekerId', 'name email')
      .sort({ createdAt: -1 });

    posts = [
      ...providerPosts.map(p => ({
        _id: p._id,
        title: p.title,
        description: p.description,
        location: p.location,
        status: p.status,
        createdAt: p.createdAt,
        postType: 'Provider',
        // Normalize price into a budget shape for 1-line UI
        budget: p.price != null ? { min: p.price, max: p.price } : null,
        author: p.providerId ? {
          _id: p.providerId._id,
          name: p.providerId.name,
          email: p.providerId.email,
          isBanned: !!p.providerId.isBanned
        } : null
      })),
      ...seekerPosts.map(p => ({
        _id: p._id,
        title: p.title,
        description: p.description,
        category: p.category,
        location: p.location,
        status: p.status,
        createdAt: p.createdAt,
        postType: 'Seeker',
        budget: p.budget || null,
        author: p.seekerId ? {
          _id: p.seekerId._id,
          name: p.seekerId.name,
          email: p.seekerId.email,
          isBanned: !!p.seekerId.isBanned
        } : null
      }))
    ];

    // Sort by creation date (newest first)
    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    total = posts.length;

    const paginatedPosts = posts.slice((page - 1) * limit, page * limit);

    res.status(200).json({
      success: true,
      count: paginatedPosts.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      data: paginatedPosts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Delete a post (admin only)
// @route   DELETE /api/admin/posts/:id
// @access  Private/Admin
const deletePost = async (req, res) => {
  try {
    const { postType } = req.body; // Expect postType: 'Provider' or 'Seeker'
    const { id } = req.params;

    let Model;
    if (postType === 'Provider') {
      Model = ProviderPost;
    } else if (postType === 'Seeker') {
      Model = SeekerPost;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid post type' });
    }

    const post = await Model.findByIdAndDelete(id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    res.status(200).json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Ban a user
// @route   PUT /api/admin/users/:role/:id/ban
// @access  Private/Admin
const banUser = async (req, res) => {
  try {
    const { id, role } = req.params;
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

    const user = await Model.findByIdAndUpdate(
      id,
      { isBanned: true, bannedAt: new Date() },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ success: true, message: 'User banned successfully', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Unban a user
// @route   PUT /api/admin/users/:role/:id/unban
// @access  Private/Admin
const unbanUser = async (req, res) => {
  try {
    const { id, role } = req.params;
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

    const user = await Model.findByIdAndUpdate(
      id,
      { $unset: { isBanned: 1, bannedAt: 1 } },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ success: true, message: 'User unbanned successfully', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const [ 
      totalProviders, 
      totalSeekers, 
      bannedProviders, 
      bannedSeekers,
      totalServices,
      activeServices,
      featuredServices,
      totalProviderPosts,
      totalSeekerPosts,
      totalHires,
      completedHires,
      seekerPosts
    ] = await Promise.all([
      Provider.countDocuments(),
      Seeker.countDocuments(),
      Provider.countDocuments({ isBanned: true }),
      Seeker.countDocuments({ isBanned: true }),
      Service.countDocuments(),
      Service.countDocuments({ isAvailable: true }),
      Service.countDocuments({ isFeatured: true }),
      ProviderPost.countDocuments(),
      SeekerPost.countDocuments(),
      Hire.countDocuments(),
      Hire.countDocuments({ status: 'completed' }),
      SeekerPost.find()
    ]);

    const totalUsers = totalProviders + totalSeekers;
    const bannedUsers = bannedProviders + bannedSeekers;
    const totalApplications = seekerPosts.reduce((acc, post) => acc + ((post && Array.isArray(post.applicants)) ? post.applicants.length : 0), 0);

    const stats = {
      users: {
        total: totalUsers,
        providers: totalProviders,
        seekers: totalSeekers,
        banned: bannedUsers,
      },
      services: {
        total: totalServices,
        active: activeServices,
        featured: featuredServices,
      },
      posts: {
        total: totalProviderPosts + totalSeekerPosts,
        provider: totalProviderPosts,
        seeker: totalSeekerPosts,
      },
      hires: {
        total: totalHires,
        completed: completedHires,
      },
      applications: {
        total: totalApplications,
      },
    };

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllUsers,
  deleteUser,
  getAllPosts,
  deletePost,
  banUser,
  unbanUser,
  getDashboardStats
};
