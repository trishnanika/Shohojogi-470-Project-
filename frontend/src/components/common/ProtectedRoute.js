import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If allowedRoles is specified, check if user has the required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect based on user's actual role
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