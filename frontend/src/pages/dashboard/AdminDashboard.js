import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import api from '../../utils/api';
import { FaUsers, FaTools, FaChartLine, FaBan, FaCheck, FaEye, FaTrash, FaUserTimes, FaFileAlt, FaHandshake, FaStar } from 'react-icons/fa';
import './Dashboard.css';
import { useToast } from '../../components/common/Toast';
import ConfirmationModal from '../../components/common/ConfirmationModal';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState({
    users: { total: 0, providers: 0, seekers: 0, banned: 0 },
    services: { total: 0, active: 0, featured: 0 },
    posts: { total: 0, provider: 0, seeker: 0 },
    hires: { total: 0, completed: 0 },
    applications: { total: 0 },
  });

  // Confirmation Modal State
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    type: 'default',
    onConfirm: null,
  });

  const openConfirm = ({ title, message, confirmText = 'Confirm', type = 'default', onConfirm }) => {
    setConfirmState({ open: true, title, message, confirmText, type, onConfirm });
  };

  const closeConfirm = () => setConfirmState(prev => ({ ...prev, open: false }));

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, usersResponse, servicesResponse, postsResponse] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/users'),
        api.get('/api/admin/services'),
        api.get('/api/admin/posts'),
      ]);

      setStats(statsResponse.data.data || stats);
      setUsers(usersResponse.data.data || []);
      setServices(servicesResponse.data.data || []);
      setPosts(postsResponse.data.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showError('Failed to load dashboard data');
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const performUserAction = async (userId, action) => {
    try {
      await api.patch(`/api/admin/users/${userId}`, { action });
      showSuccess(`User ${action} successfully`);
      await fetchDashboardData();
    } catch (error) {
      console.error('Error performing user action:', error);
      showError(`Failed to ${action} user`);
    }
  };

  const confirmUserAction = (userId, action) => {
    const user = users.find(u => u._id === userId);
    const isBan = action === 'ban';
    openConfirm({
      title: isBan ? 'Ban User' : 'Unban User',
      message: user ? `Are you sure you want to ${isBan ? 'ban' : 'unban'} ${user.name}?` : `Confirm ${action} user?`,
      confirmText: isBan ? 'Ban' : 'Unban',
      type: isBan ? 'danger' : 'warning',
      onConfirm: () => performUserAction(userId, action),
    });
  };

  const handleServiceAction = async (serviceId, action) => {
    try {
      await api.patch(`/api/admin/services/${serviceId}`, { action });
      showSuccess(`Service ${action} successfully`);
      fetchDashboardData();
    } catch (error) {
      showError(`Failed to ${action} service`);
    }
  };

  const performDeleteUser = async (userId) => {
    try {
      // Find the user to determine their role
      const user = users.find(u => u._id === userId);
      if (!user) {
        showError('User not found');
        return;
      }
      await api.delete(`/api/admin/users/${user.role}/${userId}`);
      showSuccess('User deleted successfully');
      fetchDashboardData();
    } catch (error) {
      showError('Failed to delete user');
    }
  };

  const confirmDeleteUser = (userId) => {
    const user = users.find(u => u._id === userId);
    openConfirm({
      title: 'Delete User',
      message: user ? `This will permanently delete ${user.name}. Continue?` : 'Delete this user permanently?',
      confirmText: 'Delete',
      type: 'danger',
      onConfirm: () => performDeleteUser(userId),
    });
  };

  const performDeletePost = async (postId, postType) => {
    try {
      await api.delete(`/api/admin/posts/${postId}`, {
        data: { postType },
      });
      showSuccess('Post deleted successfully');
      fetchDashboardData();
    } catch (error) {
      showError('Failed to delete post');
    }
  };

  const confirmDeletePost = (postId, postType, title) => {
    openConfirm({
      title: 'Delete Post',
      message: title ? `Delete the post "${title}"? This action cannot be undone.` : 'Delete this post? This action cannot be undone.',
      confirmText: 'Delete',
      type: 'danger',
      onConfirm: () => performDeletePost(postId, postType),
    });
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar onSectionChange={handleSectionChange} activeSection={activeSection} />
      <div className="dashboard admin-dashboard">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p>Welcome back, {user?.name}!</p>
        </div>

        {activeSection === 'dashboard' && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <FaUsers />
                </div>
                <div className="stat-content">
                  <h3>{stats.users.total}</h3>
                  <p>Total Users</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <FaUsers />
                </div>
                <div className="stat-content">
                  <h3>{stats.users.providers}</h3>
                  <p>Providers</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <FaUsers />
                </div>
                <div className="stat-content">
                  <h3>{stats.users.seekers}</h3>
                  <p>Seekers</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <FaTools />
                </div>
                <div className="stat-content">
                  <h3>{stats.services.total}</h3>
                  <p>Total Services</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <FaChartLine />
                </div>
                <div className="stat-content">
                  <h3>{stats.services.active}</h3>
                  <p>Active Services</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <FaBan />
                </div>
                <div className="stat-content">
                  <h3>{stats.users.banned}</h3>
                  <p>Banned Users</p>
                </div>
              </div>
               <div className="stat-card">
                <div className="stat-icon">
                  <FaStar />
                </div>
                <div className="stat-content">
                  <h3>{stats.services.featured}</h3>
                  <p>Featured Services</p>
                </div>
              </div>
                <div className="stat-card">
                <div className="stat-icon">
                  <FaFileAlt />
                </div>
                <div className="stat-content">
                  <h3>{stats.posts.total}</h3>
                  <p>Total Posts</p>
                </div>
              </div>
                <div className="stat-card">
                <div className="stat-icon">
                  <FaHandshake />
                </div>
                <div className="stat-content">
                  <h3>{stats.hires.total}</h3>
                  <p>Total Hires</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <FaCheck />
                </div>
                <div className="stat-content">
                  <h3>{stats.hires.completed}</h3>
                  <p>Completed Hires</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <FaFileAlt />
                </div>
                <div className="stat-content">
                  <h3>{stats.applications.total}</h3>
                  <p>Total Applications</p>
                </div>
              </div>
            </div>

            <div className="dashboard-grid">
              <div className="section">
                <div className="section-header">
                  <h2>User Management</h2>
                  <button 
                    className="btn btn-primary btn-sm" 
                    onClick={() => setActiveSection('users')}
                  >
                    <FaEye /> View All Users
                  </button>
                </div>
                <div className="user-list">
                  {users.slice(0, 5).map(user => (
                    <div key={user._id} className="user-item">
                      <div className="user-info">
                        <h4>{user.name}</h4>
                        <p className="email">{user.email}</p>
                        <p className="role">{user.role}</p>
                      </div>
                      <div className="user-status">
                        <span className={`status status-${user.isBanned ? 'banned' : 'active'}`}>
                          {user.isBanned ? 'Banned' : 'Active'}
                        </span>
                      </div>
                      <div className="user-actions">
                        {user.isBanned ? (
                          <button 
                            className="btn btn-success btn-sm"
                            onClick={() => confirmUserAction(user._id, 'unban')}
                          >
                            <FaCheck /> Unban
                          </button>
                        ) : (
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => confirmUserAction(user._id, 'ban')}
                          >
                            <FaBan /> Ban
                          </button>
                        )}
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => confirmDeleteUser(user._id)}
                        >
                          <FaUserTimes /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="section">
                <div className="section-header">
                  <h2>Service Management</h2>
                  <button 
                    className="btn btn-primary btn-sm" 
                    onClick={() => setActiveSection('services')}
                  >
                    <FaEye /> View All Services
                  </button>
                </div>
              </div>

              <div className="section">
                <h2>Quick Actions</h2>
                <div className="action-buttons">
                  <button 
                    className="btn btn-primary"
                    onClick={() => setActiveSection('users')}
                  >
                    <FaUsers /> Manage Users
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setActiveSection('services')}
                  >
                    <FaTools /> Manage Services
                  </button>
                  <button 
                    className="btn btn-accent"
                    onClick={() => setActiveSection('manage-posts')}
                  >
                    <FaFileAlt /> Manage Posts
                  </button>
                  <button className="btn btn-outline">
                    <FaBan /> Banned Users
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {activeSection === 'users' && (
          <div className="section">
            <div className="section-header">
              <h2>All Users</h2>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => setActiveSection('dashboard')}
              >
                ← Back to Dashboard
              </button>
            </div>
            <div className="user-list">
              {users.map(user => (
                <div key={user._id} className="user-item">
                  <div className="user-info">
                    <h4>{user.name}</h4>
                    <p className="email">{user.email}</p>
                    <span className={`role-badge role-${user.role}`}>{user.role}</span>
                  </div>
                  <div className="user-status">
                    <span className={`status status-${user.isBanned ? 'banned' : 'active'}`}>
                      {user.isBanned ? 'Banned' : 'Active'}
                    </span>
                    <span className="date">{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="user-actions">
                    {user.isBanned ? (
                      <button 
                        className="btn btn-success btn-sm"
                        onClick={() => confirmUserAction(user._id, 'unban')}
                      >
                        <FaCheck /> Unban
                      </button>
                    ) : (
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => confirmUserAction(user._id, 'ban')}
                      >
                        <FaBan /> Ban
                      </button>
                    )}
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => confirmDeleteUser(user._id)}
                    >
                      <FaUserTimes /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'services' && (
          <div className="section">
            <div className="section-header">
              <h2>All Services</h2>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => setActiveSection('dashboard')}
              >
                ← Back to Dashboard
              </button>
            </div>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Provider</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map(service => (
                    <tr key={service._id}>
                      <td>{service.title}</td>
                      <td>{service.category}</td>
                      <td>{service.provider?.name || 'N/A'}</td>
                      <td>৳{service.price}</td>
                      <td>
                        <span className={`status status-${service.isAvailable ? 'active' : 'inactive'}`}>
                          {service.isAvailable ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{new Date(service.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleServiceAction(service._id, 'delete')}
                        >
                          <FaTrash /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* Removed duplicated users section to avoid rendering twice */}
      {/* Removed duplicated services section to avoid rendering twice */}

      {activeSection === 'manage-posts' && (
        <div className="section">
          <div className="section-header">
            <h2>All Posts</h2>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => setActiveSection('dashboard')}
            >
              ← Back to Dashboard
            </button>
          </div>
          <div className="post-list">
            {posts.map(post => (
              <div key={post._id} className="post-item">
                <div className="post-info">
                  <h4>{post.title}</h4>
                  <p className="post-meta">
                    <span className={`role-badge role-${post.postType?.toLowerCase()}`}>{post.postType}</span>
                    <span>by {post.author?.name || 'N/A'}</span>
                    <span>
                      ৳{post.budget?.min ?? post.budget ?? '-'}
                      {post.budget?.max ? ` - ৳${post.budget.max}` : ''}
                    </span>
                    <span className={`status status-${post.status}`}>{post.status}</span>
                    <span className="date">{new Date(post.createdAt).toLocaleDateString()}</span>
                  </p>
                </div>
                <div className="post-actions">
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => confirmDeletePost(post._id, post.postType, post.title)}
                  >
                    <FaTrash /> Delete
                  </button>
                  {post.author && (
                    <button 
                      className="btn btn-warning btn-sm"
                      onClick={() => confirmUserAction(post.author._id, post.author.isBanned ? 'unban' : 'ban')}
                    >
                      {post.author.isBanned ? <FaCheck /> : <FaBan />} {post.author.isBanned ? 'Unban User' : 'Ban User'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmState.open}
        onClose={closeConfirm}
        onConfirm={() => {
          if (typeof confirmState.onConfirm === 'function') {
            confirmState.onConfirm();
          }
        }}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        type={confirmState.type}
      />
      </div>
    </div>
  );
};

export default AdminDashboard;
