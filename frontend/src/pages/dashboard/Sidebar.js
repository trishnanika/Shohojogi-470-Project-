import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiHome, FiUser, FiSettings, FiLogOut, FiUsers, FiTool, FiBarChart, FiPlus, FiList, FiSearch, FiHeart, FiClock, FiCalendar, FiStar, FiMessageSquare, FiFileText, FiUserCheck } from 'react-icons/fi';
import './Dashboard.css';

const Sidebar = ({ onPostServiceClick, onSectionChange, activeSection }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  let links = [];
  if (user.role === 'admin') {
    links = [
      { type: 'section', section: 'dashboard', label: 'Overview', icon: <FiHome /> },
      { type: 'section', section: 'users', label: 'Manage Users', icon: <FiUsers /> },
      { type: 'section', section: 'manage-posts', label: 'Manage Posts', icon: <FiTool /> },
      { to: '/profile', label: 'Profile', icon: <FiUser /> },
      { to: '/profile/edit', label: 'Settings', icon: <FiSettings /> },
    ];
  } else if (user.role === 'provider') {
    links = [
      { type: 'section', section: 'dashboard', label: 'Dashboard', icon: <FiHome /> },
      { type: 'section', section: 'createPost', label: 'Create Post', icon: <FiPlus /> },
      { type: 'section', section: 'applications', label: 'Applications', icon: <FiUserCheck /> },
      { type: 'section', section: 'messages', label: 'Messages', icon: <FiMessageSquare /> },
      { type: 'section', section: 'myPosts', label: 'My Posts', icon: <FiFileText /> },
      { to: '/profile', label: 'Profile', icon: <FiUser /> },
      { type: 'section', section: 'settings', label: 'Settings', icon: <FiSettings /> },
    ];
  } else if (user.role === 'seeker') {
    links = [
      { type: 'section', section: 'dashboard', label: 'Dashboard', icon: <FiHome /> },
      { type: 'section', section: 'createPost', label: 'Create Post', icon: <FiPlus /> },
      { type: 'section', section: 'myPosts', label: 'My Posts', icon: <FiFileText /> },
      { type: 'section', section: 'messages', label: 'Messages', icon: <FiMessageSquare /> },
      { type: 'section', section: 'hireHistory', label: 'Hire History', icon: <FiClock /> },
      { to: '/profile', label: 'Profile', icon: <FiUser /> },
      { type: 'section', section: 'settings', label: 'Settings', icon: <FiSettings /> },
    ];
  }

  return (
    <aside className="dashboard-sidebar">
      <nav>
        <ul>
          {links.map(link => (
            link.type === 'section' && onSectionChange ? (
              <li key={link.section} className={activeSection === link.section ? 'active' : ''}>
                <button onClick={() => onSectionChange(link.section)}>
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