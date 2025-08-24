const express = require('express');
const { body } = require('express-validator');
const { protect, providerOnly, seekerOnly } = require('../middlewares/auth');
const {
  createService,
  getServices,
  getService,
  updateService,
  deleteService,
  getServicesByProvider,
  getMyServices,
  toggleServiceAvailability,
  getProviderStats
} = require('../controllers/serviceController');

const router = express.Router();

// Validation middleware
const validateService = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('category')
    .isIn([
      'Tutor', 'Electrician', 'Plumber', 'Carpenter', 'Painter',
      'Parcel Delivery', 'Home Repair', 'Cleaning', 'Gardening',
      'Cooking', 'Photography', 'Event Management', 'Transportation',
      'Beauty Services', 'Pet Care', 'Other'
    ])
    .withMessage('Please select a valid category'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number'),
  body('priceType')
    .isIn(['hourly', 'fixed', 'negotiable'])
    .withMessage('Price type must be hourly, fixed, or negotiable'),
  body('location.city')
    .isIn(['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh', 'Comilla', 'Noakhali'])
    .withMessage('Please select a valid city'),
  body('location.area')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Area must be at least 2 characters'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
];

// Public routes
router.get('/', getServices);
// Place the provider stats route before the generic ':id' route to avoid routing conflicts
// Apply inline protect + providerOnly because it's defined before router.use(protect)
router.get('/stats', protect, providerOnly, getProviderStats);
// Place the provider-specific route before the generic ':id' route to avoid routing conflicts
router.get('/provider/:providerId', getServicesByProvider);
// IMPORTANT: define '/my-services' BEFORE '/:id' to avoid being captured by the generic route
router.get('/my-services', protect, providerOnly, getMyServices);
router.get('/:id', getService);

// Protected routes
router.use(protect);

// Provider only routes
router.post('/', validateService, providerOnly, createService);
router.put('/:id', validateService, providerOnly, updateService);
router.delete('/:id', providerOnly, deleteService);
router.put('/:id/toggle-availability', providerOnly, toggleServiceAvailability);

// Booking/Application endpoints (Sprint 2)
// Apply to a service (seeker)
router.post('/:id/apply', seekerOnly, async (req, res) => {
  try {
    const serviceId = req.params.id;
    const { message } = req.body || {};

    const service = await require('../models/Service').findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // prevent provider applying to own service
    if (String(service.provider) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Cannot apply to your own service' });
    }

    // prevent duplicate pending application by same seeker
    const alreadyApplied = (service.applications || []).some(a => String(a.seeker) === String(req.user._id) && a.status === 'pending');
    if (alreadyApplied) {
      return res.status(400).json({ success: false, message: 'Already applied and pending' });
    }

    service.applications.push({ seeker: req.user._id, message, status: 'pending' });
    await service.save();

    // Notify provider
    await require('../models/User').findByIdAndUpdate(service.provider, {
      $push: {
        notifications: {
          message: `New application for: ${service.title}`,
          type: 'booking',
          createdAt: new Date(),
          read: false
        }
      }
    });

    res.status(200).json({ success: true, message: 'Application submitted' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error submitting application', error: e.message });
  }
});

// Provider updates application status
router.put('/:id/application/:applicationId/status', providerOnly, async (req, res) => {
  try {
    const { id, applicationId } = req.params;
    const { status } = req.body; // 'assigned' | 'rejected'

    if (!['assigned', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const Service = require('../models/Service');
    const service = await Service.findById(id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    if (String(service.provider) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const application = service.applications.id(applicationId);
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    application.status = status;
    await service.save();

    // Notify seeker
    await require('../models/User').findByIdAndUpdate(application.seeker, {
      $push: {
        notifications: {
          message: `Your application for ${service.title} was ${status}`,
          type: 'status',
          createdAt: new Date(),
          read: false
        }
      }
    });

    res.status(200).json({ success: true, message: 'Application status updated' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error updating status', error: e.message });
  }
});

module.exports = router; 