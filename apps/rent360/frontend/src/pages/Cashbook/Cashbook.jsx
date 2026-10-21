import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FiDollarSign, FiPlus, FiSearch, FiFilter, FiCalendar, 
  FiArrowDownLeft, FiArrowUpRight, FiTrash2, FiEdit2, FiPrinter, 
  FiDownload, FiRefreshCw, FiClock, FiFileText, FiTag, 
  FiCreditCard, FiCheckCircle, FiAlertCircle, FiX, FiTrendingUp
} from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import AddTransactionModal from './AddTransactionModal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import './Cashbook.scss';

const Cashbook = () => {
  const { user, token } = useSelector((state) => state.auth);
    const isSuperAdmin = user?.role === 'SUPER_ADMIN' || !user?.role;
  if (isSuperAdmin) {
    return <Navigate to="/stores" replace />;
  }
  const userStoreId = user?.store?.id || user?.storeId || '';

  const selectedStoreId = userStoreId;

  // Main Data
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalCredit: 0,
    totalDebit: 0,
    netBalance: 0,
    cashBalance: 0,
    cashInDrawer: 0,
    bankBalance: 0,
    cashCredit: 0,
    cashDebit: 0,
    bankCredit: 0,
    bankDebit: 0,
    count: 0
  });
  const [loading, setLoading] = useState(true);

  // Masters
  const [paymentModes, setPaymentModes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);

  // Filters
  const [datePreset, setDatePreset] = useState('today'); // 'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'CREDIT' | 'DEBIT'
  const [accountScope, setAccountScope] = useState('ALL'); // 'ALL' | 'CASH' | 'BANK'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedMode, setSelectedMode] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [txToEdit, setTxToEdit] = useState(null);
  const [txToDelete, setTxToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);


  // Fetch Master Data (Payment Modes, Categories, Bank Accounts)
  useEffect(() => {
    if (!selectedStoreId) return;
    fetchMasters();
  }, [selectedStoreId]);

  const fetchMasters = async () => {
    try {
      const storeParam = selectedStoreId ? `?storeId=${selectedStoreId}` : '';
      const [modesRes, catsRes, accountsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/paymentModes${storeParam}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_BASE_URL}/api/transactionCategories${storeParam}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_BASE_URL}/api/storeBankAccounts${storeParam}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: [] } }))
      ]);

      setPaymentModes(modesRes.data.data || []);
      setCategories(catsRes.data.data || []);
      setBankAccounts(accountsRes.data.data || []);
    } catch (err) {
      console.error('Error loading master data:', err);
    }
  };

  // Helper to compute date range query
  const getDateRange = () => {
    const now = new Date();
    const formatDate = (d) => d.toISOString().split('T')[0];

    if (datePreset === 'today') {
      const todayStr = formatDate(now);
      return { startDate: todayStr, endDate: todayStr };
    }
    if (datePreset === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = formatDate(y);
      return { startDate: yStr, endDate: yStr };
    }
    if (datePreset === 'week') {
      const w = new Date(now);
      w.setDate(w.getDate() - 7);
      return { startDate: formatDate(w), endDate: formatDate(now) };
    }
    if (datePreset === 'month') {
      const m = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: formatDate(m), endDate: formatDate(now) };
    }
    if (datePreset === 'custom') {
      return { startDate: customStartDate || '', endDate: customEndDate || '' };
    }
    return { startDate: '', endDate: '' };
  };

  // Fetch Transactions on filter changes
  useEffect(() => {
    fetchTransactions();
  }, [selectedStoreId, datePreset, customStartDate, customEndDate, typeFilter, selectedCategory, selectedMode]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStoreId) params.append('storeId', selectedStoreId);
      if (typeFilter !== 'ALL') params.append('type', typeFilter);
      if (selectedCategory !== 'ALL') params.append('categoryId', selectedCategory);
      if (selectedMode !== 'ALL') params.append('paymentModeId', selectedMode);

      const { startDate, endDate } = getDateRange();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await axios.get(`${API_BASE_URL}/api/transactions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const responseData = res.data.data || {};
      setTransactions(responseData.transactions || []);
      setSummary(responseData.summary || {
        totalCredit: 0,
        totalDebit: 0,
        netBalance: 0,
        cashBalance: 0,
        cashInDrawer: 0,
        bankBalance: 0,
        cashCredit: 0,
        cashDebit: 0,
        bankCredit: 0,
        bankDebit: 0,
        count: 0
      });
    } catch (err) {
      toast.error('Failed to load cashbook transactions');
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering (Search + Account Scope: All, Cash Only, Bank Only)
  const filteredTransactions = useMemo(() => {
    let list = transactions;

    if (accountScope === 'CASH') {
      list = list.filter((tx) => (tx.paymentMode?.name || '').toLowerCase().includes('cash'));
    } else if (accountScope === 'BANK') {
      list = list.filter((tx) => !(tx.paymentMode?.name || '').toLowerCase().includes('cash'));
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((tx) => {
      const matchRef = tx.reference_no?.toLowerCase().includes(q);
      const matchRemarks = tx.remarks?.toLowerCase().includes(q);
      const matchCat = tx.transactionCategory?.name?.toLowerCase().includes(q);
      const matchStaff = tx.performedBy?.name?.toLowerCase().includes(q);
      const matchBooking = tx.booking?.booking_no?.toLowerCase().includes(q);
      const matchCustomer = tx.booking?.customer?.full_name?.toLowerCase().includes(q);
      const matchAmount = String(tx.amount).includes(q);

      return matchRef || matchRemarks || matchCat || matchStaff || matchBooking || matchCustomer || matchAmount;
    });
  }, [transactions, accountScope, searchQuery]);

  // Dynamic scoped financial summary based on active filters and account scope
  const scopedSummary = useMemo(() => {
    let totalCredit = 0;
    let totalDebit = 0;
    let cashCredit = 0;
    let cashDebit = 0;
    let bankCredit = 0;
    let bankDebit = 0;

    filteredTransactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      const isCredit = tx.transaction_type === 'CREDIT';
      const isCash = (tx.paymentMode?.name || '').toLowerCase().includes('cash');

      if (isCredit) {
        totalCredit += amt;
        if (isCash) cashCredit += amt;
        else bankCredit += amt;
      } else {
        totalDebit += amt;
        if (isCash) cashDebit += amt;
        else bankDebit += amt;
      }
    });

    return {
      totalCredit,
      totalDebit,
      netBalance: totalCredit - totalDebit,
      cashBalance: cashCredit - cashDebit,
      cashCredit,
      cashDebit,
      bankBalance: bankCredit - bankDebit,
      bankCredit,
      bankDebit,
      count: filteredTransactions.length
    };
  }, [filteredTransactions]);

  // Delete transaction handler
  const handleDeleteTransaction = async () => {
    if (!txToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${API_BASE_URL}/api/transactions/${txToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Transaction deleted');
      setTxToDelete(null);
      fetchTransactions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete transaction');
    } finally {
      setIsDeleting(false);
    }
  };

  // Print Daily Cashbook Sheet
  const handlePrint = () => {
    window.print();
  };

  // Format currency
  const formatINR = (val) => {
    return Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  // Format timestamp
  const formatDateTime = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="cashbook-page-view">
      {/* Top Header Bar */}
      <div className="cashbook-top-bar no-print">
        <div className="title-area">
          <div className="title-row">
            <h1 className="main-heading">Cashbook</h1>
            <div className="live-pill">
              <span className="dot" />
              <span>
                {scopedSummary.count} {accountScope === 'CASH' ? 'Cash ' : accountScope === 'BANK' ? 'Bank ' : ''}{scopedSummary.count === 1 ? 'Record' : 'Records'}
              </span>
            </div>
          </div>
          <p className="sub-heading">
            Track daily rental income, security deposits, petty cash expenses, and payment settlements
          </p>
        </div>

        <div className="top-actions-wrap">

          <button
            type="button"
            className="btn-pill-outline"
            onClick={handlePrint}
            title="Print Cashbook Summary"
          >
            <FiPrinter />
            <span>Print Sheet</span>
          </button>

          <button
            type="button"
            className="btn-pill-primary"
            onClick={() => {
              setTxToEdit(null);
              setIsAddModalOpen(true);
            }}
          >
            <FiPlus className="plus-icon" />
            <span>Record Entry</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Metric Cards (Clean Bento Style) */}
      <div className="financial-kpi-grid">
        {accountScope === 'CASH' ? (
          <>
            {/* Cash in Hand */}
            <div 
              className="kpi-bento-card active-filter"
              onClick={() => setAccountScope('ALL')}
              role="button"
              tabIndex={0}
              title="Viewing Cash Only - Click to show All accounts"
            >
              <div className="kpi-top">
                <span className="kpi-tag">Cash in Hand</span>
                <span className="kpi-icon-pill"><FiDollarSign /></span>
              </div>
              <div className="kpi-figure">₹ {formatINR(scopedSummary.cashBalance)}</div>
              <div className="kpi-bottom">
                <span className="kpi-hint">Physical cash in drawer</span>
              </div>
            </div>

            {/* Total Cash In */}
            <div className="kpi-bento-card">
              <div className="kpi-top">
                <span className="kpi-tag">Total Cash In</span>
                <span className="kpi-icon-pill"><FiArrowDownLeft /></span>
              </div>
              <div className="kpi-figure">₹ {formatINR(scopedSummary.cashCredit)}</div>
              <div className="kpi-bottom">
                <span className="kpi-hint">Cash received & collected</span>
              </div>
            </div>

            {/* Total Cash Out */}
            <div className="kpi-bento-card">
              <div className="kpi-top">
                <span className="kpi-tag">Total Cash Out</span>
                <span className="kpi-icon-pill"><FiArrowUpRight /></span>
              </div>
              <div className="kpi-figure">₹ {formatINR(scopedSummary.cashDebit)}</div>
              <div className="kpi-bottom">
                <span className="kpi-hint">Cash expenses & refunds</span>
              </div>
            </div>

            {/* Cash Net Balance */}
            <div className="kpi-bento-card">
              <div className="kpi-top">
                <span className="kpi-tag">Cash Net Balance</span>
                <span className="kpi-icon-pill"><FiTrendingUp /></span>
              </div>
              <div className="kpi-figure">₹ {formatINR(scopedSummary.cashBalance)}</div>
              <div className="kpi-bottom">
                <span className="kpi-hint">Cash In minus Cash Out</span>
              </div>
            </div>
          </>
        ) : accountScope === 'BANK' ? (
          <>
            {/* Bank Balance */}
            <div 
              className="kpi-bento-card active-filter"
              onClick={() => setAccountScope('ALL')}
              role="button"
              tabIndex={0}
              title="Viewing Bank & UPI Only - Click to show All accounts"
            >
              <div className="kpi-top">
                <span className="kpi-tag">Bank & UPI Balance</span>
                <span className="kpi-icon-pill"><FiCreditCard /></span>
              </div>
              <div className="kpi-figure">₹ {formatINR(scopedSummary.bankBalance)}</div>
              <div className="kpi-bottom">
                <span className="kpi-hint">Online accounts & QR</span>
              </div>
            </div>

            {/* Total Bank In */}
            <div className="kpi-bento-card">
              <div className="kpi-top">
                <span className="kpi-tag">Total Bank In</span>
                <span className="kpi-icon-pill"><FiArrowDownLeft /></span>
              </div>
              <div className="kpi-figure">₹ {formatINR(scopedSummary.bankCredit)}</div>
              <div className="kpi-bottom">
                <span className="kpi-hint">UPI & online deposits</span>
              </div>
            </div>

            {/* Total Bank Out */}
            <div className="kpi-bento-card">
              <div className="kpi-top">
                <span className="kpi-tag">Total Bank Out</span>
                <span className="kpi-icon-pill"><FiArrowUpRight /></span>
              </div>
              <div className="kpi-figure">₹ {formatINR(scopedSummary.bankDebit)}</div>
              <div className="kpi-bottom">
                <span className="kpi-hint">Bank transfers & refunds</span>
              </div>
            </div>

            {/* Bank Net Balance */}
            <div className="kpi-bento-card">
              <div className="kpi-top">
                <span className="kpi-tag">Bank Net Balance</span>
                <span className="kpi-icon-pill"><FiTrendingUp /></span>
              </div>
              <div className="kpi-figure">₹ {formatINR(scopedSummary.bankBalance)}</div>
              <div className="kpi-bottom">
                <span className="kpi-hint">Bank In minus Bank Out</span>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Cash in Hand */}
            <div 
              className="kpi-bento-card"
              onClick={() => setAccountScope('CASH')}
              role="button"
              tabIndex={0}
              title="Click to filter Cash transactions"
            >
              <div className="kpi-top">
                <span className="kpi-tag">Cash in Hand</span>
                <span className="kpi-icon-pill"><FiDollarSign /></span>
              </div>
              <div className="kpi-figure">₹ {formatINR(scopedSummary.cashBalance)}</div>
              <div className="kpi-bottom">
                <span className="kpi-hint">Physical cash in drawer</span>
              </div>
            </div>

            {/* Bank & Online (UPI / QR) */}
            <div 
              className="kpi-bento-card"
              onClick={() => setAccountScope('BANK')}
              role="button"
              tabIndex={0}
              title="Click to filter Bank & UPI transactions"
            >
              <div className="kpi-top">
                <span className="kpi-tag">Bank & UPI</span>
                <span className="kpi-icon-pill"><FiCreditCard /></span>
              </div>
              <div className="kpi-figure">₹ {formatINR(scopedSummary.bankBalance)}</div>
              <div className="kpi-bottom">
                <span className="kpi-hint">Online accounts & QR</span>
              </div>
            </div>

            {/* Total Net Balance */}
            <div 
              className="kpi-bento-card active-filter"
              onClick={() => setAccountScope('ALL')}
              role="button"
              tabIndex={0}
              title="Viewing All accounts"
            >
              <div className="kpi-top">
                <span className="kpi-tag">Net Balance</span>
                <span className="kpi-icon-pill"><FiTrendingUp /></span>
              </div>
              <div className="kpi-figure">₹ {formatINR(scopedSummary.netBalance)}</div>
              <div className="kpi-bottom">
                <span className="kpi-hint">Cash + Bank combined</span>
              </div>
            </div>

            {/* Total Expenses / Outflow */}
            <div className="kpi-bento-card">
              <div className="kpi-top">
                <span className="kpi-tag">Total Expenses</span>
                <span className="kpi-icon-pill"><FiArrowUpRight /></span>
              </div>
              <div className="kpi-figure">₹ {formatINR(scopedSummary.totalDebit)}</div>
              <div className="kpi-bottom">
                <span className="kpi-hint">Refunds & petty expenses</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Unified Main Card containing Toolbar + Content */}
      <div className="cashbook-main-card">
        {/* Card Toolbar with Filter Controls */}
        <div className="cashbook-card-toolbar no-print">
          {/* Row 1: Date Range Presets & Quick Search */}
          <div className="controls-row-top">
            <div className="date-preset-strip">
              <button
                type="button"
                className={`preset-pill ${datePreset === 'today' ? 'active' : ''}`}
                onClick={() => setDatePreset('today')}
              >
                Today
              </button>
              <button
                type="button"
                className={`preset-pill ${datePreset === 'yesterday' ? 'active' : ''}`}
                onClick={() => setDatePreset('yesterday')}
              >
                Yesterday
              </button>
              <button
                type="button"
                className={`preset-pill ${datePreset === 'week' ? 'active' : ''}`}
                onClick={() => setDatePreset('week')}
              >
                Last 7 Days
              </button>
              <button
                type="button"
                className={`preset-pill ${datePreset === 'month' ? 'active' : ''}`}
                onClick={() => setDatePreset('month')}
              >
                This Month
              </button>
              <button
                type="button"
                className={`preset-pill ${datePreset === 'all' ? 'active' : ''}`}
                onClick={() => setDatePreset('all')}
              >
                All Time
              </button>
              <button
                type="button"
                className={`preset-pill ${datePreset === 'custom' ? 'active' : ''}`}
                onClick={() => setDatePreset('custom')}
              >
                <FiCalendar /> Custom
              </button>

              {datePreset === 'custom' && (
                <div className="custom-date-inputs">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                  <span className="to-txt">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Quick Search Box */}
            <div className="search-pill-box">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search remarks, ref #, amount..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="clear-search"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  <FiX />
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Account Filter (Cash vs Bank) + Type (In / Out) + Category */}
          <div className="controls-row-bottom">
            {/* Account Filter Pills */}
            <div className="segmented-filter">
              <span className="filter-tag">Account:</span>
              <button
                type="button"
                className={`seg-pill ${accountScope === 'ALL' ? 'active' : ''}`}
                onClick={() => setAccountScope('ALL')}
              >
                All
              </button>
              <button
                type="button"
                className={`seg-pill ${accountScope === 'CASH' ? 'active' : ''}`}
                onClick={() => setAccountScope('CASH')}
              >
                <FiDollarSign /> Cash Only
              </button>
              <button
                type="button"
                className={`seg-pill ${accountScope === 'BANK' ? 'active' : ''}`}
                onClick={() => setAccountScope('BANK')}
              >
                <FiCreditCard /> Bank & UPI
              </button>
            </div>

            <div className="bottom-right-filters">
              {/* Type Filter Pills */}
              <div className="segmented-filter">
                <span className="filter-tag">Type:</span>
                <button
                  type="button"
                  className={`seg-pill ${typeFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setTypeFilter('ALL')}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`seg-pill credit ${typeFilter === 'CREDIT' ? 'active' : ''}`}
                  onClick={() => setTypeFilter('CREDIT')}
                >
                  <FiArrowDownLeft /> Cash In
                </button>
                <button
                  type="button"
                  className={`seg-pill debit ${typeFilter === 'DEBIT' ? 'active' : ''}`}
                  onClick={() => setTypeFilter('DEBIT')}
                >
                  <FiArrowUpRight /> Cash Out
                </button>
              </div>

              {/* Category Filter */}
              <div className="filter-dropdown-wrap">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Card Content Area */}
        <div className="cashbook-card-content">
          {loading ? (
            <div className="cashbook-loading-box">
              <FiRefreshCw className="spin-icon" />
              <span>Loading Cashbook Entries...</span>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="empty-cashbook-card">
              <div className="empty-icon-pill">
                <FiDollarSign />
              </div>
              <h3 className="empty-title">No Transactions Recorded</h3>
              <p className="empty-desc">
                {searchQuery || typeFilter !== 'ALL' || selectedCategory !== 'ALL' || selectedMode !== 'ALL'
                  ? 'No cashbook entries match your filters. Try clearing your search.'
                  : 'Keep your daily cash drawer balanced by recording your first transaction.'}
              </p>
              <div className="empty-actions">
                {searchQuery || typeFilter !== 'ALL' || selectedCategory !== 'ALL' || selectedMode !== 'ALL' ? (
                  <button
                    type="button"
                    className="btn-pill-secondary"
                    onClick={() => {
                      setTypeFilter('ALL');
                      setSelectedCategory('ALL');
                      setSelectedMode('ALL');
                      setSearchQuery('');
                      setDatePreset('today');
                    }}
                  >
                    Reset All Filters
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-pill-primary"
                    onClick={() => {
                      setTxToEdit(null);
                      setIsAddModalOpen(true);
                    }}
                  >
                    <FiPlus />
                    <span>Record First Transaction</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Transactions Table */
            <div className="cashbook-table-card">
              <div className="table-responsive">
                <table className="cashbook-table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Type</th>
                      <th>Category / Purpose</th>
                      <th>Payment Mode</th>
                      <th>Reference / Bill #</th>
                      <th>Logged By</th>
                      <th className="th-amount">Amount (₹)</th>
                      <th className="th-actions no-print">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx) => {
                      const isCredit = tx.transaction_type === 'CREDIT';
                      return (
                        <tr key={tx.id} className={isCredit ? 'row-credit' : 'row-debit'}>
                          {/* Date & Time */}
                          <td className="td-datetime">
                            <div className="datetime-cell">
                              <FiClock className="icon" />
                              <span>{formatDateTime(tx.createdAt)}</span>
                            </div>
                          </td>

                          {/* Type Badge */}
                          <td className="td-type">
                            <span className={`type-badge ${isCredit ? 'credit' : 'debit'}`}>
                              {isCredit ? (
                                <>
                                  <FiArrowDownLeft /> Cash In
                                </>
                              ) : (
                                <>
                                  <FiArrowUpRight /> Cash Out
                                </>
                              )}
                            </span>
                          </td>

                          {/* Category & Remarks */}
                          <td className="td-category">
                            <div className="cat-desc-cell">
                              <strong className="cat-name">
                                {tx.category?.name || 'General'}
                              </strong>
                              {tx.remarks && (
                                <span className="cat-remarks" title={tx.remarks}>
                                  {tx.remarks}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Payment Mode */}
                          <td className="td-mode">
                            <div className="mode-cell">
                              {(() => {
                                const modeName = (tx.paymentMode?.name || 'Cash').toLowerCase();
                                const isCash = modeName.includes('cash');
                                return (
                                  <span className={`mode-badge ${isCash ? 'cash' : 'bank'}`}>
                                    {isCash ? <FiDollarSign /> : <FiCreditCard />}
                                    <span>{tx.paymentMode?.name || 'Cash'}</span>
                                  </span>
                                );
                              })()}
                              {tx.bankAccount && !tx.bankAccount.account_name.toLowerCase().includes('drawer') && (
                                <span className="account-text">
                                  {tx.bankAccount.account_name}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Reference No */}
                          <td className="td-ref">
                            <span className="ref-code">
                              {tx.reference_no || '-'}
                            </span>
                          </td>

                          {/* Logged By */}
                          <td className="td-staff">
                            <span className="staff-name">
                              {tx.performedBy?.name || 'Admin'}
                            </span>
                          </td>

                          {/* Amount */}
                          <td className={`td-amount ${isCredit ? 'credit-text' : 'debit-text'}`}>
                            {isCredit ? '+ ' : '- '}₹ {formatINR(tx.amount)}
                          </td>

                          {/* Action */}
                          <td className="td-actions no-print">
                            <div className="actions-cell-wrap">
                              <button
                                type="button"
                                className="edit-icon-btn"
                                onClick={() => {
                                  setTxToEdit(tx);
                                  setIsAddModalOpen(true);
                                }}
                                title="Edit entry"
                              >
                                <FiEdit2 />
                              </button>
                              <button
                                type="button"
                                className="delete-icon-btn"
                                onClick={() => setTxToDelete(tx)}
                                title="Delete entry"
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
          )}
        </div>
      </div>

      {/* Add / Edit Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setTxToEdit(null);
        }}
        onSuccess={fetchTransactions}
        token={token}
        storeId={selectedStoreId}
        paymentModes={paymentModes}
        categories={categories}
        bankAccounts={bankAccounts}
        onCategoryCreated={(newCat) => setCategories((prev) => [...prev, newCat])}
        editTransaction={txToEdit}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(txToDelete)}
        title="Delete Transaction Entry"
        message={`Are you sure you want to delete this ${txToDelete?.transaction_type === 'CREDIT' ? 'income' : 'expense'} entry of ₹${formatINR(txToDelete?.amount)}? This will recalculate the drawer balance.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Entry'}
        cancelText="Cancel"
        onConfirm={handleDeleteTransaction}
        onCancel={() => setTxToDelete(null)}
        isDestructive={true}
      />
    </div>
  );
};

export default Cashbook;
