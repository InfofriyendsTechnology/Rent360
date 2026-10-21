import React, { useState, useEffect, useRef } from 'react';
import { 
  FiBell, FiSun, FiMoon, FiMenu, FiSearch, 
  FiRotateCw, FiShoppingBag, FiChevronDown, 
  FiUser, FiLogOut, FiShield, FiCornerUpLeft 
} from 'react-icons/fi';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { logout, loginSuccess } from '../../store/authSlice';
import SearchProductModal from '../SearchProductModal/SearchProductModal';
import './Header.scss';

const Header = ({ onToggleSidebar }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const location = useLocation();
  const navigate = useNavigate();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || !user?.role;
  const superAdminToken = localStorage.getItem('superAdminToken');
  const canReturnToSuperAdmin = !isSuperAdmin && Boolean(superAdminToken);

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [theme]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    setTheme(newTheme);
    window.dispatchEvent(new Event('themeChanged'));
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  const handleCartClick = () => {
    if (!isSuperAdmin) {
      navigate('/collection');
    }
  };

  const handleReturnToSuperAdmin = () => {
    const sToken = localStorage.getItem('superAdminToken');
    const userStr = localStorage.getItem('superAdminUser');
    if (sToken && userStr) {
      try {
        const sUser = JSON.parse(userStr);
        localStorage.removeItem('superAdminToken');
        localStorage.removeItem('superAdminUser');
        dispatch(loginSuccess({ user: sUser, token: sToken }));
        setIsDropdownOpen(false);
        navigate('/stores');
        toast.success('Returned to Super Admin');
      } catch (err) {}
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('superAdminToken');
    localStorage.removeItem('superAdminUser');
    localStorage.removeItem('rent360_active_store_id');
    setIsDropdownOpen(false);
    dispatch(logout());
  };

  const getBreadcrumbTitle = () => {
    if (location.pathname === '/') return 'Overview';
    if (location.pathname.startsWith('/stores')) return 'Stores Management';
    if (location.pathname.startsWith('/subscriptions')) return 'Subscriptions';
    if (location.pathname.startsWith('/collection') || location.pathname.startsWith('/inventory')) return 'Collection';
    if (location.pathname.startsWith('/cashbook') || location.pathname.startsWith('/transactions')) return 'Cashbook';
    if (location.pathname.startsWith('/customers')) return 'Customers';
    if (location.pathname.startsWith('/roles') || location.pathname.startsWith('/staff')) return 'Roles & Staff';
    if (location.pathname.startsWith('/settings') || location.pathname.startsWith('/categories')) return 'System Setup';
    return 'Dashboard';
  };

  // Profile display name
  const displayName = isSuperAdmin 
    ? (user?.name || 'Super Admin') 
    : (user?.store?.name || user?.name || 'Virasat Studio');

  const avatarInitials = isSuperAdmin
    ? 'SA'
    : (user?.store?.name ? user.store.name.slice(0, 2).toUpperCase() : (user?.name ? user.name.slice(0, 2).toUpperCase() : 'VS'));

  return (
    <>
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

        {/* Right: Controls matching competitor CRM */}
        <div className="header-actions">
          {/* 1. Quick Product Search Button (matches green search icon) */}
          <button 
            type="button"
            className="header-action-icon search-btn"
            onClick={() => setIsSearchModalOpen(true)}
            title="Search Product by Code"
            aria-label="Search Product"
          >
            <FiSearch />
          </button>

          {/* 2. Refresh Button (matches rotate icon) */}
          <button 
            type="button"
            className={`header-action-icon refresh-btn ${isRefreshing ? 'spinning' : ''}`}
            onClick={handleRefresh}
            title="Refresh Data"
            aria-label="Refresh Data"
          >
            <FiRotateCw />
          </button>

          {/* 3. Rental Cart Button with Red Counter Badge */}
          <button 
            type="button"
            className="header-action-icon cart-btn"
            onClick={handleCartClick}
            title="Rental Cart"
            aria-label="Rental Cart"
          >
            <FiShoppingBag />
            <span className="cart-badge">0</span>
          </button>

          {/* 4. Theme Toggle Button */}
          <button 
            type="button"
            className="header-action-icon theme-btn" 
            onClick={toggleTheme} 
            title="Toggle Theme"
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <FiMoon /> : <FiSun />}
          </button>

          {/* 5. Store / User Profile Capsule with Dropdown */}
          <div className="profile-dropdown-container" ref={dropdownRef}>
            <button 
              type="button"
              className="user-profile-capsule"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-label="User menu"
            >
              <div className="profile-avatar">
                {user?.profile_pic ? (
                  <img src={user.profile_pic} alt="DP" />
                ) : (
                  <span>{avatarInitials}</span>
                )}
              </div>
              <span className="profile-display-name">{displayName}</span>
              <FiChevronDown className={`chevron-icon ${isDropdownOpen ? 'rotated' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="profile-dropdown-menu">
                <div className="dropdown-header">
                  <div className="dropdown-user-name">{user?.name || displayName}</div>
                  <div className="dropdown-role-pill">
                    {isSuperAdmin ? 'SUPER ADMIN' : (user?.role || 'STORE ADMIN')}
                  </div>
                  {!isSuperAdmin && user?.store?.name && (
                    <div className="dropdown-store-sub">Store: {user.store.name}</div>
                  )}
                </div>

                <div className="dropdown-divider" />

                <button 
                  type="button" 
                  className="dropdown-item"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate('/profile');
                  }}
                >
                  <FiUser className="item-icon" />
                  <span>Profile Settings</span>
                </button>

                {canReturnToSuperAdmin && (
                  <button 
                    type="button" 
                    className="dropdown-item return-item"
                    onClick={handleReturnToSuperAdmin}
                  >
                    <FiCornerUpLeft className="item-icon" />
                    <span>Return to Super Admin</span>
                  </button>
                )}

                <div className="dropdown-divider" />

                <button 
                  type="button" 
                  className="dropdown-item logout-item"
                  onClick={handleLogout}
                >
                  <FiLogOut className="item-icon" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Quick Search Product Modal */}
      <SearchProductModal 
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </>
  );
};

export default Header;
