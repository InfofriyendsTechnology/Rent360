import React, { useState, useEffect } from 'react';
import { 
  FiUsers, FiCalendar, FiDollarSign, FiClock, 
  FiArrowUpRight, FiBox, FiShield, FiPlus, FiCheckCircle
} from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Skeleton } from '../../components/ui/Skeleton/Skeleton';
import { API_BASE_URL } from '../../config/api';
import './DashboardHome.scss';

const StoreDashboard = () => {
  const { user, token } = useSelector((state) => state.auth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/analytics/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data.data);
    } catch (err) {
      console.error('Error fetching store stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const storeName = user?.store?.name || 'Store';

  return (
    <div className="superadmin-dashboard">
      {/* Top Hero Bar */}
      <div className="dashboard-hero-bar">
        <div className="hero-text">
          <div className="hero-badge">
            <span className="pulse-dot" />
            <span>Store Overview · {storeName}</span>
          </div>
          <h1 className="hero-title">{getGreeting()}, {user?.name || 'Store Admin'}</h1>
          <p className="hero-subtitle">
            Manage your daily rental operations, bookings, staff members, and customers.
          </p>
        </div>

        <div className="hero-actions">
          <Link to="/customers" className="hero-pill-btn">
            <FiPlus />
            <span>New Customer</span>
          </Link>
        </div>
      </div>

      {/* 4 KPI Bento Cards */}
      <div className="metrics-bento-grid">
        {/* KPI 1: Active Bookings */}
        <div className="bento-kpi-card">
          <div className="kpi-top">
            <span className="kpi-tag">1. Active Bookings</span>
            <div className="kpi-icon-pill">
              <FiCalendar />
            </div>
          </div>
          <div className="kpi-figure">
            {loading ? <Skeleton width="60px" height="36px" /> : stats?.activeBookings || 0}
          </div>
          <div className="kpi-bottom">
            <span className="trend-badge">
              <FiCheckCircle /> Live pipeline
            </span>
            <span className="kpi-caption">upcoming & active</span>
          </div>
        </div>

        {/* KPI 2: Total Customers */}
        <div className="bento-kpi-card">
          <div className="kpi-top">
            <span className="kpi-tag">2. Registered Customers</span>
            <div className="kpi-icon-pill">
              <FiUsers />
            </div>
          </div>
          <div className="kpi-figure">
            {loading ? <Skeleton width="60px" height="36px" /> : stats?.totalCustomers || 0}
          </div>
          <div className="kpi-bottom">
            <span className="trend-badge highlight">
              <FiArrowUpRight /> Client database
            </span>
            <span className="kpi-caption">total clients</span>
          </div>
        </div>

        {/* KPI 3: Today's Income */}
        <div className="bento-kpi-card">
          <div className="kpi-top">
            <span className="kpi-tag">3. Today's Inflow</span>
            <div className="kpi-icon-pill">
              <FiDollarSign />
            </div>
          </div>
          <div className="kpi-figure">
            {loading ? <Skeleton width="90px" height="36px" /> : `₹${(stats?.todaysIncome || 0).toLocaleString('en-IN')}`}
          </div>
          <div className="kpi-bottom">
            <span className="trend-badge highlight">
              <FiArrowUpRight /> Today
            </span>
            <span className="kpi-caption">credits recorded</span>
          </div>
        </div>

        {/* KPI 4: Today's Expense */}
        <div className="bento-kpi-card">
          <div className="kpi-top">
            <span className="kpi-tag">4. Today's Outflow</span>
            <div className="kpi-icon-pill">
              <FiDollarSign />
            </div>
          </div>
          <div className="kpi-figure">
            {loading ? <Skeleton width="90px" height="36px" /> : `₹${(stats?.todaysExpense || 0).toLocaleString('en-IN')}`}
          </div>
          <div className="kpi-bottom">
            <span className="trend-badge">
              <FiClock /> Expenses
            </span>
            <span className="kpi-caption">debits recorded</span>
          </div>
        </div>
      </div>

      {/* Quick Action Modules */}
      <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        <Link to="/collection" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="bento-kpi-card" style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}>
            <div className="kpi-top">
              <span className="kpi-tag">COLLECTION</span>
              <div className="kpi-icon-pill"><FiBox /></div>
            </div>
            <div style={{ marginTop: '12px', fontSize: '16px', fontWeight: '600' }}>Manage Collection</div>
            <p style={{ margin: '6px 0 0 0', fontSize: '13px', opacity: 0.7 }}>Browse and manage outfits, accessories and items</p>
          </div>
        </Link>

        <Link to="/customers" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="bento-kpi-card" style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}>
            <div className="kpi-top">
              <span className="kpi-tag">CUSTOMERS</span>
              <div className="kpi-icon-pill"><FiUsers /></div>
            </div>
            <div style={{ marginTop: '12px', fontSize: '16px', fontWeight: '600' }}>Customer Profiles</div>
            <p style={{ margin: '6px 0 0 0', fontSize: '13px', opacity: 0.7 }}>Manage client records, booking history & contact info</p>
          </div>
        </Link>

        <Link to="/staff" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="bento-kpi-card" style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}>
            <div className="kpi-top">
              <span className="kpi-tag">TEAM</span>
              <div className="kpi-icon-pill"><FiUsers /></div>
            </div>
            <div style={{ marginTop: '12px', fontSize: '16px', fontWeight: '600' }}>Team Members</div>
            <p style={{ margin: '6px 0 0 0', fontSize: '13px', opacity: 0.7 }}>Invite staff and assign permissions</p>
          </div>
        </Link>

        <Link to="/roles" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="bento-kpi-card" style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}>
            <div className="kpi-top">
              <span className="kpi-tag">PERMISSIONS</span>
              <div className="kpi-icon-pill"><FiShield /></div>
            </div>
            <div style={{ marginTop: '12px', fontSize: '16px', fontWeight: '600' }}>Roles & Access</div>
            <p style={{ margin: '6px 0 0 0', fontSize: '13px', opacity: 0.7 }}>Configure custom roles and feature access</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default StoreDashboard;
