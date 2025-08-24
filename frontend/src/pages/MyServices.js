import React, { useEffect, useState } from 'react';
import api from '../utils/api';

const MyServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyServices = async () => {
      try {
        const { data } = await api.get('/api/services/my-services');
        setServices(data.data || []);
      } catch (e) {
        setError('Failed to load your services');
      } finally {
        setLoading(false);
      }
    };
    fetchMyServices();
  }, []);

  if (loading) return <div className="my-services-page"><p>Loading...</p></div>;
  if (error) return <div className="my-services-page"><p>{error}</p></div>;

  return (
    <div className="my-services-page">
      <h1>My Services</h1>
      {services.length === 0 ? (
        <p>No services posted yet.</p>
      ) : (
        <ul>
          {services.map(s => (
            <li key={s._id}>
              <strong>{s.title}</strong> — {s.category} — ৳{s.price} — {s.location?.city}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyServices;