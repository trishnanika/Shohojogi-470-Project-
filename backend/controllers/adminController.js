const Provider = require('../models/Provider');
const Seeker = require('../models/Seeker');
const Service = require('../models/Service');
const Post = require('../models/Post');
const ProviderPost = require('../models/ProviderPost');
const SeekerPost = require('../models/SeekerPost');
const Application = require('../models/Application');
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

    let allPosts = [];

    // Get provider posts
    const providerPosts = await ProviderPost.find()
      .populate('providerId', 'name email')
      .sort({ createdAt: -1 });

    // Get seeker posts  
    const seekerPosts = await SeekerPost.find()
      .populate('seekerId', 'name email')
      .sort({ createdAt: -1 });

    // Format provider posts
    const formattedProviderPosts = providerPosts.map(post => ({
      _id: post._id,
      title: post.title,
      description: post.description,
      category: post.category,
      location: post.location,
      status: post.status || 'active',
      createdAt: post.createdAt,
      postType: 'Provider',
      author: post.providerId,
      price: post.price,
      priceType: post.priceType,
      hiredBy: post.hiredBy || []
    }));

    // Format seeker posts
    const formattedSeekerPosts = seekerPosts.map(post => ({
      _id: post._id,
      title: post.title,
      description: post.description,
      category: post.category,
      location: post.location,
      status: post.status || 'active',
      createdAt: post.createdAt,
      postType: 'Seeker',
      author: post.seekerId,
      budget: post.budget,
      vacancy: post.vacancy,
      applicants: post.applicants || []
    }));

    allPosts = [...formattedProviderPosts, ...formattedSeekerPosts];

    // Get applications for each post
    const allApplications = await Application.find()
      .populate('providerId', 'name email')
      .populate('postId', 'title');

    // Get hire information
    const allHires = await Hire.find()
      .populate('providerId', 'name email')
      .populate('seekerId', 'name email')
      .populate('postId', 'title');

    // Sort all posts by creation date
    allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply filters
    let filteredPosts = allPosts;
    
    if (postType && postType !== 'all') {
      filteredPosts = filteredPosts.filter(post => 
        post.postType.toLowerCase() === postType.toLowerCase()
      );
    }
    
    if (status && status !== 'all') {
      filteredPosts = filteredPosts.filter(post => post.status === status);
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    const paginatedPosts = filteredPosts.slice(skip, skip + parseInt(limit));

    // Add application and hire counts
    const enrichedPosts = paginatedPosts.map(post => {
      const postApplications = allApplications.filter(app => 
        app.postId && app.postId._id.toString() === post._id.toString()
      );
      
      const postHires = allHires.filter(hire => 
        hire.postId && hire.postId._id.toString() === post._id.toString()
      );

      return {
        ...post,
        applicationCount: postApplications.length,
        hireCount: postHires.length,
        author: post.author ? {
          _id: post.author._id,
          name: post.author.name,
          email: post.author.email,
          isBanned: !!post.author.isBanned
        } : null,
        applications: postApplications.map(app => ({
          _id: app._id,
          provider: app.providerId,
          offeredAmount: app.offeredAmount,
          message: app.message,
          status: app.status,
          createdAt: app.createdAt
        })),
        hires: postHires.map(h => ({
          _id: h._id,
          provider: h.providerId,
          seeker: h.seekerId,
          amount: h.amount,
          paymentStatus: h.paymentStatus,
          status: h.status,
          createdAt: h.createdAt
        }))
      };
    });

    const total = enrichedPosts.length;
    const finalPosts = enrichedPosts.slice((page - 1) * limit, page * limit);

    res.status(200).json({
      success: true,
      count: finalPosts.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      data: finalPosts
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
    const { id } = req.params;

    // Try to find the post in both collections
    let post = await ProviderPost.findById(id);
    let isProviderPost = true;
    
    if (!post) {
      post = await SeekerPost.findById(id);
      isProviderPost = false;
    }

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Cascade delete related applications and hire records
    await Application.deleteMany({ postId: id });
    await Hire.deleteMany({ postId: id });

    // Delete the post from the appropriate collection
    if (isProviderPost) {
      await ProviderPost.findByIdAndDelete(id);
    } else {
      await SeekerPost.findByIdAndDelete(id);
    }

    res.status(200).json({ success: true, message: 'Post and related records deleted successfully' });
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
