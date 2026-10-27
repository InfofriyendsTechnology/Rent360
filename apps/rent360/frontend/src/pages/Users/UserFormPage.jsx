import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FiArrowLeft, FiCamera, FiTrash2, FiEye, FiEyeOff, 
  FiShoppingBag, FiInfo, FiRefreshCw, FiChevronDown, FiPlus 
} from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import { convertToWebP } from '../../utils/imageOptimizer';
import './UserFormPage.scss';

const INDIAN_STATES = [
  'Gujarat', 'Maharashtra', 'Rajasthan', 'Madhya Pradesh', 
  'Delhi', 'Goa', 'Karnataka', 'Punjab', 'Uttar Pradesh', 'West Bengal'
];

const GUJARAT_CITIES = [
  'Surat', 'Ahmedabad', 'Vadodara', 'Rajkot', 'Bhavnagar', 
  'Jamnagar', 'Gandhinagar', 'Junagadh', 'Anand', 'Navsari', 
  'Bharuch', 'Vapi', 'Valsad', 'Mehsana', 'Morbi', 'Bhuj',
  'Mumbai', 'Pune', 'Jaipur', 'Indore', 'Delhi'
];

const UserFormPage = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const { user, token } = useSelector((state) => state.auth);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || !user?.role;
  const userStoreId = isSuperAdmin ? '' : (user?.store?.id || user?.storeId || '');

  // Stores for Super Admin
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(() => {
    return isSuperAdmin 
      ? (localStorage.getItem('rent360_active_store_id') || '') 
      : userStoreId;
  });

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [optimizingAvatar, setOptimizingAvatar] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Quick Role Creation Modal
  const [isQuickRoleModalOpen, setIsQuickRoleModalOpen] = useState(false);
  const [quickRoleName, setQuickRoleName] = useState('');
  const [isSavingQuickRole, setIsSavingQuickRole] = useState(false);

  // Form Fields matching competitor screenshot + role
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    contact_no_2: '',
    email: '',
    username: '',
    password: '',
    roleId: '',
    address: '',
    state: 'Gujarat',
    city: 'Surat',
    remarks: '',
    status: 'ACTIVE'
  });

  const [avatarImage, setAvatarImage] = useState(null);
  const fileInputRef = useRef(null);
  const originalStateRef = useRef(null);

  // Active Store Info
  const activeStore = isSuperAdmin
    ? (stores.find(s => s.id === selectedStoreId) || null)
    : (user?.store || null);

  const activeShopName = activeStore?.name || (isSuperAdmin ? 'Rent360 HQ Store' : 'Virasat THE FASHION STUDIO');

  // Fetch stores if Super Admin
  useEffect(() => {
    if (isSuperAdmin && token) {
      axios
        .get(`${API_BASE_URL}/api/stores`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          const list = res.data.data || [];
          setStores(list);
          if (list.length > 0 && !selectedStoreId) {
            setSelectedStoreId(list[0].id);
          }
        })
        .catch(() => {});
    }
  }, [isSuperAdmin, token]);

  // Fetch Roles for current store
  const fetchRoles = async () => {
    try {
      const rolesUrl = selectedStoreId
        ? `${API_BASE_URL}/api/roles?storeId=${selectedStoreId}`
        : `${API_BASE_URL}/api/roles`;
      const res = await axios.get(rolesUrl, { headers: { Authorization: `Bearer ${token}` } });
      const staffRoles = (res.data.data || []).filter(
        r => r.name !== 'STORE_ADMIN' && r.name !== 'SUPER_ADMIN'
      );
      setRoles(staffRoles);

      // If creating new and no role selected yet, default to first available staff role
      if (!isEditing && staffRoles.length > 0 && !formData.roleId) {
        setFormData(prev => ({ ...prev, roleId: staffRoles[0].id }));
      }
    } catch (err) {
      console.error('Failed to load roles', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchRoles();
    }
  }, [selectedStoreId, token]);

  // Fetch existing user data on Edit
  useEffect(() => {
    if (isEditing && id && token) {
      setLoading(true);
      axios
        .get(`${API_BASE_URL}/api/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => {
          const u = res.data.data;
          if (u) {
            const initialForm = {
              name: u.name || '',
              mobile: u.mobile || '',
              contact_no_2: u.contact_no_2 || '',
              email: u.email || '',
              username: u.username || '',
              password: '', // Keep blank on edit
              roleId: u.roleId || '',
              address: u.address || '',
              state: u.state || 'Gujarat',
              city: u.city || 'Surat',
              remarks: u.remarks || '',
              status: u.status || 'ACTIVE'
            };
            setFormData(initialForm);
            setAvatarImage(u.profile_pic || null);
            if (u.storeId && isSuperAdmin) {
              setSelectedStoreId(u.storeId);
            }
            originalStateRef.current = {
              form: initialForm,
              avatar: u.profile_pic || null
            };
          }
        })
        .catch((err) => {
          toast.error(err.response?.data?.message || 'Failed to load user details');
          navigate('/users');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id, isEditing, token]);

  // Handle standard input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      // Auto-suggest username if creating and user types Full Name
      if (!isEditing && name === 'name' && !prev.username) {
        const storeSlug = (activeStore?.username || activeShopName || 'store')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        const nameSlug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '')
          .slice(0, 10);
        if (nameSlug) {
          updated.username = `${storeSlug}-${nameSlug}`;
        }
      }

      return updated;
    });

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Avatar Selection and WebP optimization
  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    try {
      setOptimizingAvatar(true);
      const optimized = await convertToWebP(file, { maxWidth: 500, maxHeight: 500, quality: 0.85 });
      setAvatarImage(optimized.dataUrl);
      toast.success('Avatar ready');
    } catch (err) {
      toast.error('Failed to process image');
    } finally {
      setOptimizingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = (e) => {
    e.stopPropagation();
    setAvatarImage(null);
  };

  // Form Validation
  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full Name is required';
    if (!formData.mobile.trim()) {
      errs.mobile = 'Contact No.1 is required';
    } else if (!/^\d{10}$/.test(formData.mobile.trim())) {
      errs.mobile = 'Enter a valid 10-digit mobile number';
    }

    if (!formData.username.trim()) errs.username = 'Username is required';
    if (!isEditing && (!formData.password || formData.password.trim().length < 4)) {
      errs.password = 'Password must be at least 4 characters';
    }

    // Role check (The user's key requirement)
    if (!formData.roleId) {
      errs.roleId = 'Please select a Role for this user';
    }

    setFormErrors(errs);
    if (Object.keys(errs).length > 0) {
      const firstField = Object.keys(errs)[0];
      const targetInput = document.querySelector(`[name="${firstField}"]`);
      targetInput?.focus?.();
      return false;
    }
    return true;
  };

  // Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      name: formData.name.trim(),
      mobile: formData.mobile.trim(),
      contact_no_2: formData.contact_no_2 ? formData.contact_no_2.trim() : null,
      email: formData.email ? formData.email.trim() : null,
      username: formData.username.trim(),
      roleId: formData.roleId || null,
      address: formData.address ? formData.address.trim() : null,
      state: formData.state || 'Gujarat',
      city: formData.city || 'Surat',
      remarks: formData.remarks ? formData.remarks.trim() : null,
      status: formData.status || 'ACTIVE',
      profile_pic: avatarImage || null
    };

    if (formData.password && formData.password.trim()) {
      payload.password = formData.password.trim();
    }

    const effectiveStoreId = isSuperAdmin
      ? selectedStoreId
      : (userStoreId || user?.storeId);

    if (effectiveStoreId) {
      payload.storeId = effectiveStoreId;
    }

    try {
      setSubmitting(true);
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/api/users/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(`User "${payload.name}" updated successfully`);
      } else {
        await axios.post(`${API_BASE_URL}/api/users`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(`User "${payload.name}" created successfully`);
      }
      navigate('/users');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to save user';
      if (errMsg.toLowerCase().includes('mobile') || errMsg.toLowerCase().includes('exists')) {
        setFormErrors(prev => ({ ...prev, mobile: 'Mobile number already exists' }));
      } else if (errMsg.toLowerCase().includes('username')) {
        setFormErrors(prev => ({ ...prev, username: 'Username already taken' }));
      } else {
        toast.error(errMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel / Reset
  const handleCancel = () => {
    if (isEditing && originalStateRef.current) {
      setFormData(originalStateRef.current.form);
      setAvatarImage(originalStateRef.current.avatar);
      toast.success('Form reset to saved user details');
    } else {
      navigate('/users');
    }
  };

  // Quick Role Creation
  const handleCreateQuickRole = async (e) => {
    e.preventDefault();
    if (!quickRoleName.trim()) {
      toast.error('Role name is required');
      return;
    }
    try {
      setIsSavingQuickRole(true);
      const effectiveStoreId = isSuperAdmin ? selectedStoreId : userStoreId;
      const res = await axios.post(
        `${API_BASE_URL}/api/roles`,
        {
          name: quickRoleName.trim(),
          permissions: ['INVENTORY_MANAGE', 'CUSTOMERS_MANAGE', 'BILLING_CREATE'],
          storeId: effectiveStoreId || undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newRole = res.data?.data;
      if (newRole) {
        setRoles(prev => [...prev, newRole]);
        setFormData(prev => ({ ...prev, roleId: newRole.id }));
        toast.success(`Role "${newRole.name}" created and assigned`);
      }
      setIsQuickRoleModalOpen(false);
      setQuickRoleName('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create role');
    } finally {
      setIsSavingQuickRole(false);
    }
  };

  if (loading) {
    return (
      <div className="user-form-view loading-state">
        <div className="loading-card">
          <FiRefreshCw className="spin-icon" />
          <p>Loading User Canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-form-view">
      {/* 1. Top Bar Header matching Competitor View */}
      <div className="user-top-header">
        <div className="header-left">
          <button 
            type="button" 
            className="back-pill-btn" 
            onClick={() => navigate('/users')}
            title="Back to Users"
          >
            <FiArrowLeft className="back-icon" />
          </button>
          <h1 className="page-heading">
            {isEditing ? 'Edit User' : 'Create User'}
          </h1>
        </div>

        <div className="header-right">
          <div className="competitor-breadcrumb">
            <Link to="/">Dashboard</Link>
            <span className="crumb-sep">/</span>
            <Link to="/users">Users</Link>
            <span className="crumb-sep">/</span>
            <span className="crumb-active">{isEditing ? 'Edit User' : 'Create User'}</span>
          </div>

          {isSuperAdmin && stores.length > 0 && (
            <div className="store-selector-pill">
              <FiShoppingBag className="store-pill-icon" />
              <select
                value={selectedStoreId}
                onChange={(e) => {
                  setSelectedStoreId(e.target.value);
                  localStorage.setItem('rent360_active_store_id', e.target.value);
                }}
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Form Canvas Card */}
      <div className="user-form-canvas">
        <form onSubmit={handleSubmit}>
          <div className="canvas-grid-layout">
            
            {/* Left Column: Round Avatar Profile Box */}
            <div className="avatar-upload-column">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarSelect}
                accept="image/*"
                style={{ display: 'none' }}
              />

              <div 
                className="avatar-circle-box" 
                onClick={() => fileInputRef.current?.click()}
                title="Click to upload profile picture"
              >
                {avatarImage ? (
                  <img src={avatarImage} alt="User Avatar" className="avatar-preview-img" />
                ) : (
                  <div className="default-avatar-illustration">
                    {/* Professional Avatar SVG matching competitor screenshot */}
                    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="60" cy="60" r="58" fill="#F1F5F9" />
                      {/* Body & Blue Suit */}
                      <path d="M26 108C26 88 40 76 60 76C80 76 94 88 94 108H26Z" fill="#1E293B" />
                      {/* White Collar / Shirt */}
                      <path d="M48 76L60 92L72 76L67 71L60 77L53 71L48 76Z" fill="#FFFFFF" />
                      {/* Red Tie matching competitor */}
                      <path d="M57 77H63L65 98L60 106L55 98L57 77Z" fill="#EF4444" />
                      {/* Neck */}
                      <path d="M52 64H68V76H52V64Z" fill="#FDBA74" />
                      {/* Face */}
                      <circle cx="60" cy="48" r="22" fill="#FDBA74" />
                      {/* Hair */}
                      <path d="M40 44C40 30 48 24 60 24C72 24 80 30 80 44C78 38 72 34 60 34C48 34 42 38 40 44Z" fill="#475569" />
                      {/* Glasses */}
                      <rect x="47" y="44" width="10" height="7" rx="2" stroke="#0F172A" strokeWidth="2" fill="none" />
                      <rect x="63" y="44" width="10" height="7" rx="2" stroke="#0F172A" strokeWidth="2" fill="none" />
                      <line x1="57" y1="47" x2="63" y2="47" stroke="#0F172A" strokeWidth="2" />
                    </svg>
                  </div>
                )}

                <div className="avatar-hover-overlay">
                  <FiCamera className="camera-icon" />
                  <span className="upload-text">
                    {optimizingAvatar ? 'Optimizing...' : (avatarImage ? 'Change Photo' : 'Upload Photo')}
                  </span>
                </div>
              </div>

              <div className="avatar-action-bar">
                <button
                  type="button"
                  className="btn-upload-avatar"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose Picture
                </button>
                {avatarImage && (
                  <button
                    type="button"
                    className="btn-remove-avatar"
                    onClick={handleRemoveAvatar}
                    title="Remove picture"
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>

              <div className="avatar-hint-note">
                <FiInfo className="info-icon" />
                <span>Allowed: JPG, PNG, WEBP (Max 2MB)</span>
              </div>
            </div>

            {/* Right Column: Form Fields */}
            <div className="user-fields-column">

              {/* Row 1: Shop Name, Full Name, Contact No.1, Contact No.2 */}
              <div className="fields-grid-row row-4-col">
                {/* 1. Shop Name */}
                <div className="form-field-group">
                  <label className="field-label">
                    Shop Name<span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    value={activeShopName}
                    disabled
                    readOnly
                    className="field-input read-only-field"
                    title="Current Store"
                  />
                </div>

                {/* 2. Full Name */}
                <div className="form-field-group">
                  <label className="field-label">
                    Full Name<span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Full Name"
                    className={`field-input ${formErrors.name ? 'has-error' : ''}`}
                  />
                  {formErrors.name && <span className="error-hint-text">{formErrors.name}</span>}
                </div>

                {/* 3. Contact No.1 */}
                <div className="form-field-group">
                  <label className="field-label">
                    Contact No.1<span className="required-star">*</span>
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={(e) => {
                      const cleanVal = e.target.value.replace(/\D/g, '').slice(0, 10);
                      handleChange({ target: { name: 'mobile', value: cleanVal } });
                    }}
                    placeholder="Phone Number"
                    maxLength={10}
                    className={`field-input ${formErrors.mobile ? 'has-error' : ''}`}
                  />
                  {formErrors.mobile && <span className="error-hint-text">{formErrors.mobile}</span>}
                </div>

                {/* 4. Contact No.2 */}
                <div className="form-field-group">
                  <label className="field-label">
                    Contact No.2
                  </label>
                  <input
                    type="tel"
                    name="contact_no_2"
                    value={formData.contact_no_2}
                    onChange={(e) => {
                      const cleanVal = e.target.value.replace(/\D/g, '').slice(0, 10);
                      handleChange({ target: { name: 'contact_no_2', value: cleanVal } });
                    }}
                    placeholder="Phone Number"
                    maxLength={10}
                    className="field-input"
                  />
                </div>
              </div>

              {/* Row 2: Email, Username, Password, Role (The Extraordinary Thing) */}
              <div className="fields-grid-row row-4-col">
                {/* 5. Email */}
                <div className="form-field-group">
                  <label className="field-label">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email address"
                    className="field-input"
                  />
                </div>

                {/* 6. Username */}
                <div className="form-field-group">
                  <label className="field-label">
                    Username<span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="virasat-mv-admin"
                    className={`field-input ${formErrors.username ? 'has-error' : ''}`}
                  />
                  {formErrors.username && <span className="error-hint-text">{formErrors.username}</span>}
                </div>

                {/* 7. Password */}
                <div className="form-field-group">
                  <label className="field-label">
                    Password{!isEditing && <span className="required-star">*</span>}
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={isEditing ? 'Leave blank to keep current' : '••••••••'}
                      className={`field-input ${formErrors.password ? 'has-error' : ''}`}
                    />
                    <button
                      type="button"
                      className="toggle-password-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {formErrors.password && <span className="error-hint-text">{formErrors.password}</span>}
                </div>

                {/* 8. Role (EXTRAORDINARY THING - DO NOT FORGET IT) */}
                <div className="form-field-group">
                  <label className="field-label">
                    Role<span className="required-star">*</span>
                    <span className="role-extraordinary-pill">Permission Role</span>
                  </label>
                  <div className="role-select-wrapper">
                    <select
                      name="roleId"
                      value={formData.roleId}
                      onChange={handleChange}
                      className={`role-custom-select ${formErrors.roleId ? 'has-error' : ''}`}
                    >
                      <option value="">Select User Role...</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                    <FiChevronDown className="select-chevron-icon" />
                  </div>
                  {formErrors.roleId && <span className="error-hint-text">{formErrors.roleId}</span>}
                </div>
              </div>

              {/* Row 3: Address (span 2), State (1), City (1) */}
              <div className="fields-grid-row row-3-col">
                {/* 9. Address */}
                <div className="form-field-group">
                  <label className="field-label">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Type your address here"
                    rows={2}
                    className="field-textarea"
                  />
                </div>

                {/* 10. State */}
                <div className="form-field-group">
                  <label className="field-label">
                    State
                  </label>
                  <div className="role-select-wrapper">
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="role-custom-select"
                    >
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <FiChevronDown className="select-chevron-icon" />
                  </div>
                </div>

                {/* 11. City */}
                <div className="form-field-group">
                  <label className="field-label">
                    City
                  </label>
                  <div className="role-select-wrapper">
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="role-custom-select"
                    >
                      {GUJARAT_CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <FiChevronDown className="select-chevron-icon" />
                  </div>
                </div>
              </div>

              {/* Row 4: Remarks */}
              <div className="fields-grid-row row-full">
                <div className="form-field-group">
                  <label className="field-label">
                    Remarks
                  </label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    placeholder="Enter your remarks"
                    rows={2}
                    className="field-textarea"
                  />
                </div>
              </div>

              {/* Form Bottom Actions */}
              <div className="form-actions-row">
                <button
                  type="button"
                  className="btn-cancel-pill"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-submit-pill"
                >
                  {submitting && <FiRefreshCw className="btn-spin-icon" />}
                  <span>{submitting ? 'Saving...' : (isEditing ? 'Update User' : 'Submit')}</span>
                </button>
              </div>

            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormPage;
