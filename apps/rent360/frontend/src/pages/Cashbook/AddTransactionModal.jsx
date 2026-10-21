import React, { useState, useEffect } from 'react';
import { FiX, FiArrowDownLeft, FiArrowUpRight, FiCalendar, FiTag, FiCreditCard, FiFileText, FiPlus, FiCheck } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import './AddTransactionModal.scss';

const AddTransactionModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  token, 
  storeId, 
  paymentModes = [], 
  categories = [], 
  bankAccounts = [],
  onCategoryCreated,
  editTransaction = null
}) => {
  const [type, setType] = useState('CREDIT'); // 'CREDIT' (Cash In) | 'DEBIT' (Cash Out)
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentModeId, setPaymentModeId] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick category creation state
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editTransaction) {
        setType(editTransaction.transaction_type || 'CREDIT');
        setAmount(String(editTransaction.amount ?? ''));
        setCategoryId(editTransaction.categoryId || '');
        setPaymentModeId(editTransaction.paymentModeId || (paymentModes[0]?.id || ''));
        setBankAccountId(editTransaction.bankAccountId || '');
        setReferenceNo(editTransaction.reference_no || '');
        setRemarks(editTransaction.remarks || '');

        if (editTransaction.createdAt) {
          const d = new Date(editTransaction.createdAt);
          const offset = d.getTimezoneOffset() * 60000;
          const localISOTime = (new Date(d.getTime() - offset)).toISOString().slice(0, 16);
          setDateTime(localISOTime);
        } else {
          const now = new Date();
          const offset = now.getTimezoneOffset() * 60000;
          setDateTime((new Date(now.getTime() - offset)).toISOString().slice(0, 16));
        }

        setIsCreatingCategory(false);
        setNewCategoryName('');
      } else {
        // Set default datetime to local current ISO
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(now.getTime() - offset)).toISOString().slice(0, 16);
        setDateTime(localISOTime);

        // Default payment mode to "Cash" if available
        const cashMode = paymentModes.find(m => m.name.toLowerCase().includes('cash'));
        if (cashMode) setPaymentModeId(cashMode.id);
        else if (paymentModes.length > 0) setPaymentModeId(paymentModes[0].id);

        // Default bank account / drawer to "Cash Drawer" if available
        const drawer = bankAccounts.find(a => a.account_name.toLowerCase().includes('drawer') || a.account_name.toLowerCase().includes('cash'));
        if (drawer) setBankAccountId(drawer.id);
        else if (bankAccounts.length > 0) setBankAccountId(bankAccounts[0].id);

        setType('CREDIT');
        setAmount('');
        setCategoryId('');
        setReferenceNo('');
        setRemarks('');
        setIsCreatingCategory(false);
        setNewCategoryName('');
      }
    }
  }, [isOpen, editTransaction, paymentModes, bankAccounts]);

  if (!isOpen) return null;

  // Filter categories based on transaction type (CREDIT -> INCOME, DEBIT -> EXPENSE)
  const targetCategoryType = type === 'CREDIT' ? 'INCOME' : 'EXPENSE';
  const filteredCategories = categories.filter(c => !c.category_type || c.category_type === targetCategoryType);

  const handleQuickAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Enter category name');
      return;
    }
    setIsSavingCategory(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/transactionCategories`,
        {
          name: newCategoryName.trim(),
          category_type: targetCategoryType,
          storeId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Category created');
      const created = res.data.data;
      if (onCategoryCreated) onCategoryCreated(created);
      setCategoryId(created.id);
      setNewCategoryName('');
      setIsCreatingCategory(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create category');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    if (!paymentModeId) {
      toast.error('Please select a payment mode');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        storeId,
        transaction_type: type,
        amount: numAmount,
        paymentModeId,
        categoryId: categoryId || null,
        bankAccountId: bankAccountId || null,
        reference_no: referenceNo.trim() || null,
        remarks: remarks.trim() || null,
        createdAt: dateTime ? new Date(dateTime).toISOString() : new Date().toISOString()
      };

      if (editTransaction) {
        await axios.put(`${API_BASE_URL}/api/transactions/${editTransaction.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Transaction updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/api/transactions`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(type === 'CREDIT' ? 'Income recorded successfully' : 'Expense recorded successfully');
      }

      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || (editTransaction ? 'Failed to update transaction' : 'Failed to record transaction'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-tx-modal-overlay" onClick={onClose}>
      <div className="add-tx-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="title-area">
            <h2 className="modal-title">
              {editTransaction ? 'Edit Cashbook Entry' : 'Record Cashbook Entry'}
            </h2>
            <p className="modal-sub">
              {editTransaction
                ? 'Update amount, payment mode, category, or reference details'
                : 'Add income, deposit, petty cash expense, or drawer settlement'}
            </p>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>

        {/* Type Toggle Tabs */}
        <div className="type-toggle-container">
          <button
            type="button"
            className={`type-tab-btn credit ${type === 'CREDIT' ? 'active' : ''}`}
            onClick={() => {
              setType('CREDIT');
              setCategoryId('');
            }}
          >
            <FiArrowDownLeft className="icon" />
            <div className="text-wrap">
              <span className="main-label">Cash In</span>
              <span className="sub-label">Rental, Deposit, Sale</span>
            </div>
          </button>

          <button
            type="button"
            className={`type-tab-btn debit ${type === 'DEBIT' ? 'active' : ''}`}
            onClick={() => {
              setType('DEBIT');
              setCategoryId('');
            }}
          >
            <FiArrowUpRight className="icon" />
            <div className="text-wrap">
              <span className="main-label">Cash Out</span>
              <span className="sub-label">Refund, Expense, Tea, Bills</span>
            </div>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Amount Box */}
          <div className={`amount-input-box ${type === 'CREDIT' ? 'credit-focus' : 'debit-focus'}`}>
            <span className="currency-symbol">₹</span>
            <input
              type="number"
              step="any"
              min="1"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-grid">
            {/* Category selection */}
            <div className="form-group span-2">
              <div className="label-with-action">
                <label>
                  <FiTag /> {type === 'CREDIT' ? 'Income Category' : 'Expense Category'}
                </label>
                {!isCreatingCategory ? (
                  <button
                    type="button"
                    className="quick-link-btn"
                    onClick={() => setIsCreatingCategory(true)}
                  >
                    <FiPlus /> New Category
                  </button>
                ) : (
                  <button
                    type="button"
                    className="quick-link-btn cancel"
                    onClick={() => setIsCreatingCategory(false)}
                  >
                    Cancel
                  </button>
                )}
              </div>

              {!isCreatingCategory ? (
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="select-field"
                >
                  <option value="">-- Select Category (Optional) --</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="inline-add-row">
                  <input
                    type="text"
                    placeholder={`New ${type === 'CREDIT' ? 'Income' : 'Expense'} Category name...`}
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="input-field"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="save-cat-btn"
                    onClick={handleQuickAddCategory}
                    disabled={isSavingCategory}
                  >
                    <FiCheck /> {isSavingCategory ? 'Saving...' : 'Add'}
                  </button>
                </div>
              )}
            </div>

            {/* Payment Mode */}
            <div className="form-group">
              <div className="label-with-mode-hint">
                <label><FiCreditCard /> Payment Mode</label>
                {(() => {
                  const selMode = paymentModes.find(m => m.id === paymentModeId);
                  const isCash = (selMode?.name || '').toLowerCase().includes('cash');
                  return (
                    <span className={`mode-target-tag ${isCash ? 'cash' : 'bank'}`}>
                      {isCash ? 'Cash in Hand' : 'Bank / UPI'}
                    </span>
                  );
                })()}
              </div>
              <select
                value={paymentModeId}
                onChange={(e) => setPaymentModeId(e.target.value)}
                required
                className="select-field"
              >
                {paymentModes.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date & Time */}
            <div className="form-group">
              <label><FiCalendar /> Date & Time</label>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="input-field"
                required
              />
            </div>

            {/* Reference No / Bill No */}
            <div className="form-group">
              <label><FiFileText /> Reference / UPI / Bill #</label>
              <input
                type="text"
                placeholder="e.g. UPI Ref #, Bill #104"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="input-field"
              />
            </div>

            {/* Remarks */}
            <div className="form-group">
              <label>Remarks / Notes</label>
              <input
                type="text"
                placeholder="e.g. Advance rent, Tea, etc."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className={`btn-submit ${type === 'CREDIT' ? 'credit-btn' : 'debit-btn'}`}
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? (editTransaction ? 'Updating...' : 'Recording...') 
                : editTransaction 
                  ? 'Update Entry' 
                  : type === 'CREDIT' 
                    ? 'Record Cash In (+)' 
                    : 'Record Cash Out (-)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;
