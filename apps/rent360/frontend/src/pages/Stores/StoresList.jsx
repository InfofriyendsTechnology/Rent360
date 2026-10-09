import React, { useState, useEffect } from 'react';
import { 
  FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiKey, 
  FiEye, FiEyeOff, FiMapPin, FiPhone, FiMail, FiLogIn,
  FiImage, FiUploadCloud
} from 'react-icons/fi';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { loginSuccess } from '../../store/authSlice';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { DataTable, AvatarCell, StatusPill, RowActions } from '../../components/ui';
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
  const [storeToDelete, setStoreToDelete] = useState(null);

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
      window.location.href = '/';
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
      setPlans(res.data.data || DEFAULT_PLANS_FALLBACK);
    } catch (error) {
      console.error('Error fetching plans, using fallback:', error);
      setPlans(DEFAULT_PLANS_FALLBACK);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData({ ...formData, logo_url: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    setEditingStoreId(null);
    setFormData({
      name: '', owner_name: '', mobile: '', email: '',
      address: '', city: '', state: '', pincode: '',
      gst_number: '', logo_url: '', password: ''
    });
    setShowFormPassword(false);
    setIsModalOpen(true);
  };

  const handleEdit = (store) => {
    setEditingStoreId(store.id);
    setEditingStoreHasPassword(store.hasPassword || false);
    setFormData({
      name: store.name,
      owner_name: store.owner_name || '',
      mobile: store.mobile || '',
      email: store.email || '',
      address: store.address || '',
      city: store.city || '',
      state: store.state || '',
      pincode: store.pincode || '',
      gst_number: store.gst_number || '',
      logo_url: store.logo_url || '',
      password: '' // empty so we only update if provided
    });
    setShowFormPassword(false);
    setIsModalOpen(true);
  };

  const executeDelete = async () => {
    if (!storeToDelete) return;
    try {
      await axios.delete(`http://localhost:61026/api/stores/${storeToDelete}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Company deleted successfully!');
      fetchStores();
    } catch (error) {
      console.error('Error deleting store:', error);
      toast.error('Failed to delete store.');
    } finally {
      setStoreToDelete(null);
    }
  };

  // Submit Company Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStoreId) {
        // Build payload dynamically (only include password if typed)
        const payload = { ...formData };
        if (!payload.password) {
          delete payload.password;
        }
        await axios.put(`http://localhost:61026/api/stores/${editingStoreId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Company updated successfully!');
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
      toast.error(error.response?.data?.message || 'Failed to save store');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'CO';
    const parts = name.split(' ');
    if (parts.length >= 2) {
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

      {/* Main Table Card using common UI component */}
      <div className="bond-card-container">
        <DataTable 
          columns={[
            { label: 'Company / Store' },
            { label: 'Owner Name' },
            { label: 'Contact Mobile' },
            { label: 'City & Location' },
            { label: 'GST Number' },
            { label: 'Status' },
            { label: 'Actions', align: 'right' }
          ]}
          data={loading ? [] : stores}
          emptyMessage={loading ? "Loading companies..." : "No companies found. Click + Add Company to register one!"}
          keyExtractor={(store) => store.id}
          renderRow={(store) => (
            <>
              <td>
                <AvatarCell 
                  src={store.logo_url}
                  title={store.name}
                  subtitle={store.email}
                  fallbackChars={getInitials(store.name)}
                />
              </td>
              <td><span className="owner-text">{store.owner_name}</span></td>
              <td><span className="phone-text">{store.mobile}</span></td>
              <td>
                <span className="location-text">
                  {store.city ? `${store.city}, ${store.state || 'Gujarat'}` : (store.address || '—')}
                </span>
              </td>
              <td><span className="gst-text">{store.gst_number || 'Unregistered'}</span></td>
              <td><StatusPill status={store.subscription_status || 'ACTIVE'} /></td>
              <td className="text-right">
                <RowActions 
                  actions={[
                    { icon: FiLogIn, variant: 'login', title: 'Login as Store', onClick: () => handleLoginAsStore(store.id) },
                    { icon: FiEdit2, variant: 'edit', title: 'Edit Company', onClick: () => handleEdit(store) },
                    { icon: FiTrash2, variant: 'delete', title: 'Delete Company', onClick: () => setStoreToDelete(store.id) }
                  ]}
                />
              </td>
            </>
          )}
        />
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
                {/* Premium Sleek Logo Upload */}
                <div className="form-field sleek-logo-field">
                  <label>Company Logo</label>
                  <div className="sleek-logo-upload">
                    <label className="logo-upload-circle" title="Upload Company Logo">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleLogoUpload} 
                        style={{ display: "none" }}
                      />
                      {formData.logo_url ? (
                        <img src={formData.logo_url} alt="Company Logo" />
                      ) : (
                        <div className="empty-state">
                          <FiImage />
                        </div>
                      )}
                      <div className="hover-overlay">
                        <FiUploadCloud />
                      </div>
                    </label>
                    
                    {formData.logo_url && (
                      <button 
                        type="button" 
                        className="remove-logo-btn" 
                        onClick={() => setFormData({...formData, logo_url: ''})}
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>
                </div>

                {/* Row 1: Company & Owner Name */}
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Company / Store Name *</label>
                    <input 
                      type="text" 
                      name="name" 
                      placeholder="e.g. Rentopus HQ" 
                      value={formData.name} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                  <div className="form-field">
                    <label>Owner Full Name *</label>
                    <input 
                      type="text" 
                      name="owner_name" 
                      placeholder="e.g. Harsh Savaliya" 
                      value={formData.owner_name} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                </div>

                {/* Row 2: Mobile & Email */}
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Contact Mobile * (Used for Login)</label>
                    <input 
                      type="text" 
                      name="mobile" 
                      placeholder="10-digit number" 
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
                          ? (editingStoreHasPassword ? '••••••••' : 'Set new password')
                          : 'Set access PIN or password'} 
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

      <ConfirmModal 
        isOpen={!!storeToDelete}
        title="Delete Company"
        message="Are you sure you want to delete this company store? This action cannot be undone."
        confirmText="Delete"
        onConfirm={executeDelete}
        onCancel={() => setStoreToDelete(null)}
        isDestructive={true}
      />
    </div>
  );
};

export default StoresList;






