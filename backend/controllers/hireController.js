const Post = require('../models/Post');
const Application = require('../models/Application');
const Hire = require('../models/Hire');
const Provider = require('../models/Provider');
const Seeker = require('../models/Seeker');

// @desc    Get hire history for seeker (providers they hired)
// @route   GET /api/hires/seeker-history
// @access  Private (Seeker only)
const getSeekerHireHistory = async (req, res) => {
  try {
    const { _id } = req.user;

    const hires = await Hire.find({ seekerId: _id })
      .populate({
        path: 'providerId',
        select: 'name email profileImage'
      })
      .populate({
        path: 'postId',
        refPath: 'postModel',
        select: 'title category budget description providerId seekerId'
      })
      .sort({ createdAt: -1 });

    // Manually populate the post owners based on postModel
    const Seeker = require('../models/Seeker');
    const Provider = require('../models/Provider');
    
    for (let hire of hires) {
      if (hire.postId) {
        if (hire.postModel === 'SeekerPost' && hire.postId.seekerId) {
          const seeker = await Seeker.findById(hire.postId.seekerId).select('name');
          if (seeker) {
            hire.postId.seekerId = seeker;
          }
        } else if (hire.postModel === 'ProviderPost' && hire.postId.providerId) {
          const provider = await Provider.findById(hire.postId.providerId).select('name');
          if (provider) {
            hire.postId.providerId = provider;
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      data: hires
    });
  } catch (error) {
    console.error('Error fetching seeker hire history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hire history',
      error: error.message
    });
  }
};

// @desc    Get hire history for provider (jobs they were hired for)
// @route   GET /api/hires/provider-history
// @access  Private (Provider only)
const getProviderHireHistory = async (req, res) => {
  try {
    const { _id } = req.user;

    const hires = await Hire.find({ providerId: _id })
      .populate({
        path: 'seekerId',
        select: 'name email profileImage'
      })
      .populate({
        path: 'postId',
        refPath: 'postModel',
        select: 'title category budget description providerId seekerId'
      })
      .sort({ createdAt: -1 });

    // Manually populate the post owners based on postModel
    const Seeker = require('../models/Seeker');
    const Provider = require('../models/Provider');
    
    for (let hire of hires) {
      if (hire.postId) {
        if (hire.postModel === 'SeekerPost' && hire.postId.seekerId) {
          const seeker = await Seeker.findById(hire.postId.seekerId).select('name');
          if (seeker) {
            hire.postId.seekerId = seeker;
          }
        } else if (hire.postModel === 'ProviderPost' && hire.postId.providerId) {
          const provider = await Provider.findById(hire.postId.providerId).select('name');
          if (provider) {
            hire.postId.providerId = provider;
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      data: hires
    });
  } catch (error) {
    console.error('Error fetching provider hire history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hire history',
      error: error.message
    });
  }
};

// @desc    Update payment status with ownership rules
// @route   PATCH /api/hires/:id/payment
// @access  Private
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;
    const { _id, role } = req.user;

    if (!['pending', 'paid', 'cancelled'].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status. Must be: pending, paid, or cancelled'
      });
    }

    const hire = await Hire.findById(id)
      .populate({
        path: 'postId',
        refPath: 'postModel',
        select: 'title category budget description providerId seekerId'
      })
      .populate('providerId', 'name email')
      .populate('seekerId', 'name email');

    // Manually populate post owner based on postModel
    const Seeker = require('../models/Seeker');
    const Provider = require('../models/Provider');
    
    if (hire && hire.postId) {
      if (hire.postModel === 'SeekerPost' && hire.postId.seekerId) {
        const seeker = await Seeker.findById(hire.postId.seekerId).select('name email');
        if (seeker) {
          hire.postId.seekerId = seeker;
        }
      } else if (hire.postModel === 'ProviderPost' && hire.postId.providerId) {
        const provider = await Provider.findById(hire.postId.providerId).select('name email');
        if (provider) {
          hire.postId.providerId = provider;
        }
      }
    }

    console.log('Found hire record:', {
      hireId: hire?._id,
      postModel: hire?.postModel,
      seekerId: hire?.seekerId?._id,
      providerId: hire?.providerId?._id,
      postId: hire?.postId?._id,
      postProviderId: hire?.postId?.providerId?._id || hire?.postId?.providerId?.name,
      postSeekerId: hire?.postId?.seekerId?._id || hire?.postId?.seekerId?.name
    });

    if (!hire) {
      return res.status(404).json({
        success: false,
        message: 'Hire record not found'
      });
    }

    // Updated payment status rules based on user requirements:
    // 1. If seeker hired provider (SeekerPost) -> seeker updates in hire history
    // 2. If provider hired seeker (ProviderPost) -> provider updates in my posts
    let canUpdatePayment = false;

    console.log('Authorization debug:', {
      postModel: hire.postModel,
      userRole: role,
      userId: _id.toString(),
      hireSeekerId: hire.seekerId?.toString(),
      hireProviderId: hire.providerId?.toString(),
      postProviderId: hire.postId?.providerId?.toString(),
      postSeekerId: hire.postId?.seekerId?.toString()
    });

    // Since postModel is undefined, we need to determine it from the hire data
    // If hire has both seeker and provider, check which one matches current user
    if (role === 'provider' && hire.providerId && hire.providerId._id && hire.providerId._id.toString() === _id.toString()) {
      // Current user is the provider in this hire - they can update payment
      canUpdatePayment = true;
    } else if (role === 'seeker' && hire.seekerId && hire.seekerId._id && hire.seekerId._id.toString() === _id.toString()) {
      // Current user is the seeker in this hire - they can update payment
      canUpdatePayment = true;
    }

    if (!canUpdatePayment) {
      return res.status(403).json({
        success: false,
        message: `Only the ${hire.postModel === 'SeekerPost' ? 'seeker' : 'provider'} who created this post can update payment status`
      });
    }

    try {
      hire.paymentStatus = paymentStatus;
      await hire.save();
      console.log('Payment status updated successfully for hire:', hire._id);
    } catch (saveError) {
      console.error('Error saving hire:', saveError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update payment status: ' + saveError.message
      });
    }

    res.status(200).json({
      success: true,
      message: `Payment status updated to ${paymentStatus}`,
      data: hire
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error updating payment status',
      error: error.message
    });
  }
};

