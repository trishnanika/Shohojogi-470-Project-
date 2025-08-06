import React from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>SohoJogi</h3>
            <p>Connecting Hands, Simplifying Life</p>
            <p className="footer-description">
              Your trusted platform for finding reliable service providers across Bangladesh.
            </p>
          </div>

          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/services">Services</Link></li>
              <li><Link to="/register">Register</Link></li>
              <li><Link to="/login">Login</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Services</h4>
            <ul>
              <li><Link to="/services?category=Tutor">Tutoring</Link></li>
              <li><Link to="/services?category=Electrician">Electrical Work</Link></li>
              <li><Link to="/services?category=Plumber">Plumbing</Link></li>
              <li><Link to="/services?category=Cleaning">Cleaning</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Contact</h4>
            <div className="contact-info">
              <div className="contact-item">
                <FiMail />
                <span>info@sohojogi.com</span>
              </div>
              <div className="contact-item">
                <FiPhone />
                <span>+880 1700-000000</span>
              </div>
              <div className="contact-item">
                <FiMapPin />
                <span>Dhaka, Bangladesh</span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} SohoJogi. All rights reserved.</p>
          <div className="footer-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 