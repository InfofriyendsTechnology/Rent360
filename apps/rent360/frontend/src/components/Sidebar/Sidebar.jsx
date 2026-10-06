import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiBox, FiUsers, FiSettings, FiLogOut, FiCreditCard, FiShield } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';
import './Sidebar.scss';

const Sidebar = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const sidebarLogo = theme === 'dark' ? '/assets/logo/Rent360_icon_White.png' : '/assets/logo/Rent360_icon_Black.png';

  useEffect(() => {
    const handleThemeChange = () => {
      setTheme(localStorage.getItem('theme') || 'light');
    };
    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
  };

  const menuItems = isSuperAdmin ? [
    { name: 'Dashboard', icon: <FiHome />, path: '/' },
    { name: 'Stores', icon: <FiBox />, path: '/stores' },
    { name: 'Subscriptions', icon: <FiCreditCard />, path: '/subscriptions' },
    { name: 'Global Settings', icon: <FiSettings />, path: '/settings' },
  ] : [
    { name: 'Dashboard', icon: <FiHome />, path: '/' },
    { name: 'Inventory', icon: <FiBox />, path: '/inventory' },
    { name: 'Customers', icon: <FiUsers />, path: '/customers' },
    { name: 'Roles', icon: <FiShield />, path: '/roles' },
    { name: 'Settings', icon: <FiSettings />, path: '/settings' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">
          <img src={sidebarLogo} alt="Rent360 Logo" />
        </div>
        <h2 className="brand-text">RENT360</h2>
      </div>

      <div className="sidebar-menu">
        <nav>
          {menuItems.map((item, index) => (
            <NavLink 
              to={item.path} 
              key={index} 
              className={({ isActive }) => isActive ? 'menu-item active' : 'menu-item'}
            >
              <span className="icon">{item.icon}</span>
              <span className="text">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <FiLogOut />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
