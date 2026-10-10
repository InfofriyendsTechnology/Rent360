import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FiHome, FiBox, FiUsers, FiSettings, FiLogOut, FiTrash2, 
  FiCreditCard, FiShield, FiSearch, FiBell, FiLayers, FiCamera, FiHardDrive, FiCornerUpLeft
} from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { logout, updateUser, loginSuccess } from '../../store/authSlice';
import axios from 'axios';
import toast from 'react-hot-toast';
import ProfileUploadModal from '../ProfileUploadModal/ProfileUploadModal';
import './Sidebar.scss';

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const fileInputRef = useRef(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const superAdminToken = localStorage.getItem('superAdminToken');

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

  const handleProfileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result);
        setIsModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = null; // reset
  };

  const handleUploadCroppedImage = async (base64Image) => {
    try {
      const res = await axios.put(`http://localhost:61026/api/users/${user.id}`, 
        { profile_pic: base64Image },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Update Redux state with Cloudinary URL returned from backend
      if (res.data?.data?.profile_pic) {
        dispatch(updateUser({ profile_pic: res.data.data.profile_pic }));
        toast.success("Profile picture updated successfully!");
      }
    } catch (err) {
      console.error("Error updating profile pic:", err);
      toast.error("Failed to update profile picture");
    }
  };

  
  const handleRemoveProfilePic = async (e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to remove your profile picture?")) return;
    try {
      await axios.put(`http://localhost:61026/api/users/${user.id}`, 
        { profile_pic: null },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      dispatch(updateUser({ profile_pic: null }));
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <>
      <aside className="sidebar">
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-logo-card">
            <img src={sidebarLogo} alt="Rent360" />
          </div>
          <div className="brand-title-wrap">
            <span className="brand-name">Rent360</span>
            <span className="brand-sub">Platform</span>
          </div>
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
                  >
                    <span className="icon"><FiBox /></span>
                    <span className="text">Stores</span>
                  </NavLink>
                  <NavLink 
                    to="/plans" 
                    className={({ isActive }) => isActive ? 'menu-pill active' : 'menu-pill'}
                  >
                    <span className="icon"><FiLayers /></span>
                    <span className="text">Plans</span>
                  </NavLink>
                  <NavLink 
                    to="/subscriptions" 
                    className={({ isActive }) => isActive ? 'menu-pill active' : 'menu-pill'}
                  >
                    <span className="icon"><FiCreditCard /></span>
                    <span className="text">Subscriptions</span>
                  </NavLink>
                  <NavLink 
                    to="/staff" 
                    className={({ isActive }) => isActive ? 'menu-pill active' : 'menu-pill'}
                  >
                    <span className="icon"><FiUsers /></span>
                    <span className="text">Team Members</span>
                  </NavLink>
                  <NavLink 
                    to="/roles" 
                    className={({ isActive }) => isActive ? 'menu-pill active' : 'menu-pill'}
                  >
                    <span className="icon"><FiShield /></span>
                    <span className="text">Roles</span>
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink 
                    to="/inventory" 
                    className={({ isActive }) => isActive ? 'menu-pill active' : 'menu-pill'}
                  >
                    <span className="icon"><FiBox /></span>
                    <span className="text">Inventory</span>
                  </NavLink>
                  <NavLink 
                    to="/customers" 
                    className={({ isActive }) => isActive ? 'menu-pill active' : 'menu-pill'}
                  >
                    <span className="icon"><FiUsers /></span>
                    <span className="text">Customers</span>
                  </NavLink>
                  {(user?.role === 'STORE_ADMIN' || (user?.permissions || []).includes('ALL') || (user?.permissions || []).includes('SETTINGS_MANAGE')) && (
                    <>
                      <NavLink 
                        to="/staff" 
                        className={({ isActive }) => isActive ? 'menu-pill active' : 'menu-pill'}
                      >
                        <span className="icon"><FiUsers /></span>
                        <span className="text">Team Members</span>
                      </NavLink>
                      <NavLink 
                        to="/roles" 
                        className={({ isActive }) => isActive ? 'menu-pill active' : 'menu-pill'}
                      >
                        <span className="icon"><FiShield /></span>
                        <span className="text">Roles</span>
                      </NavLink>
                    </>
                  )}
                </>
              )}
            </nav>
          </div>

          <div className="menu-group">
            <span className="group-title">SETTINGS</span>
            <nav>
              <NavLink 
                to="/settings" 
                className={({ isActive }) => isActive ? 'menu-pill active' : 'menu-pill'}
              >
                <span className="icon"><FiSettings /></span>
                <span className="text">Settings</span>
              </NavLink>
            </nav>
          </div>
        </div>

        {/* Footer Profile Card */}
        <div className="sidebar-footer">
          {superAdminToken && (
            <button 
              className="return-admin-btn" 
              onClick={handleReturnToSuperAdmin}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 14px', marginBottom: '12px', background: '#2563eb', color: '#fff', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
            >
              <FiCornerUpLeft />
              Return to Super Admin
            </button>
          )}
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleFileChange} 
          />
          <div className="user-profile-card">
            <div className="profile-avatar" onClick={handleProfileClick} style={{ cursor: 'pointer', overflow: 'hidden', position: 'relative' }} title="Change Profile Picture">
              {user?.profile_pic ? (
                <img src={user.profile_pic} alt="DP" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'
              )}
              {user?.profile_pic && (
                <button 
                  onClick={handleRemoveProfilePic} 
                  title="Remove Picture" 
                  style={{ 
                    position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, 
                    background: 'rgba(239,68,68,0.8)', color: 'white', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: 'none', opacity: 0, transition: 'opacity 0.2s',
                    width: '100%', height: '100%'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                >
                  <FiTrash2 size={16} />
                </button>
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
      
      <ProfileUploadModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        imageSrc={selectedImage} 
        onUpload={handleUploadCroppedImage} 
      />
    </>
  );
};

export default Sidebar;
