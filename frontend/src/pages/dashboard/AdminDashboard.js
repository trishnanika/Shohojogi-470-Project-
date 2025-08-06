import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import { FaUsers, FaTools, FaChartBar, FaCog } from 'react-icons/fa';
import './Dashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalServices: 0,
    activeProviders: 0,
    pendingServices: 0
  });

  useEffect(() => {
    // TODO: Fetch admin dashboard stats from API
    // setStats({ totalUsers: 0, totalServices: 0, activeProviders: 0, pendingServices: 0 });
    // You can implement real fetching here.
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard admin-dashboard">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p>Welcome back, {user?.name}!</p>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <FaUsers />
            </div>
            <div className="stat-content">
              <h3>{stats.totalUsers}</h3>
              <p>Total Users</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <FaTools />
            </div>
            <div className="stat-content">
              <h3>{stats.totalServices}</h3>
              <p>Total Services</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <FaChartBar />
            </div>
            <div className="stat-content">
              <h3>{stats.activeProviders}</h3>
              <p>Active Providers</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <FaCog />
            </div>
            <div className="stat-content">
              <h3>{stats.pendingServices}</h3>
              <p>Pending Services</p>
            </div>
          </div>
        </div>
        <div className="dashboard-sections">
          <div className="section">
            <h2>Quick Actions</h2>
            <div className="action-buttons">
              <button className="btn btn-primary">Manage Users</button>
              <button className="btn btn-secondary">Review Services</button>
              <button className="btn btn-accent">View Reports</button>
              <button className="btn btn-outline">System Settings</button>
            </div>
          </div>
          <div className="section">
            <h2>Recent Activity</h2>
            <div className="activity-list">
              <div className="activity-item">
                <span className="activity-time">2 hours ago</span>
                <p>New service provider registered: John Doe</p>
              </div>
              <div className="activity-item">
                <span className="activity-time">4 hours ago</span>
                <p>Service "Home Cleaning" was approved</p>
              </div>
              <div className="activity-item">
                <span className="activity-time">6 hours ago</span>
                <p>New user registration: jane@example.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 