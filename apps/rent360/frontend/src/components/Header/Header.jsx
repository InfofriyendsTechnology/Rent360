import React, { useState, useEffect } from 'react';
import { FiBell, FiSearch, FiUser, FiSun, FiMoon } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import './Header.scss';

const Header = () => {
  const { user } = useSelector((state) => state.auth);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme); // Set first
    setTheme(newTheme);
    window.dispatchEvent(new Event('themeChanged')); // Then dispatch
  };

  return (
    <header className="dashboard-header">
      <div className="header-search">
        <FiSearch className="search-icon" />
        <input type="text" placeholder="Search across Rent360..." />
      </div>

      <div className="header-actions">
        <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
          {theme === 'light' ? <FiMoon /> : <FiSun />}
        </button>

        <button className="icon-btn">
          <FiBell />
          <span className="badge">3</span>
        </button>
        
        <div className="user-profile">
          <div className="avatar">
            <FiUser />
          </div>
          <div className="user-info">
            <span className="name">{user?.name || 'Admin'}</span>
            <span className="role">{user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Store Admin'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
