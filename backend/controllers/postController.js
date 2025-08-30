const Post = require('../models/Post');
const SeekerPost = require('../models/SeekerPost');
const ProviderPost = require('../models/ProviderPost');
const Application = require('../models/Application');
const Hire = require('../models/Hire');

// @desc    Create a new seeker post
// @route   POST /api/posts/seeker
// @access  Private (Seeker only)
const createSeekerPost = async (req, res) => {
  try {
    const { _id } = req.user;
    const {
      title,
      description,
      category,
      vacancy,
      minRate,
      maxRate,
      location,
      serviceDate,
      tags,
      images
    } = req.body;

    // Validate required fields for seeker posts
    if (!title || !description || !category || !minRate || !maxRate || !location || !serviceDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (title, description, category, minRate, maxRate, location, serviceDate)'
      });
    }

    // Validate rate range
    if (maxRate < minRate) {
      return res.status(400).json({
        success: false,
        message: 'Maximum rate must be greater than or equal to minimum rate'
      });
    }

    const postData = {
      title,
      description,
      category,
      seekerId: _id,
      vacancy: vacancy || 1,
      budget: {
        min: parseFloat(minRate) || 0,
        max: parseFloat(maxRate) || 0,
        currency: 'BDT'
      },
      location,
      serviceDate,
      tags: tags || [],
      images: images || []
    };

    const post = await SeekerPost.create(postData);
    await post.populate('seekerId');

    res.status(201).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error creating seeker post:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating seeker post',
      error: error.message
    });
  }
};

// @desc    Create a new provider post
// @route   POST /api/posts/provider
// @access  Private (Provider only)
const createProviderPost = async (req, res) => {
  try {
    const { _id } = req.user;
    const {
      title,
      description,
      category,
      price,
      location,
      tags,
      images
    } = req.body;

    // Validate required fields for provider posts
    if (!title || !description || !category || !price || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (title, description, category, price, location)'
      });
    }

    const postData = {
      title,
      description,
      category,
      providerId: _id,
      price,
      location,
      isAvailable: true,
      tags: tags || [],
      images: images || []
    };

    const post = await ProviderPost.create(postData);
    await post.populate('providerId');

    res.status(201).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error creating provider post:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating provider post',
      error: error.message
    });
  }
};

