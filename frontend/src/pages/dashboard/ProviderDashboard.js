import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import axios from 'axios';
import { FaPlus, FaTools, FaChartLine, FaUser, FaCalendar, FaStar } from 'react-icons/fa';
import './Dashboard.css';

const ProviderDashboard = () => {
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
  const { user } = useAuth();
  const [myServices, setMyServices] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [earnings, setEarnings] = useState({
    thisMonth: 0,
    lastMonth: 0,
    totalEarnings: 0
  });

  useEffect(() => {
    // TODO: Fetch provider dashboard data from API
    // setMyServices([]);
    // setRecentBookings([]);
    // setEarnings({ thisMonth: 0, lastMonth: 0, totalEarnings: 0 });
    // You can implement real fetching here.
  }, []);

  const handlePostServiceClick = () => setActiveSection('postService');
  const handleDashboardClick = () => setActiveSection('dashboard');

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'city' || name === 'area') {
      setForm({ ...form, location: { ...form.location, [name]: value } });
    } else {
      setForm({ ...form, [name]: value });
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
      const res = await axios.post('/api/services', postBody, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPostSuccess('Service posted successfully!');
      setForm({ title: '', category: '', price: '', description: '', location: '' });
      setMyServices(prev => [...prev, res.data.service]);
    } catch (err) {
      setPostError(err.response?.data?.message || 'Failed to post service.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar onPostServiceClick={handlePostServiceClick} />
      <div className="dashboard provider-dashboard">
        {activeSection === 'dashboard' && (
          <>
            <div className="dashboard-header">
              <h1>Offer Services Dashboard</h1>
              <p>Welcome back, {user?.name}!</p>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <FaTools />
                </div>
                <div className="stat-content">
                  <h3>{myServices.length}</h3>
                  <p>Active Services</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <FaCalendar />
                </div>
                <div className="stat-content">
                  <h3>{recentBookings.length}</h3>
                  <p>This Month Bookings</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <FaChartLine />
                </div>
                <div className="stat-content">
                  <h3>৳{earnings.thisMonth}</h3>
                  <p>This Month Earnings</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <FaStar />
                </div>
                <div className="stat-content">
                  <h3>4.8</h3>
                  <p>Average Rating</p>
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
                    <div key={service.id} className="service-item">
                      <div className="service-info">
                        <h4>{service.title}</h4>
                        <p className="category">{service.category}</p>
                        <p className="price">৳{service.price}</p>
                      </div>
                      <div className="service-stats">
                        <span className={`status status-${service.status?.toLowerCase?.() || 'active'}`}>
                          {service.status || 'Active'}
                        </span>
                        <span className="bookings">{service.bookings || 0} bookings</span>
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
                      <div style={{ fontSize: 13, opacity: 0.7 }}>Location: {service.location}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderDashboard;