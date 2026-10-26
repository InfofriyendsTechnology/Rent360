import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { 
  FiDollarSign, FiCalendar, FiArrowDownLeft, FiArrowUpRight, 
  FiPrinter, FiFileText, FiRefreshCw, FiTrendingUp, 
  FiCreditCard, FiShoppingBag, FiChevronDown, FiPieChart,
  FiLayers, FiCheckCircle, FiShield, FiClock
} from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import { DateInputDMY } from '../../components/ui';
import './CashbookReports.scss';

const CashbookReports = () => {
  const { user, token: reduxToken } = useSelector((state) => state.auth);
  const token = reduxToken || localStorage.getItem('token') || '';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || !user?.role;
  const userStoreId = user?.store?.id || user?.storeId || '';

  // Stores (for Super Admin)
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(
    userStoreId || localStorage.getItem('rent360_active_store_id') || ''
  );

  // Bank accounts master
  const [bankAccounts, setBankAccounts] = useState([]);

  // Date Filters
  const [datePreset, setDatePreset] = useState('month'); // 'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Account Scope Filter ('ALL' | 'CASH' | 'BANK' | bankAccountId)
  const [accountScope, setAccountScope] = useState('ALL');

  // Data State
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
    openingBalance: 0,
    openingCash: 0,
    openingBank: 0,
    closingBalance: 0,
    closingCash: 0,
    closingBank: 0,
    depositInflow: 0,
    depositOutflow: 0,
    allTimeDepositHeld: 0,
    count: 0
  });
  const [loading, setLoading] = useState(false);

  // Load stores for Super Admin
  useEffect(() => {
    if (isSuperAdmin && token) {
      axios.get(`${API_BASE_URL}/api/stores`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        const storeList = res.data.data || [];
        setStores(storeList);
        if (!selectedStoreId && storeList.length > 0) {
          setSelectedStoreId(storeList[0].id);
        }
      })
      .catch(() => {});
    }
  }, [isSuperAdmin, token]);

  // Load Bank Accounts
  useEffect(() => {
    const effectiveStore = selectedStoreId || userStoreId;
    if (!effectiveStore || !token) return;
    axios.get(`${API_BASE_URL}/api/storeBankAccounts?storeId=${effectiveStore}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setBankAccounts(res.data.data || []);
    })
    .catch(() => {});
  }, [selectedStoreId, userStoreId, token]);

  // Compute date bounds based on preset
  const getDateRange = () => {
    const now = new Date();
    const formatDate = (d) => d.toISOString().split('T')[0];

    if (datePreset === 'today') {
      const s = formatDate(now);
      return { startDate: s, endDate: s, label: 'Today' };
    }
    if (datePreset === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const s = formatDate(y);
      return { startDate: s, endDate: s, label: 'Yesterday' };
    }
    if (datePreset === 'week') {
      const w = new Date(now);
      w.setDate(w.getDate() - 7);
      return { startDate: formatDate(w), endDate: formatDate(now), label: 'Last 7 Days' };
    }
    if (datePreset === 'month') {
      const m = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: formatDate(m), endDate: formatDate(now), label: 'This Month' };
    }
    if (datePreset === 'custom') {
      return { 
        startDate: customStartDate || '', 
        endDate: customEndDate || '', 
        label: `${customStartDate || 'Start'} to ${customEndDate || 'End'}` 
      };
    }
    return { startDate: '', endDate: '', label: 'All Time' };
  };

  const activeRange = getDateRange();

  // Fetch transactions
  useEffect(() => {
    const effectiveStore = selectedStoreId || userStoreId;
    if (!effectiveStore || !token) return;
    fetchReportData();
  }, [selectedStoreId, userStoreId, token, datePreset, customStartDate, customEndDate]);

  const fetchReportData = async () => {
    const effectiveStore = selectedStoreId || userStoreId;
    if (!effectiveStore || !token) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('storeId', effectiveStore);
      if (activeRange.startDate) params.append('startDate', activeRange.startDate);
      if (activeRange.endDate) params.append('endDate', activeRange.endDate);

      const res = await axios.get(`${API_BASE_URL}/api/transactions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = res.data.data || {};
      setTransactions(data.transactions || []);
      setSummary(data.summary || {
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
        openingBalance: 0,
        openingCash: 0,
        openingBank: 0,
        closingBalance: 0,
        closingCash: 0,
        closingBank: 0,
        depositInflow: 0,
        depositOutflow: 0,
        allTimeDepositHeld: 0,
        count: 0
      });
    } catch (err) {
      console.error('Error fetching report data:', err);
      toast.error('Failed to load cash & bank summary data');
    } finally {
      setLoading(false);
    }
  };

  // Currency Formatter
  const formatINR = (val) => {
    return Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Filtered transactions by account scope
  const scopedTransactions = useMemo(() => {
    if (accountScope === 'ALL') return transactions;
    if (accountScope === 'CASH') {
      return transactions.filter(tx => (tx.paymentMode?.name || '').toLowerCase().includes('cash'));
    }
    if (accountScope === 'BANK') {
      return transactions.filter(tx => !(tx.paymentMode?.name || '').toLowerCase().includes('cash'));
    }
    // Specific bank account ID
    return transactions.filter(tx => tx.bankAccountId === accountScope);
  }, [transactions, accountScope]);

  // Dynamic Scoped Summary based on active account scope
  const activeScopedSummary = useMemo(() => {
    if (accountScope === 'ALL') return summary;

    let totalCredit = 0;
    let totalDebit = 0;
    let depositInflow = 0;
    let depositOutflow = 0;

    scopedTransactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      const isCredit = tx.transaction_type === 'CREDIT';
      const catName = (tx.transactionCategory?.name || tx.category?.name || '').toLowerCase();
      const isDeposit = catName.includes('security') || catName.includes('deposit');

      if (isCredit) {
        totalCredit += amt;
        if (isDeposit) depositInflow += amt;
      } else {
        totalDebit += amt;
        if (isDeposit) depositOutflow += amt;
      }
    });

    const isCashOnly = accountScope === 'CASH';
    const opening = isCashOnly ? (summary.openingCash || 0) : (summary.openingBank || 0);

    return {
      ...summary,
      totalCredit,
      totalDebit,
      netBalance: totalCredit - totalDebit,
      openingBalance: opening,
      closingBalance: opening + (totalCredit - totalDebit),
      depositInflow,
      depositOutflow,
      count: scopedTransactions.length
    };
  }, [scopedTransactions, accountScope, summary]);

  // 1. Payment Mode Breakdown
  const paymentModeBreakdown = useMemo(() => {
    const map = {};
    let grandIn = 0;
    let grandOut = 0;

    scopedTransactions.forEach((tx) => {
      const modeName = tx.paymentMode?.name || 'Other';
      const amt = Number(tx.amount) || 0;
      if (!map[modeName]) {
        map[modeName] = { name: modeName, in: 0, out: 0, net: 0, count: 0 };
      }
      if (tx.transaction_type === 'CREDIT') {
        map[modeName].in += amt;
        grandIn += amt;
      } else {
        map[modeName].out += amt;
        grandOut += amt;
      }
      map[modeName].net = map[modeName].in - map[modeName].out;
      map[modeName].count += 1;
    });

    return Object.values(map).map((item) => ({
      ...item,
      inPercent: grandIn > 0 ? ((item.in / grandIn) * 100).toFixed(1) : 0,
      outPercent: grandOut > 0 ? ((item.out / grandOut) * 100).toFixed(1) : 0
    }));
  }, [scopedTransactions]);

  // 2. Bank Accounts & Drawer Accounts Breakdown
  const accountBreakdown = useMemo(() => {
    const map = {};

    // Initialize with Drawer
    map['drawer'] = {
      id: 'drawer',
      name: 'Cash Drawer (Physical Cash)',
      inflow: 0,
      outflow: 0,
      net: 0,
      count: 0
    };

    // Initialize with known bank accounts
    bankAccounts.forEach(b => {
      const isDrawer = b.account_name.toLowerCase().includes('drawer') || b.account_name.toLowerCase().includes('cash');
      if (!isDrawer) {
        map[b.id] = {
          id: b.id,
          name: b.account_name + (b.account_number ? ` (${b.account_number})` : ''),
          inflow: 0,
          outflow: 0,
          net: 0,
          count: 0
        };
      }
    });

    // Aggregate transactions
    transactions.forEach(tx => {
      const amt = Number(tx.amount) || 0;
      const isCredit = tx.transaction_type === 'CREDIT';
      const isCash = (tx.paymentMode?.name || '').toLowerCase().includes('cash');

      let targetKey = 'drawer';
      if (!isCash) {
        if (tx.bankAccountId && map[tx.bankAccountId]) {
          targetKey = tx.bankAccountId;
        } else {
          // General / default bank
          targetKey = 'general_bank';
          if (!map['general_bank']) {
            map['general_bank'] = {
              id: 'general_bank',
              name: 'General Bank / UPI',
              inflow: 0,
              outflow: 0,
              net: 0,
              count: 0
            };
          }
        }
      }

      if (isCredit) {
        map[targetKey].inflow += amt;
      } else {
        map[targetKey].outflow += amt;
      }
      map[targetKey].net = map[targetKey].inflow - map[targetKey].outflow;
      map[targetKey].count += 1;
    });

    return Object.values(map);
  }, [transactions, bankAccounts]);

  // 3. Category Breakdown (Income vs Expenses)
  const categoryBreakdown = useMemo(() => {
    const incomeMap = {};
    const expenseMap = {};
    let totalCatIncome = 0;
    let totalCatExpense = 0;

    scopedTransactions.forEach((tx) => {
      const catName = tx.transactionCategory?.name || tx.category?.name || (tx.booking ? 'BOOKING CHARGE' : 'GENERAL / MISC');
      const amt = Number(tx.amount) || 0;

      if (tx.transaction_type === 'CREDIT') {
        incomeMap[catName] = (incomeMap[catName] || 0) + amt;
        totalCatIncome += amt;
      } else {
        expenseMap[catName] = (expenseMap[catName] || 0) + amt;
        totalCatExpense += amt;
      }
    });

    const incomeList = Object.entries(incomeMap).map(([name, amount]) => ({
      name,
      amount,
      percent: totalCatIncome > 0 ? ((amount / totalCatIncome) * 100).toFixed(1) : 0
    })).sort((a, b) => b.amount - a.amount);

    const expenseList = Object.entries(expenseMap).map(([name, amount]) => ({
      name,
      amount,
      percent: totalCatExpense > 0 ? ((amount / totalCatExpense) * 100).toFixed(1) : 0
    })).sort((a, b) => b.amount - a.amount);

    return { incomeList, expenseList, totalCatIncome, totalCatExpense };
  }, [scopedTransactions]);

  // 4. Day-by-day cashflow summary
  const dailySummary = useMemo(() => {
    const dayMap = {};

    scopedTransactions.forEach((tx) => {
      const dayKey = new Date(tx.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      if (!dayMap[dayKey]) {
        dayMap[dayKey] = {
          date: dayKey,
          rawDate: tx.createdAt,
          cashIn: 0,
          cashOut: 0,
          bankIn: 0,
          bankOut: 0,
          totalIn: 0,
          totalOut: 0,
          txCount: 0
        };
      }

      const amt = Number(tx.amount) || 0;
      const isCredit = tx.transaction_type === 'CREDIT';
      const isCash = (tx.paymentMode?.name || '').toLowerCase().includes('cash');

      if (isCredit) {
        dayMap[dayKey].totalIn += amt;
        if (isCash) dayMap[dayKey].cashIn += amt;
        else dayMap[dayKey].bankIn += amt;
      } else {
        dayMap[dayKey].totalOut += amt;
        if (isCash) dayMap[dayKey].cashOut += amt;
        else dayMap[dayKey].bankOut += amt;
      }
      dayMap[dayKey].txCount += 1;
    });

    return Object.values(dayMap).sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
  }, [scopedTransactions]);

  // Export CSV Handler
  const handleExportCSV = () => {
    const storeObj = stores.find(s => s.id === selectedStoreId);
    const storeName = storeObj?.name || user?.store?.name || 'Rent360 Store';
    const filename = `Cash_Bank_Summary_${activeRange.label.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;

    const rows = [
      [`Cash & Bank Summary - ${storeName}`],
      [`Period: ${activeRange.label}`, `Generated on: ${new Date().toLocaleString('en-IN')}`],
      [`Opening Balance: Rs. ${formatINR(activeScopedSummary.openingBalance || 0)}`, `Total Inflow: Rs. ${formatINR(activeScopedSummary.totalCredit)}`, `Total Outflow: Rs. ${formatINR(activeScopedSummary.totalDebit)}`, `Closing Balance: Rs. ${formatINR(activeScopedSummary.closingBalance || 0)}`],
      [`Cash in Drawer: Rs. ${formatINR(summary.cashBalance)}`, `Bank & UPI Balance: Rs. ${formatINR(summary.bankBalance)}`, `Active Deposit Held: Rs. ${formatINR(summary.allTimeDepositHeld || 0)}`],
      [],
      ['--- DAY-WISE CASHFLOW STATEMENT ---'],
      ['Date', 'Cash In (Rs.)', 'Cash Out (Rs.)', 'Bank In (Rs.)', 'Bank Out (Rs.)', 'Total In (Rs.)', 'Total Out (Rs.)', 'Day Net (Rs.)', 'Tx Count'],
    ];

    dailySummary.forEach((d) => {
      rows.push([
        d.date,
        d.cashIn.toFixed(2),
        d.cashOut.toFixed(2),
        d.bankIn.toFixed(2),
        d.bankOut.toFixed(2),
        d.totalIn.toFixed(2),
        d.totalOut.toFixed(2),
        (d.totalIn - d.totalOut).toFixed(2),
        d.txCount
      ]);
    });

    rows.push([]);
    rows.push(['--- PAYMENT MODE BREAKDOWN ---']);
    rows.push(['Mode', 'Inflow (Rs.)', 'Outflow (Rs.)', 'Net Balance (Rs.)', 'Tx Count']);
    paymentModeBreakdown.forEach((m) => {
      rows.push([m.name, m.in.toFixed(2), m.out.toFixed(2), m.net.toFixed(2), m.count]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="cashbook-reports-view">
      {/* Top Header Bar */}
      <div className="reports-top-bar no-print">
        <div className="title-area">
          <div className="breadcrumb-nav">
            <span>Financial Reports</span>
            <span className="sep">/</span>
            <span className="current">Cash & Bank Summary</span>
          </div>
          <div className="title-row">
            <h1 className="main-heading">Cash & Bank Summary</h1>
            <span className="live-pill">
              <span className="dot" /> {activeScopedSummary.count} Transactions
            </span>
          </div>
          <p className="sub-heading">
            Track daily cash inflow, drawer physical balance, digital collections, and refundable security deposits
          </p>
        </div>

        <div className="top-actions-wrap">
          {/* Store Switcher for SuperAdmin */}
          {isSuperAdmin && stores.length > 0 && (
            <div className="store-pill">
              <FiShoppingBag className="icon" />
              <select
                value={selectedStoreId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedStoreId(val);
                  if (val) localStorage.setItem('rent360_active_store_id', val);
                }}
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name || s.store_name}
                  </option>
                ))}
              </select>
              <FiChevronDown />
            </div>
          )}

          <button
            type="button"
            className="btn-pill-outline"
            onClick={handleExportCSV}
            title="Export CSV"
          >
            <FiFileText />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className="btn-pill-primary"
            onClick={handlePrint}
            title="Print Report"
          >
            <FiPrinter />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar: Dates + Account Scope Selector */}
      <div className="reports-filter-bar no-print">
        <div className="filter-left-section">
          {/* Date Presets */}
          <div className="preset-pill-group">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'week', label: 'Last 7 Days' },
              { id: 'month', label: 'This Month' },
              { id: 'all', label: 'All Time' },
              { id: 'custom', label: 'Custom' }
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`preset-btn ${datePreset === preset.id ? 'active' : ''}`}
                onClick={() => setDatePreset(preset.id)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range Picker */}
          {datePreset === 'custom' && (
            <div className="custom-range-inputs">
              <DateInputDMY
                value={customStartDate}
                onChange={setCustomStartDate}
              />
              <span className="sep">to</span>
              <DateInputDMY
                value={customEndDate}
                onChange={setCustomEndDate}
              />
            </div>
          )}
        </div>

        <div className="filter-right-section">
          {/* Account Filter Dropdown */}
          <div className="account-filter-select">
            <label>Account:</label>
            <select
              value={accountScope}
              onChange={(e) => setAccountScope(e.target.value)}
            >
              <option value="ALL">All Cash & Bank Accounts</option>
              <option value="CASH">Cash Drawer Only (Cash in Hand)</option>
              <option value="BANK">Bank & UPI Only (Digital)</option>
              {bankAccounts.filter(b => !b.account_name.toLowerCase().includes('drawer') && !b.account_name.toLowerCase().includes('cash')).map(b => (
                <option key={b.id} value={b.id}>
                  {b.account_name} {b.account_number ? `(${b.account_number})` : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="btn-refresh"
            onClick={fetchReportData}
            title="Refresh Data"
          >
            <FiRefreshCw className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Printable Report Header (Strictly Hidden on Screen, visible on Print) */}
      <div className="print-report-header">
        <h2>Rent360 Cash & Bank Summary Report</h2>
        <p>Period: {activeRange.label} | Scope: {accountScope === 'ALL' ? 'Consolidated Cash & Bank' : accountScope === 'CASH' ? 'Cash Drawer Only' : 'Digital / Bank Accounts'}</p>
        <p>Opening: ₹ {formatINR(activeScopedSummary.openingBalance || 0)} | Inflow: ₹ {formatINR(activeScopedSummary.totalCredit)} | Outflow: ₹ {formatINR(activeScopedSummary.totalDebit)} | Closing: ₹ {formatINR(activeScopedSummary.closingBalance || 0)}</p>
      </div>

      {/* Unified 6-Card Financial Bento Grid (2 rows of 3 balanced cards) */}
      <div className="reports-kpi-grid">
        {/* Card 1: Opening Balance */}
        <div className="kpi-card opening-card">
          <div className="kpi-header">
            <span className="label">Opening Balance</span>
            <span className="icon"><FiClock /></span>
          </div>
          <div className="figure neutral">₹ {formatINR(activeScopedSummary.openingBalance || 0)}</div>
          <div className="sub">
            Balance as of {datePreset === 'all' ? 'All-Time Start' : (activeRange.startDate || 'Period Start')}
          </div>
        </div>

        {/* Card 2: Total Inflow */}
        <div className="kpi-card in-card">
          <div className="kpi-header">
            <span className="label">Total Inflow (Receipts)</span>
            <span className="icon"><FiArrowDownLeft /></span>
          </div>
          <div className="figure green">+ ₹ {formatINR(activeScopedSummary.totalCredit)}</div>
          <div className="sub">
            Cash: ₹ {formatINR(summary.cashCredit)} | Bank: ₹ {formatINR(summary.bankCredit)}
          </div>
        </div>

        {/* Card 3: Total Outflow */}
        <div className="kpi-card out-card">
          <div className="kpi-header">
            <span className="label">Total Outflow (Expenses)</span>
            <span className="icon"><FiArrowUpRight /></span>
          </div>
          <div className="figure red">- ₹ {formatINR(activeScopedSummary.totalDebit)}</div>
          <div className="sub">
            Cash: ₹ {formatINR(summary.cashDebit)} | Bank: ₹ {formatINR(summary.bankDebit)}
          </div>
        </div>

        {/* Card 4: Closing Balance */}
        <div className="kpi-card closing-card">
          <div className="kpi-header">
            <span className="label">Closing Balance</span>
            <span className="icon"><FiDollarSign /></span>
          </div>
          <div className="figure blue">₹ {formatINR(activeScopedSummary.closingBalance || 0)}</div>
          <div className="sub">
            Drawer: ₹ {formatINR(summary.cashInDrawer || summary.cashBalance)} | Bank: ₹ {formatINR(summary.bankBalance)}
          </div>
        </div>

        {/* Card 6: Active Security Deposit Held */}
        <div className="kpi-card deposit-card">
          <div className="kpi-header">
            <span className="label">Security Deposit Held</span>
            <span className="icon"><FiShield /></span>
          </div>
          <div className="figure amber">₹ {formatINR(summary.allTimeDepositHeld || 0)}</div>
          <div className="sub">
            Collected: + ₹ {formatINR(activeScopedSummary.depositInflow || 0)} | Refunded: - ₹ {formatINR(activeScopedSummary.depositOutflow || 0)}
          </div>
        </div>
      </div>

      {/* Middle Row: Payment Modes & Bank Accounts Split */}
      <div className="reports-middle-grid">
        {/* Payment Modes Breakdown */}
        <div className="report-card payment-mode-card">
          <div className="card-header">
            <div className="header-title">
              <FiCreditCard className="icon" />
              <h3>Payment Mode Breakdown</h3>
            </div>
            <span className="header-tag">{paymentModeBreakdown.length} Modes</span>
          </div>
          <div className="table-responsive">
            <table className="breakdown-table">
              <thead>
                <tr>
                  <th>Mode</th>
                  <th className="text-right">Inflow (₹)</th>
                  <th className="text-right">Outflow (₹)</th>
                  <th className="text-right">Net (₹)</th>
                </tr>
              </thead>
              <tbody>
                {paymentModeBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty-text">No payment data in this period</td>
                  </tr>
                ) : (
                  paymentModeBreakdown.map((m) => (
                    <tr key={m.name}>
                      <td className="font-medium">
                        {m.name} <span className="tx-count-pill">{m.count} txs</span>
                      </td>
                      <td className="text-right green font-semibold">₹ {formatINR(m.in)}</td>
                      <td className="text-right red font-semibold">₹ {formatINR(m.out)}</td>
                      <td className={`text-right font-bold ${m.net >= 0 ? 'green' : 'red'}`}>
                        ₹ {formatINR(m.net)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bank & Drawer Accounts Breakdown */}
        <div className="report-card accounts-card">
          <div className="card-header">
            <div className="header-title">
              <FiDollarSign className="icon" />
              <h3>Accounts & Bank Split</h3>
            </div>
            <span className="header-tag">{accountBreakdown.length} Accounts</span>
          </div>
          <div className="table-responsive">
            <table className="breakdown-table">
              <thead>
                <tr>
                  <th>Account Name</th>
                  <th className="text-right">Inflow (₹)</th>
                  <th className="text-right">Outflow (₹)</th>
                  <th className="text-right">Net Balance (₹)</th>
                </tr>
              </thead>
              <tbody>
                {accountBreakdown.map((acc) => (
                  <tr key={acc.id}>
                    <td className="font-medium">
                      {acc.name}
                    </td>
                    <td className="text-right green font-semibold">₹ {formatINR(acc.inflow)}</td>
                    <td className="text-right red font-semibold">₹ {formatINR(acc.outflow)}</td>
                    <td className={`text-right font-bold ${acc.net >= 0 ? 'green' : 'red'}`}>
                      ₹ {formatINR(acc.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Category Expenses & Incomes Bar Strip */}
      <div className="report-card category-card">
        <div className="card-header">
          <div className="header-title">
            <FiLayers className="icon" />
            <h3>Top Expense & Income Categories</h3>
          </div>
          <span className="header-tag">Categories</span>
        </div>

        <div className="category-columns">
          {/* Expenses */}
          <div className="cat-column">
            <div className="column-title red">
              <span>Expenses (Outflow): ₹ {formatINR(categoryBreakdown.totalCatExpense)}</span>
            </div>
            {categoryBreakdown.expenseList.length === 0 ? (
              <p className="no-cat-text">No expenses recorded in this period</p>
            ) : (
              <div className="cat-bars-list">
                {categoryBreakdown.expenseList.slice(0, 5).map((c) => (
                  <div key={c.name} className="cat-bar-item">
                    <div className="bar-labels">
                      <span className="cat-name">{c.name}</span>
                      <span className="cat-amount">₹ {formatINR(c.amount)} ({c.percent}%)</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill red-fill" style={{ width: `${c.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Income */}
          <div className="cat-column">
            <div className="column-title green">
              <span>Income (Inflow): ₹ {formatINR(categoryBreakdown.totalCatIncome)}</span>
            </div>
            {categoryBreakdown.incomeList.length === 0 ? (
              <p className="no-cat-text">No income recorded in this period</p>
            ) : (
              <div className="cat-bars-list">
                {categoryBreakdown.incomeList.slice(0, 5).map((c) => (
                  <div key={c.name} className="cat-bar-item">
                    <div className="bar-labels">
                      <span className="cat-name">{c.name}</span>
                      <span className="cat-amount">₹ {formatINR(c.amount)} ({c.percent}%)</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill green-fill" style={{ width: `${c.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Day-by-Day Statement Table */}
      <div className="report-card statement-card">
        <div className="card-header">
          <div className="header-title">
            <FiCalendar className="icon" />
            <h3>Day-Wise Cashflow Statement</h3>
          </div>
          <span className="header-tag">{dailySummary.length} Active Days</span>
        </div>

        <div className="table-responsive">
          <table className="statement-table">
            <thead>
              <tr>
                <th>Date</th>
                <th className="text-right">Cash In</th>
                <th className="text-right">Cash Out</th>
                <th className="text-right">Bank In</th>
                <th className="text-right">Bank Out</th>
                <th className="text-right">Total Inflow</th>
                <th className="text-right">Total Outflow</th>
                <th className="text-right">Day Net</th>
                <th className="text-center">Entries</th>
              </tr>
            </thead>
            <tbody>
              {dailySummary.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-text">No daily entries found in this period</td>
                </tr>
              ) : (
                dailySummary.map((d) => {
                  const dayNet = d.totalIn - d.totalOut;
                  return (
                    <tr key={d.date}>
                      <td className="font-semibold text-main">{d.date}</td>
                      <td className="text-right green">₹ {formatINR(d.cashIn)}</td>
                      <td className="text-right red">₹ {formatINR(d.cashOut)}</td>
                      <td className="text-right green">₹ {formatINR(d.bankIn)}</td>
                      <td className="text-right red">₹ {formatINR(d.bankOut)}</td>
                      <td className="text-right green font-semibold">₹ {formatINR(d.totalIn)}</td>
                      <td className="text-right red font-semibold">₹ {formatINR(d.totalOut)}</td>
                      <td className={`text-right font-bold ${dayNet >= 0 ? 'green' : 'red'}`}>
                        {dayNet >= 0 ? '+ ' : '- '}₹ {formatINR(Math.abs(dayNet))}
                      </td>
                      <td className="text-center">
                        <span className="tx-count-pill">{d.txCount}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CashbookReports;
