import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user) {
    // Redirect based on user's role
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'provider') {
      return <Navigate to="/provider" replace />;
    } else {
      return <Navigate to="/seeker" replace />;
    }
  }

  return children;
}; 