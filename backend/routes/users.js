const express = require('express');
const { body } = require('express-validator');
const { protect, adminOnly, providerOrSeeker } = require('../middlewares/auth');
const {
  getUsers,
  getUser,
  updateProfile,
  getProviders,
  deleteUser,
  toggleUserStatus
} = require('../controllers/userController');

const router = express.Router();

// Validation middleware
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .matches(/^(\+880|880|0)?1[3-9]\d{8}$/)
    .withMessage('Please provide a valid Bangladeshi phone number'),
  body('location.city')
    .optional()
    .isIn(['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh', 'Comilla', 'Noakhali'])
    .withMessage('Please select a valid city'),
  body('location.area')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Area must be at least 2 characters'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  body('experience')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Experience must be a non-negative integer'),
  body('hourlyRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hourly rate must be a non-negative number'),
  body('preferences')
    .optional()
    .isArray()
    .withMessage('Preferences must be an array')
];

// Apply protect middleware to all routes
router.use(protect);

// Routes
router.get('/', adminOnly, getUsers);
router.get('/providers', getProviders);
router.get('/:id', getUser);
router.put('/profile', validateProfileUpdate, updateProfile);
router.delete('/:id', adminOnly, deleteUser);
router.put('/:id/toggle-status', adminOnly, toggleUserStatus);

module.exports = router; 