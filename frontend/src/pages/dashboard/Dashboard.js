import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminDashboard from './AdminDashboard';
import SeekerDashboard from './SeekerDashboard';
import ProviderDashboard from './ProviderDashboard';
import Loading from '../../components/common/Loading';

const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <div>Please log in to access your dashboard.</div>;
  }

  // Route to appropriate dashboard based on user role
  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'seeker':
      return <SeekerDashboard />;
    case 'provider':
      return <ProviderDashboard />;
    default:
      return <div>Invalid user role.</div>;
  }
};

export default Dashboard; 