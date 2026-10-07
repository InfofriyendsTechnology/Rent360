import React, { useState, useEffect } from 'react';
import { 
  FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiKey, 
  FiEye, FiEyeOff, FiMapPin, FiPhone, FiMail, FiCreditCard,
  FiCalendar, FiZap
} from 'react-icons/fi';
import axios from 'axios';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import './StoresList.scss';

const DEFAULT_PLANS_FALLBACK = [
  { id: 'starter', name: 'STARTER', price_per_month: 799, price_per_year: 7999, max_staff: 2 },
  { id: 'growth', name: 'GROWTH', price_per_month: 999, price_per_year: 9999, max_staff: 10 },
  { id: 'pro', name: 'PRO', price_per_month: 1499, price_per_year: 14999, max_staff: 0 }
];

const StoresList = () => {
  const { token } = useSelector((state) => state.auth);
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

  // Dedicated Subscription Assignment Modal
  const [subModalStore, setSubModalStore] = useState(null);
  const [subFormData, setSubFormData] = useState({
    planId: '',
    billing_cycle: 'YEARLY',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    status: 'ACTIVE',
    last_paid_amount: 9999
  });
  const [savingSub, setSavingSub] = useState(false);

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
    password: ''
  });
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [editingStoreHasPassword, setEditingStoreHasPassword] = useState(false);

  useEffect(() => {
    fetchStores();
    fetchPlans();
  }, []);

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

  // Dedicated Subscription Assignment Handler
  const openSubModal = (store) => {
    setSubModalStore(store);
    const existingSub = store.subscriptions?.[0];
    const defaultPlan = plans.find(p => p.id === existingSub?.planId) || 
                        plans.find(p => p.name.toUpperCase().includes('GROWTH')) || 
                        plans[0];

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Default 1 year from now
    const nextYear = new Date(today);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextYearStr = nextYear.toISOString().split('T')[0];

    const defaultPrice = defaultPlan?.price_per_year || 9999;

    setSubFormData({
      planId: defaultPlan?.id || '',
      billing_cycle: 'YEARLY',
      start_date: todayStr,
      end_date: nextYearStr,
      status: store.subscription_status || 'ACTIVE',
      last_paid_amount: defaultPrice
    });
  };

  const handlePlanSelect = (plan) => {
    const isYearly = subFormData.billing_cycle === 'YEARLY';
    const amount = isYearly ? (plan.price_per_year || 0) : (plan.price_per_month || 0);

    setSubFormData(prev => ({
      ...prev,
      planId: plan.id,
      last_paid_amount: amount
    }));
  };

  const handleCycleChange = (cycle) => {
    const selectedPlan = plans.find(p => p.id === subFormData.planId) || plans[0];
    const startDate = subFormData.start_date ? new Date(subFormData.start_date) : new Date();
    const endDate = new Date(startDate);

    if (cycle === 'YEARLY') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const amount = cycle === 'YEARLY' 
      ? (selectedPlan?.price_per_year || 9999) 
      : (selectedPlan?.price_per_month || 999);

    setSubFormData(prev => ({
      ...prev,
      billing_cycle: cycle,
      end_date: endDate.toISOString().split('T')[0],
      last_paid_amount: amount
    }));
  };

  const handleSaveSubscription = async (e) => {
    e.preventDefault();
    if (!subModalStore || !subFormData.planId) {
      toast.error('Please select a subscription plan');
      return;
    }

    setSavingSub(true);
    try {
      await axios.post(
        'http://localhost:61026/api/storeSubscriptions',
        {
          storeId: subModalStore.id,
          planId: subFormData.planId,
          billing_cycle: subFormData.billing_cycle,
          start_date: subFormData.start_date,
          end_date: subFormData.end_date,
          status: subFormData.status,
          last_paid_amount: Number(subFormData.last_paid_amount) || 0
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Subscription activated successfully for ${subModalStore.name}!`);
      setSubModalStore(null);
      fetchStores();
    } catch (error) {
      console.error('Error starting subscription:', error);
      toast.error(error.response?.data?.message || 'Failed to start subscription');
    } finally {
      setSavingSub(false);
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
                <th>City & Location</th>
                <th>Subscription Plan</th>
                <th>GST Number</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center state-message">
                    Loading companies...
                  </td>
                </tr>
              ) : stores.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center state-message">
                    No companies found. Click <strong>+ Add Company</strong> to register one!
                  </td>
                </tr>
              ) : (
                stores.map((store) => {
                  const activeSub = store.subscriptions?.[0];
                  const hasActivePlan = Boolean(activeSub?.plan);
                  const planName = activeSub?.plan?.name || '';
                  const isYearly = (activeSub?.last_paid_amount || 0) >= 3000;

                  return (
                    <tr key={store.id}>
                      <td>
                        <div className="store-identity">
                          <div className="avatar-initials">
                            {getInitials(store.name)}
                          </div>
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
                      <td className="plan-col-cell">
                        {hasActivePlan ? (
                          <div className="store-plan-badge-wrap" onClick={() => openSubModal(store)} title="Click to manage subscription">
                            <span className={`plan-badge-pill ${planName.toLowerCase()}`}>
                              <FiZap className="badge-icon" />
                              {planName}
                            </span>
                            <span className="plan-cycle-subtext">
                              {isYearly ? 'Yearly' : 'Monthly'} · ₹{(activeSub.last_paid_amount || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ) : (
                          <button 
                            className="assign-plan-pill-btn" 
                            onClick={() => openSubModal(store)}
                            title="Assign a SaaS plan to this store"
                          >
                            <FiCreditCard className="btn-icon" />
                            <span>Assign Plan</span>
                          </button>
                        )}
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
                          {/* Assign / Change Subscription */}
                          <button 
                            className="icon-action-btn subscription" 
                            title={hasActivePlan ? "Renew / Change Plan" : "Assign Subscription Plan"} 
                            onClick={() => openSubModal(store)}
                          >
                            <FiCreditCard />
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

                <div className="form-row-3">
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

                {/* Password field inside Store form */}
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
                        ? (editingStoreHasPassword ? 'Enter new password to update' : 'Set new password for this store')
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

      {/* DEDICATED ASSIGN / START SUBSCRIPTION MODAL */}
      {subModalStore && (
        <div className="bond-modal-overlay" onClick={() => setSubModalStore(null)}>
          <div className="bond-modal-card subscription-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Assign / Start Subscription</h2>
                <p>Activate SaaS rental tier for <strong>{subModalStore.name}</strong> ({subModalStore.owner_name})</p>
              </div>
              <button className="modal-close" onClick={() => setSubModalStore(null)}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSaveSubscription}>
              <div className="modal-body">
                {/* Store Profile Context */}
                <div className="company-access-banner">
                  <div className="access-item">
                    <span className="access-label">Store:</span>
                    <span className="access-val">{subModalStore.name}</span>
                  </div>
                  <div className="access-item">
                    <span className="access-label">Owner Mobile:</span>
                    <span className="access-val code">{subModalStore.mobile}</span>
                  </div>
                  <div className="access-item">
                    <span className="access-label">Current Plan:</span>
                    <span className="access-val">
                      {subModalStore.subscriptions?.[0]?.plan?.name || 'No Active Plan'}
                    </span>
                  </div>
                </div>

                {/* Billing Cycle Toggle */}
                <div className="cycle-toggle-section">
                  <label className="section-label">Select Billing Term:</label>
                  <div className="cycle-pills-wrap">
                    <button
                      type="button"
                      className={`cycle-pill-btn ${subFormData.billing_cycle === 'YEARLY' ? 'active' : ''}`}
                      onClick={() => handleCycleChange('YEARLY')}
                    >
                      <FiZap className="zap-icon" />
                      <span>Yearly (Recommended · Best Value)</span>
                    </button>
                    <button
                      type="button"
                      className={`cycle-pill-btn ${subFormData.billing_cycle === 'MONTHLY' ? 'active' : ''}`}
                      onClick={() => handleCycleChange('MONTHLY')}
                    >
                      <span>Monthly Term</span>
                    </button>
                  </div>
                </div>

                {/* Plan Tier Selection Grid */}
                <div className="plan-selection-section">
                  <label className="section-label">Choose Subscription Tier:</label>
                  <div className="plan-cards-grid">
                    {plans.map((p) => {
                      const isSelected = subFormData.planId === p.id;
                      const isGrowth = p.name.toUpperCase().includes('GROWTH');
                      const displayPrice = subFormData.billing_cycle === 'YEARLY'
                        ? `₹${(p.price_per_year || 0).toLocaleString('en-IN')}/year`
                        : `₹${(p.price_per_month || 0).toLocaleString('en-IN')}/month`;

                      return (
                        <div
                          key={p.id}
                          className={`plan-select-card ${isSelected ? 'selected' : ''} ${isGrowth ? 'popular' : ''}`}
                          onClick={() => handlePlanSelect(p)}
                        >
                          <div className="card-top-line">
                            <span className="plan-name-label">{p.name}</span>
                            {isSelected ? (
                              <span className="select-check"><FiCheck /></span>
                            ) : null}
                          </div>
                          <div className="plan-price-label">{displayPrice}</div>
                          <div className="plan-meta-sub">
                            <span>{p.max_staff === 0 ? 'Unlimited Salesman' : `${p.max_staff} Salesman`}</span>
                            <span className="dot-sep">•</span>
                            <span>Unlimited Bookings</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Dates Configuration */}
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Start Date *</label>
                    <input 
                      type="date"
                      value={subFormData.start_date}
                      onChange={(e) => setSubFormData({ ...subFormData, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Expiry / Renewal Date *</label>
                    <input 
                      type="date"
                      value={subFormData.end_date}
                      onChange={(e) => setSubFormData({ ...subFormData, end_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Amount Paid & Status */}
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Amount Collected (₹) *</label>
                    <input 
                      type="number"
                      value={subFormData.last_paid_amount}
                      onChange={(e) => setSubFormData({ ...subFormData, last_paid_amount: e.target.value })}
                      required
                      min="0"
                    />
                  </div>
                  <div className="form-field">
                    <label>Subscription Status *</label>
                    <select 
                      value={subFormData.status}
                      onChange={(e) => setSubFormData({ ...subFormData, status: e.target.value })}
                    >
                      <option value="ACTIVE">ACTIVE (Full Platform Access)</option>
                      <option value="TRIAL">TRIAL (14-Day Free Evaluation)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="pill-btn-secondary" 
                  onClick={() => setSubModalStore(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="pill-btn-primary" disabled={savingSub}>
                  {savingSub ? 'Starting Plan...' : 'Start Subscription'}
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
