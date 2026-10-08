import React, { useState, useEffect } from 'react';
import { 
  FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiKey, 
  FiEye, FiEyeOff, FiMapPin, FiPhone, FiMail, FiLogIn
} from 'react-icons/fi';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { loginSuccess } from '../../store/authSlice';
import toast from 'react-hot-toast';
import './StoresList.scss';

const DEFAULT_PLANS_FALLBACK = [
  { id: 'starter', name: 'STARTER', price_per_month: 799, price_per_year: 7999, max_staff: 2 },
  { id: 'growth', name: 'GROWTH', price_per_month: 999, price_per_year: 9999, max_staff: 10 },
  { id: 'pro', name: 'PRO', price_per_month: 1499, price_per_year: 14999, max_staff: 0 }
];

const StoresList = () => {
  const { token, user } = useSelector((state) => state.auth);
  const [stores, setStores] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState(null);

  // Dedicated Password Modal
  const [passwordModalStore, setPasswordModalStore] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Store/Company Form State
  const [formData, setFormData] = useState({
    name: '',
    owner_name: '',
    mobile: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gst_number: '',
    logo_url: '',
    password: ''
  });
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [editingStoreHasPassword, setEditingStoreHasPassword] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    fetchStores();
    fetchPlans();
  }, []);

  const handleLoginAsStore = async (storeId) => {
    try {
      const res = await axios.post(`http://localhost:61026/api/stores/${storeId}/login-as`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Save Super Admin session before switching
      localStorage.setItem('superAdminToken', token);
      localStorage.setItem('superAdminUser', JSON.stringify(user));
      
      toast.success('Logged in successfully!');
      dispatch(loginSuccess(res.data.data));
    } catch (error) {
      console.error('Error logging in as store:', error);
      toast.error(error.response?.data?.message || 'Failed to login as store');
    }
  };

  const fetchStores = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:61026/api/stores', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStores(res.data.data || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
      toast.error('Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await axios.get('http://localhost:61026/api/plans', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.data && res.data.data.length > 0) {
        setPlans(res.data.data);
      } else {
        setPlans(DEFAULT_PLANS_FALLBACK);
      }
    } catch (error) {
      console.warn('Could not fetch plans:', error);
      setPlans(DEFAULT_PLANS_FALLBACK);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const webpDataUrl = canvas.toDataURL('image/webp', 0.8);
        setFormData((prev) => ({ ...prev, logo_url: webpDataUrl }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const openAddModal = () => {
    setEditingStoreId(null);
    setEditingStoreHasPassword(false);
    setFormData({ 
      name: '',
      owner_name: '',
      mobile: '',
      email: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      gst_number: '',
      logo_url: '',
      password: ''
    });
    setShowFormPassword(false);
    setIsModalOpen(true);
  };

  const handleEdit = (store) => {
    setEditingStoreId(store.id);
    setEditingStoreHasPassword(Boolean(store.hasPassword));
    setFormData({
      name: store.name || '',
      owner_name: store.owner_name || '',
      mobile: store.mobile || '',
      email: store.email || '',
      address: store.address || '',
      city: store.city || '',
      state: store.state || '',
      pincode: store.pincode || '',
      gst_number: store.gst_number || '',
      logo_url: store.logo_url || '',
      password: store.adminPassword || ''
    });
    setShowFormPassword(false);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this company store?')) return;
    try {
      await axios.delete(`http://localhost:61026/api/stores/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Company deleted successfully!');
      fetchStores();
    } catch (error) {
      console.error('Error deleting store:', error);
      toast.error('Failed to delete store.');
    }
  };

  // Submit Company Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStoreId) {
        await axios.put(`http://localhost:61026/api/stores/${editingStoreId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(
          formData.password 
            ? 'Company & password updated successfully!' 
            : 'Company updated successfully!'
        );
      } else {
        await axios.post('http://localhost:61026/api/stores', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Company registered successfully!');
      }
      setIsModalOpen(false);
      fetchStores();
    } catch (error) {
      console.error('Error saving store:', error);
      toast.error(error.response?.data?.message || 'Failed to save store.');
    }
  };

  // Dedicated Password Setting Handler
  const openPasswordModal = (store) => {
    setPasswordModalStore(store);
    setNewPassword(store.adminPassword || '');
    setShowPassword(false);
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!passwordModalStore) return;
    if (newPassword.trim().length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    try {
      setSavingPassword(true);
      await axios.put(
        `http://localhost:61026/api/stores/${passwordModalStore.id}/password`,
        { password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(
        passwordModalStore.hasPassword 
          ? 'Password updated successfully!' 
          : 'Password set successfully!'
      );
      setPasswordModalStore(null);
      fetchStores();
    } catch (error) {
      console.error('Error setting password:', error);
      toast.error(error.response?.data?.message || 'Failed to set password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'ST';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="stores-view">
      {/* Top Bar matching Minimalist Header */}
      <div className="stores-top-bar">
        <div className="title-section">
          <h1 className="main-title">Company Stores</h1>
          <p className="subtitle">
            {stores.length} registered business tenants • Plan licensing, profile management & access controls
          </p>
        </div>

        <div className="top-actions">
          <div className="pill-filter">
            <span className="dot" />
            <span>All Companies ({stores.length})</span>
          </div>

          <button className="pill-btn-primary" onClick={openAddModal}>
            <FiPlus className="plus-icon" />
            <span>Add Company</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bond-card-container">
        <div className="table-responsive">
          <table className="bond-table">
            <thead>
              <tr>
                <th>Company / Store</th>
                <th>Owner Name</th>
                <th>Contact Mobile</th>
                <th>City &amp; Location</th>
                <th>GST Number</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center state-message">
                    Loading companies...
                  </td>
                </tr>
              ) : stores.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center state-message">
                    No companies found. Click <strong>+ Add Company</strong> to register one!
                  </td>
                </tr>
              ) : (
                stores.map((store) => {
                  return (
                    <tr key={store.id}>
                      <td>
                        <div className="store-identity">
                          {store.logo_url ? (
                            <img src={store.logo_url} alt="Logo" className="avatar-image" />
                          ) : (
                            <div className="avatar-initials">
                              {getInitials(store.name)}
                            </div>
                          )}
                          <div className="store-text">
                            <span className="store-name">{store.name}</span>
                            {store.email && (
                              <span className="store-sub">{store.email}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="owner-text">{store.owner_name}</span>
                      </td>
                      <td>
                        <span className="phone-text">{store.mobile}</span>
                      </td>
                      <td>
                        <span className="location-text">
                          {store.city ? `${store.city}, ${store.state || 'Gujarat'}` : (store.address || '—')}
                        </span>
                      </td>
                      <td>
                        <span className="gst-text">
                          {store.gst_number || 'Unregistered'}
                        </span>
                      </td>
                      <td>
                        <span className={`bond-status-pill ${(store.subscription_status || 'ACTIVE').toLowerCase()}`}>
                          <span className="status-indicator" />
                          {store.subscription_status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="row-action-btns">
                          {/* Login as Store */}
                          <button 
                            className="icon-action-btn edit" 
                            title="Login as Store" 
                            onClick={() => handleLoginAsStore(store.id)}
                            style={{ color: '#2563eb', background: '#eff6ff' }}
                          >
                            <FiLogIn />
                          </button>

                          {/* Edit Company Profile */}
                          <button 
                            className="icon-action-btn edit" 
                            title="Edit Company" 
                            onClick={() => handleEdit(store)}
                          >
                            <FiEdit2 />
                          </button>
                          
                          {/* Dedicated Password Setup Option */}
                          <button 
                            className="icon-action-btn password" 
                            title={store.hasPassword ? 'Change Password' : 'Set Password'} 
                            onClick={() => openPasswordModal(store)}
                          >
                            <FiKey />
                          </button>

                          {/* Delete Company */}
                          <button 
                            className="icon-action-btn delete" 
                            title="Delete Company" 
                            onClick={() => handleDelete(store.id)}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT STORE MODAL */}
      {isModalOpen && (
        <div className="bond-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="bond-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{editingStoreId ? 'Edit Company Profile' : 'Add New Company'}</h2>
                <p>Configure factual business details & tenant identity</p>
              </div>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Logo Upload */}
                <div className="form-field logo-upload-field">
                  <label>Company Logo (Auto-compressed to WebP)</label>
                  <div className="logo-preview-wrap">
                    {formData.logo_url ? (
                      <img src={formData.logo_url} alt="Preview" className="logo-preview-img" />
                    ) : (
                      <div className="logo-placeholder">No Logo</div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleLogoUpload} 
                    />
                  </div>
                </div>

                {/* Row 1: Store & Owner */}
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Store Name *</label>
                    <input 
                      type="text" 
                      name="name" 
                      placeholder="e.g. Royal Bridal Studio" 
                      value={formData.name} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                  <div className="form-field">
                    <label>Owner Name *</label>
                    <input 
                      type="text" 
                      name="owner_name" 
                      placeholder="e.g. Rajesh Patel" 
                      value={formData.owner_name} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                </div>

                {/* Row 2: Mobile & Email */}
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Mobile Number *</label>
                    <input 
                      type="text" 
                      name="mobile" 
                      placeholder="10-digit mobile" 
                      value={formData.mobile} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                  <div className="form-field">
                    <label>Email Address</label>
                    <input 
                      type="email" 
                      name="email" 
                      placeholder="contact@store.com" 
                      value={formData.email} 
                      onChange={handleChange} 
                    />
                  </div>
                </div>

                {/* Row 3: Address & City */}
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Store Address</label>
                    <input 
                      type="text" 
                      name="address" 
                      placeholder="Shop No, Complex, Street area..." 
                      value={formData.address} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="form-field">
                    <label>City</label>
                    <input 
                      type="text" 
                      name="city" 
                      placeholder="e.g. Surat" 
                      value={formData.city} 
                      onChange={handleChange} 
                    />
                  </div>
                </div>

                {/* Row 4: State & Pincode */}
                <div className="form-row-2">
                  <div className="form-field">
                    <label>State</label>
                    <input 
                      type="text" 
                      name="state" 
                      placeholder="e.g. Gujarat" 
                      value={formData.state} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="form-field">
                    <label>Pincode</label>
                    <input 
                      type="text" 
                      name="pincode" 
                      placeholder="395006" 
                      value={formData.pincode} 
                      onChange={handleChange} 
                    />
                  </div>
                </div>

                {/* Row 5: GST Number & Password */}
                <div className="form-row-2">
                  <div className="form-field">
                    <label>GST Number</label>
                    <input 
                      type="text" 
                      name="gst_number" 
                      placeholder="24AAAAA0000A1Z5" 
                      value={formData.gst_number} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="form-field password-integrated-field">
                    <label>
                      {editingStoreId 
                        ? (editingStoreHasPassword ? 'Change Password' : 'Set Password')
                        : 'Set Password *'}
                    </label>
                    <div className="password-box">
                      <input 
                        type={showFormPassword ? 'text' : 'password'} 
                        name="password" 
                        placeholder={editingStoreId 
                          ? (editingStoreHasPassword ? 'Enter new password to update' : 'Set new password')
                          : 'Set access password (min 6 chars)'} 
                        value={formData.password} 
                        onChange={handleChange} 
                        required={!editingStoreId}
                      />
                      <button 
                        type="button" 
                        className="eye-btn" 
                        onClick={() => setShowFormPassword(!showFormPassword)}
                      >
                        {showFormPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="pill-btn-secondary" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="pill-btn-primary">
                  {editingStoreId ? 'Save Changes' : 'Register Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated Separate "Set / Change Password" Option Modal */}
      {passwordModalStore && (
        <div className="bond-modal-overlay" onClick={() => setPasswordModalStore(null)}>
          <div className="bond-modal-card password-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{passwordModalStore.hasPassword ? 'Change Password' : 'Set Password'}</h2>
                <p>
                  {passwordModalStore.hasPassword 
                    ? `Change access credentials for ${passwordModalStore.name}`
                    : `Set access credentials for ${passwordModalStore.name}`}
                </p>
              </div>
              <button className="modal-close" onClick={() => setPasswordModalStore(null)}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSavePassword}>
              <div className="modal-body">
                <div className="company-access-banner">
                  <div className="access-item">
                    <span className="access-label">Company:</span>
                    <span className="access-val">{passwordModalStore.name}</span>
                  </div>
                  <div className="access-item">
                    <span className="access-label">Login Mobile:</span>
                    <span className="access-val code">{passwordModalStore.mobile}</span>
                  </div>
                </div>

                <div className="form-field" style={{ marginTop: '16px' }}>
                  <label>
                    {passwordModalStore.hasPassword ? 'Change Password *' : 'Set Password *'}
                  </label>
                  <div className="password-box">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder={passwordModalStore.hasPassword ? 'Enter new password (min 6 chars)' : 'Set password (min 6 chars)'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button 
                      type="button" 
                      className="eye-btn" 
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="pill-btn-secondary" 
                  onClick={() => setPasswordModalStore(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="pill-btn-primary" disabled={savingPassword}>
                  {savingPassword 
                    ? (passwordModalStore.hasPassword ? 'Updating...' : 'Setting...') 
                    : (passwordModalStore.hasPassword ? 'Change Password' : 'Set Password')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoresList;
