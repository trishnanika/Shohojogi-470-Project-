import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FiUser, 
  FiMail, 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiPhone, 
  FiMapPin 
} from 'react-icons/fi';
import './Auth.css';

const Register = () => {
  const { register: registerUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState('seeker');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Validate role selection
      if (!selectedRole) {
        throw new Error('Please select whether you want to find workers or find jobs');
      }

      // Prepare user data
      const userData = {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        role: selectedRole,
        location: {
          city: data.city,
          area: data.area
        }
      };

      // Register user
      await registerUser(userData);

    } catch (error) {
      console.error('Registration error:', error);
      
      // Show error in the form
      if (error.message.includes('role')) {
        // Role selection error
        setError('role', {
          type: 'manual',
          message: error.message
        });
      } else if (error.response?.data?.message) {
        // Backend validation error
        setError('email', {
          type: 'manual',
          message: error.response.data.message
        });
      } else {
        // Generic error
        setError('email', {
          type: 'manual',
          message: 'Registration failed. Please try again.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const cities = [
    'Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 
    'Barisal', 'Rangpur', 'Mymensingh', 'Comilla', 'Noakhali'
  ];

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Join SohoJogi</h1>
          <p>Create your account and start connecting</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          {/* Role Selection */}
          <div className="role-selection">
            <label>I want to:</label>
            <div className="role-buttons">
              <button
                type="button"
                className={`role-btn ${selectedRole === 'seeker' ? 'active' : ''}`}
                onClick={() => setSelectedRole('seeker')}
              >
                <span className="role-icon">🔍</span>
                <span className="role-text">
                  <strong>Find Workers</strong>
                  <small>I need services</small>
                </span>
              </button>
              <button
                type="button"
                className={`role-btn ${selectedRole === 'provider' ? 'active' : ''}`}
                onClick={() => setSelectedRole('provider')}
              >
                <span className="role-icon">🛠️</span>
                <span className="role-text">
                  <strong>Find Jobs</strong>
                  <small>I provide services</small>
                </span>
              </button>
            </div>
            {errors.role && (
              <span className="error-message mt-2">{errors.role.message}</span>
            )}
          </div>

          {/* Name Field */}
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <div className="input-wrapper">
              <FiUser className="input-icon" />
              <input
                id="name"
                type="text"
                placeholder="Enter your full name"
                {...register('name', {
                  required: 'Name is required',
                  minLength: {
                    value: 2,
                    message: 'Name must be at least 2 characters'
                  }
                })}
              />
            </div>
            {errors.name && (
              <span className="error-message">{errors.name.message}</span>
            )}
          </div>

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Please enter a valid email'
                  }
                })}
              />
            </div>
            {errors.email && (
              <span className="error-message">{errors.email.message}</span>
            )}
          </div>

          {/* Phone Field */}
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <div className="input-wrapper">
              <FiPhone className="input-icon" />
              <input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                {...register('phone', {
                  required: 'Phone number is required',
                  pattern: {
                    value: /^(\+880|880|0)?1[3-9]\d{8}$/,
                    message: 'Please enter a valid Bangladeshi phone number'
                  }
                })}
              />
            </div>
            {errors.phone && (
              <span className="error-message">{errors.phone.message}</span>
            )}
          </div>

          {/* Location Fields */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City</label>
              <div className="input-wrapper">
                <FiMapPin className="input-icon" />
                <select
                  id="city"
                  {...register('city', {
                    required: 'City is required'
                  })}
                >
                  <option value="">Select a city</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              {errors.city && (
                <span className="error-message">{errors.city.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="area">Area</label>
              <div className="input-wrapper">
                <FiMapPin className="input-icon" />
                <input
                  id="area"
                  type="text"
                  placeholder="Enter your area"
                  {...register('area', {
                    required: 'Area is required',
                    minLength: {
                      value: 2,
                      message: 'Area must be at least 2 characters'
                    }
                  })}
                />
              </div>
              {errors.area && (
                <span className="error-message">{errors.area.message}</span>
              )}
            </div>
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors.password && (
              <span className="error-message">{errors.password.message}</span>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match'
                })}
              />
            </div>
            {errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword.message}</span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register; 