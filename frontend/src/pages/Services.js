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
        const [seekerRes, providerRes] = await Promise.all([
          api.get('/api/seeker-posts?includeClosed=true'),
          api.get('/api/provider-posts')
        ]);

        const seekerPosts = (seekerRes.data?.data || []).map(p => ({
          _id: p._id,
          title: p.title,
          description: p.description,
          category: p.category,
          location: p.location,
          urgency: p.urgency,
          deadline: p.deadline,
          tags: p.tags || [],
          budget: p.budget || { min: 0, max: 0 },
          status: p.status || 'active',
          closedBy: p.closedBy || null,
          roleType: 'seeker',
          author: p.seeker || p.seekerId || null
        }));

        const providerPosts = (providerRes.data?.data || []).map(p => ({
          _id: p._id,
          title: p.title,
          description: p.description,
          category: p.category,
          location: p.location,
          urgency: 'medium',
          deadline: null,
          tags: p.tags || [],
          // Normalize price as a fixed budget range for display
          budget: { min: p.price || 0, max: p.price || 0 },
          roleType: 'provider',
          author: p.provider || p.providerId || null,
          // include hiredBy to detect already-hired posts after refresh
          hiredBy: Array.isArray(p.hiredBy) ? p.hiredBy : []
        }));

        setPosts([...seekerPosts, ...providerPosts]);
      } catch (error) {
        console.error('Error fetching posts:', error);
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
    const matchesRoleType = selectedRoleType === '' || post.roleType === selectedRoleType;

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
    if (!actionPost) return;

    try {
      await api.post(`/api/seeker-posts/${actionPost._id}/apply`, {});

      showSuccess('Application submitted successfully!');
      // Optimistically remember this post as applied to hide button in UI
      setAppliedPostIds(prev => new Set(prev).add(actionPost._id));
      setShowApplyModal(false);
      setActionPost(null);
      // Refresh posts
      // Refresh both lists
      const [seekerRes, providerRes] = await Promise.all([
        api.get('/api/seeker-posts?includeClosed=true'),
        api.get('/api/provider-posts')
      ]);
      const seekerPosts = (seekerRes.data?.data || []).map(p => ({
        _id: p._id,
        title: p.title,
        description: p.description,
        category: p.category,
        location: p.location,
        urgency: p.urgency,
        deadline: p.deadline,
        tags: p.tags || [],
        budget: p.budget || { min: 0, max: 0 },
        roleType: 'seeker',
        status: p.status || 'active',
        closedBy: p.closedBy || null,
        author: p.seeker || p.seekerId || null
      }));
      const providerPosts = (providerRes.data?.data || []).map(p => ({
        _id: p._id,
        title: p.title,
        description: p.description,
        category: p.category,
        location: p.location,
        urgency: 'medium',
        deadline: null,
        tags: p.tags || [],
        budget: { min: p.price || 0, max: p.price || 0 },
        roleType: 'provider',
        author: p.provider || p.providerId || null,
        hiredBy: Array.isArray(p.hiredBy) ? p.hiredBy : []
      }));
      setPosts([...seekerPosts, ...providerPosts]);
    } catch (error) {
      console.error('Error applying to post:', error);
      const backendMsg = error?.response?.data?.message || 'Failed to submit application';
      showError(backendMsg);
    }
  };

  const confirmHire = async () => {
    if (!actionPost) return;

    try {
      // This would typically create a contract or booking
      await api.post(`/api/provider-posts/${actionPost._id}/hire`, {});

      showSuccess('Hire request sent successfully!');
      // Optimistically remember this provider post as hired to hide button
      setHiredPostIds(prev => new Set(prev).add(actionPost._id));
      setShowHireModal(false);
      setActionPost(null);
      // Refresh both lists
      const [seekerRes, providerRes] = await Promise.all([
        api.get('/api/seeker-posts?includeClosed=true'),
        api.get('/api/provider-posts')
      ]);
      const seekerPosts = (seekerRes.data?.data || []).map(p => ({
        _id: p._id,
        title: p.title,
        description: p.description,
        category: p.category,
        location: p.location,
        urgency: p.urgency,
        deadline: p.deadline,
        tags: p.tags || [],
        budget: p.budget || { min: 0, max: 0 },
        roleType: 'seeker',
        status: p.status || 'active',
        closedBy: p.closedBy || null,
        author: p.seeker || p.seekerId || null
      }));
      const providerPosts = (providerRes.data?.data || []).map(p => ({
        _id: p._id,
        title: p.title,
        description: p.description,
        category: p.category,
        location: p.location,
        urgency: 'medium',
        deadline: null,
        tags: p.tags || [],
        budget: { min: p.price || 0, max: p.price || 0 },
        roleType: 'provider',
        author: p.provider || p.providerId || null
      }));
      setPosts([...seekerPosts, ...providerPosts]);
    } catch (error) {
      console.error('Error hiring provider:', error);
      showError('Failed to send hire request');
    }
  };

  const canViewDetails = (post) => {
    // All users can view details of all posts
    return true;
  };

  const canApply = (post) => {
    if (!user || !post.author) return false;
    // Providers can apply to seeker posts (not their own)
    const isActive = (post.status || 'active') === 'active';
    const isClosed = !!post.closedBy; // 'applied' or 'hired' from backend
    const alreadyApplied = appliedPostIds.has(post._id);
    return user.role === 'provider'
      && post.roleType === 'seeker'
      && post.author._id !== user._id
      && isActive
      && !isClosed
      && !alreadyApplied;
  };

  const canHire = (post) => {
    if (!user || !post.author) return false;
    // Seekers can hire providers (not themselves)
    const alreadyHiredLocal = hiredPostIds.has(post._id);
    // Also check backend-persisted hires for this seeker
    const alreadyHiredBackend = Array.isArray(post.hiredBy)
      && post.hiredBy.some(h => {
        const seekerId = (h && (h.seekerId?._id || h.seekerId)) || null;
        return seekerId && String(seekerId) === String(user._id);
      });
    return user.role === 'seeker'
      && post.roleType === 'provider'
      && post.author._id !== user._id
      && !alreadyHiredLocal
      && !alreadyHiredBackend;
  };

  const canMessage = (post) => {
    if (!user || !post.author) return false;
    // Providers can message seekers, seekers can message providers (not own posts)
    return ((user.role === 'provider' && post.roleType === 'seeker') || 
            (user.role === 'seeker' && post.roleType === 'provider')) && 
            post.author._id !== user._id;
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
                <span className={`role-badge ${post.roleType}`}>
                  {post.roleType === 'provider' ? 'Provider Post' : 'Seeker Post'}
                </span>
                {post.roleType === 'seeker' && (post.status || 'active') !== 'active' && (
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

              <div className="service-footer">
                <div className="budget">
                  {post.budget?.min > 0 && (
                    <span>৳{post.budget.min} - ৳{post.budget.max}</span>
                  )}
                </div>
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
                <span className={`role-badge ${selectedPost.roleType}`}>
                  {selectedPost.roleType === 'provider' ? 'Provider Post' : 'Seeker Post'}
                </span>
                <p><strong>Description:</strong> {selectedPost.description}</p>
                <p><strong>Category:</strong> {selectedPost.category}</p>
                <p><strong>Location:</strong> {selectedPost.location?.city}, {selectedPost.location?.area}</p>
                <p><strong>Author:</strong> {selectedPost.author?.name}</p>
                <p><strong>Priority:</strong> {selectedPost.urgency}</p>
                {selectedPost.budget?.min > 0 && (
                  <p><strong>Budget:</strong> ৳{selectedPost.budget.min} - ৳{selectedPost.budget.max}</p>
                )}
                {selectedPost.deadline && (
                  <p><strong>Deadline:</strong> {new Date(selectedPost.deadline).toLocaleDateString()}</p>
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

      {/* Apply Confirmation Modal */}
      {showApplyModal && actionPost && (
        <ConfirmationModal
          isOpen={showApplyModal}
          onClose={() => setShowApplyModal(false)}
          onConfirm={confirmApply}
          title="Apply to Post"
          message={`Are you sure you want to apply to "${actionPost.title}"?`}
          confirmText="Apply"
          type="success"
        />
      )}

      {/* Hire Confirmation Modal */}
      {showHireModal && actionPost && (
        <ConfirmationModal
          isOpen={showHireModal}
          onClose={() => setShowHireModal(false)}
          onConfirm={confirmHire}
          title="Hire Provider"
          message={`Are you sure you want to hire ${actionPost.author?.name} for "${actionPost.title}"?`}
          confirmText="Hire"
          type="success"
        />
      )}
    </div>
  );
};

export default Services; 