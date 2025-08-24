const SeekerPost = require('../models/SeekerPost');
const Service = require('../models/Service');

// @desc    Get applications received by a provider
// @route   GET /api/applications/received
// @access  Private (Provider only)
const getReceivedApplications = async (req, res) => {
  try {
    const { _id } = req.user;

    // Find services created by this provider that have applications in seeker posts
    const services = await Service.find({ provider: _id });
    const serviceIds = services.map(s => s._id);
    
    // Find seeker posts that have applications for this provider's services
    const postsWithApplicants = await SeekerPost.find({
      'applicants.providerId': _id,
      'applicants.0': { $exists: true }
    }).populate({
      path: 'applicants.providerId',
      select: 'name email profileImage'
    }).populate({
      path: 'seekerId',
      select: 'name email profileImage'
    });

    // Extract and format applications for this provider
    const applications = [];
    
    postsWithApplicants.forEach(post => {
      post.applicants.forEach(applicant => {
        if (applicant.providerId._id.toString() === _id.toString()) {
          applications.push({
            id: applicant._id,
            postId: post._id,
            postTitle: post.title,
            seekerId: post.seekerId._id,
            seekerName: post.seekerId.name,
            seekerEmail: post.seekerId.email,
            seekerImage: post.seekerId.profileImage,
            message: applicant.message,
            status: applicant.status,
            appliedAt: applicant.appliedAt,
            postCategory: post.category,
            postBudget: post.budget
          });
        }
      });
    });

    // Sort by most recent first
    applications.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

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

// @desc    Update application status (accept/reject)
// @route   PATCH /api/applications/:applicationId
// @access  Private (Provider only)
const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;
    const { _id } = req.user;

    if (!status || !['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Status must be either "accepted" or "rejected"'
      });
    }

    // Find the seeker post that contains this application
    const post = await SeekerPost.findOne({
      'applicants._id': applicationId,
      'applicants.providerId': _id
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or you do not have permission to update it'
      });
    }

    // Update the application status
    const applicationIndex = post.applicants.findIndex(
      app => app._id.toString() === applicationId
    );

    if (applicationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    post.applicants[applicationIndex].status = status;
    await post.save();

    res.status(200).json({
      success: true,
      message: `Application ${status}`,
      data: post.applicants[applicationIndex]
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

// @desc    Get applications sent by a user (provider/seeker)
// @route   GET /api/applications/sent
// @access  Private
const getSentApplications = async (req, res) => {
  try {
    const { _id } = req.user;

    // Find seeker posts where this provider has applied
    const postsWithMyApplications = await SeekerPost.find({
      'applicants.providerId': _id
    }).populate({
      path: 'seekerId',
      select: 'name email profileImage'
    });

    // Extract and format applications
    const applications = [];
    
    postsWithMyApplications.forEach(post => {
      post.applicants.forEach(applicant => {
        if (applicant.providerId.toString() === _id.toString()) {
          applications.push({
            id: applicant._id,
            postId: post._id,
            postTitle: post.title,
            postOwnerId: post.seekerId._id,
            postOwnerName: post.seekerId.name,
            postOwnerEmail: post.seekerId.email,
            postOwnerImage: post.seekerId.profileImage,
            message: applicant.message,
            status: applicant.status || 'pending',
            appliedAt: applicant.appliedAt,
            postCategory: post.category,
            postBudget: post.budget
          });
        }
      });
    });

    // Sort by most recent first
    applications.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

    res.status(200).json({
      success: true,
      data: applications
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

module.exports = {
  getReceivedApplications,
  updateApplicationStatus,
  getSentApplications
};