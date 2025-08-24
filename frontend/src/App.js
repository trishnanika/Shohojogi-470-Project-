import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/common/Toast';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { PublicRoute } from './components/common/PublicRoute';

// Layout components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Public pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Protected pages
import Dashboard from './pages/dashboard/Dashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import SeekerDashboard from './pages/dashboard/SeekerDashboard';
import ProviderDashboard from './pages/dashboard/ProviderDashboard';

// Service pages
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import CreateService from './pages/CreateService';
import MyServices from './pages/MyServices';
import CreatePost from './pages/CreatePost';
import Messages from './pages/Messages';

// Profile pages
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';

// Loading component
import Loading from './components/common/Loading';

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const { pathname } = window.location;

  if (loading) {
    return <Loading />;
  }

  // Hide footer on dashboard pages
  const hideFooter = [
    '/dashboard',
    '/admin',
    '/seeker',
    '/provider'
  ].some((path) => pathname.startsWith(path));

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:id" element={<ServiceDetail />} />
          
          {/* Auth routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />

          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Role-based dashboards */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/seeker" 
            element={
              <ProtectedRoute allowedRoles={['seeker']}>
                <SeekerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/provider" 
            element={
              <ProtectedRoute allowedRoles={['provider']}>
                <ProviderDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Service routes */}
          <Route 
            path="/create-service" 
            element={
              <ProtectedRoute allowedRoles={['provider']}>
                <CreateService />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-services" 
            element={
              <ProtectedRoute allowedRoles={['provider']}>
                <MyServices />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/create-post" 
            element={
              <ProtectedRoute allowedRoles={['provider', 'seeker']}>
                <CreatePost />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/messages" 
            element={
              <ProtectedRoute allowedRoles={['provider', 'seeker']}>
                <Messages />
              </ProtectedRoute>
            } 
          />

          {/* Profile routes */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile/edit" 
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            } 
          />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!hideFooter && <Footer />}
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
};

export default App; 