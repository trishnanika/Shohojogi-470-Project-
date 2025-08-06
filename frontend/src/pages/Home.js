import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiSearch, 
  FiMapPin, 
  FiStar, 
  FiUsers, 
  FiShield, 
  FiClock,
  FiCheckCircle
} from 'react-icons/fi';
import './Home.css';

const Home = () => {
  const { user } = useAuth();

  const serviceCategories = [
    { name: 'Tutor', icon: '📚', color: '#667eea' },
    { name: 'Electrician', icon: '⚡', color: '#fbbf24' },
    { name: 'Plumber', icon: '🔧', color: '#10b981' },
    { name: 'Carpenter', icon: '🪚', color: '#8b5cf6' },
    { name: 'Painter', icon: '🎨', color: '#f59e0b' },
    { name: 'Parcel Delivery', icon: '📦', color: '#ef4444' },
    { name: 'Home Repair', icon: '🏠', color: '#06b6d4' },
    { name: 'Cleaning', icon: '🧹', color: '#84cc16' },
    { name: 'Gardening', icon: '🌱', color: '#22c55e' },
    { name: 'Cooking', icon: '👨‍🍳', color: '#f97316' },
    { name: 'Photography', icon: '📸', color: '#ec4899' },
    { name: 'Event Management', icon: '🎉', color: '#a855f7' }
  ];

  const features = [
    {
      icon: <FiUsers />,
      title: 'Verified Providers',
      description: 'All service providers are thoroughly verified and background checked'
    },
    {
      icon: <FiShield />,
      title: 'Secure Payments',
      description: 'Safe and secure payment processing for all transactions'
    },
    {
      icon: <FiClock />,
      title: 'Quick Service',
      description: 'Get connected with providers within minutes, not days'
    },
    {
      icon: <FiStar />,
      title: 'Quality Guaranteed',
      description: 'Rate and review system ensures high-quality services'
    }
  ];

  const stats = [
    { number: '1000+', label: 'Service Providers' },
    { number: '50+', label: 'Cities Covered' },
    { number: '10,000+', label: 'Happy Customers' },
    { number: '4.8', label: 'Average Rating' }
  ];

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1>
                Connecting Hands,{' '}
                <span className="gradient-text">Simplifying Life</span>
              </h1>
              <p>
                Find reliable service providers or offer your skills to help others. 
                SohoJogi connects you with trusted professionals across Bangladesh.
              </p>
              
              {!user ? (
                <div className="hero-buttons">
                  <Link to="/register" className="btn btn-primary btn-large">
                    Get Started
                  </Link>
                  <Link to="/services" className="btn btn-outline btn-large">
                    Browse Services
                  </Link>
                </div>
              ) : (
                <div className="hero-buttons">
                  <Link to="/services" className="btn btn-primary btn-large">
                    Find Services
                  </Link>
                  {user.role === 'provider' && (
                    <Link to="/create-service" className="btn btn-outline btn-large">
                      Post Service
                    </Link>
                  )}
                </div>
              )}
            </div>
            
            <div className="hero-image">
              <div className="hero-illustration">
                <div className="floating-card card-1">
                  <FiStar className="card-icon" />
                  <span>Verified Provider</span>
                </div>
                <div className="floating-card card-2">
                  <FiMapPin className="card-icon" />
                  <span>Local Service</span>
                </div>
                <div className="floating-card card-3">
                  <FiCheckCircle className="card-icon" />
                  <span>Quality Assured</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="search-section">
        <div className="container">
          <div className="search-card">
            <h2>Find the Perfect Service</h2>
            <div className="search-form">
              <div className="search-input">
                <FiSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder="What service do you need?"
                  className="search-field"
                />
              </div>
              <div className="search-input">
                <FiMapPin className="search-icon" />
                <select className="search-field">
                  <option value="">Select City</option>
                  <option value="Dhaka">Dhaka</option>
                  <option value="Chittagong">Chittagong</option>
                  <option value="Sylhet">Sylhet</option>
                  <option value="Rajshahi">Rajshahi</option>
                  <option value="Khulna">Khulna</option>
                </select>
              </div>
              <button className="btn btn-primary search-btn">
                <FiSearch />
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="categories-section">
        <div className="container">
          <div className="section-header">
            <h2>Popular Service Categories</h2>
            <p>Find the service you need from our wide range of categories</p>
          </div>
          
          <div className="categories-grid">
            {serviceCategories.map((category, index) => (
              <Link 
                key={index}
                to={`/services?category=${category.name}`}
                className="category-card"
                style={{ '--category-color': category.color }}
              >
                <span className="category-icon">{category.icon}</span>
                <h3>{category.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose SohoJogi?</h2>
            <p>We make finding and providing services simple and reliable</p>
          </div>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Get Started?</h2>
            <p>Join thousands of users who trust SohoJogi for their service needs</p>
            
            {!user ? (
              <div className="cta-buttons">
                <Link to="/register" className="btn btn-primary btn-large">
                  Join Now
                </Link>
                <Link to="/services" className="btn btn-outline btn-large">
                  Browse Services
                </Link>
              </div>
            ) : (
              <div className="cta-buttons">
                <Link to="/services" className="btn btn-primary btn-large">
                  Find Services
                </Link>
                {user.role === 'provider' && (
                  <Link to="/create-service" className="btn btn-outline btn-large">
                    Post Your Service
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 