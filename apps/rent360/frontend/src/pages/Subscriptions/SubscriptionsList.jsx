import React, { useState, useEffect } from 'react';
import { 
  FiCreditCard, FiPlus, FiX, FiSearch, FiRefreshCw, FiEdit2
} from 'react-icons/fi';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import './SubscriptionsList.scss';

const SubscriptionsList = () => {
  const { token } = useSelector((state) => state.auth);
  const [searchParams] = useSearchParams();

  const [subscriptions, setSubscriptions] = useState([]);
  const [stores, setStores] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    storeId: '',
    planId: '',
    billing_cycle: 'YEARLY',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    last_paid_amount: 9999,
    status: 'ACTIVE'
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [subsRes, storesRes, plansRes] = await Promise.all([
        axios.get('http://localhost:61026/api/storeSubscriptions', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:61026/api/stores', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:61026/api/plans', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setSubscriptions(subsRes.data?.data || []);
      setStores(storesRes.data?.data || []);
      setPlans(plansRes.data?.data || []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (preselectStoreId = null) => {
    const defaultPlan = plans.find(p => p.name.toUpperCase().includes('GROWTH')) || plans[0];
    const today = new Date();
    const nextYear = new Date(today);
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    setFormData({
      storeId: preselectStoreId || (stores[0]?.id || ''),
      planId: defaultPlan?.id || '',
      billing_cycle: 'YEARLY',
      start_date: today.toISOString().split('T')[0],
      end_date: nextYear.toISOString().split('T')[0],
      last_paid_amount: defaultPlan?.price_per_year || 9999,
      status: 'ACTIVE'
    });
    setIsModalOpen(true);
  };

  const handlePlanChange = (planId) => {
    const plan = plans.find(p => p.id === planId);
    const isYearly = formData.billing_cycle === 'YEARLY';
    const amount = isYearly ? (plan?.price_per_year || 9999) : (plan?.price_per_month || 999);
    const start = new Date(formData.start_date || new Date());
    const end = new Date(start);
    if (isYearly) end.setFullYear(end.getFullYear() + 1);
    else end.setMonth(end.getMonth() + 1);

    setFormData(prev => ({
      ...prev,
      planId,
      last_paid_amount: amount,
      end_date: end.toISOString().split('T')[0]
    }));
  };

  const handleCycleChange = (cycle) => {
    const plan = plans.find(p => p.id === formData.planId) || plans[0];
    const amount = cycle === 'YEARLY' ? (plan?.price_per_year || 9999) : (plan?.price_per_month || 999);
    const start = new Date(formData.start_date || new Date());
    const end = new Date(start);
    if (cycle === 'YEARLY') end.setFullYear(end.getFullYear() + 1);
    else end.setMonth(end.getMonth() + 1);

    setFormData(prev => ({
      ...prev,
      billing_cycle: cycle,
      last_paid_amount: amount,
      end_date: end.toISOString().split('T')[0]
    }));
  };

  const handleStartDateChange = (date) => {
    const start = new Date(date);
    const end = new Date(start);
    if (formData.billing_cycle === 'YEARLY') end.setFullYear(end.getFullYear() + 1);
    else end.setMonth(end.getMonth() + 1);

    setFormData(prev => ({
      ...prev,
      start_date: date,
      end_date: end.toISOString().split('T')[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.storeId || !formData.planId) {
      toast.error('Please select a store and plan');
      return;
    }
    setSaving(true);
    try {
      await axios.post(
        'http://localhost:61026/api/storeSubscriptions',
        {
          storeId: formData.storeId,
          planId: formData.planId,
          billing_cycle: formData.billing_cycle,
          start_date: formData.start_date,
          end_date: formData.end_date,
          status: formData.status,
          last_paid_amount: Number(formData.last_paid_amount) || 0
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Subscription activated!');
      setIsModalOpen(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to activate subscription');
    } finally {
      setSaving(false);
    }
  };

  const getDaysLeft = (endDate) => {
    if (!endDate) return 0;
    const diff = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const filtered = subscriptions.filter(sub => {
    const q = searchQuery.toLowerCase();
    return (
      (sub.store?.name || '').toLowerCase().includes(q) ||
      (sub.plan?.name || '').toLowerCase().includes(q) ||
      (sub.store?.owner_name || '').toLowerCase().includes(q)
    );
  });

  // Preselect store from query param
  useEffect(() => {
    const storeId = searchParams.get('storeId');
    if (storeId && stores.length > 0 && plans.length > 0) {
      openModal(storeId);
    }
  }, [stores, plans]);

  return (
    <div className="subscriptions-view">

      {/* Top Bar */}
      <div className="subs-top-bar">
        <div className="title-section">
          <h1 className="main-title">Subscriptions</h1>
          <p className="subtitle">Active company SaaS licenses · {subscriptions.length} total</p>
        </div>
        <button className="pill-btn-primary" onClick={() => openModal()}>
          <FiPlus />
          <span>Assign Subscription</span>
        </button>
      </div>

      {/* Search + Refresh */}
      <div className="subs-controls-bar">
        <div className="search-wrap">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by company or plan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="refresh-btn" onClick={fetchAll} title="Refresh">
          <FiRefreshCw />
        </button>
      </div>

      {/* Table */}
      <div className="bond-card-container">
        <div className="table-responsive">
          <table className="bond-table">
            <thead>
              <tr>
                <th>Company / Store</th>
                <th>Plan</th>
                <th>Billing</th>
                <th>Amount Paid</th>
                <th>Expiry</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="state-message text-center">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" className="state-message text-center">No subscriptions yet. Click <strong>Assign Subscription</strong> to add one.</td></tr>
              ) : (
                filtered.map(sub => {
                  const isYearly = (sub.last_paid_amount || 0) >= 3000;
                  const daysLeft = getDaysLeft(sub.end_date);
                  const planName = sub.plan?.name || '—';
                  return (
                    <tr key={sub.id}>
                      <td>
                        <div className="store-identity">
                          <div className="avatar-initials">
                            {(sub.store?.name || 'ST').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="store-text">
                            <span className="store-name">{sub.store?.name || '—'}</span>
                            <span className="store-sub">{sub.store?.owner_name || ''}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`plan-badge ${planName.toLowerCase()}`}>{planName}</span>
                      </td>
                      <td>
                        <span className={`cycle-pill ${isYearly ? 'yearly' : 'monthly'}`}>
                          {isYearly ? 'Yearly' : 'Monthly'}
                        </span>
                      </td>
                      <td>
                        <span className="amount-val">₹{(sub.last_paid_amount || 0).toLocaleString('en-IN')}</span>
                      </td>
                      <td>
                        <div className="date-cell">
                          <span className="date-range">
                            {sub.end_date ? new Date(sub.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </span>
                          <span className={`days-pill ${daysLeft < 30 ? 'expiring' : 'safe'}`}>
                            {daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${(sub.status || 'ACTIVE').toLowerCase()}`}>
                          <span className="dot" />
                          {sub.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          className="icon-action-btn"
                          title="Reassign Plan"
                          onClick={() => openModal(sub.storeId)}
                        >
                          <FiEdit2 />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SIMPLE ASSIGN MODAL */}
      {isModalOpen && (
        <div className="bond-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="bond-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Assign Subscription</h2>
                <p>Activate a plan for a company store</p>
              </div>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}><FiX /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">

                {/* Store Dropdown */}
                <div className="form-field">
                  <label>Company / Store *</label>
                  <select
                    value={formData.storeId}
                    onChange={e => setFormData(prev => ({ ...prev, storeId: e.target.value }))}
                    required
                  >
                    <option value="">-- Select Store --</option>
                    {stores.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {s.owner_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Plan Dropdown */}
                <div className="form-field">
                  <label>Subscription Plan *</label>
                  <select
                    value={formData.planId}
                    onChange={e => handlePlanChange(e.target.value)}
                    required
                  >
                    <option value="">-- Select Plan --</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ₹{p.price_per_year}/yr · ₹{p.price_per_month}/mo
                      </option>
                    ))}
                  </select>
                </div>

                {/* Billing Cycle */}
                <div className="form-field">
                  <label>Billing Cycle *</label>
                  <div className="cycle-pills-wrap">
                    <button
                      type="button"
                      className={`cycle-pill-btn ${formData.billing_cycle === 'YEARLY' ? 'active' : ''}`}
                      onClick={() => handleCycleChange('YEARLY')}
                    >
                      Yearly
                    </button>
                    <button
                      type="button"
                      className={`cycle-pill-btn ${formData.billing_cycle === 'MONTHLY' ? 'active' : ''}`}
                      onClick={() => handleCycleChange('MONTHLY')}
                    >
                      Monthly
                    </button>
                  </div>
                </div>

                {/* Dates Row */}
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Start Date *</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={e => handleStartDateChange(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>End / Expiry Date *</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Amount + Status Row */}
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Amount Collected (₹) *</label>
                    <input
                      type="number"
                      value={formData.last_paid_amount}
                      onChange={e => setFormData(prev => ({ ...prev, last_paid_amount: e.target.value }))}
                      required
                      min="0"
                    />
                  </div>
                  <div className="form-field">
                    <label>Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="TRIAL">TRIAL</option>
                      <option value="EXPIRED">EXPIRED</option>
                    </select>
                  </div>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="pill-btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="pill-btn-primary" disabled={saving}>
                  {saving ? 'Activating...' : 'Activate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SubscriptionsList;
