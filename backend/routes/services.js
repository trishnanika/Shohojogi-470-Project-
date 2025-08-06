const express = require('express');
const { body } = require('express-validator');
const { protect, providerOnly } = require('../middlewares/auth');
const {
  createService,
  getServices,
  getService,
  updateService,
  deleteService,
  getServicesByProvider,
  getMyServices,
  toggleServiceAvailability
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
router.get('/:id', getService);
router.get('/provider/:providerId', getServicesByProvider);

// Protected routes
router.use(protect);

// Provider only routes
router.post('/', validateService, providerOnly, createService);
router.get('/my-services', providerOnly, getMyServices);
router.put('/:id', validateService, providerOnly, updateService);
router.delete('/:id', providerOnly, deleteService);
router.put('/:id/toggle-availability', providerOnly, toggleServiceAvailability);

module.exports = router; 