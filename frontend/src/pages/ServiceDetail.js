import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaStar, FaMapMarkerAlt } from 'react-icons/fa';
import api from '../utils/api';
import './ServiceDetail.css';

const ServiceDetail = () => {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchService = async () => {
      try {
        const { data } = await api.get(`/api/services/${id}`);
        setService(data.data);
      } catch (e) {
        setError('Failed to load service');
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id]);

  if (loading) return <div className="service-detail-page"><div className="sd-loading">Loading...</div></div>;
  if (error) return <div className="service-detail-page"><div className="sd-error">{error}</div></div>;
  if (!service) return null;

  return (
    <div className="service-detail-page">
      <div className="sd-container">
        <div className="sd-card">
          <div className="sd-image">
            <img src={service.images?.[0] || 'https://via.placeholder.com/800x520'} alt={service.title} />
            <span className="sd-chip sd-category">{service.category}</span>
          </div>
          <div className="sd-content">
            <h1 className="sd-title">{service.title}</h1>
            <div className="sd-meta">
              <div className="sd-rating">
                <FaStar />
                <span>{service.rating || 0}</span>
                <span className="sd-reviews">({service.totalReviews || 0} reviews)</span>
              </div>
              <div className="sd-location">
                <FaMapMarkerAlt />
                <span>{service.location?.city} {service.location?.area ? `• ${service.location.area}` : ''}</span>
              </div>
              <div className="sd-price">
                <span className="sd-price-amount">৳{service.price}</span>
                {service.priceType && <span className="sd-price-type">{service.priceType}</span>}
              </div>
            </div>

            <div className="sd-section">
              <h3>Description</h3>
              <p>{service.description}</p>
            </div>

            <div className="sd-section">
              <h3>Provider</h3>
              <div className="sd-provider-name">{typeof service.provider === 'object' ? service.provider?.name : service.provider}</div>
              {/* Contact details intentionally hidden for privacy until chat is implemented */}
            </div>

            <div className="sd-actions">
              <button className="btn btn-primary">Book Now</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail; 