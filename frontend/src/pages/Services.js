import React, { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaMapMarkerAlt, FaStar } from 'react-icons/fa';
import './Services.css';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  const categories = [
    'All',
    'Cleaning',
    'Repair',
    'Education',
    'Delivery',
    'Beauty',
    'Health',
    'Other'
  ];

  const locations = [
    'All Locations',
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
    // TODO: Fetch services from API
    const dummyServices = [
      {
        id: 1,
        title: 'Professional Home Cleaning',
        description: 'Complete home cleaning service with professional equipment and eco-friendly products.',
        category: 'Cleaning',
        price: 1500,
        location: 'Dhaka',
        provider: 'Clean Pro Services',
        rating: 4.8,
        reviews: 45,
        image: 'https://via.placeholder.com/300x200'
      },
      {
        id: 2,
        title: 'Electrical Repair & Installation',
        description: 'Expert electrical work including wiring, installation, and repair services.',
        category: 'Repair',
        price: 800,
        location: 'Dhaka',
        provider: 'Ahmed Electrician',
        rating: 4.9,
        reviews: 32,
        image: 'https://via.placeholder.com/300x200'
      },
      {
        id: 3,
        title: 'Mathematics Tutoring',
        description: 'Experienced tutor for all levels of mathematics from primary to university.',
        category: 'Education',
        price: 500,
        location: 'Dhaka',
        provider: 'Math Tutor Sarah',
        rating: 4.7,
        reviews: 28,
        image: 'https://via.placeholder.com/300x200'
      },
      {
        id: 4,
        title: 'Parcel Delivery Service',
        description: 'Fast and reliable parcel delivery across the city with tracking.',
        category: 'Delivery',
        price: 200,
        location: 'Dhaka',
        provider: 'Quick Delivery BD',
        rating: 4.6,
        reviews: 56,
        image: 'https://via.placeholder.com/300x200'
      },
      {
        id: 5,
        title: 'Plumbing Services',
        description: 'Complete plumbing solutions including installation, repair, and maintenance.',
        category: 'Repair',
        price: 1200,
        location: 'Dhaka',
        provider: 'Plumber Pro',
        rating: 4.5,
        reviews: 38,
        image: 'https://via.placeholder.com/300x200'
      },
      {
        id: 6,
        title: 'Beauty & Makeup',
        description: 'Professional makeup and beauty services for special occasions.',
        category: 'Beauty',
        price: 2500,
        location: 'Dhaka',
        provider: 'Beauty Studio',
        rating: 4.8,
        reviews: 42,
        image: 'https://via.placeholder.com/300x200'
      }
    ];

    setServices(dummyServices);
    setLoading(false);
  }, []);

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.provider.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === '' || selectedCategory === 'All' || 
                           service.category === selectedCategory;
    
    const matchesLocation = selectedLocation === '' || selectedLocation === 'All Locations' || 
                           service.location === selectedLocation;

    return matchesSearch && matchesCategory && matchesLocation;
  });

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
        <h1>Find Services</h1>
        <p>Discover trusted professionals for all your needs</p>
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
            <FaFilter className="filter-icon" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              <option value="">All Categories</option>
              {categories.slice(1).map(category => (
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
              {locations.slice(1).map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="services-grid">
        {filteredServices.length > 0 ? (
          filteredServices.map(service => (
            <div key={service.id} className="service-card">
              <div className="service-image">
                <img src={service.image} alt={service.title} />
                <div className="service-category">{service.category}</div>
              </div>
              
              <div className="service-content">
                <h3>{service.title}</h3>
                <p className="service-description">{service.description}</p>
                
                <div className="service-provider">
                  <span className="provider-name">{service.provider}</span>
                  <div className="rating">
                    <FaStar className="star-icon" />
                    <span>{service.rating}</span>
                    <span className="reviews">({service.reviews} reviews)</span>
                  </div>
                </div>

                <div className="service-location">
                  <FaMapMarkerAlt className="location-icon" />
                  <span>{service.location}</span>
                </div>

                <div className="service-footer">
                  <div className="price">৳{service.price}</div>
                  <button className="btn btn-primary">View Details</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <h3>No services found</h3>
            <p>Try adjusting your search criteria or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Services; 