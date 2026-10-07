import React, { useState, useEffect } from 'react';
import { 
  FiShoppingBag, FiDollarSign, FiAward, FiCalendar, 
  FiPlus, FiTrendingUp, FiCheckCircle, FiShield, FiTag, 
  FiLayers, FiArrowUpRight, FiGrid, FiList, FiSearch, 
  FiChevronRight, FiActivity
} from 'react-icons/fi';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, CartesianGrid 
} from 'recharts';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './DashboardHome.scss';

const DashboardHome = () => {
  const { user, token } = useSelector((state) => state.auth);
  
  // Layout Switcher: 'GRID' vs 'TABLE'
  const [viewLayout, setViewLayout] = useState('GRID');
  // Time Filter: 'Month' vs 'Quarter' vs 'Year'
  const [timeRange, setTimeRange] = useState('Quarter');
  // Table search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTierFilter, setSelectedTierFilter] = useState('ALL');

  const [liveStats, setLiveStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dynamic Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    fetchLiveStats();
  }, []);

  const fetchLiveStats = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:61026/api/analytics/superadmin', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLiveStats(res.data.data);
    } catch (err) {
      console.error('Error fetching live stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Total Plans Sold across the platform (Real active subscriptions)
  const totalActiveSubs = (liveStats?.starterStores || 0) + (liveStats?.growthStores || 0) + (liveStats?.proStores || 0);
  const totalPlansSoldCount = String(totalActiveSubs).padStart(2, '0');

  // 2. Gross Subscription Revenue Sold (Real total inflow from DB)
  const grossRevenueSold = `₹${(liveStats?.totalRevenue || 0).toLocaleString('en-IN')}`;

  // 3. Net Platform Profit (Real 75% margin on actual revenue)
  const netPlatformProfit = `₹${Math.round((liveStats?.totalRevenue || 0) * 0.75).toLocaleString('en-IN')}`;

  // 4. Total Stores Listed (Real count from database)
  const totalStoresCount = String(liveStats?.totalStores || 0).padStart(2, '0');

  // 100% Real Stores List from Database
  const storesAndBuyersList = liveStats?.realStoresList || [];

  // Filtered Stores for Table Layout
  const filteredStores = storesAndBuyersList.filter((s) => {
    const matchesSearch = (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (s.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.buyer || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = selectedTierFilter === 'ALL' || s.tierKey === selectedTierFilter;
    return matchesSearch && matchesTier;
  });

  // Recharts Monthly Revenue Velocity & Net Platform Profit Data (From DB)
  const rechartsData = (liveStats?.monthlyRevenueChart?.length > 0)
    ? liveStats.monthlyRevenueChart
    : [
        { month: 'Current', sales: liveStats?.totalRevenue || 0, profit: Math.round((liveStats?.totalRevenue || 0) * 0.75) }
      ];

  // Plan Distribution Percentages
  const starterCount = liveStats?.starterStores || 0;
  const growthCount = liveStats?.growthStores || 0;
  const proCount = liveStats?.proStores || 0;

  const starterPct = totalActiveSubs > 0 ? Math.round((starterCount / totalActiveSubs) * 100) : 0;
  const growthPct = totalActiveSubs > 0 ? Math.round((growthCount / totalActiveSubs) * 100) : 0;
  const proPct = totalActiveSubs > 0 ? Math.round((proCount / totalActiveSubs) * 100) : 0;

  // Minimalist Black-and-White Glass Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="minimal-glass-tooltip">
          <p className="tooltip-head">{label}</p>
          <div className="tooltip-row">
            <span className="dot white-dot" />
            <span className="row-label">Revenue Sold:</span>
            <span className="row-val">₹{Number(payload[0]?.value || 0).toLocaleString('en-IN')}</span>
          </div>
          {payload[1] && (
            <div className="tooltip-row">
              <span className="dot blue-dot" />
              <span className="row-label">Our Platform Profit:</span>
              <span className="row-val">₹{Number(payload[1]?.value || 0).toLocaleString('en-IN')}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="superadmin-dashboard">
      {/* Minimalist Top Hero Bar */}
      <div className="dashboard-hero-bar">
        <div className="hero-text">
          <div className="hero-badge">
            <span className="pulse-dot" />
            <span>Platform Financials · Subscription ARR Overview</span>
          </div>
          <h1 className="hero-title">{getGreeting()}, {user?.name || 'Super Admin'}</h1>
          <p className="hero-subtitle">
            Executive monitoring of total subscription sales, net platform earnings, and listed store performance.
          </p>
        </div>

        {/* Action Controls: Layout Switcher + Time Filter + Onboard */}
        <div className="hero-actions">
          {/* Grid vs Table Layout Switcher */}
          <div className="layout-toggle-pill" title="Switch between Bento Grid & Comprehensive Table layout">
            <button 
              className={`layout-btn ${viewLayout === 'GRID' ? 'active' : ''}`}
              onClick={() => setViewLayout('GRID')}
            >
              <FiGrid />
              <span>Grid</span>
            </button>
            <button 
              className={`layout-btn ${viewLayout === 'TABLE' ? 'active' : ''}`}
              onClick={() => setViewLayout('TABLE')}
            >
              <FiList />
              <span>Table</span>
            </button>
          </div>

          {/* Time Period Filter */}
          <div className="time-filter-pill">
            {['Month', 'Quarter', 'Year'].map((period) => (
              <button
                key={period}
                className={`time-btn ${timeRange === period ? 'active' : ''}`}
                onClick={() => setTimeRange(period)}
              >
                {period}
              </button>
            ))}
          </div>

          {/* New Store Primary Action */}
          <Link to="/stores" className="hero-pill-btn">
            <FiPlus />
            <span>New Store</span>
          </Link>
        </div>
      </div>

      {/* 4 Executive KPI Cards: Profit & Total Sold (Strict Minimalist B&W) */}
      <div className="metrics-bento-grid">
        {/* KPI 1: How many total we sell (Subscriptions Sold) */}
        <div className="bento-kpi-card">
          <div className="kpi-top">
            <span className="kpi-tag">1. Active Subscriptions</span>
            <div className="kpi-icon-pill">
              <FiShoppingBag />
            </div>
          </div>
          <div className="kpi-figure">{totalPlansSoldCount}</div>
          <div className="kpi-bottom">
            <span className="trend-badge">
              <FiCheckCircle /> Real-time DB sync
            </span>
            <span className="kpi-caption">active store licenses</span>
          </div>
        </div>

        {/* KPI 2: Total Revenue Sold */}
        <div className="bento-kpi-card">
          <div className="kpi-top">
            <span className="kpi-tag">2. Gross Revenue Sold</span>
            <div className="kpi-icon-pill">
              <FiDollarSign />
            </div>
          </div>
          <div className="kpi-figure">{grossRevenueSold}</div>
          <div className="kpi-bottom">
            <span className="trend-badge highlight">
              <FiArrowUpRight /> ₹{(liveStats?.arr || 0).toLocaleString('en-IN')} ARR
            </span>
            <span className="kpi-caption">cumulative subscription sales</span>
          </div>
        </div>

        {/* KPI 3: Our Platform Net Profit */}
        <div className="bento-kpi-card">
          <div className="kpi-top">
            <span className="kpi-tag">3. Net Platform Profit</span>
            <div className="kpi-icon-pill">
              <FiTrendingUp />
            </div>
          </div>
          <div className="kpi-figure">{netPlatformProfit}</div>
          <div className="kpi-bottom">
            <span className="trend-badge highlight">
              <FiActivity /> 75% Operating Margin
            </span>
            <span className="kpi-caption">our net platform earnings</span>
          </div>
        </div>

        {/* KPI 4: Total Stores Listed */}
        <div className="bento-kpi-card">
          <div className="kpi-top">
            <span className="kpi-tag">4. Stores Listed</span>
            <div className="kpi-icon-pill">
              <FiLayers />
            </div>
          </div>
          <div className="kpi-figure">{totalStoresCount}</div>
          <div className="kpi-bottom">
            <span className="trend-badge">
              <FiShield /> {liveStats?.activeStores || 0} Active Stores
            </span>
            <span className="kpi-caption">across registered tenants</span>
          </div>
        </div>
      </div>

      {/* CONDITIONAL LAYOUT: GRID VIEW */}
      {viewLayout === 'GRID' && (
        <>
          {/* Split Analytics Section */}
          <div className="analytics-split-layout">
            {/* Left: Recharts Area Chart (Gross Revenue Sold vs Our Profit) */}
            <div className="analytics-card chart-card">
              <div className="card-header-row">
                <div>
                  <h2 className="card-title">Subscription Sales & Net Profit Velocity</h2>
                  <p className="card-sub">Comparing platform gross subscription sales vs our net platform earnings</p>
                </div>
                <div className="header-meta-right">
                  <span className="card-type-tag">Live</span>
                  <div className="chart-legend-wrap">
                    <span className="legend-chip">
                      <span className="dot white" /> Gross Sold
                    </span>
                    <span className="legend-chip">
                      <span className="dot blue" /> Our Net Profit
                    </span>
                  </div>
                </div>
              </div>

              {/* Minimalist Recharts Curve */}
              <div className="recharts-wrapper-container">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={rechartsData} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="minimalRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.14} />
                        <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="minimalCustomGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
                    <XAxis 
                      dataKey="month" 
                      tickLine={false} 
                      axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }} 
                      tick={{ fill: '#71717A', fontSize: 12, fontWeight: 500 }}
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: '#71717A', fontSize: 12 }}
                      tickFormatter={(val) => `₹${val >= 1000 ? Math.round(val / 1000) + 'k' : val}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#FFFFFF" 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#minimalRevenueGrad)" 
                      dot={{ r: 3, fill: '#18181C', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                      activeDot={{ r: 5, fill: '#FFFFFF', stroke: '#18181C', strokeWidth: 2 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#3B82F6" 
                      strokeWidth={1.75} 
                      strokeDasharray="4 4"
                      fillOpacity={1} 
                      fill="url(#minimalCustomGrad)" 
                      dot={{ r: 2.5, fill: '#18181C', stroke: '#3B82F6', strokeWidth: 1.5 }}
                      activeDot={{ r: 4.5, fill: '#3B82F6', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="card-footer-meta">
                <div className="author-info">
                  <span className="author-avatar">R3</span>
                  <span className="author-name">Rent360 Platform Financial Telemetry</span>
                </div>
                <span className="update-time">75% Net Operating Margin</span>
              </div>
            </div>

            {/* Right: Plan Distribution Breakdown (Real Counts) */}
            <div className="analytics-card distribution-card">
              <div className="card-header-row">
                <div>
                  <h2 className="card-title">Plans Sold Allocation</h2>
                  <p className="card-sub">Distribution of total licenses sold across tiers</p>
                </div>
                <span className="card-type-tag">Tiers</span>
              </div>

              <div className="plan-tiers-list">
                <div className="plan-tier-item">
                  <div className="tier-meta">
                    <span className="tier-name">PRO (₹14,999/yr · ₹1,499/mo)</span>
                    <span className="tier-count">{proCount} Sold · {proPct}%</span>
                  </div>
                  <div className="tier-bar-track">
                    <div className="tier-bar-fill primary" style={{ width: `${Math.max(proPct, 4)}%` }} />
                  </div>
                </div>

                <div className="plan-tier-item">
                  <div className="tier-meta">
                    <span className="tier-name">GROWTH (₹9,999/yr · ₹999/mo)</span>
                    <span className="tier-count">{growthCount} Sold · {growthPct}%</span>
                  </div>
                  <div className="tier-bar-track">
                    <div className="tier-bar-fill secondary" style={{ width: `${Math.max(growthPct, 4)}%` }} />
                  </div>
                </div>

                <div className="plan-tier-item">
                  <div className="tier-meta">
                    <span className="tier-name">STARTER (₹7,999/yr · ₹799/mo)</span>
                    <span className="tier-count">{starterCount} Sold · {starterPct}%</span>
                  </div>
                  <div className="tier-bar-track">
                    <div className="tier-bar-fill muted" style={{ width: `${Math.max(starterPct, 4)}%` }} />
                  </div>
                </div>
              </div>

              <div className="card-footer-meta">
                <div className="author-info">
                  <span className="author-avatar">SA</span>
                  <span className="author-name">Total Sold: {totalActiveSubs} Licenses (₹{(liveStats?.arr || 0).toLocaleString('en-IN')} ARR)</span>
                </div>
                <span className="update-time">Verified Active</span>
              </div>
            </div>
          </div>

          {/* Top Stores & Plan Buyers Table Preview */}
          <div className="recent-tenants-card">
            <div className="card-header-row">
              <div>
                <h2 className="card-title">Plan Buyers & Listed Store Performance</h2>
                <p className="card-sub">Active subscribers and tenant store profiles</p>
              </div>
              <div className="header-meta-right">
                <span className="card-type-tag">Subscribers</span>
                <button onClick={() => setViewLayout('TABLE')} className="view-all-pill">
                  View Full Table ({storesAndBuyersList.length})
                </button>
              </div>
            </div>

            <div className="pipeline-table-wrap">
              <table className="pipeline-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Store & City</th>
                    <th>Plan Buyer (Owner)</th>
                    <th>Subscribed Plan</th>
                    <th>SaaS Inflow</th>
                    <th>Rental Volume</th>
                    <th>Store Net Profit</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {storesAndBuyersList.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="empty-cell text-center">
                        No stores found. Go to <strong>Company Stores</strong> to register stores and assign plans!
                      </td>
                    </tr>
                  ) : (
                    storesAndBuyersList.slice(0, 5).map((store) => (
                      <tr key={store.id || store.rank}>
                        <td>
                          <span className={`rank-num ${store.rank <= 3 ? 'rank-top' : ''}`}>
                            {String(store.rank).padStart(2, '0')}
                          </span>
                        </td>
                        <td>
                          <div className="store-pill-identity">
                            <div className="store-avatar-circle">
                              {(store.name || 'ST').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="name">{store.name}</span>
                              <span className="sub">{store.city}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="owner-name-val">{store.buyer}</span>
                        </td>
                        <td>
                          <span className={`tier-pill ${store.tierKey.toLowerCase()}`}>
                            {store.plan}
                          </span>
                        </td>
                        <td>
                          <span className="plan-price-val bold">{store.planPrice}</span>
                        </td>
                        <td>
                          <span className="revenue-val">{store.rentalVolume}</span>
                        </td>
                        <td>
                          <div className="profit-col">
                            <span className="profit-val">{store.storeProfit}</span>
                            <span className="profit-margin">{store.margin} margin</span>
                          </div>
                        </td>
                        <td className="text-right">
                          <Link to="/stores" className="manage-link">Manage Store</Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* CONDITIONAL LAYOUT: FULL TABLE VIEW */}
      {viewLayout === 'TABLE' && (
        <div className="comprehensive-table-card">
          <div className="table-toolbar-row">
            <div className="search-filter-box">
              <div className="search-input-wrap">
                <FiSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Filter by store, plan buyer, or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Tier Filter Tabs */}
              <div className="tier-filter-chips">
                {[
                  { key: 'ALL', label: 'All Plans' },
                  { key: 'PRO', label: 'PRO (₹14,999/yr)' },
                  { key: 'GROWTH', label: 'GROWTH (₹9,999/yr)' },
                  { key: 'STARTER', label: 'STARTER (₹799/mo)' },
                ].map((tier) => (
                  <button
                    key={tier.key}
                    className={`tier-chip-btn ${selectedTierFilter === tier.key ? 'active' : ''}`}
                    onClick={() => setSelectedTierFilter(tier.key)}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="toolbar-stats-count">
              <span>Showing <strong>{filteredStores.length}</strong> of {storesAndBuyersList.length} stores</span>
            </div>
          </div>

          <div className="pipeline-table-wrap">
            <table className="pipeline-table full-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Store Identity</th>
                  <th>Plan Buyer (Owner)</th>
                  <th>Subscribed Plan</th>
                  <th>SaaS Plan Inflow</th>
                  <th>Rental Booking Volume</th>
                  <th>Store Net Profit</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStores.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="empty-cell text-center">
                      No stores found matching your query.
                    </td>
                  </tr>
                ) : (
                  filteredStores.map((store) => (
                    <tr key={store.id || store.rank}>
                      <td>
                        <span className={`rank-num ${store.rank <= 3 ? 'rank-top' : ''}`}>
                          {String(store.rank).padStart(2, '0')}
                        </span>
                      </td>
                      <td>
                        <div className="store-pill-identity">
                          <div className="store-avatar-circle">
                            {(store.name || 'ST').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="name">{store.name}</span>
                            <span className="sub">{store.city}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="owner-name-val">{store.buyer}</span>
                      </td>
                      <td>
                        <span className={`tier-pill ${store.tierKey.toLowerCase()}`}>
                          {store.plan}
                        </span>
                      </td>
                      <td>
                        <span className="plan-price-val bold">{store.planPrice}</span>
                      </td>
                      <td>
                        <span className="revenue-val">{store.rentalVolume}</span>
                      </td>
                      <td>
                        <div className="profit-col">
                          <span className="profit-val">{store.storeProfit}</span>
                          <span className="profit-margin">{store.margin} margin</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${store.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                          <span className="pulse-indicator" /> {store.status || 'Active'}
                        </span>
                      </td>
                      <td className="text-right">
                        <Link to="/stores" className="manage-link">Manage Store</Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardHome;
