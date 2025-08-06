import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import './Auth.css';

const Login = () => {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginType, setLoginType] = useState('user'); // 'user' or 'admin'
  const [selectedRole, setSelectedRole] = useState('seeker'); // For future-proofing (not used here)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // For admin login, pass email/password, backend will recognize admin
      if (loginType === 'admin') {
        await login(data.email, data.password, null, true); // last param isAdmin (optional)
      } else {
        await login(data.email, data.password, null, false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('email', {
        type: 'manual',
        message: error.response?.data?.message || 'Login failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to your SohoJogi account</p>
        </div>

        {/* Login Type Toggle */}
        <div className="login-type-toggle" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', justifyContent: 'center' }}>
          <button
            type="button"
            className={`btn btn-outline${loginType === 'user' ? ' active' : ''}`}
            style={{ minWidth: 120, fontWeight: loginType === 'user' ? 700 : 500 }}
            onClick={() => setLoginType('user')}
            disabled={loginType === 'user'}
          >
            User Login
          </button>
          <button
            type="button"
            className={`btn btn-outline${loginType === 'admin' ? ' active' : ''}`}
            style={{ minWidth: 120, fontWeight: loginType === 'admin' ? 700 : 500 }}
            onClick={() => setLoginType('admin')}
            disabled={loginType === 'admin'}
          >
            Admin Login
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">

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

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
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

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="link">
              Sign up here
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Login; 