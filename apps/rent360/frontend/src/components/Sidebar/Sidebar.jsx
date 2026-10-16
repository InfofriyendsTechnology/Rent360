import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  FiHome, FiBox, FiUsers, FiSettings, FiLogOut, 
  FiCreditCard, FiShield, FiSearch, FiBell, FiLayers, FiHardDrive, 
  FiCornerUpLeft, FiX, FiSliders, FiDatabase, FiChevronDown, FiChevronRight,
  FiMaximize2, FiDroplet, FiClock, FiBookOpen
} from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { logout, loginSuccess } from '../../store/authSlice';
import toast from 'react-hot-toast';

import './Sidebar.scss';

const Sidebar = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || !user?.role;
  const superAdminToken = localStorage.getItem('superAdminToken');
  const canReturnToSuperAdmin = !isSuperAdmin && Boolean(superAdminToken);

  const isMasterRouteActive = [
    '/master', '/users', '/categories', '/sizes', '/colors', 
    '/time-slots', '/reminders', '/accounts', '/security-accounts'
  ].some((p) => location.pathname.startsWith(p));

  const [isMasterOpen, setIsMasterOpen] = useState(true);

  useEffect(() => {
    if (isSuperAdmin) {
      localStorage.removeItem('superAdminToken');
      localStorage.removeItem('superAdminUser');
    }
  }, [isSuperAdmin]);

  const handleReturnToSuperAdmin = () => {
    const sToken = localStorage.getItem('superAdminToken');
    const userStr = localStorage.getItem('superAdminUser');
    if (sToken && userStr) {
      try {
        const sUser = JSON.parse(userStr);
        localStorage.removeItem('superAdminToken');
        localStorage.removeItem('superAdminUser');
        dispatch(loginSuccess({ user: sUser, token: sToken }));
        onClose?.();
        navigate('/stores');
        toast.success("Returned to Super Admin");
      } catch (err) {}
    }
  };
  const sidebarLogo = theme === 'dark' ? '/assets/logo/Rent360_icon_White.png' : '/assets/logo/Rent360_icon_Black.png';

  useEffect(() => {
    const handleThemeChange = () => {
      setTheme(localStorage.getItem('theme') || 'light');
    };
    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('superAdminToken');
    localStorage.removeItem('superAdminUser');
    onClose?.();
    dispatch(logout());
  };

  const handleProfileClick = () => { 
    onClose?.();
    navigate('/profile'); 
  };

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-logo-card">
            <img src={sidebarLogo} alt="Rent360" />
          </div>
          <div className="brand-title-wrap">
            <span className="brand-name">Rent360</span>
            <span className="brand-sub">Platform</span>
          </div>
          <button 
            type="button" 
            className="mobile-sidebar-close" 
            onClick={onClose} 
            aria-label="Close menu"
            title="Close navigation"
          >
            <FiX />
          </button>
        </div>

        {/* Pill Search Input */}
        <div className="sidebar-search">
          <FiSearch className="search-icon" />
          <input type="text" placeholder="Search everything" readOnly />
          <span className="shortcut-badge">?K</span>
        </div>

        {/* Menu Sections */}
        <div className="sidebar-scroll">
          <div className="menu-group">
            <span className="group-title">WORKSPACE</span>
            <nav>
              <NavLink 
                to="/" 
                end
                className={({ isActive }) => isActive ? 'menu-pill active' : 'menu-pill'}
                onClick={onClose}
              >
                <span className="icon"><FiHome /></span>
                <span className="text">Overview</span>
              </NavLink>
              <div className="menu-pill muted">
                <span className="icon"><FiBell /></span>
                <span className="text">Notifications</span>
                <span className="count-badge">3</span>
              </div>
            </nav>
          </div>

          <div className="menu-group">
            <span className="group-title">{isSuperAdmin ? 'MANAGEMENT' : 'RECORDS'}</span>
            <nav>
              {isSuperAdmin ? (
                <>
                  <NavLink 
                    to="/stores" 
                    className={({ isActive }) => isActive ? 'menu-pill active' : 'menu-pill'}
                    onClick={onClose}
                  >
                    <span className="icon"><FiBox /></span>
                    <span className="text">Stores</span>
                  </NavLink>
                  <NavLink 
                    to="/collection" 
                    className={({ isActive }) => isActive ? 'menu-pill active' : 'menu-pill'}
                    onClick={onClose}
                  >
                    <span className="icon"><FiLayers /></span>
                    <span className="text">Collection</span>
                  </NavLink>
                  <NavLink 
                    to="/plans" 
                    className={({ isActive }) => isActive ? 'menu-pill active' : 'menu-pill'}
                    onClick={onClose}
                  >
                    <span className="icon"><FiLayers /></span>
                    <span className="text">Plans</span>
                  </NavLink>
                  <NavLink 
                    to="/subscriptions" 
                    className={({ isActive }) => isActive ? 'menu-pill active' : 'menu-pill'}
                    onClick={onClose}
                  >
                    <span className="icon"><FiCreditCard /></span>
                    <span className="text">Subscriptions</span>
                  </NavLink>
                  <NavLink 
                    to="/bucket"
                    className={({ isActive }) => isActive ? "menu-pill active" : "menu-pill"}
                    onClick={onClose}
                  >
                    <span className="icon"><FiHardDrive /></span>
                    <span className="text">Bucket Storage</span>
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink 
                    to="/collection" 
                    className={({ isActive }) => isActive ? 'menu-pill active' : 'menu-pill'}
                    onClick={onClose}
                  >
                    <span className="icon"><FiBox /></span>
                    <span className="text">Collection</span>
                  </NavLink>
                  <NavLink 
                    to="/customers" 
                    className={({ isActive }) => isActive ? 'menu-pill active' : 'menu-pill'}
                    onClick={onClose}
                  >
                    <span className="icon"><FiUsers /></span>
                    <span className="text">Customers</span>
                  </NavLink>
                  <NavLink 
                    to="/roles" 
                    className={({ isActive }) => isActive ? 'menu-pill active' : 'menu-pill'}
                    onClick={onClose}
                  >
                    <span className="icon"><FiShield /></span>
                    <span className="text">Roles</span>
                  </NavLink>
                </>
              )}
            </nav>
          </div>

          {/* Collapsible Store Setup Accordion Section */}
          <div className="menu-group master-menu-group">
            <span className="group-title">STORE SETUP</span>
            <div className="accordion-group">
              <button
                type="button"
                className={`menu-pill accordion-trigger ${isMasterOpen ? 'open' : ''} ${isMasterRouteActive ? 'active-group' : ''}`}
                onClick={() => setIsMasterOpen(!isMasterOpen)}
              >
                <span className="icon"><FiSliders /></span>
                <span className="text">Store Setup</span>
                <span className="accordion-chevron">
                  {isMasterOpen ? <FiChevronDown /> : <FiChevronRight />}
                </span>
              </button>

              {isMasterOpen && (
                <div className="accordion-submenu">
                  <NavLink 
                    to="/users" 
                    className={({ isActive }) => isActive ? 'sub-menu-pill active' : 'sub-menu-pill'} 
                    onClick={onClose}
                  >
                    <span className="sub-icon"><FiUsers /></span>
                    <span className="text">Users</span>
                  </NavLink>

                  <NavLink 
                    to="/categories" 
                    className={({ isActive }) => isActive ? 'sub-menu-pill active' : 'sub-menu-pill'} 
                    onClick={onClose}
                  >
                    <span className="sub-icon"><FiLayers /></span>
                    <span className="text">Categories</span>
                  </NavLink>

                  <NavLink 
                    to="/sizes" 
                    className={({ isActive }) => isActive ? 'sub-menu-pill active' : 'sub-menu-pill'} 
                    onClick={onClose}
                  >
                    <span className="sub-icon"><FiMaximize2 /></span>
                    <span className="text">Size</span>
                  </NavLink>

                  <NavLink 
                    to="/colors" 
                    className={({ isActive }) => isActive ? 'sub-menu-pill active' : 'sub-menu-pill'} 
                    onClick={onClose}
                  >
                    <span className="sub-icon"><FiDroplet /></span>
                    <span className="text">Colors</span>
                  </NavLink>

                  <NavLink 
                    to="/time-slots" 
                    className={({ isActive }) => isActive ? 'sub-menu-pill active' : 'sub-menu-pill'} 
                    onClick={onClose}
                  >
                    <span className="sub-icon"><FiClock /></span>
                    <span className="text">Time Slots</span>
                  </NavLink>

                  <NavLink 
                    to="/reminders" 
                    className={({ isActive }) => isActive ? 'sub-menu-pill active' : 'sub-menu-pill'} 
                    onClick={onClose}
                  >
                    <span className="sub-icon"><FiBell /></span>
                    <span className="text">Reminder</span>
                  </NavLink>

                  <NavLink 
                    to="/accounts" 
                    className={({ isActive }) => isActive ? 'sub-menu-pill active' : 'sub-menu-pill'} 
                    onClick={onClose}
                  >
                    <span className="sub-icon"><FiBookOpen /></span>
                    <span className="text">Accounts</span>
                  </NavLink>

                  <NavLink 
                    to="/security-accounts" 
                    className={({ isActive }) => isActive ? 'sub-menu-pill active' : 'sub-menu-pill'} 
                    onClick={onClose}
                  >
                    <span className="sub-icon"><FiShield /></span>
                    <span className="text">Security Accounts</span>
                  </NavLink>
                </div>
              )}
            </div>
          </div>

          <div className="menu-group">
            <span className="group-title">PREFERENCES</span>
            <nav>
              <NavLink 
                to="/settings" 
                className={({ isActive }) => isActive ? 'menu-pill active' : 'menu-pill'}
                onClick={onClose}
              >
                <span className="icon"><FiSettings /></span>
                <span className="text">System Settings</span>
              </NavLink>
            </nav>
          </div>
        </div>

        {/* Footer Profile Card */}
        <div className="sidebar-footer">
          {canReturnToSuperAdmin && (
            <button 
              className="return-admin-btn" 
              onClick={handleReturnToSuperAdmin}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 14px', marginBottom: '12px', background: '#2563eb', color: '#fff', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
            >
              <FiCornerUpLeft />
              Return to Super Admin
            </button>
          )}
          
          <div className="user-profile-card">
            <div className="profile-avatar" onClick={handleProfileClick} style={{ cursor: 'pointer', overflow: 'hidden', position: 'relative' }} title="Profile Settings">
              {user?.profile_pic ? (
                <img src={user.profile_pic} alt="DP" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'
              )}
            </div>
            <div className="profile-info">
              <span className="profile-name">{user?.name || 'Main Admin'}</span>
              <span className="profile-role">{isSuperAdmin ? 'Super Admin' : 'Store Admin'}</span>
            </div>
            <button className="logout-icon-btn" onClick={handleLogout} title="Logout">
              <FiLogOut />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
