import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/api/auth/login') || url.includes('/api/auth/register');
      const currentPath = window.location?.pathname || '';
      const isOnAuthPage = currentPath.startsWith('/login') || currentPath.startsWith('/register');
      if (!isAuthEndpoint) {
        localStorage.removeItem('token');
        // Avoid hard reload while already on auth pages to prevent refresh loop
        if (!isOnAuthPage) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api; 