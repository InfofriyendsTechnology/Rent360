import React, { useState, useEffect } from 'react';
import { 
  FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiLayers, 
  FiDollarSign, FiTrendingUp, FiUsers, FiGrid, FiList, 
  FiSearch, FiArrowUpRight, FiPackage, FiZap, FiCheckCircle
} from 'react-icons/fi';
import axios from 'axios';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import './PlansList.scss';

// Exact feature lists matching the reference standard
const DEFAULT_PLANS_FALLBACK = [
  {
    id: 'starter',
    name: 'STARTER',
    price_per_month: 799,
    price_per_year: 7999,
    savings: 1589,
    features: [
      'Up to 100 Inventory',
      '2 Salesman Accounts',
      'Multi device login',
      'All Features Included',
      'Support & Training'
    ],
    max_staff: 2,
    is_active: true
  },
  {
    id: 'growth',
    name: 'GROWTH',
    is_popular: true,
    price_per_month: 999,
    price_per_year: 9999, // In competitor this was 14,999/yr, user specified: "and 15,000 year ma chhe tya apde 9999 chhe"
    savings: 1989,
    features: [
      'Unlimited Inventory',
      '10 Salesman Accounts',
      'Multi device login',
      'All Features Included',
      'Support & Training'
    ],
    max_staff: 10,
    is_active: true
  },
  {
    id: 'pro',
    name: 'PRO',
    price_per_month: 1499,
    price_per_year: 14999, // Custom / Pro 15k plan
    savings: 2989,
    features: [
      'Unlimited Inventory',
      'Unlimited Salesman',
      'Multi device login',
      'Priority Support & Training',
      'All Features Included'
    ],
    max_staff: 0,
    is_active: true
  }
];

const SUGGESTED_FEATURES = [
  'Up to 100 Inventory',
  'Unlimited Inventory',
  '2 Salesman Accounts',
  '10 Salesman Accounts',
  'Unlimited Salesman',
  'Multi device login',
  'All Features Included',
  'Support & Training',
  'Priority Support & Training'
];

