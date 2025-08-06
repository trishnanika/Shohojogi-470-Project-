import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import './Auth.css';
import api from '../../utils/api';

const AdminLogin = () => {
  const { dispatch } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Verify if it's admin credentials first
      if (data.email !== 'admin.shohojogi@gmail.com') {
        setError('email', {
          type: 'manual',
          message: 'Invalid admin credentials'
        });
        setIsLoading(false);
        return;
      }

      const response = await api.post('/api/auth/login', {
        email: data.email,
        password: data.password
      });

      if (response.data.role !== 'admin') {
        setError('email', {
          type: 'manual',
          message: 'Invalid admin credentials'
        });
        setIsLoading(false);
        return;
      }

      // Create admin user object
      const adminUser = {
        role: 'admin',
        name: 'Admin',
        email: data.email
      };

      // Update auth context
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: adminUser,
          token: response.data.token
        }
      });

      // Store token
      localStorage.setItem('token', response.data.token);
      
      // Navigate to admin dashboard
      navigate('/admin', { replace: true });
      
    } catch (error) {
      setError('email', {
        type: 'manual',
        message: error.response?.data?.message || 'Invalid credentials'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Admin Login</h1>
          <p>Sign in to SohoJogi Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email">Admin Email</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                id="email"
                type="email"
                placeholder="Enter admin email"
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

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter admin password"
                {...register('password', {
                  required: 'Password is required'
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

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In as Admin'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
