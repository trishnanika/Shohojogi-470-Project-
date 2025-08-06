import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiMenu, FiX, FiUser, FiLogOut, FiSettings } from 'react-icons/fi';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const closeMenus = () => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'admin':
        return '/admin';
      case 'provider':
        return '/provider';
      case 'seeker':
        return '/seeker';
      default:
        return '/dashboard';
    }
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          {/* Logo */}
          <Link to="/" className="logo" onClick={closeMenus}>
            <h1>SohoJogi</h1>
            <span>Connecting Hands, Simplifying Life</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
            <Link to="/" onClick={closeMenus}>Home</Link>
            <Link to="/services" onClick={closeMenus}>Services</Link>
            
            {user && (
              <>
                <Link to={getDashboardLink()} onClick={closeMenus}>Dashboard</Link>
                <Link to="/profile" onClick={closeMenus}>Profile</Link>
                {user.role === 'provider' && (
                  <>
                    <Link to="/create-service" onClick={closeMenus}>Post Service</Link>
                    <Link to="/my-services" onClick={closeMenus}>My Services</Link>
                  </>
                )}
              </>
            )}
          </nav>

          {/* User Menu */}
          <div className="user-menu">
            {user ? (
              <div className="user-menu-container">
                <button 
                  className="user-menu-button"
                  onClick={toggleUserMenu}
                  aria-label="User menu"
                >
                  <FiUser />
                  <span className="user-name">{user.name}</span>
                </button>
                
                {isUserMenuOpen && (
                  <div className="user-dropdown">
                    <Link to="/profile" onClick={closeMenus}>
                      <FiUser />
                      Profile
                    </Link>
                    <Link to="/profile/edit" onClick={closeMenus}>
                      <FiSettings />
                      Settings
                    </Link>
                    <button onClick={handleLogout} className="logout-button">
                      <FiLogOut />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-outline">Login</Link>
                <Link to="/register" className="btn btn-primary">Register</Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-button"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header; 