const PlansList = () => {
  const { token } = useSelector((state) => state.auth);
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'cards' (exact reference pricing cards) or 'table' (Bond CRM data density)
  const [viewMode, setViewMode] = useState(localStorage.getItem('rent360_plans_view') || 'cards');
  // Billing cycle toggle: 'yearly' vs 'monthly'
  const [isYearly, setIsYearly] = useState(true);
  // Search query in table view
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [isSubscribersModalOpen, setIsSubscribersModalOpen] = useState(false);
  const [selectedPlanForSubs, setSelectedPlanForSubs] = useState(null);
  const [savingPlan, setSavingPlan] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price_per_month: 799,
    price_per_year: 7999,
    max_staff: 2,
    is_active: true
  });
  const [featuresList, setFeaturesList] = useState([]);
  const [featureInput, setFeatureInput] = useState('');

  useEffect(() => {
    fetchPlans();
    fetchSubscriptions();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:61026/api/plans', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.data && res.data.data.length > 0) {
        setPlans(res.data.data);
      } else {
        setPlans(DEFAULT_PLANS_FALLBACK);
      }
    } catch (error) {
      console.warn('Backend plans fetch failed, using configured tier templates:', error);
      setPlans(DEFAULT_PLANS_FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const res = await axios.get('http://localhost:61026/api/storeSubscriptions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubscriptions(res.data.data || []);
    } catch (error) {
      console.warn('Could not fetch store subscriptions:', error);
    }
  };

  const handleToggleViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('rent360_plans_view', mode);
  };

  // KPI Calculations
  const totalPlansCount = plans.length;
  const activePlansCount = plans.filter(p => p.is_active).length;
  const totalSubscribersCount = subscriptions.filter(s => s.status === 'ACTIVE').length;

  // Open Create Modal
  const openAddModal = () => {
    setEditingPlanId(null);
    setFormData({
      name: '',
      price_per_month: 799,
      price_per_year: 7999,
      max_staff: 2,
      is_active: true
    });
    setFeaturesList([
      'Unlimited Inventory',
      '5 Salesman Accounts',
      'Multi device login',
      'All Features Included',
      'Support & Training'
    ]);
    setFeatureInput('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleEdit = (plan) => {
    setEditingPlanId(plan.id);
    setFormData({
      name: plan.name || '',
      price_per_month: plan.price_per_month || 0,
      price_per_year: plan.price_per_year || 0,
      max_staff: plan.max_staff ?? 5,
      is_active: plan.is_active ?? true
    });

    let feats = [];
    if (Array.isArray(plan.features)) {
      feats = plan.features;
    } else if (typeof plan.features === 'string') {
      try {
        feats = JSON.parse(plan.features);
      } catch {
        feats = plan.features.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    setFeaturesList(feats);
    setFeatureInput('');
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (plan) => {
    try {
      const updatedStatus = !plan.is_active;
      await axios.put(`http://localhost:61026/api/plans/${plan.id}`, {
        is_active: updatedStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_active: updatedStatus } : p));
      toast.success(`Plan ${updatedStatus ? 'activated' : 'paused'} successfully`);
    } catch (error) {
      console.error('Error toggling plan status:', error);
      toast.error('Failed to change plan status');
    }
  };

  const handleDelete = async (plan) => {
    const subscriberCount = plan._count?.storeSubscriptions || 0;
    if (subscriberCount > 0) {
      toast.error(`Cannot delete plan: ${subscriberCount} stores have active subscriptions linked to it. You can pause it instead.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${plan.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`http://localhost:61026/api/plans/${plan.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Plan deleted successfully');
      setPlans(prev => prev.filter(p => p.id !== plan.id));
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error(error.response?.data?.message || 'Failed to delete plan');
    }
  };

  // Feature Tag helpers
  const handleAddFeature = (feat) => {
    const featureText = (feat || featureInput).trim();
    if (!featureText) return;
    if (featuresList.includes(featureText)) {
      toast('Feature already added');
      return;
    }
    setFeaturesList([...featuresList, featureText]);
    setFeatureInput('');
  };

  const handleRemoveFeature = (indexToRemove) => {
    setFeaturesList(featuresList.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter a plan name');
      return;
    }

    setSavingPlan(true);
    try {
      const payload = {
        name: formData.name.trim().toUpperCase(),
        price_per_month: Number(formData.price_per_month) || 0,
        price_per_year: Number(formData.price_per_year) || 0,
        max_bookings: 0, // Bookings are unlimited in every plan
        max_staff: parseInt(formData.max_staff, 10) || 0,
        features: featuresList,
        is_active: formData.is_active
      };

      if (editingPlanId) {
        const res = await axios.put(`http://localhost:61026/api/plans/${editingPlanId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Plan updated successfully');
        setPlans(prev => prev.map(p => p.id === editingPlanId ? { ...res.data.data, _count: p._count } : p));
      } else {
        const res = await axios.post('http://localhost:61026/api/plans', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('New plan created successfully');
        setPlans(prev => [...prev, { ...res.data.data, _count: { storeSubscriptions: 0 } }]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error(error.response?.data?.message || 'Failed to save plan');
    } finally {
      setSavingPlan(false);
    }
  };

  const openSubscribersModal = (plan) => {
    const planSubs = subscriptions.filter(s => s.planId === plan.id);
    setSelectedPlanForSubs({
      plan,
      subscriptions: planSubs
    });
    setIsSubscribersModalOpen(true);
  };

  // Helper to compute calculated prices & savings
  const getPlanDetails = (plan) => {
    const isGrowth = plan.name.toUpperCase().includes('GROWTH');
    const isPro = plan.name.toUpperCase().includes('PRO') || plan.name.includes('15,000');
    const isStarter = plan.name.toUpperCase().includes('STARTER');

    const monthlyPrice = Number(plan.price_per_month) || 0;
    const yearlyPrice = Number(plan.price_per_year) || 0;

    // Monthly equivalent when billed annually
    const yearlyMonthlyEquiv = yearlyPrice > 0 ? Math.round(yearlyPrice / 12) : 0;
    // Calculated annual savings
    const annualSavings = Math.max(0, (monthlyPrice * 12) - yearlyPrice);

    let displaySavings = annualSavings;
    if (isStarter && displaySavings === 0) displaySavings = 1589;
    if (isGrowth && displaySavings === 0) displaySavings = 1989;
    if (isPro && displaySavings === 0) displaySavings = 2989;

    return {
      isGrowth,
      isPro,
      isStarter,
      monthlyPrice,
      yearlyPrice,
      yearlyMonthlyEquiv,
      savings: displaySavings
    };
  };

  const filteredPlans = plans.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = p.name.toLowerCase().includes(q);
    const featMatch = Array.isArray(p.features) && p.features.some(f => String(f).toLowerCase().includes(q));
    return nameMatch || featMatch;
  });

  return (
    <div className="plans-view">
      {/* Top Header & Layout Switcher */}
      <div className="plans-top-bar">
        <div className="title-section">
          <h1 className="main-title">Subscription Plans</h1>
          <p className="subtitle">Configure and manage pricing tiers for bridal and clothing rental stores</p>
        </div>

        <div className="top-actions">
          {/* View Mode Toggle: Cards vs Table */}
          <div className="view-mode-toggle" title="Switch layout">
            <button 
              className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => handleToggleViewMode('cards')}
            >
              <FiGrid className="icon" />
              <span>Cards</span>
            </button>
            <button 
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => handleToggleViewMode('table')}
            >
              <FiList className="icon" />
              <span>Table</span>
            </button>
          </div>

          <button className="pill-btn-primary" onClick={openAddModal}>
            <FiPlus className="plus-icon" />
            <span>Create Plan</span>
          </button>
        </div>
      </div>

      {/* Plans Presentation */}
      {loading ? (
        <div className="plans-loading-state">
          <div className="loading-spinner" />
          <p>Loading subscription plans...</p>
        </div>
      ) : viewMode === 'cards' ? (
        <>
          {/* Main Pricing Showcase Section - Shown ONLY in Cards View */}
          <div className="pricing-showcase-hero">
            <p className="hero-subtext">No credit card required. Cancel anytime.</p>

            {/* Toggle Bar: Monthly vs Yearly */}
            <div className="billing-cycle-switch">
              <span className={`switch-label ${!isYearly ? 'active' : ''}`}>Monthly</span>
              <label className="toggle-pill-switch">
                <input 
                  type="checkbox" 
                  checked={isYearly} 
                  onChange={() => setIsYearly(!isYearly)} 
                />
                <span className="pill-slider" />
              </label>
              <span className={`switch-label ${isYearly ? 'active' : ''}`}>Yearly</span>
              <span className="best-value-pill">Best value</span>
            </div>
          </div>

          {/* Full-Width 3-Card Grid Layout (No empty side space) */}
          <div className="reference-pricing-grid">
          {filteredPlans.map((plan) => {
            const { 
              isGrowth, 
              monthlyPrice, 
              yearlyPrice, 
              yearlyMonthlyEquiv, 
              savings 
            } = getPlanDetails(plan);

            const subCount = plan._count?.storeSubscriptions || 0;
            const features = Array.isArray(plan.features) ? plan.features : [];

            return (
              <div 
                key={plan.id} 
                className={`reference-plan-card ${isGrowth ? 'growth-card-dark' : 'standard-card-light'} ${!plan.is_active ? 'card-inactive' : ''}`}
              >
                {/* Most Popular Floating Pill for Growth Plan */}
                {isGrowth && (
                  <div className="most-popular-pill">
                    <FiZap className="zap-icon" />
                    <span>Most Popular</span>
                  </div>
                )}

                {/* Card Header: Plan Name & Save Badge */}
                <div className="card-header-row">
                  <span className="plan-title">{plan.name}</span>
                  {isYearly && savings > 0 && (
                    <span className={`savings-badge ${isGrowth ? 'growth-badge' : 'standard-badge'}`}>
                      Save ₹{savings.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                {/* Pricing Block */}
                <div className="card-pricing-block">
                  {/* Strikethrough monthly price (when in Yearly view) */}
                  {isYearly && (
                    <span className="strikethrough-price">
                      ₹{monthlyPrice.toLocaleString('en-IN')}/month
                    </span>
                  )}

                  {/* Big Hero Price */}
                  <div className="hero-price-line">
                    <span className="price-symbol">₹</span>
                    <span className="price-digits">
                      {isYearly ? yearlyMonthlyEquiv.toLocaleString('en-IN') : monthlyPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="price-period">/month</span>
                  </div>

                  {/* Subtitle term explanation */}
                  <span className="term-subtext">
                    {isYearly ? (
                      `for a 12-month term · billed ₹${yearlyPrice.toLocaleString('en-IN')}/year`
                    ) : (
                      <span className="term-hint-wrap">
                        <span>or save more with yearly plans</span>
                        <FiArrowUpRight className="term-hint-icon" />
                      </span>
                    )}
                  </span>
                </div>

                <div className="card-separator" />

                {/* Feature Checklist */}
                <ul className="card-feature-list">
                  {features.map((feat, idx) => (
                    <li key={idx} className="feature-row">
                      <div className="check-icon-circle">
                        <FiCheck className="check-svg" />
                      </div>
                      <span className="feature-text">{feat}</span>
                    </li>
                  ))}
                  {features.length === 0 && (
                    <li className="feature-row">
                      <div className="check-icon-circle"><FiCheck className="check-svg" /></div>
                      <span className="feature-text">All Standard Features Included</span>
                    </li>
                  )}
                </ul>

                {/* Main Action Button */}
                <button 
                  className={`get-started-btn ${isGrowth ? 'btn-white' : 'btn-dark'}`}
                  onClick={() => handleEdit(plan)}
                >
                  Get Started
                </button>

                {/* Super Admin Control Bar */}
                <div className="admin-manage-bar">
                  <div 
                    className="admin-subs-count" 
                    onClick={() => openSubscribersModal(plan)}
                    title="View subscribed stores"
                  >
                    <FiUsers />
                    <span>{subCount} Stores</span>
                  </div>

                  <div className="admin-actions-group">
                    <button 
                      className="admin-btn edit" 
                      onClick={() => handleEdit(plan)}
                      title="Edit Plan"
                    >
                      <FiEdit2 />
                    </button>
                    <button 
                      className={`admin-btn status ${plan.is_active ? 'active' : 'paused'}`}
                      onClick={() => handleToggleStatus(plan)}
                      title={plan.is_active ? 'Pause Plan' : 'Activate Plan'}
                    >
                      {plan.is_active ? 'Active' : 'Paused'}
                    </button>
                    <button 
                      className="admin-btn delete" 
                      onClick={() => handleDelete(plan)}
                      title="Delete Plan"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    ) : (
        /* Data-Dense Administrative Table View */
        <div className="plans-table-view-wrap">
          <div className="table-header-toolbar">
            <div className="search-wrap">
              <FiSearch className="search-icon" />
              <input 
                type="text" 
                placeholder="Search plans or features..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="clear-search" onClick={() => setSearchQuery('')}>
                  <FiX />
                </button>
              )}
            </div>

            <div className="table-count-badge">
              <span>{filteredPlans.length} plans configured</span>
            </div>
          </div>

          <div className="plans-table-card">
            <div className="table-responsive">
              <table className="bond-data-table">
                <thead>
                  <tr>
                    <th>PLAN NAME</th>
                <th>MONTHLY PRICE</th>
                <th>ANNUAL PRICE</th>
                <th>STAFF LIMIT</th>
                <th>INCLUDED FEATURES</th>
                <th>SUBSCRIBERS</th>
                <th>STATUS</th>
                <th className="actions-header">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlans.map((plan) => {
                const subCount = plan._count?.storeSubscriptions || 0;
                const features = Array.isArray(plan.features) ? plan.features : [];
                return (
                  <tr key={plan.id} className={!plan.is_active ? 'row-inactive' : ''}>
                    <td className="plan-name-cell">
                      <span className="name-bold">{plan.name}</span>
                    </td>
                    <td className="price-cell">
                      <span className="price-val">₹{plan.price_per_month.toLocaleString('en-IN')}</span>
                      <span className="period">/mo</span>
                    </td>
                    <td className="price-cell">
                      <span className="price-val">₹{plan.price_per_year.toLocaleString('en-IN')}</span>
                      <span className="period">/yr</span>
                    </td>
                    <td>
                      <span className="staff-pill">
                        {plan.max_staff === 0 ? 'Unlimited' : `${plan.max_staff} Salesman`}
                      </span>
                    </td>
                    <td className="features-cell">
                      <span className="features-preview-text">
                        {features.slice(0, 3).join(', ')}
                        {features.length > 3 && ` +${features.length - 3} more`}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="subs-chip-btn" 
                        onClick={() => openSubscribersModal(plan)}
                      >
                        <FiUsers />
                        <span>{subCount} Stores</span>
                      </button>
                    </td>
                    <td>
                      <span className={`status-pill ${plan.is_active ? 'active' : 'paused'}`}>
                        <span className="dot" />
                        {plan.is_active ? 'Active' : 'Paused'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <div className="action-buttons">
                        <button 
                          className="table-btn edit" 
                          onClick={() => handleEdit(plan)}
                          title="Edit Plan"
                        >
                          <FiEdit2 />
                        </button>
                        <button 
                          className="table-btn delete" 
                          onClick={() => handleDelete(plan)}
                          title="Delete Plan"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

      {/* CREATE / EDIT PLAN MODAL */}
      {isModalOpen && (
        <div className="bond-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="bond-modal-card plan-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <h2>{editingPlanId ? 'Edit Subscription Plan' : 'Create Subscription Plan'}</h2>
                <p>Define pricing parameters and feature items</p>
              </div>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="modal-form">
              {/* Plan Name */}
              <div className="form-group">
                <label>Plan Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. STARTER, GROWTH, PRO"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Price Row */}
              <div className="form-row-two">
                <div className="form-group">
                  <label>Monthly Price (₹) *</label>
                  <div className="input-with-symbol">
                    <span className="symbol">₹</span>
                    <input 
                      type="number" 
                      min="0"
                      placeholder="799"
                      value={formData.price_per_month}
                      onChange={(e) => setFormData({ ...formData, price_per_month: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Annual Price (₹) *</label>
                  <div className="input-with-symbol">
                    <span className="symbol">₹</span>
                    <input 
                      type="number" 
                      min="0"
                      placeholder="7999"
                      value={formData.price_per_year}
                      onChange={(e) => setFormData({ ...formData, price_per_year: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Salesman / Staff Accounts Limit */}
              <div className="form-group">
                <label>Salesman Accounts Limit *</label>
                <div className="input-with-symbol">
                  <span className="symbol"><FiUsers /></span>
                  <input 
                    type="number" 
                    min="0" 
                    placeholder="e.g. 2, 10 (0 for unlimited)"
                    value={formData.max_staff}
                    onChange={(e) => setFormData({ ...formData, max_staff: e.target.value })}
                    required
                  />
                </div>
                <div className="quick-presets">
                  {[2, 5, 10, 20].map(val => (
                    <button 
                      type="button" 
                      key={val} 
                      className={`preset-chip ${Number(formData.max_staff) === val ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, max_staff: val })}
                    >
                      {val} Salesman
                    </button>
                  ))}
                  <button 
                    type="button" 
                    className={`preset-chip ${Number(formData.max_staff) === 0 ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, max_staff: 0 })}
                  >
                    Unlimited
                  </button>
                </div>
              </div>

              {/* Feature Checklist Builder */}
              <div className="form-group features-builder">
                <label>Features & Wordings (Matching screenshot)</label>
                <div className="feature-input-row">
                  <input 
                    type="text" 
                    placeholder="Add a feature (e.g. Up to 100 Inventory)..."
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                  />
                  <button type="button" className="add-feat-btn" onClick={() => handleAddFeature()}>
                    Add
                  </button>
                </div>

                {/* Active tags */}
                <div className="feature-tags-wrap">
                  {featuresList.map((feat, idx) => (
                    <span key={idx} className="feature-tag">
                      {feat}
                      <button type="button" onClick={() => handleRemoveFeature(idx)}>
                        <FiX />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Suggestions */}
                <div className="suggestions-row">
                  <span className="sugg-label">Suggestions:</span>
                  <div className="sugg-chips">
                    {SUGGESTED_FEATURES.filter(s => !featuresList.includes(s)).map((sugg, i) => (
                      <button 
                        type="button" 
                        key={i} 
                        className="sugg-chip"
                        onClick={() => handleAddFeature(sugg)}
                      >
                        + {sugg}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="form-group status-toggle-row">
                <div className="toggle-label">
                  <span>Plan Active</span>
                  <span className="toggle-sub">Active plans are available for store subscription</span>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span className="slider round" />
                </label>
              </div>

              {/* Modal Actions */}
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="pill-btn-secondary" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="pill-btn-primary" 
                  disabled={savingPlan}
                >
                  {savingPlan ? 'Saving...' : (editingPlanId ? 'Update Plan' : 'Create Plan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBSCRIBED STORES DRAWER / MODAL */}
      {isSubscribersModalOpen && selectedPlanForSubs && (
        <div className="bond-modal-overlay" onClick={() => setIsSubscribersModalOpen(false)}>
          <div className="bond-modal-card subs-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <h2>{selectedPlanForSubs.plan.name} Subscribers</h2>
                <p>Stores enrolled in this pricing tier</p>
              </div>
              <button className="close-btn" onClick={() => setIsSubscribersModalOpen(false)}>
                <FiX />
              </button>
            </div>

            <div className="subs-list-content">
              {selectedPlanForSubs.subscriptions.length === 0 ? (
                <div className="empty-subs-notice">
                  <FiUsers className="empty-subs-icon" />
                  <p>No stores are currently subscribed to this plan.</p>
                </div>
              ) : (
                <div className="subs-cards-list">
                  {selectedPlanForSubs.subscriptions.map((sub) => (
                    <div key={sub.id} className="store-sub-item">
                      <div className="store-meta">
                        <span className="store-name">{sub.store?.name || 'Store'}</span>
                        <span className="store-owner">{sub.store?.owner_name || 'Owner'} • {sub.store?.mobile || ''}</span>
                        {sub.store?.city && <span className="store-city">{sub.store.city}</span>}
                      </div>
                      <div className="sub-meta">
                        <span className={`sub-status ${sub.status?.toLowerCase() || 'active'}`}>{sub.status || 'ACTIVE'}</span>
                        <span className="sub-date">Since {new Date(sub.start_date || sub.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="pill-btn-secondary" 
                onClick={() => setIsSubscribersModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlansList;
