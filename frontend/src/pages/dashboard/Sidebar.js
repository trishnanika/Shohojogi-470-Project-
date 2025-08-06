import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiHome, FiUser, FiSettings, FiLogOut, FiUsers, FiTool, FiBarChart, FiClipboard, FiPlus, FiList, FiSearch, FiHeart, FiClock, FiCalendar, FiStar } from 'react-icons/fi';
import './Dashboard.css';

const Sidebar = ({ onPostServiceClick }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  let links = [];
  if (user.role === 'admin') {
    links = [
      { to: '/admin', label: 'Overview', icon: <FiHome /> },
      { to: '/admin/users', label: 'Manage Users', icon: <FiUsers /> },
      { to: '/admin/services', label: 'Manage Services', icon: <FiTool /> },
      { to: '/admin/reports', label: 'Reports', icon: <FiBarChart /> },
      { to: '/profile', label: 'Profile', icon: <FiUser /> },
      { to: '/profile/edit', label: 'Settings', icon: <FiSettings /> },
    ];
  } else if (user.role === 'provider') {
    links = [
      { to: '/provider', label: 'Dashboard', icon: <FiHome /> },
      { type: 'postService', label: 'Post Service', icon: <FiPlus /> },
      { to: '/my-services', label: 'My Services', icon: <FiList /> },
      { to: '/provider/bookings', label: 'Bookings', icon: <FiCalendar /> },
      { to: '/provider/earnings', label: 'Earnings', icon: <FiStar /> },
      { to: '/profile', label: 'Profile', icon: <FiUser /> },
      { to: '/profile/edit', label: 'Settings', icon: <FiSettings /> },
    ];
  } else if (user.role === 'seeker') {
    links = [
      { to: '/seeker', label: 'Dashboard', icon: <FiHome /> },
      { to: '/services', label: 'Find Services', icon: <FiSearch /> },
      { to: '/seeker/favorites', label: 'Favorites', icon: <FiHeart /> },
      { to: '/seeker/bookings', label: 'Bookings', icon: <FiClock /> },
      { to: '/profile', label: 'Profile', icon: <FiUser /> },
      { to: '/profile/edit', label: 'Settings', icon: <FiSettings /> },
    ];
  }

  return (
    <aside className="dashboard-sidebar">
      <nav>
        <ul>
          {links.map(link => (
            link.type === 'postService' && onPostServiceClick ? (
              <li key="postService">
                <button className={"sidebar-btn"} onClick={onPostServiceClick} style={{ background: 'none', border: 'none', color: 'inherit', width: '100%', textAlign: 'left', padding: 0, display: 'flex', alignItems: 'center', gap: 8, font: 'inherit', cursor: 'pointer' }}>
                  {link.icon}
                  <span>{link.label}</span>
                </button>
              </li>
            ) : (
              <li key={link.to} className={location.pathname === link.to ? 'active' : ''}>
                <Link to={link.to}>
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              </li>
            )
          ))}
          <li>
            <button className="sidebar-logout" onClick={logout}>
              <FiLogOut /> <span>Logout</span>
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;