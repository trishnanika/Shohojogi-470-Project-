import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/Toast';
import { 
  FaUser, FaPlus, FaList, FaComments, FaHistory, FaCog, FaSignOutAlt,
  FaSearch, FaHeart, FaEye, FaEdit, FaTrash,
  FaFileAlt, FaBriefcase, FaMoneyBillWave, FaTasks
} from 'react-icons/fa';
import api from '../../utils/api';
import Sidebar from './Sidebar';
import './Dashboard.css';
import './EmptyState.css';
import './Messages.css';

const SeekerDashboard = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [recentSearches, setRecentSearches] = useState([]);
  const [favoriteProviders, setFavoriteProviders] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [hireHistory, setHireHistory] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPostForView, setSelectedPostForView] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [selectedPostApplicants, setSelectedPostApplicants] = useState(null);
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPost, setDeletingPost] = useState(null);
  const [showHireModal, setShowHireModal] = useState(false);
  const [selectedHire, setSelectedHire] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [emailChangeRequest, setEmailChangeRequest] = useState('');
  const [postForm, setPostForm] = useState({
    title: '',
    description: '',
    category: '',
    minRate: 0,
    maxRate: 0,
    vacancy: 1,
    location: { city: '', area: '' },
    serviceDate: '',
    tags: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/api/seeker-posts/stats');
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Error fetching seeker stats:', error);
        showError('Failed to load dashboard stats.');
      }
    };

    fetchStats();
  }, [showError]);

  const handleSectionChange = (section) => {
    setActiveSection(section);
    if (section === 'myPosts') {
      fetchMyPosts();
    } else if (section === 'messages') {
      fetchMessages();
    } else if (section === 'hireHistory') {
      fetchHireHistory();
    } else if (section === 'settings') {
      setShowSettingsModal(true);
    }
  };

  const fetchMyPosts = async () => {
    try {
      const response = await api.get('/api/seeker-posts/my-posts');
      const posts = response.data.data || [];
      
      // Map budget object to minRate/maxRate for frontend compatibility
      const postsWithBudget = posts.map(post => ({
        ...post,
        minRate: post.budget?.min || 0,
        maxRate: post.budget?.max || 0
      }));
      
      setMyPosts(postsWithBudget);
    } catch (error) {
      console.error('Error fetching posts:', error);
      showError('Failed to load posts');
    }
  };

  const fetchPostApplicants = async (postId) => {
    try {
      const { data } = await api.get('/api/applications/received');
      if (data.success) {
        // Filter applications for the specific post
        const postApplications = data.data.filter(app => app.postId._id === postId);
        setApplicants(postApplications);
        const post = myPosts.find(p => p._id === postId);
        setSelectedPostApplicants({ ...post, applicants: postApplications });
        setShowApplicantsModal(true);
      }
    } catch (error) {
      console.error('Error fetching applicants:', error);
      showError('Failed to load applicants');
    }
  };

  const handleApplicationAction = async (applicationId, status) => {
    try {
      const { data } = await api.patch(`/api/applications/${applicationId}/status`, {
        status
      });
      if (data.success) {
        showSuccess(`Application ${status} successfully!`);
        // Refresh applicants list
        if (selectedPostApplicants) {
          fetchPostApplicants(selectedPostApplicants._id);
        }
        // Refresh posts to update counts
        fetchMyPosts();
        // Refresh hire history if approved
        if (status === 'approved') {
          fetchHireHistory();
        }
      }
    } catch (error) {
      console.error(`Error ${status} application:`, error);
      showError(`Failed to ${status} application`);
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
      // Backend expects the partner's userId in the path
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

  const fetchHireHistory = async () => {
    try {
      const { data } = await api.get('/api/hires/seeker-history');
      setHireHistory(data.data || []);
      if (data.data.length === 0) {
        showInfo('No hire history found');
      }
    } catch (error) {
      console.error('Error fetching hire history:', error);
      showError('Failed to load hire history');
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/posts/seeker', postForm);
      showSuccess('Post created successfully!');
      setPostForm({
        title: '',
        description: '',
        category: '',
        minRate: 0,
        maxRate: 0,
        vacancy: 1,
        location: { city: '', area: '' },
        serviceDate: '',
        tags: []
      });
      setActiveSection('dashboard');
    } catch (error) {
      showError('Failed to create post');
    }
  };

  const handleHireProvider = async (providerId, postId, notes = '') => {
    try {
      const { data } = await api.post('/api/hires', {
        providerId,
        postId,
        notes
      });
      showSuccess('Provider hired successfully!');
      fetchHireHistory();
      return data.data;
    } catch (error) {
      console.error('Error hiring provider:', error);
      showError('Failed to hire provider');
      return null;
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
      budget: post.budget || { min: 0, max: 0 },
      location: post.location || { city: '', area: '' },
      urgency: post.urgency || 'medium',
      deadline: post.deadline ? post.deadline.split('T')[0] : ''
    });
    setShowEditModal(true);
  };

  const handleDeletePost = (post) => {
    setDeletingPost(post);
    setShowDeleteModal(true);
  };

  const handleViewHire = (hire) => {
    setSelectedHire(hire);
    setShowHireModal(true);
  };

  const confirmDeletePost = async () => {
    if (!deletingPost) return;
    try {
      await api.delete(`/api/seeker-posts/${deletingPost._id}`);
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
      await api.put(`/api/seeker-posts/${editingPost._id}`, postForm);
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

  return (
    <div className="dashboard-layout">
      <Sidebar onSectionChange={handleSectionChange} activeSection={activeSection} />
      <div className="dashboard seeker-dashboard">
        {activeSection === 'dashboard' && (
          <>
            <div className="dashboard-header">
              <h1>Seeker Dashboard</h1>
              <p>Welcome back, {user?.name}!</p>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon"><FaFileAlt /></div>
                <div className="stat-content">
                  <h3>{stats?.posts?.total ?? '...'}</h3>
                  <p>Posts Created</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><FaTasks /></div>
                <div className="stat-content">
                  <h3>{stats?.applications?.total ?? '...'}</h3>
                  <p>Applications Received</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><FaBriefcase /></div>
                <div className="stat-content">
                  <h3>{stats?.hires?.total ?? '...'}</h3>
                  <p>Total Hires</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><FaMoneyBillWave /></div>
                <div className="stat-content">
                  <h3>৳{stats?.spending?.total ?? '...'}</h3>
                  <p>Total Spending</p>
                </div>
              </div>
            </div>
          </>
        )}

        {activeSection === 'createPost' && (
          <div className="create-post-section">
            <div className="dashboard-header">
              <h1>Create New Post</h1>
              <p>Post your service request</p>
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
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Min Rate (৳)</label>
                  <input
                    type="number"
                    value={postForm.minRate}
                    onChange={(e) => setPostForm({...postForm, minRate: parseInt(e.target.value)})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Rate (৳)</label>
                  <input
                    type="number"
                    value={postForm.maxRate}
                    onChange={(e) => setPostForm({...postForm, maxRate: parseInt(e.target.value)})}
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
                  value={postForm.urgency}
                  onChange={(e) => setPostForm({...postForm, urgency: e.target.value})}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Service Date</label>
                <input
                  type="date"
                  value={postForm.serviceDate}
                  onChange={(e) => setPostForm({...postForm, serviceDate: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Vacancy</label>
                <input
                  type="number"
                  value={postForm.vacancy}
                  onChange={(e) => setPostForm({...postForm, vacancy: parseInt(e.target.value)})}
                  min="1"
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveSection('dashboard')}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Post</button>
              </div>
            </form>
          </div>
        )}

        {activeSection === 'myPosts' && (
          <div className="my-posts-section">
            <div className="dashboard-header">
              <h1>My Posts</h1>
              <p>Manage your service requests and applicants</p>
            </div>
            <div className="posts-list">
              {myPosts.length > 0 ? (
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
                        <span className={`post-status status-${post.status || 'active'}`}>
                          {post.status || 'active'}
                        </span>
                        <span className="post-budget">৳{post.minRate} - ৳{post.maxRate}</span>
                      </div>
                      <div className="post-applicants-info">
                        <div className="applicant-stats">
                          <span className="applicant-badge">
                            {post.applicationCount || 0} Applications
                          </span>
                          <span className="vacancy-info">
                            {post.hiredCount || 0}/{post.vacancy || 1} Hired
                          </span>
                          {post.hiredCount >= post.vacancy && (
                            <span className="vacancy-full-badge">Vacancy Full</span>
                          )}
                        </div>
                        <div className="post-actions">
                          <button 
                            className="btn btn-secondary btn-small"
                            onClick={() => fetchPostApplicants(post._id)}
                          >
                            <FaTasks /> View Applications ({post.applicationCount || 0})
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <FaList size={48} />
                  <h3>No posts found</h3>
                  <p>You haven't created any posts yet. Create one now!</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setActiveSection('createPost')}
                  >
                    <FaPlus /> Create First Post
                  </button>
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
                  {conversations.length > 0 ? (
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
                ) : (
                  <div className="empty-state">
                    <FaComments size={48} />
                    <h3>No conversations found</h3>
                    <p>You have no messages yet. Start a conversation from a service page.</p>
                  </div>
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

        {activeSection === 'hireHistory' && (
          <div className="hire-history-section">
            <div className="dashboard-header">
              <h1>Hire History</h1>
              <p>Manage your hired providers and payment status</p>
            </div>
            <div className="hire-list">
              {hireHistory.length > 0 ? (
                hireHistory.map(hire => (
                  <div key={hire._id} className="hire-list-item">
                    <div className="hire-list-content">
                      <div className="hire-main-info">
                        <h4 className="hire-title">{hire.postId?.title || 'Untitled Post'}</h4>
                        <span className="hire-provider">Provider: {hire.providerId?.name || 'Unknown Provider'}</span>
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
                      {/* Seeker can always update payment status in hire history */}
                      <div className="payment-actions">
                        <select 
                          value={hire.paymentStatus || 'pending'}
                          onChange={(e) => updatePaymentStatus(hire._id, e.target.value)}
                          className="payment-select"
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
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
                  <FaHistory size={48} />
                  <h3>No hire history found</h3>
                  <p>You haven't hired any providers yet. Approve applications to hire providers.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Post View Modal */}
        {showPostModal && selectedPostForView && (
          <div className="modal-overlay" onClick={() => setShowPostModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Post Details</h2>
                <button className="modal-close" onClick={() => setShowPostModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <h3>{selectedPostForView.title}</h3>
                <p><strong>Category:</strong> {selectedPostForView.category}</p>
                <p><strong>Description:</strong> {selectedPostForView.description}</p>
                <p><strong>Budget:</strong> ৳{selectedPostForView.budget?.min} - ৳{selectedPostForView.budget?.max}</p>
                <p><strong>Location:</strong> {selectedPostForView.location?.city}, {selectedPostForView.location?.area}</p>
                <p><strong>Urgency:</strong> {selectedPostForView.urgency}</p>
                {selectedPostForView.deadline && (
                  <p><strong>Deadline:</strong> {new Date(selectedPostForView.deadline).toLocaleDateString()}</p>
                )}
                <p><strong>Status:</strong> {selectedPostForView.status || 'active'}</p>
                <p><strong>Created:</strong> {new Date(selectedPostForView.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Edit Post Modal */}
        {showEditModal && editingPost && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Edit Post</h2>
                <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
              </div>
              <form onSubmit={handleUpdatePost} className="modal-form">
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
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Min Rate (৳)</label>
                    <input
                      type="number"
                      value={postForm.minRate}
                      onChange={(e) => setPostForm({...postForm, minRate: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Rate (৳)</label>
                    <input
                      type="number"
                      value={postForm.maxRate}
                      onChange={(e) => setPostForm({...postForm, maxRate: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Update Post</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && deletingPost && (
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="modal-content confirmation-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Delete Post</h2>
                <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete "{deletingPost.title}"?</p>
                <p className="warning-text">This action cannot be undone.</p>
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={confirmDeletePost}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Applicants Modal */}
        {showApplicantsModal && selectedPostApplicants && (
          <div className="modal-overlay" onClick={() => setShowApplicantsModal(false)}>
            <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Applicants for "{selectedPostApplicants.postTitle}"</h2>
                <button className="modal-close" onClick={() => setShowApplicantsModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="applicants-summary">
                  <p><strong>Vacancy:</strong> {selectedPostApplicants.vacancy}</p>
                  <p><strong>Hired:</strong> {selectedPostApplicants.hiredCount}/{selectedPostApplicants.vacancy}</p>
                  <p><strong>Total Applicants:</strong> {applicants.length}</p>
                </div>
                <div className="applicants-list">
                  {applicants.length > 0 ? (
                    applicants.map(applicant => (
                      <div key={applicant._id} className="applicant-item">
                        <div className="applicant-info">
                          <div className="applicant-header">
                            <h4>{applicant.providerId?.name || 'Unknown Provider'}</h4>
                            <span className={`status-badge status-${applicant.status}`}>
                              {applicant.status}
                            </span>
                          </div>
                          <p><strong>Email:</strong> {applicant.providerId?.email}</p>
                          <p><strong>Phone:</strong> {applicant.providerId?.phone || 'N/A'}</p>
                          <p><strong>Location:</strong> {applicant.providerId?.location?.city}, {applicant.providerId?.location?.area}</p>
                          {applicant.offeredAmount > 0 && (
                            <p><strong>Offered Amount:</strong> ৳{applicant.offeredAmount}</p>
                          )}
                          {applicant.message && (
                            <p><strong>Message:</strong> {applicant.message}</p>
                          )}
                          <p><strong>Applied:</strong> {new Date(applicant.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="applicant-actions">
                          {applicant.status === 'pending' && selectedPostApplicants.hiredCount < selectedPostApplicants.vacancy && (
                            <>
                              <button 
                                className="btn btn-success btn-small"
                                onClick={() => handleApplicationAction(applicant._id, 'approved')}
                              >
                                Approve
                              </button>
                              <button 
                                className="btn btn-danger btn-small"
                                onClick={() => handleApplicationAction(applicant._id, 'rejected')}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {applicant.status === 'rejected' && selectedPostApplicants.hiredCount < selectedPostApplicants.vacancy && (
                            <button 
                              className="btn btn-success btn-small"
                              onClick={() => handleApplicationAction(applicant._id, 'approved')}
                            >
                              Approve
                            </button>
                          )}
                          {applicant.status === 'approved' && (
                            <span className="approved-text">✓ Hired</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <p>No applicants found for this post.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hire View Modal */}
        {showHireModal && selectedHire && (
          <div className="modal-overlay" onClick={() => setShowHireModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Hire Details</h2>
                <button className="modal-close" onClick={() => setShowHireModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <h3>{selectedHire.postId?.title || 'Untitled Post'}</h3>
                <p><strong>Provider:</strong> {selectedHire.providerId?.name || 'Unknown Provider'}</p>
                <p><strong>Provider Email:</strong> {selectedHire.providerId?.email || 'N/A'}</p>
                <p><strong>Status:</strong> {selectedHire.status || 'confirmed'}</p>
                <p><strong>Payment Status:</strong> {selectedHire.paymentStatus || 'pending'}</p>
                {selectedHire.amount > 0 && (
                  <p><strong>Amount:</strong> {selectedHire.amount} {selectedHire.currency}</p>
                )}
                <p><strong>Hired Date:</strong> {new Date(selectedHire.createdAt).toLocaleDateString()}</p>
                {selectedHire.notes && (
                  <p><strong>Notes:</strong> {selectedHire.notes}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettingsModal && (
          <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Account Settings</h2>
                <button className="modal-close" onClick={() => setShowSettingsModal(false)}>×</button>
              </div>
              <div className="modal-body settings-modal">
                <div className="settings-section">
                  <h3>Current Email</h3>
                  <p>{user?.email}</p>
                  <div className="form-group">
                    <label className="form-label">Request Email Change</label>
                    <input
                      type="email"
                      value={emailChangeRequest}
                      onChange={(e) => setEmailChangeRequest(e.target.value)}
                      placeholder="Enter new email address"
                    />
                    <button className="btn btn-secondary btn-sm" onClick={requestEmailChange}>
                      Request Change
                    </button>
                  </div>
                </div>
                
                <div className="settings-section">
                  <h3>Change Password</h3>
                  <form onSubmit={handlePasswordChange}>
                    <div className="form-group">
                      <label className="form-label">Current Password</label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">New Password</label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary">Change Password</button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeekerDashboard;