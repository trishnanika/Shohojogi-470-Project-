import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import { FaSearch, FaHeart, FaHistory, FaUser } from 'react-icons/fa';
import './Dashboard.css';

const SeekerDashboard = () => {
  const { user } = useAuth();
  const [recentSearches, setRecentSearches] = useState([]);
  const [favoriteProviders, setFavoriteProviders] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    // TODO: Fetch seeker dashboard data from API
    // setRecentSearches([]);
    // setFavoriteProviders([]);
    // setRecentBookings([]);
    // You can implement real fetching here.
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard seeker-dashboard">
        <div className="dashboard-header">
          <h1>Find Workers Dashboard</h1>
          <p>Welcome back, {user?.name}!</p>
        </div>
        <div className="quick-search">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="What service do you need?" 
              className="search-input"
            />
            <button className="btn btn-primary">Search</button>
          </div>
        </div>
        <div className="dashboard-grid">
          <div className="section">
            <h2>Recent Searches</h2>
            <div className="search-list">
              {recentSearches.map(search => (
                <div key={search.id} className="search-item">
                  <div className="search-info">
                    <h4>{search.query}</h4>
                    <span className="category">{search.category}</span>
                  </div>
                  <span className="date">{search.date}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="section">
            <h2>Favorite Providers</h2>
            <div className="provider-list">
              {favoriteProviders.map(provider => (
                <div key={provider.id} className="provider-item">
                  <div className="provider-info">
                    <h4>{provider.name}</h4>
                    <p>{provider.service}</p>
                    <div className="rating">
                      <span className="stars">★★★★★</span>
                      <span className="rating-text">{provider.rating}</span>
                    </div>
                  </div>
                  <button className="btn btn-outline btn-sm">Book Now</button>
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
                    <p>{booking.provider}</p>
                    <span className="date">{booking.date}</span>
                  </div>
                  <span className={`status status-${booking.status.toLowerCase()}`}>
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="section">
            <h2>Quick Actions</h2>
            <div className="action-buttons">
              <button className="btn btn-primary">
                <FaSearch /> Find Services
              </button>
              <button className="btn btn-secondary">
                <FaHeart /> View Favorites
              </button>
              <button className="btn btn-accent">
                <FaHistory /> Booking History
              </button>
              <button className="btn btn-outline">
                <FaUser /> Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeekerDashboard; 