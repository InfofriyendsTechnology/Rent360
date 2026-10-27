import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FiArrowLeft, FiCamera, FiTrash2, FiEye, FiEyeOff, 
  FiShoppingBag, FiRefreshCw, FiX 
} from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import { convertToWebP } from '../../utils/imageOptimizer';
import { Select, Checkbox } from '../../components/ui';
import '../Stores/StoresList.scss';
import '../Roles/RolesList.scss';
import './UserFormPage.scss';

const ALL_PERMISSIONS = [
  'DASHBOARD_VIEW',
  'INVENTORY_MANAGE',
  'CUSTOMERS_MANAGE',
  'BILLING_CREATE',
  'REPORTS_VIEW',
  'SETTINGS_MANAGE'
];

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

  // Quick Role Creation Modal matching RolesList
  const [isQuickRoleModalOpen, setIsQuickRoleModalOpen] = useState(false);
  const [quickRoleForm, setQuickRoleForm] = useState({
    name: '',
    permissions: ['INVENTORY_MANAGE', 'CUSTOMERS_MANAGE', 'BILLING_CREATE']
  });
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

  // Role options for custom Select
  const roleOptions = useMemo(() => {
    return roles.map(r => ({
      value: r.id,
      label: r.name
    }));
  }, [roles]);

  // State options
  const stateOptions = useMemo(() => {
    return INDIAN_STATES.map(s => ({ value: s, label: s }));
  }, []);

  // City options
  const cityOptions = useMemo(() => {
    return GUJARAT_CITIES.map(c => ({ value: c, label: c }));
  }, []);

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

  // Quick Role Creation (Exact same permissions and structure as RolesList)
  const toggleQuickPermission = (perm) => {
    setQuickRoleForm(prev => {
      const exists = prev.permissions.includes(perm);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter(p => p !== perm)
          : [...prev.permissions, perm]
      };
    });
  };

  const handleCreateQuickRole = async (e) => {
    e.preventDefault();
    if (!quickRoleForm.name.trim()) {
      toast.error('Role name is required');
      return;
    }
    try {
      setIsSavingQuickRole(true);
      const effectiveStoreId = isSuperAdmin ? selectedStoreId : userStoreId;
      const res = await axios.post(
        `${API_BASE_URL}/api/roles`,
        {
          name: quickRoleForm.name.trim(),
          permissions: quickRoleForm.permissions,
          storeId: effectiveStoreId || undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newRole = res.data?.data;
      if (newRole) {
        setRoles(prev => [...prev, newRole]);
        setFormData(prev => ({ ...prev, roleId: newRole.id }));
        if (formErrors.roleId) setFormErrors(prev => ({ ...prev, roleId: null }));
        toast.success(`Role "${newRole.name}" created and selected`);
      }
      setIsQuickRoleModalOpen(false);
      setQuickRoleForm({
        name: '',
        permissions: ['INVENTORY_MANAGE', 'CUSTOMERS_MANAGE', 'BILLING_CREATE']
      });
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
      {/* 1. Top Bar Header */}
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
        <form onSubmit={handleSubmit} autoComplete="off" noValidate>
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

              <div className="avatar-circle-wrapper">
                <div 
                  className="avatar-circle-box" 
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to upload profile picture"
                >
                  {avatarImage ? (
                    <img src={avatarImage} alt="User Avatar" className="avatar-preview-img" />
                  ) : (
                    <div className="default-avatar-illustration">
                      {/* Minimalist monochrome vector avatar matching theme */}
                      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="monochrome-avatar-svg">
                        <circle cx="60" cy="60" r="58" className="avatar-bg" />
                        <circle cx="60" cy="46" r="20" className="avatar-head" />
                        <path d="M28 98C28 80.3269 42.3269 66 60 66C77.6731 66 92 80.3269 92 98V102H28V98Z" className="avatar-body" />
                      </svg>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="avatar-camera-badge"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload profile picture"
                  aria-label="Upload profile picture"
                >
                  <FiCamera className="camera-icon" />
                </button>
              </div>

              <div className="avatar-action-bar">
                <button
                  type="button"
                  className="pill-btn-secondary avatar-pick-btn"
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
                <span>JPG, PNG, WEBP up to 2MB</span>
              </div>
            </div>

            {/* Right Column: Form Fields */}
            <div className="user-fields-column">

              {/* Row 1: Shop Name, Full Name, Contact No.1, Contact No.2 */}
              <div className="fields-grid-row row-4-col">
                {/* 1. Shop Name */}
                <div className="form-field-group">
                  <label className="field-label required">
                    Shop Name*
                  </label>
                  <input
                    type="text"
                    value={activeShopName}
                    disabled
                    readOnly
                    className="outfit-input read-only-field"
                    title="Current Store"
                  />
                </div>

                {/* 2. Full Name */}
                <div className={`form-field-group ${formErrors.name ? 'has-error' : ''}`}>
                  <label className="field-label required">
                    Full Name*
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Full Name"
                    className={`outfit-input ${formErrors.name ? 'is-invalid' : ''}`}
                  />
                  {formErrors.name && <span className="field-error-text">{formErrors.name}</span>}
                </div>

                {/* 3. Contact No.1 */}
                <div className={`form-field-group ${formErrors.mobile ? 'has-error' : ''}`}>
                  <label className="field-label required">
                    Contact No.1*
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
                    className={`outfit-input ${formErrors.mobile ? 'is-invalid' : ''}`}
                  />
                  {formErrors.mobile && <span className="field-error-text">{formErrors.mobile}</span>}
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
                    className="outfit-input"
                  />
                </div>
              </div>

              {/* Row 2: Email, Username, Password, Role (Common Dropdown + Add Role) */}
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
                    className="outfit-input"
                  />
                </div>

                {/* 6. Username */}
                <div className={`form-field-group ${formErrors.username ? 'has-error' : ''}`}>
                  <label className="field-label required">
                    Username*
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="virasat-mv-admin"
                    className={`outfit-input ${formErrors.username ? 'is-invalid' : ''}`}
                  />
                  {formErrors.username && <span className="field-error-text">{formErrors.username}</span>}
                </div>

                {/* 7. Password */}
                <div className={`form-field-group ${formErrors.password ? 'has-error' : ''}`}>
                  <label className="field-label required">
                    Password{!isEditing && '*'}
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={isEditing ? 'Leave blank to keep current' : '••••••••'}
                      className={`outfit-input ${formErrors.password ? 'is-invalid' : ''}`}
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
                  {formErrors.password && <span className="field-error-text">{formErrors.password}</span>}
                </div>

                {/* 8. Role (Common Portal Dropdown with '+ Add New Role' option) */}
                <div className={`form-field-group ${formErrors.roleId ? 'has-error' : ''}`}>
                  <label className="field-label required">
                    Role*
                  </label>
                  <Select
                    name="roleId"
                    value={formData.roleId}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, roleId: e.target.value }));
                      if (formErrors.roleId) setFormErrors(prev => ({ ...prev, roleId: null }));
                    }}
                    options={roleOptions}
                    placeholder="Select User Role..."
                    size="md"
                    actionButton={{
                      label: 'Add New Role',
                      onClick: () => setIsQuickRoleModalOpen(true)
                    }}
                    className={formErrors.roleId ? 'is-invalid' : ''}
                  />
                  {formErrors.roleId && <span className="field-error-text">{formErrors.roleId}</span>}
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
                    className="outfit-textarea"
                  />
                </div>

                {/* 10. State (Common Select) */}
                <div className="form-field-group">
                  <label className="field-label">
                    State
                  </label>
                  <Select
                    name="state"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    options={stateOptions}
                    size="md"
                  />
                </div>

                {/* 11. City (Common Select) */}
                <div className="form-field-group">
                  <label className="field-label">
                    City
                  </label>
                  <Select
                    name="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    options={cityOptions}
                    size="md"
                  />
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
                    className="outfit-textarea"
                  />
                </div>
              </div>

              {/* Form Bottom Actions unified with Outfit form */}
              <div className="outfit-form-footer-actions">
                <button
                  type="button"
                  className="pill-btn-secondary"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="pill-btn-primary"
                >
                  {submitting && <FiRefreshCw className="btn-spin-icon" />}
                  <span>{submitting ? 'Saving...' : (isEditing ? 'Update User' : 'Submit')}</span>
                </button>
              </div>

            </div>

          </div>
        </form>
      </div>

      {/* Quick Role Creation Modal matching original RolesList panel */}
      {isQuickRoleModalOpen && (
        <div className="bond-modal-overlay" onClick={() => setIsQuickRoleModalOpen(false)}>
          <div className="bond-modal-card" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Create Role</h2>
                <p>Define role name and select access permissions</p>
              </div>
              <button 
                type="button" 
                className="modal-close" 
                onClick={() => setIsQuickRoleModalOpen(false)}
              >
                <FiX />
              </button>
            </div>
            <form onSubmit={handleCreateQuickRole}>
              <div className="modal-body">
                <div className="form-field">
                  <label>Role Name *</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Sales Executive"
                    value={quickRoleForm.name}
                    onChange={(e) => setQuickRoleForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="form-field" style={{ marginTop: '20px' }}>
                  <label>Select Permissions</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '10px' }}>
                    {ALL_PERMISSIONS.map(perm => (
                      <Checkbox
                        key={perm}
                        checked={quickRoleForm.permissions.includes(perm)}
                        onChange={() => toggleQuickPermission(perm)}
                        label={perm === 'INVENTORY_MANAGE' ? 'COLLECTION MANAGE' : perm.replace('_', ' ')}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="pill-btn-secondary"
                  onClick={() => setIsQuickRoleModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pill-btn-primary"
                  disabled={isSavingQuickRole}
                >
                  {isSavingQuickRole ? 'Saving...' : 'Save Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserFormPage;
