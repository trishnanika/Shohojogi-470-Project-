import React from 'react';
import { useParams } from 'react-router-dom';
import { FaStar, FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa';

const ServiceDetail = () => {
  const { id } = useParams();

  // TODO: Fetch service details from API
  const service = {
    id: id,
    title: 'Professional Home Cleaning',
    description: 'Complete home cleaning service with professional equipment and eco-friendly products. We provide thorough cleaning for all areas of your home including kitchen, bathroom, living areas, and bedrooms.',
    category: 'Cleaning',
    price: 1500,
    location: 'Dhaka',
    provider: 'Clean Pro Services',
    rating: 4.8,
    reviews: 45,
    image: 'https://via.placeholder.com/600x400',
    contact: {
      phone: '+880 1712345678',
      email: 'info@cleanpro.com'
    }
  };

  return (
    <div className="service-detail-page">
      <div className="service-detail-container">
        <div className="service-image">
          <img src={service.image} alt={service.title} />
        </div>
        
        <div className="service-info">
          <h1>{service.title}</h1>
          <div className="service-meta">
            <span className="category">{service.category}</span>
            <div className="rating">
              <FaStar />
              <span>{service.rating}</span>
              <span>({service.reviews} reviews)</span>
            </div>
          </div>
          
          <div className="service-location">
            <FaMapMarkerAlt />
            <span>{service.location}</span>
          </div>
          
          <div className="service-description">
            <h3>Description</h3>
            <p>{service.description}</p>
          </div>
          
          <div className="service-provider">
            <h3>Service Provider</h3>
            <div className="provider-info">
              <h4>{service.provider}</h4>
              <div className="contact-info">
                <div className="contact-item">
                  <FaPhone />
                  <span>{service.contact.phone}</span>
                </div>
                <div className="contact-item">
                  <FaEnvelope />
                  <span>{service.contact.email}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="service-actions">
            <div className="price">৳{service.price}</div>
            <button className="btn btn-primary">Book Now</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail; 