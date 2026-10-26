import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  FiSearch, FiShoppingBag, FiChevronDown, FiCalendar
} from 'react-icons/fi';
import { RiFileExcel2Fill } from 'react-icons/ri';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import { DateInputDMY } from '../../components/ui';
import './TrialBalance.scss';

// Generate recent financial years (e.g. 2026-2027, 2025-2026)
const getFinancialYears = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-indexed, 3 = April
  const baseYear = currentMonth >= 3 ? currentYear : currentYear - 1;

  const years = [];
  for (let i = 0; i < 4; i++) {
    const start = baseYear - i;
    const end = start + 1;
    years.push({
      label: `${start} - ${end}`,
      value: `${start}-${end}`,
      startDate: `${start}-04-01`,
      endDate: `${end}-03-31`
    });
  }
  return years;
};

const formatINR = (val) => {
  const num = Number(val) || 0;
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const TrialBalance = () => {
  const navigate = useNavigate();
  const { user, token: reduxToken } = useSelector((state) => state.auth);
  const token = reduxToken || localStorage.getItem('token') || '';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || !user?.role;
  const userStoreId = user?.store?.id || user?.storeId || '';

  // Stores (for Super Admin)
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(
    userStoreId || localStorage.getItem('rent360_active_store_id') || ''
  );

  // Financial Years
  const fyList = useMemo(() => getFinancialYears(), []);
  const [financialYear, setFinancialYear] = useState(fyList[0]?.value || '2026-2027');

  // Date Filters with Checkboxes matching user's reference UI
  const todayStr = new Date().toISOString().split('T')[0];
  const [isFromDateEnabled, setIsFromDateEnabled] = useState(true);
  const [isToDateEnabled, setIsToDateEnabled] = useState(true);
  const [fromDate, setFromDate] = useState(fyList[0]?.startDate || todayStr);
  const [toDate, setToDate] = useState(todayStr);

  // Show zero-balance accounts toggle
  const [showZeroBalance, setShowZeroBalance] = useState(false);

  // Data State
  const [data, setData] = useState({
    period: { label: '', startDate: '', endDate: '' },
    summary: {
      totalDebit: 0,
      totalCredit: 0,
      currDr: 0,
      currCr: 0,
      openingBalance: 0,
      openingType: 'Dr',
      closingBalance: 0,
      closingType: 'Dr',
      difference: 0,
      isBalanced: true,
      totalAccounts: 0
    },
    accounts: []
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

  // Handle FY Change
  const handleFYChange = (fyValue) => {
    setFinancialYear(fyValue);
    const selectedFY = fyList.find(f => f.value === fyValue);
    if (selectedFY) {
      setFromDate(selectedFY.startDate);
      const now = new Date();
      const end = new Date(selectedFY.endDate);
      if (now < end) {
        setToDate(now.toISOString().split('T')[0]);
      } else {
        setToDate(selectedFY.endDate);
      }
    }
  };

  // Fetch Trial Balance
  const fetchTrialBalance = async () => {
    const effectiveStore = selectedStoreId || userStoreId;
    if (!effectiveStore || !token) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('storeId', effectiveStore);
      if (isFromDateEnabled && fromDate) params.append('startDate', fromDate);
      if (isToDateEnabled && toDate) params.append('endDate', toDate);
      if (financialYear) params.append('financialYear', financialYear);

      const res = await axios.get(`${API_BASE_URL}/api/transactions/trial-balance?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success && res.data.data) {
        setData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load trial balance');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount or dependency change
  useEffect(() => {
    const effectiveStore = selectedStoreId || userStoreId;
    if (effectiveStore && token) {
      fetchTrialBalance();
    }
  }, [selectedStoreId, userStoreId, token, financialYear]);

  // Filter accounts: show active accounts (non-zero balance) by default unless showZeroBalance is true
  const displayedAccounts = useMemo(() => {
    const all = data.accounts || [];
    if (showZeroBalance) return all;
    return all.filter(a => 
      (a.openingBalance && a.openingBalance > 0) ||
      (a.currDr && a.currDr > 0) ||
      (a.currCr && a.currCr > 0) ||
      (a.closingBalance && a.closingBalance > 0)
    );
  }, [data.accounts, showZeroBalance]);

  // Export Excel / CSV
  const handleExportCSV = () => {
    const storeObj = stores.find(s => s.id === selectedStoreId);
    const storeName = storeObj?.name || user?.store?.name || 'Rent360 Store';
    const filename = `Trial_Balance_${financialYear}.csv`;

    const rows = [
      [`Trial Balance - ${storeName}`],
      [`Period: ${isFromDateEnabled ? fromDate : 'Beginning'} to ${isToDateEnabled ? toDate : 'Today'}`, `Financial Year: ${financialYear}`],
      [`Opening Balance: Rs. ${formatINR(data.summary?.openingBalance)} ${data.summary?.openingType}`, `Curr. Dr: Rs. ${formatINR(data.summary?.currDr)}`, `Curr. Cr: Rs. ${formatINR(data.summary?.currCr)}`, `Closing Balance: Rs. ${formatINR(data.summary?.closingBalance)} ${data.summary?.closingType}`],
      [],
      ['Account Name', 'Opening Balance', 'Curr. Dr.', 'Curr. Cr.', 'Closing Balance'],
    ];

    displayedAccounts.forEach((acc) => {
      rows.push([
        acc.name,
        acc.openingBalance ? `${formatINR(acc.openingBalance)} ${acc.openingType}` : '0.00',
        acc.currDr ? formatINR(acc.currDr) : '0.00',
        acc.currCr ? formatINR(acc.currCr) : '0.00',
        acc.closingBalance ? `${formatINR(acc.closingBalance)} ${acc.closingType}` : '0.00',
      ]);
    });

    rows.push([]);
    rows.push([
      'Total',
      `${formatINR(data.summary?.openingBalance)} ${data.summary?.openingType}`,
      formatINR(data.summary?.currDr),
      formatINR(data.summary?.currCr),
      `${formatINR(data.summary?.closingBalance)} ${data.summary?.closingType}`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Trial Balance exported');
  };

  const handleNavigateToLedger = (accId) => {
    const params = new URLSearchParams();
    params.append('accountId', accId);
    if (selectedStoreId) params.append('storeId', selectedStoreId);
    if (isFromDateEnabled && fromDate) params.append('startDate', fromDate);
    if (isToDateEnabled && toDate) params.append('endDate', toDate);
    if (financialYear) params.append('financialYear', financialYear);
    navigate(`/account-ledger?${params.toString()}`);
  };

  return (
    <div className="trial-balance-clean-view">
      {/* Top Header Bar */}
      <div className="trial-top-header">
        <h1 className="page-title">Trial Balance</h1>
        <div className="header-right">
          {isSuperAdmin && stores.length > 0 && (
            <div className="store-pill">
              <FiShoppingBag className="icon" />
              <label>Store:</label>
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
              <FiChevronDown className="chevron" />
            </div>
          )}
          <span className="breadcrumb-text">Dashboard / Trial Balance</span>
        </div>
      </div>

      {/* Filter Card matching reference UI */}
      <div className="trial-filter-card">
        <div className="filter-controls-left">
          {/* Financial Year */}
          <div className="filter-item">
            <label className="filter-label">Financial Year<span className="req">*</span></label>
            <div className="select-box">
              <select
                value={financialYear}
                onChange={(e) => handleFYChange(e.target.value)}
              >
                {fyList.map(fy => (
                  <option key={fy.value} value={fy.value}>{fy.label}</option>
                ))}
              </select>
              <FiChevronDown className="arrow" />
            </div>
          </div>

          {/* From Date with Checkbox */}
          <div className="filter-item date-item">
            <label className="filter-label">From Date</label>
            <div className="input-with-checkbox">
              <input
                type="checkbox"
                className="check-input"
                checked={isFromDateEnabled}
                onChange={(e) => setIsFromDateEnabled(e.target.checked)}
              />
              <DateInputDMY
                value={fromDate}
                onChange={setFromDate}
                disabled={!isFromDateEnabled}
              />
            </div>
          </div>

          {/* To Date with Checkbox */}
          <div className="filter-item date-item">
            <label className="filter-label">To Date</label>
            <div className="input-with-checkbox">
              <input
                type="checkbox"
                className="check-input"
                checked={isToDateEnabled}
                onChange={(e) => setIsToDateEnabled(e.target.checked)}
              />
              <DateInputDMY
                value={toDate}
                onChange={setToDate}
                disabled={!isToDateEnabled}
              />
            </div>
          </div>

          {/* Action Buttons: Blue Search & Green Excel */}
          <div className="filter-buttons">
            <button
              type="button"
              className="btn-search-blue"
              onClick={fetchTrialBalance}
              disabled={loading}
              title="Search"
            >
              <FiSearch />
            </button>

            <button
              type="button"
              className="btn-excel-green"
              onClick={handleExportCSV}
              title="Export Excel"
            >
              <RiFileExcel2Fill />
            </button>
          </div>
        </div>

        {/* Right Side Compact 2x2 Summary Metrics matching reference UI */}
        <div className="filter-summary-right">
          <div className="summary-col">
            <div className="summary-item">
              <span className="summary-label">Curr. Dr.</span>
              <span className="summary-val val-blue">₹ {formatINR(data.summary?.currDr)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Curr. Cr.</span>
              <span className="summary-val val-blue">₹ {formatINR(data.summary?.currCr)}</span>
            </div>
          </div>

          <div className="summary-col">
            <div className="summary-item">
              <span className="summary-label">Opening Balance</span>
              <span className="summary-val val-green">
                ₹ {formatINR(data.summary?.openingBalance)} {data.summary?.openingType}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Closing Balance</span>
              <span className={`summary-val ${data.summary?.closingType === 'Dr' ? 'val-green' : 'val-red'}`}>
                ₹ {formatINR(data.summary?.closingBalance)} {data.summary?.closingType}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card matching reference UI */}
      <div className="trial-table-wrapper">
        <table className="trial-simple-table">
          <thead>
            <tr>
              <th className="th-acc-name">Account Name</th>
              <th className="th-num">Opening Balance</th>
              <th className="th-num">Curr. Dr.</th>
              <th className="th-num">Curr. Cr.</th>
              <th className="th-num">Closing Balance</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="loading-cell">Loading trial balance...</td>
              </tr>
            ) : displayedAccounts.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-cell">No transaction records found for the selected period.</td>
              </tr>
            ) : (
              displayedAccounts.map((acc) => (
                <tr key={acc.id} className="acc-row">
                  <td className="td-acc-name">
                    <span 
                      className="acc-clickable"
                      onClick={() => handleNavigateToLedger(acc.id)}
                      title="Click to view Account Ledger"
                    >
                      {acc.name}
                    </span>
                  </td>
                  <td className="td-num">
                    {acc.openingBalance && acc.openingBalance > 0
                      ? `₹ ${formatINR(acc.openingBalance)}`
                      : '-'}
                  </td>
                  <td className="td-num">
                    {acc.currDr && acc.currDr > 0
                      ? `₹ ${formatINR(acc.currDr)}`
                      : '-'}
                  </td>
                  <td className="td-num">
                    {acc.currCr && acc.currCr > 0
                      ? `₹ ${formatINR(acc.currCr)}`
                      : '-'}
                  </td>
                  <td className="td-num td-closing font-medium">
                    {acc.closingBalance && acc.closingBalance > 0
                      ? `₹ ${formatINR(acc.closingBalance)}`
                      : '₹ 0.00'}
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {displayedAccounts.length > 0 && (
            <tfoot>
              <tr className="footer-total-row">
                <td className="td-total-label">Total</td>
                <td className="td-num font-bold">
                  ₹ {formatINR(data.summary?.openingBalance)}
                </td>
                <td className="td-num font-bold val-blue">
                  ₹ {formatINR(data.summary?.currDr)}
                </td>
                <td className="td-num font-bold val-blue">
                  ₹ {formatINR(data.summary?.currCr)}
                </td>
                <td className="td-num font-bold td-closing">
                  ₹ {formatINR(data.summary?.closingBalance)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Optional toggle for zero-balance accounts */}
      <div className="zero-balance-toggle-row">
        <label>
          <input
            type="checkbox"
            checked={showZeroBalance}
            onChange={(e) => setShowZeroBalance(e.target.checked)}
          />
          <span>Show zero-balance ledger accounts ({data.accounts?.length || 0} total)</span>
        </label>
      </div>
    </div>
  );
};

export default TrialBalance;
