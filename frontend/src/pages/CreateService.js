import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const initialForm = {
  title: '',
  category: '',
  price: '',
  priceType: '',
  description: '',
  location: { city: '', area: '' }
};

const CreateService = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!user || user.role !== 'provider') {
    return (
      <div className="create-service-page" style={{ background: 'linear-gradient(120deg, #6a11cb 0%, #2575fc 100%)', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <h2>Access Denied</h2>
        <p>Only service providers can post new services.</p>
      </div>
    );
  }

  const handleChange = e => {
    const { name, value } = e.target;
    if (name === 'city' || name === 'area') {
      setForm({ ...form, location: { ...form.location, [name]: value } });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/api/services', form);
      setSuccess('Service posted successfully!');
      setForm(initialForm);
      setTimeout(() => navigate('/services'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-service-page" style={{ background: 'linear-gradient(120deg, #6a11cb 0%, #2575fc 100%)', color: '#fff', minHeight: '100vh', padding: '2rem' }}>
      <h1 style={{ color: '#fff' }}>Post a New Service</h1>
      <form className="service-form" onSubmit={handleSubmit} style={{ maxWidth: 500, margin: '2rem auto', background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <label style={{ color: '#fff' }}>
          Title:
          <input type="text" name="title" value={form.title} onChange={handleChange} required style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', margin: '8px 0 18px 0' }} />
        </label>
        <label style={{ color: '#fff' }}>
          Category:
          <select name="category" value={form.category} onChange={handleChange} required style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', margin: '8px 0 18px 0' }}>
            <option value="">Select Category</option>
            {['Tutor','Electrician','Plumber','Carpenter','Painter','Parcel Delivery','Home Repair','Cleaning','Gardening','Cooking','Photography','Event Management','Transportation','Beauty Services','Pet Care','Other'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label style={{ color: '#fff' }}>
          Price (৳):
          <input type="number" name="price" value={form.price} onChange={handleChange} required style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', margin: '8px 0 18px 0' }} />
        </label>
        <label style={{ color: '#fff' }}>
          Price Type:
          <select name="priceType" value={form.priceType} onChange={handleChange} required style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', margin: '8px 0 18px 0' }}>
            <option value="">Select Price Type</option>
            {['hourly','fixed','negotiable'].map(pt => (
              <option key={pt} value={pt}>{pt}</option>
            ))}
          </select>
        </label>
        <label style={{ color: '#fff' }}>
          Description:
          <textarea name="description" value={form.description} onChange={handleChange} required rows={3} style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', margin: '8px 0 18px 0' }} />
        </label>
        <label style={{ color: '#fff' }}>
          City:
          <select name="city" value={form.location.city} onChange={handleChange} required style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', margin: '8px 0 18px 0' }}>
            <option value="">Select City</option>
            {['Dhaka','Chittagong','Sylhet','Rajshahi','Khulna','Barisal','Rangpur','Mymensingh','Comilla','Noakhali'].map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </label>
        <label style={{ color: '#fff' }}>
          Area:
          <input type="text" name="area" value={form.location.area} onChange={handleChange} required style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', margin: '8px 0 18px 0' }} />
        </label>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 12, borderRadius: 8, background: 'linear-gradient(90deg, #7f53ac 0%, #647dee 100%)', color: '#fff', fontWeight: 700, fontSize: 18, border: 'none', marginTop: 10 }} disabled={loading}>
          {loading ? 'Posting...' : 'Post Service'}
        </button>
        {success && <div style={{ color: '#b9fbc0', marginTop: 14 }}>{success}</div>}
        {error && <div style={{ color: '#ffb4b4', marginTop: 14 }}>{error}</div>}
      </form>
    </div>
  );
};

export default CreateService;