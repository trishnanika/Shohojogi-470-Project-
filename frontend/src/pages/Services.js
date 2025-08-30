import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaSearch, FaFilter, FaMapMarkerAlt, FaEye, FaEnvelope, FaHandshake } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { useToast } from '../components/common/Toast';
import api from '../utils/api';
import './Services.css';

const Services = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedRoleType, setSelectedRoleType] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showHireModal, setShowHireModal] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [actionPost, setActionPost] = useState(null);
  const [offeredAmount, setOfferedAmount] = useState('');
  const [applicationMessage, setApplicationMessage] = useState('');
  // Track applied/hired posts locally to hide buttons immediately
  const [appliedPostIds, setAppliedPostIds] = useState(new Set()); // seeker posts applied by provider
  const [hiredPostIds, setHiredPostIds] = useState(new Set());     // provider posts hired by seeker
  
  const { showSuccess, showError } = useToast();

  const categories = [
    'Home Services',
    'Technology',
    'Education',
    'Healthcare',
    'Transportation',
    'Events',
    'Other'
  ];

  const locations = [
    'Dhaka',
    'Chittagong',
    'Sylhet',
    'Rajshahi',
    'Khulna',
    'Barisal',
    'Rangpur',
    'Mymensingh',
    'Comilla',
    'Noakhali'
  ];

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await api.get('/api/posts');
        const postsData = response.data?.data || [];

        const formattedPosts = postsData.map(p => ({
          _id: p._id,
          title: p.title,
          description: p.description,
          category: p.category,
          location: p.location,
          tags: p.tags || [],
          minRate: p.minRate || p.budget?.min || 0,
          maxRate: p.maxRate || p.budget?.max || 0,
          price: p.price || 0,
          vacancy: p.vacancy || 1,
          hiredCount: p.hiredCount || 0,
          status: p.status || 'active',
          role: p.role || 'seeker',
          author: p.author,
          applicationCount: p.applicationCount || 0,
          hireCount: p.hireCount || 0,
          hiredBy: p.hiredBy || [],
          createdAt: p.createdAt
        }));

        console.log('Formatted posts:', formattedPosts);
        setPosts(formattedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
        showError('Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const filteredPosts = posts.filter(post => {
    const authorName = post.author?.name || '';
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         authorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === '' || post.category === selectedCategory;
    const matchesLocation = selectedLocation === '' || post.location?.city === selectedLocation;
    const matchesRoleType = selectedRoleType === '' || post.role === selectedRoleType;

    return matchesSearch && matchesCategory && matchesLocation && matchesRoleType;
  });

  const handleViewDetails = (post) => {
    setSelectedPost(post);
    setShowDetailsModal(true);
  };

  const handleQuickMessage = (post) => {
    setSelectedPost(post);
    setShowMessageModal(true);
  };

  const handleApply = (post) => {
    console.log('Apply modal post data:', post);
    console.log('minRate:', post.minRate, 'maxRate:', post.maxRate);
    setActionPost(post);
    setShowApplyModal(true);
  };

  const handleHire = (post) => {
    setActionPost(post);
    setShowHireModal(true);
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !selectedPost) return;

    try {
      await api.post('/api/messages', {
        receiverId: selectedPost.author._id,
        content: messageContent
      });

      showSuccess('Message sent successfully!');
      setShowMessageModal(false);
      setMessageContent('');
    } catch (error) {
      console.error('Error sending message:', error);
      showError('Failed to send message');
    }
  };

  const confirmApply = async () => {
    if (!actionPost || !offeredAmount) return;

    const amount = parseFloat(offeredAmount);
    if (amount < actionPost.minRate || amount > actionPost.maxRate) {
      showError(`Offered amount must be between ৳${actionPost.minRate} and ৳${actionPost.maxRate}`);
      return;
    }

    try {
      await api.post(`/api/seeker-posts/${actionPost._id}/apply`, {
        offeredAmount: amount,
        message: applicationMessage
      });

      showSuccess('Application submitted successfully!');
      // Optimistically remember this post as applied to hide button in UI
      setAppliedPostIds(prev => new Set(prev).add(actionPost._id));
      setShowApplyModal(false);
      setActionPost(null);
      setOfferedAmount('');
      setApplicationMessage('');
      
      // Refresh posts with proper data structure
      const response = await api.get('/api/posts');
      const postsData = response.data?.data || [];
      const formattedPosts = postsData.map(p => ({
        _id: p._id,
        title: p.title,
        description: p.description,
        category: p.category,
        location: p.location,
        tags: p.tags || [],
        minRate: p.minRate || p.budget?.min || 0,
        maxRate: p.maxRate || p.budget?.max || 0,
        price: p.price || 0,
        vacancy: p.vacancy || 1,
        hiredCount: p.hiredCount || 0,
        status: p.status || 'active',
        role: p.role || 'seeker',
        author: p.author,
        applicationCount: p.applicationCount || 0,
        hireCount: p.hireCount || 0,
        hiredBy: p.hiredBy || [],
        userHasApplied: p.userHasApplied || false,
        userApplicationStatus: p.userApplicationStatus || null,
        createdAt: p.createdAt
      }));
      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error applying to post:', error);
      const backendMsg = error?.response?.data?.message || 'Failed to submit application';
      showError(backendMsg);
    }
  };

  const confirmHire = async () => {
    if (!actionPost) return;

    try {
      await api.post(`/api/provider-posts/${actionPost._id}/hire`, {
        offeredAmount: actionPost.price, // Use provider's asking price
        notes: 'Direct hire from services page'
      });
      showSuccess('Provider hired successfully!');
      // Optimistically remember this provider post as hired to hide button
      setHiredPostIds(prev => new Set(prev).add(actionPost._id));
      setShowHireModal(false);
      setActionPost(null);
      
      // Refresh posts by calling the existing fetchPosts function
      const response = await api.get('/api/posts');
      const postsData = response.data?.data || [];

      const formattedPosts = postsData.map(p => ({
        _id: p._id,
        title: p.title,
        description: p.description,
        category: p.category,
        location: p.location,
        tags: p.tags || [],
        minRate: p.minRate || p.budget?.min || 0,
        maxRate: p.maxRate || p.budget?.max || 0,
        price: p.price || 0,
        vacancy: p.vacancy || 1,
        hiredCount: p.hiredCount || 0,
        status: p.status || 'active',
        role: p.role || 'seeker',
        author: p.author,
        applicationCount: p.applicationCount || 0,
        hireCount: p.hireCount || 0,
        hiredBy: p.hiredBy || [],
        budget: p.budget,
        createdAt: p.createdAt
      }));

      console.log('Formatted posts:', formattedPosts);
      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error hiring provider:', error);
      showError('Failed to hire provider');
    }
  };

  const canViewDetails = (post) => {
    // All users can view details of all posts
    return true;
  };

  const canApply = (post) => {
    if (!user || !post.author) {
      console.log('canApply: No user or author', { user: !!user, author: !!post.author });
      return false;
    }
    // Providers can apply to seeker posts (not their own)
    const isActive = (post.status || 'active') === 'active';
    const isVacancyFull = post.isVacancyFull || post.hiredCount >= post.vacancy;
    // Check both backend flag and local state for applied status
    const alreadyApplied = post.userHasApplied || appliedPostIds.has(post._id);
    const result = user.role === 'provider'
      && post.role === 'seeker'
      && post.author._id !== user._id
      && isActive
      && !isVacancyFull
      && !alreadyApplied;
    
    console.log('canApply check:', {
      userRole: user.role,
      postRole: post.role,
      postAuthorId: post.author._id,
      userId: user._id,
      isActive,
      isVacancyFull,
      alreadyApplied,
      backendApplied: post.userHasApplied,
      localApplied: appliedPostIds.has(post._id),
      result
    });
    
    return result;
  };

  const canHire = (post) => {
    if (!user || !post.author) {
      console.log('canHire: No user or author', { user: !!user, author: !!post.author });
      return false;
    }
    // Seekers can hire providers (not themselves)
    const alreadyHiredLocal = hiredPostIds.has(post._id);
    // Check if provider post is already hired by anyone
    const isProviderHired = post.role === 'provider' && post.hiredBy && post.hiredBy.length > 0;
    // Also check backend-persisted hires for this seeker
    const alreadyHiredBackend = Array.isArray(post.hiredBy)
      && post.hiredBy.some(h => {
        const seekerId = (h && (h.seekerId?._id || h.seekerId)) || null;
        return seekerId && String(seekerId) === String(user._id);
      });
    const result = user.role === 'seeker'
      && post.role === 'provider'
      && post.author._id !== user._id
      && !alreadyHiredLocal
      && !alreadyHiredBackend
      && !isProviderHired;
    
    console.log('canHire check:', {
      userRole: user.role,
      postRole: post.role,
      postAuthorId: post.author._id,
      userId: user._id,
      alreadyHiredLocal,
      alreadyHiredBackend,
      isProviderHired,
      result
    });
    
    return result;
  };

  const canMessage = (post) => {
    if (!user || !post.author) {
      console.log('canMessage: No user or author', { user: !!user, author: !!post.author });
      return false;
    }
    // Providers can message seekers, seekers can message providers (not own posts)
    const result = ((user.role === 'provider' && post.role === 'seeker') || 
            (user.role === 'seeker' && post.role === 'provider')) && 
            post.author._id !== user._id;
    
    console.log('canMessage check:', {
      userRole: user.role,
      postRole: post.role,
      postAuthorId: post.author._id,
      userId: user._id,
      result
    });
    
    return result;
  };

  const isOwnPost = (post) => {
    return user && post.author && post.author._id === user._id;
  };

  const renderActionButtons = (post) => {
    const buttons = [];
    
    // View Details button - shown based on role logic
    if (canViewDetails(post)) {
      buttons.push(
        <button key="details" className="btn btn-primary" onClick={() => handleViewDetails(post)}>
          View Details
        </button>
      );
    }
    
    // Apply button - providers can apply to seeker posts
    if (canApply(post)) {
      buttons.push(
        <button key="apply" className="btn btn-success" onClick={() => handleApply(post)}>
          Apply
        </button>
      );
    } else if (user && user.role === 'provider' && post.role === 'seeker' && post.author._id !== user._id && (post.userHasApplied || appliedPostIds.has(post._id))) {
      // Show "Applied" button for posts the provider has already applied to
      buttons.push(
        <button key="applied" className="btn btn-secondary" disabled>
          Applied
        </button>
      );
    }
    
    // Hire button - seekers can hire providers
    if (canHire(post)) {
      buttons.push(
        <button key="hire" className="btn btn-success" onClick={() => handleHire(post)}>
          Hire
        </button>
      );
    }
    
    // Message button - opposite roles can message each other
    if (canMessage(post)) {
      buttons.push(
        <button key="message" className="btn btn-info" onClick={() => handleQuickMessage(post)}>
          Message
        </button>
      );
    }
    
    return buttons;
  };

  if (loading) {
    return (
      <div className="services-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="services-page">
      <div className="services-header">
        <h1>Services & Requests</h1>
        <p>Find services from providers or requests from seekers</p>
        {user && (
          <Link to="/create-post" className="btn btn-primary">
            <FaPlus /> Create Post
          </Link>
        )}
      </div>

      <div className="search-filters">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search for services, providers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters">
          <div className="filter-group">
            <select
              value={selectedRoleType}
              onChange={(e) => setSelectedRoleType(e.target.value)}
              className="filter-select"
            >
              <option value="">All Posts</option>
              <option value="provider">Provider Posts</option>
              <option value="seeker">Seeker Posts</option>
            </select>
          </div>
          
          <div className="filter-group">
            <FaFilter className="filter-icon" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <FaMapMarkerAlt className="filter-icon" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="filter-select"
            >
              <option value="">All Locations</option>
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="services-grid">
        {filteredPosts.length > 0 ? (
          filteredPosts.map(post => (
            <div key={post._id} className="service-card">
              <div className="post-label">
                <span className={`role-badge ${post.role}`}>
                  {post.role === 'provider' ? 'Provider Post' : 'Seeker Post'}
                </span>
                {post.role === 'seeker' && (post.status || 'active') !== 'active' && (
                  <span
                    className="status-badge"
                    style={{
                      marginLeft: '8px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: post.closedBy === 'hired' ? '#e6f4ea' : '#e6f0ff',
                      color: post.closedBy === 'hired' ? '#137333' : '#1a73e8',
                      border: `1px solid ${post.closedBy === 'hired' ? '#a8dab5' : '#b3d1ff'}`
                    }}
                  >
                    {post.closedBy === 'hired' ? 'Hired' : 'Applied'}
                  </span>
                )}
                {post.role === 'provider' && post.hiredBy && post.hiredBy.length > 0 && (
                  <span
                    className="status-badge"
                    style={{
                      marginLeft: '8px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: '#e6f4ea',
                      color: '#137333',
                      border: '1px solid #a8dab5'
                    }}
                  >
                    Hired
                  </span>
                )}
              </div>

              <h3 className="service-title">{post.title}</h3>

              <div className="service-provider">
                <span className="provider-name">{post.author?.name}</span>
                <div className="urgency">
                  <span className={`urgency-badge ${post.urgency}`}>
                    {post.urgency} priority
                  </span>
                </div>
              </div>

              <div className="service-location">
                <FaMapMarkerAlt className="location-icon" />
                <span>{post.location?.city}, {post.location?.area}</span>
              </div>

              <div className="service-category">
                <span>{post.category}</span>
              </div>

              <div className="service-stats">
                <div className="stats-info">
                  {post.role === 'seeker' && (
                    <>
                      {post.vacancy && (
                        <span className="vacancy-badge">
                          {post.vacancy} positions
                        </span>
                      )}
                      {post.applicationCount > 0 && (
                        <span className="applications-badge">
                          {post.applicationCount} applications
                        </span>
                      )}
                    </>
                  )}
                </div>
                <div className="rate-range">
                  {post.role === 'provider' ? (
                    <span>৳{post.price || 0}</span>
                  ) : (
                    <span>৳{post.minRate || 0} - ৳{post.maxRate || 0}</span>
                  )}
                </div>
              </div>

              <div className="service-footer">
                <div className="action-buttons">
                  {renderActionButtons(post).map((button, index) => (
                    <span key={index} style={{ marginRight: '8px' }}>{button}</span>
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <h3>No posts found</h3>
            <p>Try adjusting your search criteria or filters</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedPost && (
        <div className="details-modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="details-modal-header">
              <h2>{selectedPost.title}</h2>
              <button className="details-modal-close" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            <div className="details-modal-body">
              <div className="post-details">
                <span className={`role-badge ${selectedPost.role}`}>
                  {selectedPost.role === 'provider' ? 'Provider Post' : 'Seeker Post'}
                </span>
                <p><strong>Description:</strong> {selectedPost.description}</p>
                <p><strong>Category:</strong> {selectedPost.category}</p>
                <p><strong>Location:</strong> {selectedPost.location?.city}, {selectedPost.location?.area}</p>
                <p><strong>Author:</strong> {selectedPost.author?.name}</p>
                <p><strong>Rate:</strong> {selectedPost.role === 'provider' ? `৳${selectedPost.price}` : `৳${selectedPost.minRate} - ৳${selectedPost.maxRate}`}</p>
                {selectedPost.role === 'seeker' && (
                  <p><strong>Vacancy:</strong> {selectedPost.hiredCount}/{selectedPost.vacancy} hired ({selectedPost.vacancy - selectedPost.hiredCount} remaining)</p>
                )}
                {selectedPost.applicationCount > 0 && (
                  <p><strong>Applications:</strong> {selectedPost.applicationCount} received</p>
                )}
                {selectedPost.serviceDate && (
                  <p><strong>Service Date:</strong> {new Date(selectedPost.serviceDate).toLocaleDateString()}</p>
                )}
                {selectedPost.isVacancyFull && (
                  <p className="vacancy-full-notice"><strong>Status:</strong> Vacancy Full</p>
                )}
                {selectedPost.userHasApplied && (
                  <p className="application-status"><strong>Your Application:</strong> {selectedPost.userApplicationStatus}</p>
                )}
                {selectedPost.tags?.length > 0 && (
                  <div>
                    <strong>Tags:</strong>
                    <div className="tags">
                      {selectedPost.tags.map((tag, index) => (
                        <span key={index} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="details-modal-actions">
              {canApply(selectedPost) && (
                <button className="btn btn-success" onClick={() => {
                  setShowDetailsModal(false);
                  handleApply(selectedPost);
                }}>
                  Apply
                </button>
              )}
              {user && user.role === 'provider' && selectedPost.role === 'seeker' && selectedPost.author._id !== user._id && (selectedPost.userHasApplied || appliedPostIds.has(selectedPost._id)) && (
                <button className="btn btn-secondary" disabled>
                  Applied
                </button>
              )}
              {canHire(selectedPost) && (
                <button className="btn btn-success" onClick={() => {
                  setShowDetailsModal(false);
                  handleHire(selectedPost);
                }}>
                  Hire
                </button>
              )}
              {canMessage(selectedPost) && (
                <button className="btn btn-info" onClick={() => {
                  setShowDetailsModal(false);
                  handleQuickMessage(selectedPost);
                }}>
                  Message
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Message Modal */}
      {showMessageModal && selectedPost && (
        <div className="details-modal-overlay" onClick={() => setShowMessageModal(false)}>
          <div className="quick-message-modal" onClick={(e) => e.stopPropagation()}>
            <div className="details-modal-header">
              <h2>Send Message to {selectedPost.author?.name}</h2>
              <button className="details-modal-close" onClick={() => setShowMessageModal(false)}>×</button>
            </div>
            <div className="quick-message-form">
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Type your message here..."
                className="quick-message-textarea"
              />
              <div className="quick-message-actions">
                <button className="btn btn-secondary" onClick={() => setShowMessageModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSendMessage} disabled={!messageContent.trim()}>
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {showApplyModal && actionPost && (
        <div className="modal-overlay" onClick={() => setShowApplyModal(false)}>
          <div className="modal dark-modal" onClick={(e) => e.stopPropagation()} style={{ 
            background: 'linear-gradient(120deg, #1a1d44 0%, #222650 100%)', 
            border: '1px solid #333',
            color: 'white',
            fontFamily: 'Arial, sans-serif'
          }}>
            <div className="modal-header">
              <h2 style={{ color: 'white' }}>Apply to "{actionPost.title}"</h2>
              <button className="modal-close" onClick={() => setShowApplyModal(false)} style={{ color: 'white' }}>×</button>
            </div>
            <div className="modal-body">
              <div className="post-summary" style={{ color: 'white', marginBottom: '20px', fontFamily: 'Arial, sans-serif', fontSize: '14px', lineHeight: '1.5' }}>
                <p style={{ margin: '8px 0' }}><strong>Rate Range:</strong> ৳{actionPost.minRate || actionPost.budget?.min || 0} - ৳{actionPost.maxRate || actionPost.budget?.max || 0}</p>
                <p style={{ margin: '8px 0' }}><strong>Vacancy:</strong> {actionPost.hiredCount || 0}/{actionPost.vacancy || 1} hired</p>
              </div>
              
              <div className="application-form">
                <div className="form-group">
                  <label htmlFor="offeredAmount" style={{ color: 'white', fontFamily: 'Arial, sans-serif', fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Your Offered Rate (৳):</label>
                  <input
                    type="number"
                    id="offeredAmount"
                    value={offeredAmount}
                    onChange={(e) => setOfferedAmount(e.target.value)}
                    placeholder={`Between ৳${actionPost.minRate || actionPost.budget?.min || 0} - ৳${actionPost.maxRate || actionPost.budget?.max || 0}`}
                    min={actionPost.minRate || actionPost.budget?.min || 0}
                    max={actionPost.maxRate || actionPost.budget?.max || 0}
                    style={{ 
                      backgroundColor: '#333', 
                      color: 'white', 
                      border: '1px solid #555',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      fontFamily: 'Arial, sans-serif',
                      fontSize: '14px',
                      width: '100%'
                    }}
                  />
                  {offeredAmount && (parseFloat(offeredAmount) < (actionPost.minRate || actionPost.budget?.min || 0) || parseFloat(offeredAmount) > (actionPost.maxRate || actionPost.budget?.max || 0)) && (
                    <small style={{ color: '#ff6b6b', fontFamily: 'Arial, sans-serif', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                      Rate must be between ৳{actionPost.minRate || actionPost.budget?.min || 0} - ৳{actionPost.maxRate || actionPost.budget?.max || 0}
                    </small>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="applicationMessage" style={{ color: 'white', fontFamily: 'Arial, sans-serif', fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Message (Optional):</label>
                  <textarea
                    id="applicationMessage"
                    value={applicationMessage}
                    onChange={(e) => setApplicationMessage(e.target.value)}
                    placeholder="Tell the seeker why you're the right fit for this job..."
                    rows="4"
                    maxLength="500"
                    style={{ 
                      backgroundColor: '#333', 
                      color: 'white', 
                      border: '1px solid #555',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      resize: 'vertical',
                      fontFamily: 'Arial, sans-serif',
                      fontSize: '14px',
                      width: '100%'
                    }}
                  />
                  <small style={{ color: '#ccc', fontFamily: 'Arial, sans-serif', fontSize: '12px' }}>{applicationMessage.length}/500 characters</small>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setShowApplyModal(false);
                  setOfferedAmount('');
                  setApplicationMessage('');
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-success" 
                onClick={confirmApply}
                disabled={!offeredAmount || parseFloat(offeredAmount) < actionPost.minRate || parseFloat(offeredAmount) > actionPost.maxRate}
              >
                Submit Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hire Confirmation Modal */}
      {showHireModal && actionPost && (
        <div className="modal-overlay" onClick={() => setShowHireModal(false)}>
          <div className="modal dark-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ color: 'white' }}>Hire Provider</h2>
              <button className="modal-close" onClick={() => setShowHireModal(false)} style={{ color: 'white' }}>×</button>
            </div>
            <div className="modal-body">
              <div className="hire-details" style={{ color: 'white' }}>
                <p><strong>Provider:</strong> {actionPost.author?.name}</p>
                <p><strong>Service:</strong> {actionPost.title}</p>
                <p><strong>Provider's Rate:</strong> ৳{actionPost.price}</p>
                <p style={{ marginTop: '15px', fontSize: '14px', opacity: '0.8' }}>
                  Are you sure you want to hire this provider at their asking rate?
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowHireModal(false)}>
                Cancel
              </button>
              <button 
                className="btn btn-success" 
                onClick={confirmHire}
              >
                Hire Provider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services; 