// @desc    Update hire status
// @route   PATCH /api/hires/:id/status
// @access  Private (Hire participants only)
const updateHireStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { _id, role } = req.user;

    if (!['confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: confirmed, completed, or cancelled'
      });
    }

    const hire = await Hire.findById(id)
      .populate('post')
      .populate('provider', 'name email')
      .populate('seeker', 'name email');

    if (!hire) {
      return res.status(404).json({
        success: false,
        message: 'Hire record not found'
      });
    }

    // Check if user is authorized to update this hire
    const isSeeker = role === 'Seeker' && hire.seekerId.toString() === _id.toString();
    const isProvider = role === 'Provider' && hire.providerId.toString() === _id.toString();

    if (!isSeeker && !isProvider) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this hire record'
      });
    }

    hire.status = status;
    await hire.save();

    res.status(200).json({
      success: true,
      message: `Hire status updated to ${status}`,
      data: hire
    });
  } catch (error) {
    console.error('Error updating hire status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating hire status',
      error: error.message
    });
  }
};


// @desc    Get a single hire record
// @route   GET /api/hires/:id
// @access  Private (Hire participants only)
const getHire = async (req, res) => {
  try {
    const { id } = req.params;
    const { _id, role } = req.user;

    const hire = await Hire.findById(id)
      .populate('seeker', 'name email profileImage')
      .populate('provider', 'name email profileImage')
      .populate('post', 'title description category role minRate maxRate');

    if (!hire) {
      return res.status(404).json({
        success: false,
        message: 'Hire record not found'
      });
    }

    // Check if user is authorized to view this hire
    const isSeeker = role === 'Seeker' && hire.seekerId.toString() === _id.toString();
    const isProvider = role === 'Provider' && hire.providerId.toString() === _id.toString();

    if (!isSeeker && !isProvider) {
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
    console.error('Error fetching hire record:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hire record',
      error: error.message
    });
  }
};

// @desc    Get all hires for a specific post
// @route   GET /api/hires/post/:postId
// @access  Private
const getHiresByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { _id } = req.user;

    const hires = await Hire.find({ postId })
      .populate({
        path: 'providerId',
        select: 'name email profileImage'
      })
      .populate({
        path: 'seekerId',
        select: 'name email profileImage'
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: hires
    });
  } catch (error) {
    console.error('Error fetching hires by post:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hires',
      error: error.message
    });
  }
};

module.exports = {
  getSeekerHireHistory,
  getProviderHireHistory,
  updatePaymentStatus,
  updateHireStatus,
  getHire,
  getHiresByPost
};