// @desc    Get all posts with filters
// @route   GET /api/posts
// @access  Public
const getAllPosts = async (req, res) => {
  try {
    const { category, location, role, status, page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;
    let allPosts = [];
    let total = 0;

    if (!role || role === 'provider') {
      // Fetch provider posts
      const providerFilter = {};
      if (category) providerFilter.category = category;
      if (location) providerFilter['location.city'] = location;
      if (status) providerFilter.status = status;

      const providerPosts = await ProviderPost.find(providerFilter)
        .populate('providerId')
        .sort({ createdAt: -1 });

      const providerPostsWithMeta = providerPosts.map(post => {
        const postObj = post.toObject();
        postObj.role = 'provider';
        postObj.author = post.providerId; // Set author for frontend compatibility
        postObj.applicationCount = post.hiredBy ? post.hiredBy.length : 0;
        postObj.hireCount = post.hiredBy ? post.hiredBy.filter(h => h.status === 'accepted').length : 0;
        return postObj;
      });

      allPosts = [...allPosts, ...providerPostsWithMeta];
    }

    if (!role || role === 'seeker') {
      // Fetch seeker posts
      const seekerFilter = {};
      if (category) seekerFilter.category = category;
      if (location) seekerFilter['location.city'] = location;
      if (status) seekerFilter.status = status;

      const seekerPosts = await SeekerPost.find(seekerFilter)
        .populate('seekerId')
        .sort({ createdAt: -1 });

      const seekerPostsWithMeta = await Promise.all(seekerPosts.map(async (post) => {
        const postObj = post.toObject();
        postObj.role = 'seeker';
        postObj.author = post.seekerId; // Set author for frontend compatibility
        postObj.applicationCount = post.applicants ? post.applicants.length : 0;
        postObj.hireCount = post.hiredCount || 0;
        // Map budget object to minRate/maxRate for frontend compatibility
        postObj.minRate = post.budget?.min || 0;
        postObj.maxRate = post.budget?.max || 0;
        
        // Check if current user has applied (if user is logged in and is a provider)
        if (req.user && req.user.role === 'provider') {
          const userApplication = await Application.findOne({
            postId: post._id,
            providerId: req.user._id
          });
          postObj.userHasApplied = !!userApplication;
          postObj.userApplicationStatus = userApplication?.status;
        }
        
        return postObj;
      }));

      allPosts = [...allPosts, ...seekerPostsWithMeta];
    }

    // Sort all posts by creation date
    allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination
    total = allPosts.length;
    const paginatedPosts = allPosts.slice(skip, skip + Number(limit));

    res.status(200).json({
      success: true,
      data: paginatedPosts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching posts',
      error: error.message
    });
  }
};

// @desc    Get posts by user (my posts)
// @route   GET /api/posts/my-posts
// @access  Private
const getMyPosts = async (req, res) => {
  try {
    const { _id, role } = req.user;
    const { status, page = 1, limit = 10 } = req.query;

    console.log('getMyPosts called with:', { userId: _id, role, status });

    const skip = (page - 1) * limit;
    let posts = [];
    let total = 0;

    if (role === 'provider') {
      // Fetch from ProviderPost table
      const filter = { providerId: _id };
      if (status) filter.status = status;
      
      posts = await ProviderPost.find(filter)
        .populate('providerId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));
      
      total = await ProviderPost.countDocuments(filter);
      
      // Add application and hire counts for provider posts
      const postsWithMeta = await Promise.all(posts.map(async (post) => {
        const postObj = post.toObject();
        
        // Get hire records for this provider post from both Hire collection and embedded hiredBy
        const hires = await Hire.find({ postId: post._id, postModel: 'ProviderPost' })
          .populate('seekerId', 'name')
          .sort({ createdAt: -1 });
        
        // If no hires in Hire collection, use embedded hiredBy array
        let hiredByData = [];
        if (hires.length > 0) {
          hiredByData = hires.map(hire => ({
            hireId: hire._id.toString(),
            seekerName: hire.seekerId?.name || 'Unknown',
            paymentStatus: hire.paymentStatus || 'pending',
            status: hire.status || 'confirmed'
          }));
        } else if (post.hiredBy && post.hiredBy.length > 0) {
          // Use embedded hiredBy data and try to find corresponding Hire records
          hiredByData = await Promise.all(post.hiredBy.map(async (embedded) => {
            // Try to find corresponding Hire record
            const hireRecord = await Hire.findOne({ 
              postId: post._id, 
              seekerId: embedded.seekerId 
            }).populate('seekerId', 'name');
            
            if (hireRecord) {
              return {
                hireId: hireRecord._id.toString(),
                seekerName: hireRecord.seekerId?.name || 'Unknown',
                paymentStatus: hireRecord.paymentStatus || 'pending',
                status: hireRecord.status || embedded.status || 'confirmed'
              };
            } else {
              // Create a Hire record if it doesn't exist
              const newHire = await Hire.create({
                postId: post._id,
                providerId: post.providerId,
                seekerId: embedded.seekerId,
                postModel: 'ProviderPost',
                status: embedded.status || 'confirmed',
                paymentStatus: 'pending'
              });
              
              await newHire.populate('seekerId', 'name');
              
              return {
                hireId: newHire._id.toString(),
                seekerName: newHire.seekerId?.name || 'Unknown',
                paymentStatus: newHire.paymentStatus || 'pending',
                status: newHire.status || 'confirmed'
              };
            }
          }));
        }
        
        postObj.applicationCount = post.hiredBy ? post.hiredBy.length : 0;
        postObj.hireCount = hiredByData.length;
        postObj.hiredBy = hiredByData;
        
        return postObj;
      }));
      
      posts = postsWithMeta;
    } else {
      // Fetch from SeekerPost table
      const filter = { seekerId: _id };
      if (status) filter.status = status;
      
      posts = await SeekerPost.find(filter)
        .populate('seekerId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));
      
      total = await SeekerPost.countDocuments(filter);
      
      // Add application and hire counts for seeker posts
      const postsWithMeta = posts.map(post => {
        const postObj = post.toObject();
        postObj.applicationCount = post.applicants ? post.applicants.length : 0;
        postObj.hireCount = post.hiredCount || 0;
        return postObj;
      });
      
      posts = postsWithMeta;
    }

    console.log('Found posts:', posts.length);

    res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error in getMyPosts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching posts',
      error: error.message
    });
  }
};

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Public
const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id).populate('author');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Add application count
    const applicationCount = await Application.countDocuments({ postId: post._id });
    const postObj = post.toObject();
    postObj.applicationCount = applicationCount;

    // If user is logged in, check if they've applied
    if (req.user && req.user.role === 'Provider') {
      const userApplication = await Application.findOne({
        postId: post._id,
        providerId: req.user._id
      });
      postObj.userHasApplied = !!userApplication;
      postObj.userApplicationStatus = userApplication?.status;
    }

    res.status(200).json({
      success: true,
      data: postObj
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching post',
      error: error.message
    });
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private (Author only)
const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { _id, role } = req.user;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user is the author
    if (post.authorId.toString() !== _id.toString() || post.role !== role) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post'
      });
    }

    // Don't allow updating certain fields if there are active applications
    const applicationCount = await Application.countDocuments({ 
      postId: id, 
      status: { $in: ['pending', 'approved'] } 
    });

    if (applicationCount > 0) {
      const restrictedFields = ['vacancy', 'minRate', 'maxRate'];
      const hasRestrictedUpdates = restrictedFields.some(field => req.body[field] !== undefined);
      
      if (hasRestrictedUpdates) {
        return res.status(400).json({
          success: false,
          message: 'Cannot update vacancy or rate fields when there are active applications'
        });
      }
    }

    const updatedPost = await Post.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    }).populate('author');

    res.status(200).json({
      success: true,
      data: updatedPost
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating post',
      error: error.message
    });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private (Author only)
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { _id, role } = req.user;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user is the author
    if (post.authorId.toString() !== _id.toString() || post.role !== role) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    // Cascade delete related applications and hires
    await Application.deleteMany({ postId: id });
    await Hire.deleteMany({ postId: id });

    // Delete the post
    await Post.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Post and related data deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting post',
      error: error.message
    });
  }
};

