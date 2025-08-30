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
    vacancy: 1,
    minRate: '',
    maxRate: '',
    location: {
      city: '',
      area: ''
    },
    tags: '',
    serviceDate: '',
    images: []
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

      const payload = {
        ...common,
        vacancy: parseInt(formData.vacancy) || 1,
        minRate: parseFloat(formData.minRate) || 0,
        maxRate: parseFloat(formData.maxRate) || 0,
        images: formData.images || []
      };

      // Add role-specific fields
      if (user.role === 'Seeker') {
        payload.serviceDate = formData.serviceDate ? new Date(formData.serviceDate) : null;
      }

      await api.post('/api/posts', payload);

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
              <label htmlFor="vacancy">Vacancy (Number of people needed) *</label>
              <input
                type="number"
                id="vacancy"
                name="vacancy"
                value={formData.vacancy}
                onChange={handleChange}
                min="1"
                max="50"
                required
              />
              <small>How many people do you need for this job?</small>
            </div>
          </div>

          <div className="form-section">
            <h3>Rate Range *</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="minRate">Minimum Rate (৳) *</label>
                <input
                  type="number"
                  id="minRate"
                  name="minRate"
                  value={formData.minRate}
                  onChange={handleChange}
                  placeholder="500"
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="maxRate">Maximum Rate (৳) *</label>
                <input
                  type="number"
                  id="maxRate"
                  name="maxRate"
                  value={formData.maxRate}
                  onChange={handleChange}
                  placeholder="2000"
                  min="0"
                  required
                />
              </div>
            </div>
            <small>Providers will offer their amount within this range</small>
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

          {user.role === 'Seeker' && (
            <div className="form-group">
              <label htmlFor="serviceDate">Service Date {user.role === 'Seeker' ? '*' : '(Optional)'}</label>
              <input
                type="date"
                id="serviceDate"
                name="serviceDate"
                value={formData.serviceDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                required={user.role === 'Seeker'}
              />
              <small>When do you need this service?</small>
            </div>
          )}

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
