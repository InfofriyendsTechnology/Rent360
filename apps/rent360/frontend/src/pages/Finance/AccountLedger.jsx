import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { 
  FiSearch, FiDownload, FiPrinter, FiCalendar, FiChevronDown, 
  FiShoppingBag, FiLayers, FiDollarSign, FiRefreshCw, FiBookOpen,
  FiFileText
} from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import { DateInputDMY } from '../../components/ui';
import './AccountLedger.scss';

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

const AccountLedger = () => {
  const [searchParams] = useSearchParams();
  const { user, token: reduxToken } = useSelector((state) => state.auth);
  const token = reduxToken || localStorage.getItem('token') || '';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || !user?.role;
  const userStoreId = user?.store?.id || user?.storeId || '';

  const initialAccountId = searchParams.get('accountId') || '';
  const initialFY = searchParams.get('financialYear') || '';
  const initialStart = searchParams.get('startDate') || '';
  const initialEnd = searchParams.get('endDate') || '';
  const initialStoreId = searchParams.get('storeId') || '';

  // Stores (for Super Admin)
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(
    initialStoreId || userStoreId || localStorage.getItem('rent360_active_store_id') || ''
  );

  // Financial Years
  const fyList = useMemo(() => getFinancialYears(), []);
  const [financialYear, setFinancialYear] = useState(initialFY || fyList[0]?.value || '2026-2027');

  // Account & Dates
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(initialAccountId);
  
  // Date range filters with checkboxes matching competitor reference
  const todayStr = new Date().toISOString().split('T')[0];
  const [isFromDateEnabled, setIsFromDateEnabled] = useState(Boolean(initialStart) || true);
  const [isToDateEnabled, setIsToDateEnabled] = useState(Boolean(initialEnd) || true);
  const [fromDate, setFromDate] = useState(initialStart || todayStr);
  const [toDate, setToDate] = useState(initialEnd || todayStr);

  // Ledger Data State
  const [ledgerData, setLedgerData] = useState({
    selectedAccount: null,
    period: { from: todayStr, to: todayStr },
    openingBalance: 0,
    openingBalanceType: 'Cr',
    closingBalance: 0,
    closingBalanceType: 'Cr',
    drTotal: 0,
    crTotal: 0,
    drEntries: [],
    crEntries: []
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

  // Sync URL search params whenever they change (e.g. clicked from Trial Balance)
  useEffect(() => {
    const accFromUrl = searchParams.get('accountId');
    if (accFromUrl) {
      setSelectedAccountId(accFromUrl);
    }
    const fyFromUrl = searchParams.get('financialYear');
    if (fyFromUrl) {
      setFinancialYear(fyFromUrl);
    }
    const startFromUrl = searchParams.get('startDate');
    if (startFromUrl) {
      setFromDate(startFromUrl);
      setIsFromDateEnabled(true);
    }
    const endFromUrl = searchParams.get('endDate');
    if (endFromUrl) {
      setToDate(endFromUrl);
      setIsToDateEnabled(true);
    }
    const storeFromUrl = searchParams.get('storeId');
    if (storeFromUrl && isSuperAdmin) {
      setSelectedStoreId(storeFromUrl);
    }
  }, [searchParams, isSuperAdmin]);

  // Load accounts for current store
  useEffect(() => {
    const effectiveStore = selectedStoreId || userStoreId;
    if (!effectiveStore || !token) return;

    axios.get(`${API_BASE_URL}/api/transactions/ledger?storeId=${effectiveStore}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      const list = res.data.data?.accounts || [];
      if (list.length > 0) {
        setAccounts(list);
      }
    })
    .catch(() => {});
  }, [selectedStoreId, userStoreId, token]);

  // Fetch Ledger Data
  const fetchLedger = async (accId = selectedAccountId) => {
    const effectiveStore = selectedStoreId || userStoreId;
    if (!effectiveStore || !token) return;

    if (!accId) {
      setLedgerData(prev => ({
        ...prev,
        selectedAccount: null,
        drEntries: [],
        crEntries: [],
        openingBalance: 0,
        closingBalance: 0,
        drTotal: 0,
        crTotal: 0
      }));
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('storeId', effectiveStore);
      params.append('accountId', accId);
      if (isFromDateEnabled && fromDate) params.append('startDate', fromDate);
      if (isToDateEnabled && toDate) params.append('endDate', toDate);

      const res = await axios.get(`${API_BASE_URL}/api/transactions/ledger?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success && res.data.data) {
        setLedgerData(res.data.data);
        if (res.data.data.accounts && res.data.data.accounts.length > 0) {
          setAccounts(res.data.data.accounts);
        }
      }
    } catch (err) {
      console.error('Error fetching ledger:', err);
      toast.error('Failed to load account ledger');
    } finally {
      setLoading(false);
    }
  };

  // Trigger on initial selection
  useEffect(() => {
    if (selectedAccountId) {
      fetchLedger(selectedAccountId);
    }
  }, [selectedAccountId, selectedStoreId]);

  // Handle Financial Year change
  const handleFYChange = (fyValue) => {
    setFinancialYear(fyValue);
    const selectedFY = fyList.find(f => f.value === fyValue);
    if (selectedFY) {
      setFromDate(selectedFY.startDate);
      // If current year, toDate can be today or year end
      const now = new Date();
      const end = new Date(selectedFY.endDate);
      if (now < end) {
        setToDate(now.toISOString().split('T')[0]);
      } else {
        setToDate(selectedFY.endDate);
      }
    }
  };

  // Format INR Currency
  const formatINR = (val) => {
    const num = Number(val || 0);
    return num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Balanced rows calculation for side-by-side ledger
  const maxRows = Math.max(
    ledgerData.drEntries?.length || 0,
    ledgerData.crEntries?.length || 0
  );

  // Export to Excel / CSV
  const handleExportCSV = () => {
    const accName = ledgerData.selectedAccount?.name || 'Account';
    const filename = `Ledger_${accName}_${fromDate}_to_${toDate}.csv`;

    const csvRows = [
      [`Account Ledger Statement - ${accName}`],
      [`Store: ${stores.find(s => s.id === selectedStoreId)?.name || user?.store?.name || 'Rent360 Store'}`],
      [`Period: ${ledgerData.period?.from} to ${ledgerData.period?.to}`, `Financial Year: ${financialYear}`],
      [`Opening Balance: ₹ ${formatINR(ledgerData.openingBalance)} ${ledgerData.openingBalanceType}`, `Closing Balance: ₹ ${formatINR(ledgerData.closingBalance)} ${ledgerData.closingBalanceType}`],
      [],
      [
        'Dr Date', 'Dr Ref No', 'Dr Acc Name', 'Dr Details', 'Dr Amount',
        '',
        'Cr Date', 'Cr Ref No', 'Cr Acc Name', 'Cr Details', 'Cr Amount'
      ]
    ];

    for (let i = 0; i < maxRows; i++) {
      const dr = ledgerData.drEntries[i] || {};
      const cr = ledgerData.crEntries[i] || {};

      csvRows.push([
        dr.date || '',
        `"${dr.refNo || ''}"`,
        `"${dr.accName || ''}"`,
        `"${dr.details || ''}"`,
        dr.amount ? dr.amount.toFixed(2) : '',
        '',
        cr.date || '',
        `"${cr.refNo || ''}"`,
        `"${cr.accName || ''}"`,
        `"${cr.details || ''}"`,
        cr.amount ? cr.amount.toFixed(2) : ''
      ]);
    }

    csvRows.push([]);
    csvRows.push([
      'Dr Total', '', '', '', ledgerData.drTotal.toFixed(2),
      '',
      'Cr Total', '', '', '', ledgerData.crTotal.toFixed(2)
    ]);
    csvRows.push([
      'Closing Balance', '', '', '', `${ledgerData.closingBalance.toFixed(2)} ${ledgerData.closingBalanceType}`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Ledger statement exported');
  };

  // Print Ledger Statement
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="account-ledger-view">
      {/* Top Bar matching Breadcrumb in Competitor View */}
      <div className="ledger-top-bar">
        <div className="title-section">
          <h1 className="main-title">Account Ledger</h1>
          <p className="breadcrumb-sub">Dashboard / Account Ledger</p>
        </div>

        {/* SuperAdmin Store Switcher */}
        {isSuperAdmin && stores.length > 0 && (
          <div className="store-selector-pill no-print">
            <FiShoppingBag className="store-pill-icon" />
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
            <FiChevronDown className="chevron-icon" />
          </div>
        )}
      </div>

      {/* Competitor-Style Filter Card */}
      <div className="ledger-filter-card no-print">
        <div className="filter-controls-grid">
          {/* Financial Year */}
          <div className="filter-field">
            <label className="field-label">Financial Year<span className="required">*</span></label>
            <div className="select-wrap">
              <select
                value={financialYear}
                onChange={(e) => handleFYChange(e.target.value)}
              >
                {fyList.map(fy => (
                  <option key={fy.value} value={fy.value}>{fy.label}</option>
                ))}
              </select>
              <FiChevronDown className="select-arrow" />
            </div>
          </div>

          {/* Accounts Dropdown */}
          <div className="filter-field field-account">
            <label className="field-label">Accounts<span className="required">*</span></label>
            <div className="select-wrap">
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
              >
                <option value="">-- Select Account --</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
              <FiChevronDown className="select-arrow" />
            </div>
          </div>

          {/* From Date with Checkbox */}
          <div className="filter-field field-date">
            <label className="field-label">From Date</label>
            <div className="checkbox-date-wrap">
              <input
                type="checkbox"
                className="date-checkbox"
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
          <div className="filter-field field-date">
            <label className="field-label">To Date</label>
            <div className="checkbox-date-wrap">
              <input
                type="checkbox"
                className="date-checkbox"
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

          {/* Action Buttons */}
          <div className="filter-actions-group">
            <button
              type="button"
              className="action-icon-btn btn-search"
              title="Search Ledger"
              onClick={() => fetchLedger()}
            >
              <FiSearch />
            </button>
            <button
              type="button"
              className="action-icon-btn btn-excel"
              title="Export to Excel / CSV"
              onClick={handleExportCSV}
            >
              <FiFileText />
            </button>
            <button
              type="button"
              className="action-icon-btn btn-print"
              title="Print Ledger"
              onClick={handlePrint}
            >
              <FiPrinter />
            </button>
          </div>
        </div>

        {/* Top Right Summary Badges matching Reference Image */}
        <div className="ledger-summary-strip">
          <div className="period-box">
            <div className="period-line">
              <span className="p-label">From Period</span>
              <span className="p-val">{ledgerData.period?.from}</span>
            </div>
            <div className="period-line">
              <span className="p-label">To Period</span>
              <span className="p-val">{ledgerData.period?.to}</span>
            </div>
          </div>

          <div className="balance-box op-box">
            <span className="b-label">Opening Balance</span>
            <span className={`b-val ${ledgerData.openingBalanceType === 'Cr' ? 'cr' : 'dr'}`}>
              ₹ {formatINR(ledgerData.openingBalance)} {ledgerData.openingBalanceType}
            </span>
          </div>

          <div className="balance-box cl-box">
            <span className="b-label">Closing Balance</span>
            <span className={`b-val ${ledgerData.closingBalanceType === 'Cr' ? 'cr' : 'dr'}`}>
              ₹ {formatINR(ledgerData.closingBalance)} {ledgerData.closingBalanceType}
            </span>
          </div>
        </div>
      </div>

      {/* Printable Statement Header */}
      <div className="print-only-header">
        <h2>{ledgerData.selectedAccount?.name || 'Account'} Ledger</h2>
        <p>Period: {ledgerData.period?.from} to {ledgerData.period?.to} | FY: {financialYear}</p>
        <p>Opening Balance: ₹ {formatINR(ledgerData.openingBalance)} {ledgerData.openingBalanceType} | Closing Balance: ₹ {formatINR(ledgerData.closingBalance)} {ledgerData.closingBalanceType}</p>
      </div>

      {/* Competitor Split T-Account Ledger Table */}
      <div className="ledger-table-card">
        {loading ? (
          <div className="ledger-loading-state">
            <FiRefreshCw className="spin-icon" />
            <span>Loading ledger entries...</span>
          </div>
        ) : (
          <div className="ledger-table-wrapper">
            <table className="t-account-table">
              <thead>
                {/* Master Split Headers */}
                <tr className="split-master-header">
                  <th colSpan="5" className="master-header-dr">
                    Dr Details
                  </th>
                  <th colSpan="5" className="master-header-cr">
                    Cr Details
                  </th>
                </tr>

                {/* Sub-column Headers */}
                <tr className="sub-header-row">
                  {/* Dr Subheaders */}
                  <th className="col-date">Date</th>
                  <th className="col-ref">Ref No.</th>
                  <th className="col-acc">Acc. Name</th>
                  <th className="col-details">Details</th>
                  <th className="col-amt right">Amount</th>

                  {/* Cr Subheaders */}
                  <th className="col-date border-left">Date</th>
                  <th className="col-ref">Ref No.</th>
                  <th className="col-acc">Acc. Name</th>
                  <th className="col-details">Details</th>
                  <th className="col-amt right">Amount</th>
                </tr>
              </thead>

              <tbody>
                {maxRows === 0 ? (
                  <tr>
                    <td colSpan="10" className="empty-ledger-cell">
                      <div className="empty-wrap">
                        <FiBookOpen className="empty-icon" />
                        {selectedAccountId && ledgerData.selectedAccount ? (
                          <p>No ledger transactions found for <strong>{ledgerData.selectedAccount?.name}</strong> in this date period.</p>
                        ) : (
                          <p>Please select an account from the dropdown above to view its ledger statement.</p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  Array.from({ length: maxRows }).map((_, idx) => {
                    const dr = ledgerData.drEntries[idx];
                    const cr = ledgerData.crEntries[idx];

                    return (
                      <tr key={`ledger-row-${idx}`} className="ledger-row">
                        {/* Dr Details Row */}
                        <td className="col-date">{dr ? dr.date : ''}</td>
                        <td className="col-ref">{dr ? dr.refNo : ''}</td>
                        <td className="col-acc">{dr ? <span className="cell-acc-name">{dr.accName}</span> : ''}</td>
                        <td className="col-details">{dr ? <span className="cell-details">{dr.details}</span> : ''}</td>
                        <td className="col-amt right font-num">{dr ? `₹ ${formatINR(dr.amount)}` : ''}</td>

                        {/* Cr Details Row */}
                        <td className="col-date border-left">{cr ? cr.date : ''}</td>
                        <td className="col-ref">{cr ? cr.refNo : ''}</td>
                        <td className="col-acc">{cr ? <span className="cell-acc-name">{cr.accName}</span> : ''}</td>
                        <td className="col-details">{cr ? <span className="cell-details">{cr.details}</span> : ''}</td>
                        <td className="col-amt right font-num">{cr ? `₹ ${formatINR(cr.amount)}` : ''}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Ledger Summary / Total Footer */}
              <tfoot>
                <tr className="ledger-footer-row">
                  <td colSpan="4" className="right footer-total-label">
                    Total
                  </td>
                  <td className="right footer-amt font-num">
                    ₹ {formatINR(ledgerData.drTotal)}
                  </td>

                  <td colSpan="4" className="right footer-total-label border-left">
                    Total
                  </td>
                  <td className="right footer-amt font-num">
                    ₹ {formatINR(ledgerData.crTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountLedger;
