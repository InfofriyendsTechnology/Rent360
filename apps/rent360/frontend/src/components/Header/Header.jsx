import React, { useState, useEffect } from 'react';
import { FiBell, FiSun, FiMoon, FiPlus } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import './Header.scss';

const Header = () => {
  const { user } = useSelector((state) => state.auth);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [activePeriod, setActivePeriod] = useState('Quarter');
  const location = useLocation();

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
    if (location.pathname.startsWith('/inventory')) return 'Inventory';
    if (location.pathname.startsWith('/customers')) return 'Customers';
    if (location.pathname.startsWith('/roles')) return 'Roles & Staff';
    if (location.pathname.startsWith('/settings')) return 'Global Settings';
    return 'Dashboard';
  };

  return (
    <header className="dashboard-header-capsule">
      {/* Left: Breadcrumbs */}
      <div className="header-breadcrumbs">
        <span className="crumb-root">Workspace</span>
        <span className="crumb-slash">/</span>
        <span className="crumb-active">{getBreadcrumbTitle()}</span>
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

        {/* Primary Create Button matching Bond CRM "+ Create" */}
        <button className="create-pill-btn">
          <FiPlus />
          <span>Create</span>
        </button>

        {/* Circular User Avatar */}
        <div className="avatar-circle">
          {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
        </div>
      </div>
    </header>
  );
};

export default Header;
