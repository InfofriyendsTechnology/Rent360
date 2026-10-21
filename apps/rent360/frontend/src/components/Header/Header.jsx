import React, { useState, useEffect } from 'react';
import { FiBell, FiSun, FiMoon, FiMenu } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import './Header.scss';

const Header = ({ onToggleSidebar }) => {
  const { user } = useSelector((state) => state.auth);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [activePeriod, setActivePeriod] = useState('Quarter');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    setTheme(newTheme);
    window.dispatchEvent(new Event('themeChanged'));
  };

  const getBreadcrumbTitle = () => {
    if (location.pathname === '/') return 'Overview';
    if (location.pathname.startsWith('/stores')) return 'Stores Management';
    if (location.pathname.startsWith('/subscriptions')) return 'Subscriptions';
    if (location.pathname.startsWith('/collection') || location.pathname.startsWith('/inventory')) return 'Collection';
    if (location.pathname.startsWith('/customers')) return 'Customers';
    if (location.pathname.startsWith('/roles') || location.pathname.startsWith('/staff')) return 'Roles & Staff';
    if (location.pathname.startsWith('/settings') || location.pathname.startsWith('/categories')) return 'System Setup';
    return 'Dashboard';
  };

  return (
    <header className="dashboard-header-capsule">
      {/* Left: Hamburger & Breadcrumbs */}
      <div className="header-left-wrap">
        <button 
          type="button" 
          className="mobile-hamburger-btn" 
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          title="Open menu"
        >
          <FiMenu />
        </button>
        <div className="header-breadcrumbs">
          <span className="crumb-root">Workspace</span>
          <span className="crumb-slash">/</span>
          <span className="crumb-active">{getBreadcrumbTitle()}</span>
        </div>
      </div>

      {/* Right: Controls & Actions matching Bond CRM */}
      <div className="header-actions">
        {/* Period Selector Tabs */}
        <div className="period-segmented">
          {['Month', 'Quarter', 'Year'].map((period) => (
            <button
              key={period}
              className={`period-btn ${activePeriod === period ? 'active' : ''}`}
              onClick={() => setActivePeriod(period)}
            >
              {period}
            </button>
          ))}
        </div>

        {/* Alerts Pill */}
        <div className="alerts-pill-btn">
          <FiBell className="bell-icon" />
          <span className="label">Alerts</span>
          <span className="count-pill">3</span>
        </div>

        {/* Theme Toggle Button */}
        <button className="theme-circle-btn" onClick={toggleTheme} title="Toggle Theme">
          {theme === 'light' ? <FiMoon /> : <FiSun />}
        </button>

        {/* Circular User Avatar */}
        <div 
          className="avatar-circle" 
          style={{ overflow: 'hidden', cursor: 'pointer' }}
          onClick={() => navigate('/profile')}
          title="Super Admin Profile Settings"
        >
          {user?.profile_pic ? (
            <img src={user.profile_pic} alt="DP" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
