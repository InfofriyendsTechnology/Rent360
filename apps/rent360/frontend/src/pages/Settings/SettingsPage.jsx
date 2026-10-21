import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  FiSettings, FiSliders, FiSun, FiMoon, 
  FiCheck, FiArrowRight,
  FiLayers, FiMaximize2, FiDroplet, FiClock, FiShield,
  FiBox, FiCreditCard, FiHardDrive
} from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';

import '../Stores/StoresList.scss';
import './SettingsPage.scss';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || !user?.role;
  const userStoreId = isSuperAdmin ? '' : (user?.store?.id || user?.storeId || '');

  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(userStoreId);

  // Store profile form state (for Store Admin)
  const [storeData, setStoreData] = useState({
    name: '',
    owner_name: '',
    mobile: '',
    email: '',
    address: '',
    city: '',
    gst_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Theme preference
  const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('theme') || 'light');

  // Fetch store count / list for Super Admin
  useEffect(() => {
    if (isSuperAdmin && token) {
      axios
        .get(`${API_BASE_URL}/api/stores`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => {
          setStores(res.data.data || []);
        })
        .catch(() => {});
    } else if (userStoreId) {
      setSelectedStoreId(userStoreId);
    }
  }, [isSuperAdmin, userStoreId, token]);

  // Fetch active store details ONLY for Store Admin
  const fetchStoreDetails = async () => {
    if (isSuperAdmin || !selectedStoreId || !token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/stores/${selectedStoreId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const st = res.data.data;
      if (st) {
        setStoreData({
          name: st.name || '',
          owner_name: st.owner_name || '',
          mobile: st.mobile || '',
          email: st.email || '',
          address: st.address || '',
          city: st.city || '',
          gst_number: st.gst_number || ''
        });
      }
    } catch (err) {
      if (user?.store) {
        setStoreData({
          name: user.store.name || '',
          owner_name: user.store.owner_name || user.name || '',
          mobile: user.store.mobile || user.mobile || '',
          email: user.store.email || '',
          address: user.store.address || '',
          city: user.store.city || '',
          gst_number: user.store.gst_number || ''
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSuperAdmin) {
      fetchStoreDetails();
    }
  }, [isSuperAdmin, selectedStoreId, token]);

  // Handle Theme Toggle
  const handleThemeToggle = (theme) => {
    setCurrentTheme(theme);
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    window.dispatchEvent(new Event('themeChanged'));
    toast.success(`Theme switched to ${theme} mode`);
  };

  // Save Store Details (Store Admin only)
  const handleSaveStore = async (e) => {
    e.preventDefault();
    if (isSuperAdmin || !selectedStoreId) return;

    setIsSaving(true);
    try {
      await axios.put(
        `${API_BASE_URL}/api/stores/${selectedStoreId}`,
        storeData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Store settings saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="stores-view simple-settings-view">
      <div className="stores-top-bar">
        <div className="title-section">
          <h1 className="main-title">System Settings</h1>
          <p className="subtitle">
            {isSuperAdmin
              ? 'Manage platform administration, theme appearance, and global preferences'
              : 'Manage your store business profile, contact details, and appearance preferences'}
          </p>
        </div>
      </div>

      <div className="settings-grid-layout">
        {/* Left Column */}
        {isSuperAdmin ? (
          <div className="settings-card business-card">
            <div className="card-header">
              <div className="icon-wrap accent">
                <FiShield />
              </div>
              <div>
                <h3>Platform Administrator Profile</h3>
                <p>Rent360 platform owner credentials and global authority</p>
              </div>
            </div>

            <div className="superadmin-profile-view">
              <div className="profile-field-row">
                <span className="field-label">Platform Architecture</span>
                <span className="field-val">Rent360 Multi-Tenant Cloud</span>
              </div>
              <div className="profile-field-row">
                <span className="field-label">Administrator Name</span>
                <span className="field-val">{user?.name || 'Super Admin'}</span>
              </div>
              <div className="profile-field-row">
                <span className="field-label">Registered Mobile</span>
                <span className="field-val">{user?.mobile || 'Primary System Administrator'}</span>
              </div>
              <div className="profile-field-row">
                <span className="field-label">Administrative Email</span>
                <span className="field-val">{user?.email || 'admin@rent360.com'}</span>
              </div>
              <div className="profile-field-row">
                <span className="field-label">Access Level</span>
                <span className="field-val role-pill">SUPER ADMIN (Global Authority)</span>
              </div>
              <div className="profile-field-row">
                <span className="field-label">Registered Tenant Stores</span>
                <span className="field-val">{stores.length} Active Stores</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="settings-card business-card">
            <div className="card-header">
              <div className="icon-wrap">
                <FiSettings />
              </div>
              <div>
                <h3>Store Information</h3>
                <p>Primary business identity and store contact info</p>
              </div>
            </div>

            <form onSubmit={handleSaveStore} className="card-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Store / Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Wedding Collection"
                    value={storeData.name}
                    onChange={(e) => setStoreData({ ...storeData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Owner / Manager Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Kumar"
                    value={storeData.owner_name}
                    onChange={(e) => setStoreData({ ...storeData, owner_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Contact Mobile *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9876543210"
                    value={storeData.mobile}
                    onChange={(e) => setStoreData({ ...storeData, mobile: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Business Email</label>
                  <input
                    type="email"
                    placeholder="contact@store.com"
                    value={storeData.email}
                    onChange={(e) => setStoreData({ ...storeData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    placeholder="e.g. Ahmedabad"
                    value={storeData.city}
                    onChange={(e) => setStoreData({ ...storeData, city: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>GST Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 24AAAAA0000A1Z5"
                    value={storeData.gst_number}
                    onChange={(e) => setStoreData({ ...storeData, gst_number: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Store Address</label>
                <textarea
                  rows={2}
                  placeholder="Full store street address..."
                  value={storeData.address}
                  onChange={(e) => setStoreData({ ...storeData, address: e.target.value })}
                />
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="save-btn"
                  disabled={isSaving || loading}
                >
                  <FiCheck />
                  <span>{isSaving ? 'Saving...' : 'Save Store Details'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Right Column */}
        <div className="settings-side-column">
          {/* Appearance & Preferences */}
          <div className="settings-card appearance-card">
            <div className="card-header">
              <div className="icon-wrap">
                <FiSun />
              </div>
              <div>
                <h3>Appearance & Regional</h3>
                <p>Theme display and regional currency</p>
              </div>
            </div>

            <div className="preference-item">
              <div className="pref-info">
                <span className="pref-title">Theme Mode</span>
                <span className="pref-desc">Switch between light warm oat and dark mode</span>
              </div>
              <div className="theme-toggle-group">
                <button
                  type="button"
                  className={`theme-pill ${currentTheme === 'light' ? 'active' : ''}`}
                  onClick={() => handleThemeToggle('light')}
                >
                  <FiSun />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  className={`theme-pill ${currentTheme === 'dark' ? 'active' : ''}`}
                  onClick={() => handleThemeToggle('dark')}
                >
                  <FiMoon />
                  <span>Dark</span>
                </button>
              </div>
            </div>

            <div className="preference-item">
              <div className="pref-info">
                <span className="pref-title">Operating Currency</span>
                <span className="pref-desc">Indian Rupee (INR ₹)</span>
              </div>
              <span className="static-badge">₹ INR</span>
            </div>

            <div className="preference-item">
              <div className="pref-info">
                <span className="pref-title">Timezone</span>
                <span className="pref-desc">India Standard Time (IST)</span>
              </div>
              <span className="static-badge">UTC+05:30</span>
            </div>
          </div>

          {/* Quick Shortcuts: Platform modules for Super Admin, Store Setup for Store Admin */}
          {isSuperAdmin ? (
            <div className="settings-card shortcut-setup-card">
              <div className="card-header">
                <div className="icon-wrap accent">
                  <FiShield />
                </div>
                <div>
                  <h3>Platform Management</h3>
                  <p>Global multi-tenant stores and billing infrastructure</p>
                </div>
              </div>

              <p className="shortcut-note">
                Tenant stores, subscription billing tiers, and bucket media assets are managed directly via <strong>Platform Management</strong>.
              </p>

              <div className="shortcut-pills-list">
                <button type="button" onClick={() => navigate('/stores')} className="setup-link-pill">
                  <FiBox />
                  <span>Stores</span>
                  <FiArrowRight className="arrow" />
                </button>

                <button type="button" onClick={() => navigate('/plans')} className="setup-link-pill">
                  <FiLayers />
                  <span>Plans</span>
                  <FiArrowRight className="arrow" />
                </button>

                <button type="button" onClick={() => navigate('/subscriptions')} className="setup-link-pill">
                  <FiCreditCard />
                  <span>Subscriptions</span>
                  <FiArrowRight className="arrow" />
                </button>

                <button type="button" onClick={() => navigate('/bucket')} className="setup-link-pill">
                  <FiHardDrive />
                  <span>Bucket Storage</span>
                  <FiArrowRight className="arrow" />
                </button>
              </div>
            </div>
          ) : (
            <div className="settings-card shortcut-setup-card">
              <div className="card-header">
                <div className="icon-wrap accent">
                  <FiSliders />
                </div>
                <div>
                  <h3>Store Setup Master</h3>
                  <p>Manage sizes, colors, categories, slots, and accounts</p>
                </div>
              </div>

              <p className="shortcut-note">
                Garment sizes, colors, time slots, reminder alerts, and financial accounts are managed directly inside the <strong>Store Setup</strong> menu.
              </p>

              <div className="shortcut-pills-list">
                <button type="button" onClick={() => navigate('/sizes')} className="setup-link-pill">
                  <FiMaximize2 />
                  <span>Sizes</span>
                  <FiArrowRight className="arrow" />
                </button>

                <button type="button" onClick={() => navigate('/colors')} className="setup-link-pill">
                  <FiDroplet />
                  <span>Colors</span>
                  <FiArrowRight className="arrow" />
                </button>

                <button type="button" onClick={() => navigate('/categories')} className="setup-link-pill">
                  <FiLayers />
                  <span>Categories</span>
                  <FiArrowRight className="arrow" />
                </button>

                <button type="button" onClick={() => navigate('/time-slots')} className="setup-link-pill">
                  <FiClock />
                  <span>Time Slots</span>
                  <FiArrowRight className="arrow" />
                </button>

                <button type="button" onClick={() => navigate('/accounts')} className="setup-link-pill">
                  <FiShield />
                  <span>Accounts</span>
                  <FiArrowRight className="arrow" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
