const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middlewares/auth');
const {
  register,
  login,
  getMe,
  logout
} = require('../controllers/authController');

const router = express.Router();

// Validation middleware
const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('phone')
    .matches(/^(\+880|880|0)?1[3-9]\d{8}$/)
    .withMessage('Please provide a valid Bangladeshi phone number'),
  body('role')
    .isIn(['seeker', 'provider'])
    .withMessage('Role must be either "seeker" or "provider"'),
  body('location.city')
    .isIn(['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh', 'Comilla', 'Noakhali'])
    .withMessage('Please select a valid city'),
  body('location.area')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Area must be at least 2 characters')
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Routes
router.post('/register', validateRegistration, register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router; 