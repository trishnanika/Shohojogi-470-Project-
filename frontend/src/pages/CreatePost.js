import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './CreatePost.css';

const CreatePost = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    budget: {
      min: '',
      max: ''
    },
    location: {
      city: '',
      area: ''
    },
    tags: '',
    urgency: 'medium',
    deadline: ''
  });

  const categories = [
    'Home Services',
    'Technology',
    'Education',
    'Healthcare',
    'Transportation',
    'Events',
    'Other'
  ];

  const cities = [
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const common = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        location: formData.location,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      if (user.role === 'seeker') {
        const payload = {
          ...common,
          urgency: formData.urgency,
          deadline: formData.deadline ? new Date(formData.deadline) : null,
          budget: {
            min: parseFloat(formData.budget.min) || 0,
            max: parseFloat(formData.budget.max) || 0
          }
        };
        await api.post('/api/seeker-posts', payload);
      } else {
        // provider
        const price = parseFloat(formData.budget.max || formData.budget.min) || 0;
        const payload = {
          ...common,
          price,
          images: []
        };
        await api.post('/api/provider-posts', payload);
      }

      alert('Post created successfully!');
      navigate('/services');
    } catch (error) {
      alert('Error creating post: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="create-post-page">
        <div className="auth-required">
          <h2>Login Required</h2>
          <p>Please login to create a post.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-post-page">
      <div className="create-post-container">
        <div className="page-header">
          <h1>Create New Post</h1>
          <p>
            {user.role === 'provider' 
              ? 'Post a service you want to offer' 
              : 'Post a request for a service you need'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="create-post-form">
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={user.role === 'provider' ? 'e.g., Professional House Cleaning Service' : 'e.g., Need a House Cleaning Service'}
              required
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide detailed information about your service or request..."
              required
              rows={5}
              maxLength={1000}
            />
            <small>{formData.description.length}/1000 characters</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="urgency">Priority</label>
              <select
                id="urgency"
                name="urgency"
                value={formData.urgency}
                onChange={handleChange}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="form-section">
            <h3>Budget (Optional)</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="budget.min">Minimum (৳)</label>
                <input
                  type="number"
                  id="budget.min"
                  name="budget.min"
                  value={formData.budget.min}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label htmlFor="budget.max">Maximum (৳)</label>
                <input
                  type="number"
                  id="budget.max"
                  name="budget.max"
                  value={formData.budget.max}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Location *</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="location.city">City *</label>
                <select
                  id="location.city"
                  name="location.city"
                  value={formData.location.city}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select City</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="location.area">Area *</label>
                <input
                  type="text"
                  id="location.area"
                  name="location.area"
                  value={formData.location.area}
                  onChange={handleChange}
                  placeholder="e.g., Dhanmondi, Gulshan"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags (Optional)</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g., cleaning, deep cleaning, residential (separate with commas)"
            />
            <small>Separate tags with commas</small>
          </div>

          <div className="form-group">
            <label htmlFor="deadline">Deadline (Optional)</label>
            <input
              type="date"
              id="deadline"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate('/services')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
