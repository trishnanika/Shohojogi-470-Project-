import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/Toast';
import { 
  FaUser, FaPlus, FaList, FaComments, FaClipboardList, FaCog, FaSignOutAlt,
  FaTools, FaCalendar, FaChartLine, FaStar, FaCheck, FaTimes, FaEye, FaEdit, FaTrash
} from 'react-icons/fa';
import api from '../../utils/api';
import Sidebar from './Sidebar';
import './Dashboard.css';
import './Messages.css';
import './EmptyState.css';

const ProviderDashboard = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [activeSection, setActiveSection] = useState('dashboard');
  const allowedCategories = [
    'Tutor', 'Electrician', 'Plumber', 'Carpenter', 'Painter',
    'Parcel Delivery', 'Home Repair', 'Cleaning', 'Gardening',
    'Cooking', 'Photography', 'Event Management', 'Transportation',
    'Beauty Services', 'Pet Care', 'Other'
  ];
  const allowedCities = [
    'Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh', 'Comilla', 'Noakhali'
  ];
  const allowedPriceTypes = ['hourly', 'fixed', 'negotiable'];

  const [form, setForm] = useState({
    title: '',
    category: '',
    price: '',
    priceType: '',
    description: '',
    location: { city: '', area: '' }
  });
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const [postSuccess, setPostSuccess] = useState('');
  const [stats, setStats] = useState(null);
  const [myServices, setMyServices] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [earnings, setEarnings] = useState({
    thisMonth: 0,
    lastMonth: 0,
    totalEarnings: 0
  });
  const [applications, setApplications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [hireHistory, setHireHistory] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPostForView, setSelectedPostForView] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPost, setDeletingPost] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [emailChangeRequest, setEmailChangeRequest] = useState('');
  const [selectedHire, setSelectedHire] = useState(null);
  const [showHireModal, setShowHireModal] = useState(false);
  const [postForm, setPostForm] = useState({
    title: '',
    description: '',
    category: '',
    price: 0,
    location: { city: '', area: '' },
    tags: [],
    urgency: 'low',
    deadline: ''
  });

  const fetchMyServices = useCallback(async () => {
    try {
      const { data } = await api.get('/api/posts/my-posts');
      setMyServices(data.data || []);
    } catch (e) {
      setMyServices([]);
    }
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/api/services/stats');
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Error fetching provider stats:', error);
        showError('Failed to load dashboard stats.');
      }
    };

    fetchMyServices();
    fetchStats();
  }, [fetchMyServices, showError]);

  const handlePostServiceClick = () => setActiveSection('postService');
  const handleDashboardClick = () => setActiveSection('dashboard');

  const handleSectionChange = (section) => {
    setActiveSection(section);
    if (section === 'applications') {
      fetchApplications();
    } else if (section === 'messages') {
      fetchMessages();
    } else if (section === 'myPosts') {
      fetchMyPosts();
    } else if (section === 'hireHistory') {
      fetchHireHistory();
    } else if (section === 'settings') {
      setShowSettingsModal(true);
    }
  };

  const handleViewPost = (post) => {
    setSelectedPostForView(post);
    setShowPostModal(true);
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setPostForm({
      title: post.title,
      description: post.description,
      category: post.category,
      price: post.price || 0,
      location: post.location || { city: '', area: '' },
      tags: post.tags || [],
      urgency: post.urgency || 'low',
      deadline: post.deadline || ''
    });
    setShowEditModal(true);
  };

  const handleDeletePost = (post) => {
    setDeletingPost(post);
    setShowDeleteModal(true);
  };

  const handleViewApplication = (application) => {
    setSelectedApplication(application);
    setShowApplicationModal(true);
  };

  const confirmDeletePost = async () => {
    if (!deletingPost) return;
    try {
      await api.delete(`/api/posts/${deletingPost._id}`);
      showSuccess('Post deleted successfully!');
      setShowDeleteModal(false);
      setDeletingPost(null);
      fetchMyPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      showError('Failed to delete post');
    }
  };

  const handleUpdatePost = async (e) => {
    e.preventDefault();
    if (!editingPost) return;
    try {
      await api.put(`/api/posts/${editingPost._id}`, postForm);
      showSuccess('Post updated successfully!');
      setShowEditModal(false);
      setEditingPost(null);
      fetchMyPosts();
    } catch (error) {
      console.error('Error updating post:', error);
      showError('Failed to update post');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError('New passwords do not match');
      return;
    }
    try {
      await api.put('/api/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      showSuccess('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      showError('Failed to change password');
    }
  };

  const requestEmailChange = async () => {
    if (!emailChangeRequest.trim()) {
      showError('Please enter a new email address');
      return;
    }
    try {
      await api.post('/api/auth/request-email-change', {
        newEmail: emailChangeRequest
      });
      showSuccess('Email change request sent to admin for approval');
      setEmailChangeRequest('');
    } catch (error) {
      console.error('Error requesting email change:', error);
      showError('Failed to request email change');
    }
  };

  const fetchApplications = async () => {
    try {
      const { data } = await api.get('/api/applications/my-applications');
      setApplications(data.data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
    }
  };

  const fetchHireHistory = async () => {
    try {
      const { data } = await api.get('/api/hires/provider');
      setHireHistory(data.data || []);
    } catch (error) {
      console.error('Error fetching hire history:', error);
      setHireHistory([]);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data } = await api.get('/api/messages/conversations');
      setConversations(data.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      showError('Failed to load messages');
    }
  };

  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    try {
      const { data } = await api.get(`/api/messages/conversation/${conversation.partner._id}`);
      setChatMessages(data.data || []);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      showError('Failed to load chat messages');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;
    
    try {
      const { data } = await api.post('/api/messages', {
        receiverId: selectedConversation.partner._id,
        content: newMessage
      });
      
      setChatMessages(prev => [...prev, data.data]);
      setNewMessage('');
      
      // Update conversation list
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      showError('Failed to send message');
    }
  };

  const fetchMyPosts = async () => {
    try {
      const { data } = await api.get('/api/posts/my-posts');
      setMyPosts(data.data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const handleApplicationAction = async (applicationId, action) => {
    try {
      await api.patch(`/api/applications/${applicationId}/status`, { status: action });
      showSuccess(`Application ${action === 'approved' ? 'approved' : 'rejected'} successfully`);
      fetchApplications();
    } catch (error) {
      showError(`Failed to ${action === 'approved' ? 'approve' : 'reject'} application`);
    }
  };

  const updatePaymentStatus = async (hireId, paymentStatus) => {
    try {
      const { data } = await api.patch(`/api/hires/${hireId}/payment`, {
        paymentStatus
      });
      if (data.success) {
        showSuccess(`Payment status updated to ${paymentStatus}`);
        fetchHireHistory();
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      showError('Failed to update payment status');
    }
  };

  const updatePostPaymentStatus = async (postId, paymentStatus) => {
    try {
      // Get hires for this post and update payment status
      const { data } = await api.get(`/api/hires/post/${postId}`);
      if (data.success && data.data.length > 0) {
        // Update payment status for all hires of this post
        await Promise.all(data.data.map(hire => 
          api.patch(`/api/hires/${hire._id}/payment`, { paymentStatus })
        ));
        showSuccess(`Payment status updated to ${paymentStatus} for all hires`);
        // Refresh both my posts and hire history
        fetchMyPosts();
        fetchHireHistory();
      }
    } catch (error) {
      console.error('Error updating post payment status:', error);
      showError('Failed to update payment status');
    }
  };

  const handleViewHire = (hire) => {
    setSelectedHire(hire);
    setShowHireModal(true);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/posts/provider', postForm);
      showSuccess('Post created successfully!');
      setPostForm({
        title: '',
        description: '',
        category: '',
        price: 0,
        location: { city: '', area: '' },
        tags: [],
        urgency: 'low',
        deadline: ''
      });
      setActiveSection('dashboard');
    } catch (error) {
      showError('Failed to create post');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'city' || name === 'area') {
      setPostForm({
        ...postForm,
        location: { ...postForm.location, [name]: value }
      });
    } else if (name === 'price') {
      setPostForm({
        ...postForm,
        [name]: parseInt(value) || 0
      });
    } else {
      setPostForm({ ...postForm, [name]: value });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setPosting(true);
    setPostError('');
    setPostSuccess('');
    try {
      // Prepare POST body as required by backend
      const postBody = {
        ...form,
        location: {
          city: form.location.city,
          area: form.location.area
        }
      };
      const res = await api.post('/api/posts/provider', postBody);
      setPostSuccess('Service posted successfully!');
      showSuccess('Service posted successfully');
      setForm({ title: '', category: '', price: '', priceType: '', description: '', location: { city: '', area: '' } });
      // Re-fetch to ensure we have the latest canonical list
      await fetchMyServices();
      setActiveSection('dashboard');
    } catch (err) {
      setPostError(err.response?.data?.message || 'Failed to post service.');
      showError(err.response?.data?.message || 'Failed to post service');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar onPostServiceClick={handlePostServiceClick} onSectionChange={handleSectionChange} activeSection={activeSection} />
      <div className="dashboard provider-dashboard">
        {['/provider/bookings','/provider/earnings'].includes(window.location.pathname) && (
          <div className="section"><h2>Coming soon</h2><p>We are building this section.</p></div>
        )}
        {activeSection === 'dashboard' && (
          <>
            <div className="dashboard-header">
              <h1>Provider Dashboard</h1>
              <p>Welcome back, {user?.name}!</p>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon"><FaTools /></div>
                <div className="stat-content">
                  <h3>{stats?.services?.total ?? '...'}</h3>
                  <p>Total Services</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><FaCheck /></div>
                <div className="stat-content">
                  <h3>{stats?.services?.active ?? '...'}</h3>
                  <p>Active Services</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><FaCalendar /></div>
                <div className="stat-content">
                  <h3>{stats?.hires?.total ?? '...'}</h3>
                  <p>Total Hires</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><FaChartLine /></div>
                <div className="stat-content">
                  <h3>৳{stats?.earnings?.total ?? '...'}</h3>
                  <p>Total Earnings</p>
                </div>
              </div>
            </div>
            <div className="dashboard-grid">
              <div className="section">
                <div className="section-header">
                  <h2>My Services</h2>
                  <button className="btn btn-primary btn-sm" onClick={handlePostServiceClick}>
                    <FaPlus /> Add Service
                  </button>
                </div>
                <div className="service-list">
                  {myServices.map(service => (
                    <div key={service._id} className="service-item">
                      <div className="service-info">
                        <h4>{service.title}</h4>
                        <p className="category">{service.category}</p>
                        <p className="price">৳{service.price}</p>
                      </div>
                      <div className="service-stats">
                        <span className={`status status-${service.isAvailable ? 'active' : 'inactive'}`}>
                          {service.isAvailable ? 'Active' : 'Inactive'}
                        </span>
                        <span className="bookings">{service.totalReviews || 0} reviews</span>
                      </div>
                      <div className="service-actions">
                        <button className="btn btn-outline btn-sm">Edit</button>
                        <button className="btn btn-secondary btn-sm">View</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="section">
                <h2>Recent Bookings</h2>
                <div className="booking-list">
                  {recentBookings.map(booking => (
                    <div key={booking.id} className="booking-item">
                      <div className="booking-info">
                        <h4>{booking.service}</h4>
                        <p>{booking.client}</p>
                        <span className="date">{booking.date}</span>
                      </div>
                      <div className="booking-details">
                        <span className={`status status-${booking.status?.toLowerCase?.() || 'completed'}`}>
                          {booking.status}
                        </span>
                        <span className="amount">৳{booking.amount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="section">
                <h2>Earnings Overview</h2>
                <div className="earnings-overview">
                  <div className="earning-item">
                    <h4>This Month</h4>
                    <p className="amount">৳{earnings.thisMonth}</p>
                  </div>
                  <div className="earning-item">
                    <h4>Last Month</h4>
                    <p className="amount">৳{earnings.lastMonth}</p>
                  </div>
                  <div className="earning-item">
                    <h4>Total Earnings</h4>
                    <p className="amount">৳{earnings.totalEarnings}</p>
                  </div>
                </div>
              </div>
              <div className="section">
                <h2>Quick Actions</h2>
                <div className="action-buttons">
                  <button className="btn btn-primary" onClick={handlePostServiceClick}>
                    <FaPlus /> Post New Service
                  </button>
                  <button className="btn btn-secondary">
                    <FaTools /> Manage Services
                  </button>
                  <button className="btn btn-accent">
                    <FaCalendar /> View Schedule
                  </button>
                  <button className="btn btn-outline">
                    <FaUser /> Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
        {activeSection === 'postService' && (
          <div className="post-service-section" style={{ background: 'linear-gradient(120deg, #6a11cb 0%, #2575fc 100%)', color: '#fff', minHeight: '100vh', padding: '2rem' }}>
            <button onClick={handleDashboardClick} style={{ marginBottom: 20, background: 'none', border: 'none', color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>← Back to Dashboard</button>
            <h2 style={{ color: '#fff' }}>Post a New Service</h2>
            <form className="service-form" onSubmit={handleFormSubmit} style={{ maxWidth: 500, margin: '2rem auto', background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              <label style={{ color: '#fff' }}>
                Title:
                <input type="text" name="title" value={form.title} onChange={handleFormChange} required minLength={5} maxLength={100} style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', margin: '8px 0 18px 0' }} />
              </label>
              <label style={{ color: '#fff' }}>
                Category:
                <select name="category" value={form.category} onChange={handleFormChange} required style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', margin: '8px 0 18px 0' }}>
                  <option value="">Select Category</option>
                  {allowedCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </label>
              <label style={{ color: '#fff' }}>
                Price (৳):
                <input type="number" name="price" value={form.price} onChange={handleFormChange} required min={0} style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', margin: '8px 0 18px 0' }} />
              </label>
              <label style={{ color: '#fff' }}>
                Price Type:
                <select name="priceType" value={form.priceType} onChange={handleFormChange} required style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', margin: '8px 0 18px 0' }}>
                  <option value="">Select Price Type</option>
                  {allowedPriceTypes.map(pt => <option key={pt} value={pt}>{pt.charAt(0).toUpperCase() + pt.slice(1)}</option>)}
                </select>
              </label>
              <label style={{ color: '#fff' }}>
                Description:
                <textarea name="description" value={form.description} onChange={handleFormChange} required minLength={10} maxLength={1000} rows={3} style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', margin: '8px 0 18px 0' }} />
              </label>
              <label style={{ color: '#fff' }}>
                City:
                <select name="city" value={form.location.city} onChange={handleFormChange} required style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', margin: '8px 0 18px 0' }}>
                  <option value="">Select City</option>
                  {allowedCities.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
              </label>
              <label style={{ color: '#fff' }}>
                Area:
                <input type="text" name="area" value={form.location.area} onChange={handleFormChange} required minLength={2} style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', margin: '8px 0 18px 0' }} />
              </label>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 12, borderRadius: 8, background: 'linear-gradient(90deg, #7f53ac 0%, #647dee 100%)', color: '#fff', fontWeight: 700, fontSize: 18, border: 'none', marginTop: 10 }} disabled={posting}>
                {posting ? 'Posting...' : 'Post Service'}
              </button>
              {postSuccess && <div style={{ color: '#b9fbc0', marginTop: 14 }}>{postSuccess}</div>}
              {postError && <div style={{ color: '#ffb4b4', marginTop: 14 }}>{postError}</div>}
            </form>
            <div className="service-history" style={{ maxWidth: 700, margin: '2rem auto', background: 'rgba(255,255,255,0.10)', borderRadius: 16, padding: 24 }}>
              <h3 style={{ color: '#fff', marginBottom: 16 }}>Your Posted Services</h3>
              {myServices.length === 0 ? (
                <p style={{ color: '#fff' }}>No services posted yet.</p>
              ) : (
                <ul style={{ color: '#fff', listStyle: 'none', padding: 0 }}>
                  {myServices.map(service => (
                    <li key={service.id || service._id} style={{ marginBottom: 12, padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.07)' }}>
                      <strong>{service.title}</strong> — {service.category} — ৳{service.price}
                      <div style={{ fontSize: 14, opacity: 0.8 }}>{service.description}</div>
                      <div style={{ fontSize: 13, opacity: 0.7 }}>Location: {service.location?.city}{service.location?.area ? `, ${service.location.area}` : ''}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {activeSection === 'createPost' && (
          <div className="create-post-section">
            <div className="dashboard-header">
              <h1>Create New Post</h1>
              <p>Post your service offering</p>
            </div>
            <form onSubmit={handleCreatePost} className="post-form">
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  value={postForm.title}
                  onChange={(e) => setPostForm({...postForm, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  value={postForm.description}
                  onChange={(e) => setPostForm({...postForm, description: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  value={postForm.category}
                  onChange={(e) => setPostForm({...postForm, category: e.target.value})}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Home Services">Home Services</option>
                  <option value="Technology">Technology</option>
                  <option value="Education">Education</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Events">Events</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <div className="form-group">
                  <label className="form-label">Service Price (BDT)</label>
                  <input
                    type="number"
                    name="price"
                    placeholder="Your service price"
                    value={postForm.price}
                    onChange={handleFormChange}
                    required
                    min="0"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <select
                    value={postForm.location.city}
                    onChange={(e) => setPostForm({...postForm, location: {...postForm.location, city: e.target.value}})}
                    required
                  >
                    <option value="">Select City</option>
                    <option value="Dhaka">Dhaka</option>
                    <option value="Chittagong">Chittagong</option>
                    <option value="Sylhet">Sylhet</option>
                    <option value="Rajshahi">Rajshahi</option>
                    <option value="Khulna">Khulna</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Area</label>
                  <input
                    type="text"
                    value={postForm.location.area}
                    onChange={(e) => setPostForm({...postForm, location: {...postForm.location, area: e.target.value}})}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Urgency</label>
                <select
                  value={postForm.urgency || 'low'}
                  onChange={(e) => setPostForm({...postForm, urgency: e.target.value})}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Deadline (Optional)</label>
                <input
                  type="date"
                  value={postForm.deadline || ''}
                  onChange={(e) => setPostForm({...postForm, deadline: e.target.value})}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveSection('dashboard')}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Post</button>
              </div>
            </form>
          </div>
        )}

        {activeSection === 'applications' && (
          <div className="applications-section">
            <div className="dashboard-header">
              <h1>My Applications</h1>
              <p>Track your application status</p>
            </div>
            <div className="applications-list">
              {applications.length === 0 ? (
                <div className="empty-state">
                  <FaClipboardList size={48} color="#ccc" />
                  <h3>No Applications Yet</h3>
                  <p>You haven't applied to any posts yet. Browse available posts and apply to get started!</p>
                </div>
              ) : (
                applications.map(application => (
                  <div key={application._id} className="application-item">
                    <div className="application-info">
                      <h4>{application.postId?.title || 'Untitled Post'}</h4>
                      <p><strong>Seeker:</strong> {application.seekerId?.name || 'Unknown Seeker'}</p>
                      <p><strong>Category:</strong> {application.postId?.category || 'N/A'}</p>
                      <p><strong>Budget:</strong> ৳{application.postId?.minRate || 0} - ৳{application.postId?.maxRate || 0}</p>
                      <p><strong>Your Offer:</strong> ৳{application.offeredAmount}</p>
                      {application.message && (
                        <p><strong>Your Message:</strong> {application.message}</p>
                      )}
                      <div className="application-meta">
                        <span className="application-date">
                          Applied: {new Date(application.createdAt).toLocaleDateString()}
                        </span>
                        <span className={`application-status status-${application.status}`}>
                          {application.status === 'pending' && 'Pending'}
                          {application.status === 'approved' && '✓ Approved'}
                          {application.status === 'rejected' && '✗ Rejected'}
                        </span>
                      </div>
                    </div>
                    <div className="application-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => handleViewApplication(application)}>
                        <FaEye /> View Details
                      </button>
                      {application.status === 'rejected' && (
                        <button className="btn btn-primary btn-sm" onClick={() => window.location.href = `/services`}>
                          Browse Posts
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeSection === 'hireHistory' && (
          <div className="hire-history-section">
            <div className="dashboard-header">
              <h1>Hire History</h1>
              <p>Jobs you've been hired for and payment status</p>
            </div>
            <div className="hire-list">
              {hireHistory.length > 0 ? (
                hireHistory.map(hire => (
                  <div key={hire._id} className="hire-list-item">
                    <div className="hire-list-content">
                      <div className="hire-main-info">
                        <h4 className="hire-title">{hire.postId?.title || 'Untitled Post'}</h4>
                        <span className="hire-seeker">Seeker: {hire.seekerId?.name || 'Unknown Seeker'}</span>
                      </div>
                      <div className="hire-meta">
                        <span className="hire-date">{new Date(hire.createdAt).toLocaleDateString()}</span>
                        <span className={`hire-status status-${(hire.status || 'confirmed').toLowerCase()}`}>
                          {hire.status || 'confirmed'}
                        </span>
                        <span className={`payment-status status-${(hire.paymentStatus || 'pending').toLowerCase()}`}>
                          Payment: {hire.paymentStatus || 'pending'}
                        </span>
                        {hire.offeredAmount > 0 && (
                          <span className="hire-amount">৳{hire.offeredAmount}</span>
                        )}
                      </div>
                      {/* No payment controls in hire history for providers - they update in My Posts section */}
                    </div>
                    <div className="hire-actions">
                      <button className="btn-small btn-outline" onClick={() => handleViewHire(hire)}>
                        <FaEye /> View Details
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <FaClipboardList size={48} />
                  <h3>No hire history found</h3>
                  <p>You haven't been hired for any jobs yet. Keep applying to get hired!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'messages' && (
          <div className="messages-section">
            <div className="dashboard-header">
              <h1>Messages</h1>
              <p>Your conversations</p>
            </div>
            <div className="messages-layout">
              <div className="conversations-panel">
                <div className="search-bar">
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>
                <div className="conversations-list">
                  {conversations.length === 0 ? (
                    <div className="empty-state">
                      <FaComments size={48} color="#ccc" />
                      <h3>No Messages Yet</h3>
                      <p>Start a conversation by contacting service providers or clients.</p>
                    </div>
                  ) : (
                    conversations.filter(conv => 
                      conv.partner?.name?.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map(conversation => (
                      <div 
                        key={conversation.conversationId} 
                        className={`conversation-item ${
                          selectedConversation?.conversationId === conversation.conversationId ? 'active' : ''
                        }`}
                        onClick={() => handleSelectConversation(conversation)}
                      >
                        <div className="conversation-avatar">
                          <div className="avatar-circle">
                            {conversation.partner?.name?.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="conversation-info">
                          <h4>{conversation.partner?.name}</h4>
                          <p className="last-message">{conversation.lastMessage?.content}</p>
                          <span className="time">
                            {new Date(conversation.lastMessage?.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        {conversation.unreadCount > 0 && (
                          <div className="unread-badge">{conversation.unreadCount}</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="chat-panel">
                {selectedConversation ? (
                  <>
                    <div className="chat-header">
                      <div className="chat-partner-info">
                        <div className="avatar-circle">
                          {selectedConversation.partner?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3>{selectedConversation.partner?.name}</h3>
                          <span className="status">Online</span>
                        </div>
                      </div>
                    </div>
                    <div className="chat-messages">
                      {chatMessages.map(message => (
                        <div 
                          key={message._id} 
                          className={`message-bubble ${
                            message.sender._id === user._id ? 'sent' : 'received'
                          }`}
                        >
                          <div className="message-content">
                            <p>{message.content}</p>
                            <span className="message-time">
                              {new Date(message.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="chat-input">
                      <form onSubmit={handleSendMessage}>
                        <input
                          type="text"
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="message-input"
                        />
                        <button type="submit" className="send-button">
                          <FaComments />
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="no-conversation-selected">
                    <FaComments size={48} />
                    <h3>Select a conversation</h3>
                    <p>Choose a conversation from the list to start messaging</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {activeSection === 'myPosts' && (
          <div className="my-posts-section">
            <div className="dashboard-header">
              <h1>My Posts</h1>
              <p>Manage your service posts</p>
            </div>
            <div className="posts-list">
              {myPosts.length === 0 ? (
                <div className="empty-state">
                  <FaList size={48} color="#ccc" />
                  <h3>No Posts Yet</h3>
                  <p>You haven't created any posts yet. Create your first post to start offering services!</p>
                  <button className="btn btn-primary" onClick={() => setActiveSection('createPost')}>
                    <FaPlus /> Create First Post
                  </button>
                </div>
              ) : (
                myPosts.map(post => (
                  <div key={post._id} className="post-list-item">
                    <div className="post-actions-top">
                      <button className="btn-small btn-outline" onClick={() => handleViewPost(post)}>
                        <FaEye /> View
                      </button>
                      <button className="btn-small btn-primary" onClick={() => handleEditPost(post)}>
                        <FaEdit /> Edit
                      </button>
                      <button className="btn-small btn-danger" onClick={() => handleDeletePost(post)}>
                        <FaTrash /> Delete
                      </button>
                    </div>
                    <div className="post-list-content">
                      <div className="post-main-info">
                        <h4 className="post-title">{post.title}</h4>
                        <span className="post-category">{post.category}</span>
                      </div>
                      <div className="post-meta">
                        <span className="post-date">{new Date(post.createdAt).toLocaleDateString()}</span>
                        <span className={`post-status status-${(post.status || (post.isAvailable ? 'active' : 'inactive')).toLowerCase()}`}>
                          {post.status || (post.isAvailable ? 'active' : 'inactive')}
                        </span>
                        <span className="post-budget">৳{post.price || post.minRate} {post.maxRate ? `- ৳${post.maxRate}` : ''}</span>
                      </div>
                      <div className="post-applicants-info">
                        <div className="applicant-stats">
                          <span className="applicant-badge">
                            {post.applicationCount || 0} Applications
                          </span>
                          {post.vacancy && (
                            <span className="vacancy-info">
                              {post.hiredCount || 0}/{post.vacancy} Hired
                            </span>
                          )}
                          {post.hiredCount >= post.vacancy && (
                            <span className="vacancy-full-badge">Vacancy Full</span>
                          )}
                        </div>
                        {/* Payment status controls for hired seekers on provider posts */}
                        {post.hiredBy && post.hiredBy.length > 0 && (
                          <div className="hired-seekers-payment">
                            <h5>Hired Seekers - Payment Status:</h5>
                            {post.hiredBy.map((hire, index) => (
                              <div key={hire.hireId || index} className="payment-controls">
                                <span className="hired-seeker-name">{hire.seekerName || 'Seeker'}</span>
                                <select 
                                  value={hire.paymentStatus || 'pending'}
                                  onChange={(e) => {
                                    console.log('Updating payment for hire:', hire.hireId, 'to:', e.target.value);
                                    if (hire.hireId) {
                                      updatePaymentStatus(hire.hireId, e.target.value);
                                    } else {
                                      console.error('No hireId found for hire:', hire);
                                    }
                                  }}
                                  className="payment-select"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="paid">Paid</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Modals: View Post */}
        {showPostModal && selectedPostForView && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header"><h3>Post Details</h3></div>
              <div className="modal-body">
                <h4>{selectedPostForView.title}</h4>
                <p>{selectedPostForView.description}</p>
                <div className="meta">
                  <span>Category: {selectedPostForView.category}</span>
                  <span>Price: ৳{selectedPostForView.price || selectedPostForView.minRate} {selectedPostForView.maxRate ? `- ৳${selectedPostForView.maxRate}` : ''}</span>
                  <span>Location: {selectedPostForView.location?.city}{selectedPostForView.location?.area ? `, ${selectedPostForView.location.area}` : ''}</span>
                  {selectedPostForView.tags?.length ? (
                    <span>Tags: {selectedPostForView.tags.join(', ')}</span>
                  ) : null}
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn" onClick={() => setShowPostModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Modals: Edit Post */}
        {showEditModal && editingPost && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header"><h3>Edit Post</h3></div>
              <form onSubmit={handleUpdatePost} className="modal-body">
                <div className="form-group">
                  <label>Title</label>
                  <input type="text" value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea value={postForm.description} onChange={(e) => setPostForm({ ...postForm, description: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <select value={postForm.category} onChange={(e) => setPostForm({ ...postForm, category: e.target.value })} required>
                      <option value="">Select Category</option>
                      <option value="Home Services">Home Services</option>
                      <option value="Technology">Technology</option>
                      <option value="Education">Education</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Transportation">Transportation</option>
                      <option value="Events">Events</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Service Price (BDT)</label>
                    <input type="number" value={postForm.price} onChange={(e) => setPostForm({ ...postForm, price: parseInt(e.target.value) || 0 })} min={0} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <select value={postForm.location.city} onChange={(e) => setPostForm({ ...postForm, location: { ...postForm.location, city: e.target.value } })} required>
                      <option value="">Select City</option>
                      <option value="Dhaka">Dhaka</option>
                      <option value="Chittagong">Chittagong</option>
                      <option value="Sylhet">Sylhet</option>
                      <option value="Rajshahi">Rajshahi</option>
                      <option value="Khulna">Khulna</option>
                      <option value="Barisal">Barisal</option>
                      <option value="Rangpur">Rangpur</option>
                      <option value="Mymensingh">Mymensingh</option>
                      <option value="Comilla">Comilla</option>
                      <option value="Noakhali">Noakhali</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Area</label>
                    <input type="text" value={postForm.location.area} onChange={(e) => setPostForm({ ...postForm, location: { ...postForm.location, area: e.target.value } })} required />
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn" onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modals: Delete Confirm */}
        {showDeleteModal && deletingPost && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header"><h3>Delete Post</h3></div>
              <div className="modal-body">
                Are you sure you want to delete "{deletingPost.title}"?
              </div>
              <div className="modal-actions">
                <button className="btn" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={confirmDeletePost}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Modals: View Application */}
        {showApplicationModal && selectedApplication && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header"><h3>Application Details</h3></div>
              <div className="modal-body">
                <p><strong>Post:</strong> {selectedApplication.post?.title || selectedApplication.postTitle}</p>
                <p><strong>Applicant:</strong> {selectedApplication.applicant?.name || selectedApplication.seeker?.name}</p>
                <p><strong>Message:</strong> {selectedApplication.message}</p>
                <p><strong>Status:</strong> {selectedApplication.status}</p>
              </div>
              <div className="modal-actions">
                <button className="btn" onClick={() => setShowApplicationModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderDashboard;