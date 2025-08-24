import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  error: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'AUTH_SUCCESS':
      if (!action.payload) {
        return {
          ...state,
          loading: false,
          error: 'Invalid response from server'
        };
      }
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();

  // Set auth token in axios headers
  useEffect(() => {
    if (state.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
      localStorage.setItem('token', state.token);
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [state.token]);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (state.token) {
        try {
          const response = await api.get('/api/auth/me');
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user: response.data.data,
              token: state.token
            }
          });
        } catch (error) {
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: null });
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password, role) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await api.post('/api/auth/login', { email, password, role });

      const { user, token } = response.data;

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token },
      });

      toast.success('Login successful!');

      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'provider') {
        navigate('/provider');
      } else {
        navigate('/seeker');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      toast.error(message);
      throw error; // Re-throw for the component to handle
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'AUTH_START' });
    
    try {
      if (!userData.role || !['seeker', 'provider'].includes(userData.role)) {
        throw new Error('Please select whether you want to find workers or find jobs');
      }

      const response = await api.post('/api/auth/register', userData);

      // Support both shapes:
      // 1) { success, message, token, user }
      // 2) { data: { token, user } }
      const payload = response?.data?.data || response?.data;
      const receivedUser = payload?.user;
      const receivedToken = payload?.token;

      if (!receivedUser || !receivedToken) {
        throw new Error('Invalid response from server');
      }

      const user = {
        ...receivedUser,
        role: userData.role // Preserve selected role from form
      };

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user,
          token: receivedToken
        }
      });

      toast.success('Registration successful!');
      
      // Redirect based on role
      if (user.role === 'provider') {
        navigate('/provider');
      } else {
        navigate('/seeker');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      toast.error(message);
      throw error; // Re-throw for the component to handle
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully');
    navigate('/');
  };

  const updateUser = (userData) => {
    dispatch({
      type: 'UPDATE_USER',
      payload: userData
    });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
    updateUser,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 