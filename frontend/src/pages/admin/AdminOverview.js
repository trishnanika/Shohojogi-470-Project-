import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaUsers, FaTools, FaChartBar, FaCog } from 'react-icons/fa';
import api from '../../utils/api';
import Loading from '../../components/common/Loading';

const AdminOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data } = await api.get('/api/admin/dashboard');
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome back, {user?.name}!</p>
      </div>
      {stats && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon"><FaUsers /></div>
              <div className="stat-content">
                <h3>{stats.stats.totalUsers}</h3>
                <p>Total Users</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><FaUsers /></div>
              <div className="stat-content">
                <h3>{stats.stats.totalProviders}</h3>
                <p>Total Providers</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><FaUsers /></div>
              <div className="stat-content">
                <h3>{stats.stats.totalSeekers}</h3>
                <p>Total Seekers</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><FaTools /></div>
              <div className="stat-content">
                <h3>{stats.stats.totalServices}</h3>
                <p>Total Services</p>
              </div>
            </div>
          </div>
          <div className="dashboard-sections">
            <div className="section">
              <h2>Recent Users</h2>
              <div className="activity-list">
                {stats.recentUsers.map(u => (
                  <div key={u._id} className="activity-item">
                    <p>{u.name} ({u.role}) - Joined on {new Date(u.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="section">
              <h2>Recent Services</h2>
              <div className="activity-list">
                {stats.recentServices.map(s => (
                  <div key={s._id} className="activity-item">
                    <p>{s.title} by {s.provider.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminOverview;
