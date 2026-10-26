import React, { useState, useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FiPlus, FiSearch, FiX, FiDollarSign, FiCreditCard, 
  FiClock, FiTag, FiUser
} from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import AddTransactionModal from './AddTransactionModal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { DataTable, RowActions } from '../../components/ui';

import '../Stores/StoresList.scss';
import './Cashbook.scss';

const Cashbook = () => {
  const { user, token: reduxToken } = useSelector((state) => state.auth);
  const token = reduxToken || localStorage.getItem('token') || '';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || !user?.role;
  if (isSuperAdmin) {
    return <Navigate to="/stores" replace />;
  }
  const userStoreId = user?.store?.id || user?.storeId || '';
  const selectedStoreId = userStoreId;

  // Transactions data
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Masters
  const [paymentModes, setPaymentModes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [txToEdit, setTxToEdit] = useState(null);
  const [txToDelete, setTxToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Master Data
  useEffect(() => {
    if (!selectedStoreId || !token) return;
    fetchMasters();
  }, [selectedStoreId, token]);

  const fetchMasters = async () => {
    if (!token) return;
    try {
      const storeParam = selectedStoreId ? `?storeId=${selectedStoreId}` : '';
      const [modesRes, catsRes, accountsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/paymentModes${storeParam}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_BASE_URL}/api/transactionCategories${storeParam}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_BASE_URL}/api/storeBankAccounts${storeParam}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: [] } }))
      ]);

      setPaymentModes(modesRes.data?.data || []);
      setCategories(catsRes.data?.data || []);
      setBankAccounts(accountsRes.data?.data || []);
    } catch (err) {
      console.error('Error loading master data:', err);
    }
  };

  // Fetch All Transactions
  useEffect(() => {
    if (!selectedStoreId || !token) return;
    fetchTransactions();
  }, [selectedStoreId, token]);

  const fetchTransactions = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStoreId) params.append('storeId', selectedStoreId);

      const res = await axios.get(`${API_BASE_URL}/api/transactions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const responseData = res.data?.data || {};
      setTransactions(responseData.transactions || []);
    } catch (err) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

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

  // Search filter
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const q = searchQuery.toLowerCase().trim();

    return transactions.filter((tx) => {
      const ref = tx.reference_no?.toLowerCase() || '';
      const remarks = tx.remarks?.toLowerCase() || '';
      const cat = (tx.transactionCategory?.name || tx.category?.name || '').toLowerCase();
      const staff = tx.performedBy?.name?.toLowerCase() || '';
      const customer = tx.booking?.customer?.full_name?.toLowerCase() || '';
      const bookingNo = tx.booking?.booking_no?.toLowerCase() || '';
      const account = tx.bankAccount?.account_name?.toLowerCase() || '';
      const paymentMode = tx.paymentMode?.name?.toLowerCase() || '';
      const amount = String(tx.amount || '');

      return (
        ref.includes(q) ||
        remarks.includes(q) ||
        cat.includes(q) ||
        staff.includes(q) ||
        customer.includes(q) ||
        bookingNo.includes(q) ||
        account.includes(q) ||
        paymentMode.includes(q) ||
        amount.includes(q)
      );
    });
  }, [transactions, searchQuery]);

  // Helpers
  const formatDateOnly = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB'); // DD/MM/YYYY
  };

  const formatINR = (val) => {
    return Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="stores-view cashbook-view">
      {/* Top Header matching Rent360 Standard */}
      <div className="stores-top-bar">
        <div className="title-section">
          <h1 className="main-title">Cashbook</h1>
          <p className="subtitle">
            Record and manage daily payments, receipts, and cashflow
          </p>
        </div>

        <div className="top-actions">
          <div className="pill-filter">
            <span className="dot" />
            <span>Total Records ({filteredTransactions.length})</span>
          </div>

          <button
            type="button"
            className="pill-btn-primary"
            onClick={() => {
              setTxToEdit(null);
              setIsAddModalOpen(true);
            }}
          >
            <FiPlus className="plus-icon" />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="cashbook-search-toolbar">
        <div className="search-pill-wrapper">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by party, reference #, remarks, amount..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
            >
              <FiX />
            </button>
          )}
        </div>
      </div>

      {/* Main Table Container using Rent360 DataTable */}
      <div className="bond-card-container">
        <DataTable
          columns={[
            { label: 'Record No.', width: '130px' },
            { label: 'Date', width: '110px' },
            { label: 'Account', width: '140px' },
            { label: 'Party / Name', width: '160px' },
            { label: 'Amount', align: 'right', width: '140px' },
            { label: 'Payment Mode', width: '130px' },
            { label: 'Details / Category' },
            { label: 'Actions', align: 'right', width: '90px' }
          ]}
          data={filteredTransactions}
          loading={loading}
          initialPageSize={20}
          pageSizeOptions={[10, 20, 50, 100]}
          emptyMessage="No transactions found. Click + Add Record to record daily cash flow."
          keyExtractor={(tx) => tx.id}
          renderRow={(tx, idx) => {
            const isCredit = tx.transaction_type === 'CREDIT';
            const incomeNo = tx.reference_no || `REC-${tx.id ? tx.id.slice(-6).toUpperCase() : idx + 1}`;
            const isCashMode = (tx.paymentMode?.name || '').toLowerCase().includes('cash');
            const accountName = tx.bankAccount?.account_name || (isCashMode ? 'Cash Drawer' : 'Main Bank');
            const partyName = tx.booking?.customer?.full_name || tx.performedBy?.name || '-';
            const paymentMode = tx.paymentMode?.name || 'Cash';
            const detailsText = tx.remarks || tx.transactionCategory?.name || tx.category?.name || '-';

            return (
              <>
                {/* Record No. */}
                <td>
                  <span className="record-code">{incomeNo}</span>
                </td>

                {/* Date */}
                <td>
                  <span className="date-text">{formatDateOnly(tx.createdAt)}</span>
                </td>

                {/* Account */}
                <td>
                  <span className="account-badge">
                    {isCashMode ? <FiDollarSign className="icon" /> : <FiCreditCard className="icon" />}
                    <span>{accountName}</span>
                  </span>
                </td>

                {/* Party / Name */}
                <td>
                  <span className="party-name">{partyName}</span>
                </td>

                {/* Amount */}
                <td className="text-right">
                  <span className={`amount-text ${isCredit ? 'credit' : 'debit'}`}>
                    {isCredit ? '+ ' : '- '}₹ {formatINR(tx.amount)}
                  </span>
                </td>

                {/* Payment Mode */}
                <td>
                  <span className="payment-mode-pill">
                    {paymentMode}
                  </span>
                </td>

                {/* Details */}
                <td>
                  <div className="details-cell" title={detailsText}>
                    <span className="cat-name">{tx.transactionCategory?.name || tx.category?.name || 'General'}</span>
                    {tx.remarks && <span className="remarks-text">{tx.remarks}</span>}
                  </div>
                </td>

                {/* Actions */}
                <td className="text-right">
                  <RowActions
                    onEdit={() => {
                      setTxToEdit(tx);
                      setIsAddModalOpen(true);
                    }}
                    onDelete={() => setTxToDelete(tx)}
                  />
                </td>
              </>
            );
          }}
        />
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
        title="Delete Record"
        message={`Are you sure you want to delete this entry of ₹${formatINR(txToDelete?.amount)}?`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        onConfirm={handleDeleteTransaction}
        onCancel={() => setTxToDelete(null)}
        isDestructive={true}
      />
    </div>
  );
};

export default Cashbook;
