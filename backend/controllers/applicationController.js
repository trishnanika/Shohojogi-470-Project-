const Post = require('../models/Post');
const Application = require('../models/Application');
const Hire = require('../models/Hire');

// @desc    Get applications submitted by provider
// @route   GET /api/applications/my-applications
// @access  Private (Provider only)
const getMyApplications = async (req, res) => {
  try {
    const { _id, role } = req.user;

    if (role !== 'provider') {
      return res.status(403).json({
        success: false,
        message: 'Only providers can view their applications'
      });
    }

    // Find applications submitted by this provider
    const applications = await Application.find({ providerId: _id })
      .populate({
        path: 'postId',
        select: 'title category budget vacancy description'
      })
      .populate({
        path: 'seekerId',
        select: 'name email profileImage'
      })
      .sort({ createdAt: -1 });

    // Transform the data to include minRate/maxRate from budget
    const transformedApplications = applications.map(app => {
      const appObj = app.toObject();
      if (appObj.postId && appObj.postId.budget) {
        appObj.postId.minRate = appObj.postId.budget.min;
        appObj.postId.maxRate = appObj.postId.budget.max;
      }
      return appObj;
    });

    res.status(200).json({
      success: true,
      data: transformedApplications
    });
  } catch (error) {
    console.error('Error fetching provider applications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message
    });
  }
};

// @desc    Get applications for posts owned by user (seeker/provider)
// @route   GET /api/applications/received
// @access  Private
const getReceivedApplications = async (req, res) => {
  try {
    const { _id, role } = req.user;

    let applications = [];

    if (role === 'seeker') {
      // Find applications for seeker posts
      applications = await Application.find({ 
        seekerId: _id,
        postModel: 'SeekerPost'
      })
      .populate({
        path: 'providerId',
        select: 'name email profileImage'
      })
      .populate({
        path: 'postId',
        select: 'title category budget vacancy description'
      })
      .sort({ createdAt: -1 });
    } else {
      // Find posts created by this user
      const userPosts = await Post.find({ authorId: _id, role });
      const postIds = userPosts.map(p => p._id);

      // Find applications for these posts
      applications = await Application.find({ 
        postId: { $in: postIds } 
      })
      .populate({
        path: 'provider',
        select: 'name email profileImage'
      })
      .populate({
        path: 'post',
        select: 'title category minRate maxRate vacancy hiredCount'
      })
      .sort({ createdAt: -1 });
    }

    // Transform seeker applications to include minRate/maxRate from budget
    if (role === 'seeker') {
      applications = applications.map(app => {
        const appObj = app.toObject();
        if (appObj.postId && appObj.postId.budget) {
          appObj.postId.minRate = appObj.postId.budget.min;
          appObj.postId.maxRate = appObj.postId.budget.max;
        }
        return appObj;
      });
    }

    res.status(200).json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Error fetching received applications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching received applications',
      error: error.message
    });
  }
};

// @desc    Update application status (approve/reject) - for post owners
// @route   PATCH /api/applications/:applicationId
// @access  Private (Post owner only)
const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;
    const { _id, role } = req.user;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Status must be either "approved" or "rejected"'
      });
    }

    // Find the application
    const application = await Application.findById(applicationId)
      .populate('postId')
      .populate('providerId');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if user is the post owner (for SeekerPost, check seekerId)
    if (application.postModel === 'SeekerPost') {
      if (application.postId.seekerId.toString() !== _id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this application'
        });
      }
    } else {
      // For regular posts, check authorId
      if (application.postId.authorId.toString() !== _id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this application'
        });
      }
    }

    // Check if vacancy is available for approval
    if (status === 'approved') {
      const post = application.postId;
      if (post.hiredCount >= post.vacancy) {
        return res.status(400).json({
          success: false,
          message: 'Vacancy limit reached. Cannot approve more applications.'
        });
      }

      // Create hire record
      const hire = await Hire.create({
        postId: post._id,
        seekerId: application.seekerId,
        providerId: application.providerId,
        applicationId: application._id,
        offeredAmount: application.offeredAmount,
        postModel: application.postModel
      });

      // Update post hired count based on post model
      if (application.postModel === 'SeekerPost') {
        const SeekerPost = require('../models/SeekerPost');
        await SeekerPost.findByIdAndUpdate(post._id, {
          $inc: { hiredCount: 1 }
        });
      } else {
        const Post = require('../models/Post');
        await Post.findByIdAndUpdate(post._id, {
          $inc: { hiredCount: 1 }
        });
      }
    }

    // Update application status
    application.status = status;
    await application.save();

    res.status(200).json({
      success: true,
      message: `Application ${status}`,
      data: application
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating application status',
      error: error.message
    });
  }
};

// @desc    Get applications sent by a provider
// @route   GET /api/applications/sent
// @access  Private (Provider only)
const getSentApplications = async (req, res) => {
  try {
    const { _id } = req.user;

    // Find applications sent by this provider
    const applications = await Application.find({ providerId: _id })
      .populate({
        path: 'post',
        populate: {
          path: 'author',
          select: 'name email profileImage'
        }
      })
      .sort({ createdAt: -1 });

    // Format applications with post owner details
    const formattedApplications = applications.map(app => ({
      id: app._id,
      postId: app.post._id,
      postTitle: app.post.title,
      postOwner: app.post.author,
      offeredAmount: app.offeredAmount,
      message: app.message,
      status: app.status,
      appliedAt: app.createdAt,
      postCategory: app.post.category,
      postMinRate: app.post.minRate,
      postMaxRate: app.post.maxRate,
      postVacancy: app.post.vacancy,
      postHiredCount: app.post.hiredCount,
      canReapply: app.status === 'rejected' && !app.post.isVacancyFull
    }));

    res.status(200).json({
      success: true,
      data: formattedApplications
    });
  } catch (error) {
    console.error('Error fetching sent applications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sent applications',
      error: error.message
    });
  }
};

// @desc    Reapply to a post (after rejection)
// @route   POST /api/applications/:applicationId/reapply
// @access  Private (Provider only)
const reapplyToPost = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { offeredAmount, message } = req.body;
    const { _id } = req.user;

    // Find the existing application
    const existingApplication = await Application.findById(applicationId)
      .populate('post');

    if (!existingApplication) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if user owns this application
    if (existingApplication.providerId.toString() !== _id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reapply for this application'
      });
    }

    // Check if application was rejected
    if (existingApplication.status !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Can only reapply to rejected applications'
      });
    }

    const post = existingApplication.post;

    // Check if post is still active and has vacancy
    if (post.status !== 'active' || post.isVacancyFull) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reapply to this post - either inactive or vacancy full'
      });
    }

    // Validate offered amount
    if (!offeredAmount || offeredAmount < post.minRate || offeredAmount > post.maxRate) {
      return res.status(400).json({
        success: false,
        message: `Offered amount must be between ${post.minRate} and ${post.maxRate}`
      });
    }

    // Update the existing application
    existingApplication.offeredAmount = offeredAmount;
    existingApplication.message = message || '';
    existingApplication.status = 'pending';
    await existingApplication.save();

    await existingApplication.populate(['post', 'provider']);

    res.status(200).json({
      success: true,
      data: existingApplication,
      message: 'Reapplication submitted successfully'
    });
  } catch (error) {
    console.error('Error reapplying to post:', error);
    res.status(500).json({
      success: false,
      message: 'Error reapplying to post',
      error: error.message
    });
  }
};

module.exports = {
  getMyApplications,
  getReceivedApplications,
  updateApplicationStatus,
  getSentApplications,
  reapplyToPost
};