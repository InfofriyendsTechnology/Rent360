import React, { useState, useEffect } from 'react';
import { FiBell, FiSun, FiMoon, FiPlus, FiMenu, FiCornerUpLeft } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { loginSuccess } from '../../store/authSlice';
import toast from 'react-hot-toast';
import './Header.scss';

const Header = ({ onToggleSidebar }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [activePeriod, setActivePeriod] = useState('Quarter');
  const location = useLocation();
  const navigate = useNavigate();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || !user?.role;
  const superAdminToken = localStorage.getItem('superAdminToken');
  const canReturnToSuperAdmin = !isSuperAdmin && Boolean(superAdminToken);

  const handleReturnToSuperAdmin = () => {
    const sToken = localStorage.getItem('superAdminToken');
    const userStr = localStorage.getItem('superAdminUser');
    if (sToken && userStr) {
      try {
        const sUser = JSON.parse(userStr);
        localStorage.removeItem('superAdminToken');
        localStorage.removeItem('superAdminUser');
        dispatch(loginSuccess({ user: sUser, token: sToken }));
        navigate('/stores');
        toast.success("Returned to Super Admin");
      } catch (err) {}
    }
  };

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
        {canReturnToSuperAdmin && (
          <button 
            type="button"
            className="return-superadmin-pill" 
            onClick={handleReturnToSuperAdmin}
            title="Return to Super Admin Dashboard"
          >
            <FiCornerUpLeft className="return-icon" />
            <span>Return to Super Admin</span>
          </button>
        )}

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