// @desc    Apply to a post
// @route   POST /api/posts/:id/apply
// @access  Private (Provider only)
const applyToPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { _id } = req.user;
    const { offeredAmount, message } = req.body;

    // Validate required fields
    if (!offeredAmount) {
      return res.status(400).json({
        success: false,
        message: 'Offered amount is required'
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if post is active
    if (post.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot apply to inactive post'
      });
    }

    // Check if vacancy is full
    if (post.isVacancyFull) {
      return res.status(400).json({
        success: false,
        message: 'Vacancy is full for this post'
      });
    }

    // Check if provider already applied
    const existingApplication = await Application.findOne({
      postId: id,
      providerId: _id
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this post'
      });
    }

    // Validate offered amount is within range
    if (offeredAmount < post.minRate || offeredAmount > post.maxRate) {
      return res.status(400).json({
        success: false,
        message: `Offered amount must be between ${post.minRate} and ${post.maxRate}`
      });
    }

    // Create application
    const application = await Application.create({
      postId: id,
      providerId: _id,
      offeredAmount,
      message: message || ''
    });

    await application.populate(['post', 'provider']);

    res.status(201).json({
      success: true,
      data: application,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    console.error('Error applying to post:', error);
    res.status(500).json({
      success: false,
      message: 'Error applying to post',
      error: error.message
    });
  }
};

module.exports = {
  createSeekerPost,
  createProviderPost,
  getAllPosts,
  getMyPosts,
  getPostById,
  updatePost,
  deletePost,
  applyToPost
};
