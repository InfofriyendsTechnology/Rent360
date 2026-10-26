import React, { useState, useEffect } from 'react';
import { FiX, FiArrowDownLeft, FiArrowUpRight, FiCalendar, FiTag, FiCreditCard, FiFileText, FiPlus, FiCheck } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import { DateInputDMY } from '../../components/ui';
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
  const effectiveToken = token || localStorage.getItem('token') || '';
  const [type, setType] = useState('CREDIT'); // 'CREDIT' (Cash In) | 'DEBIT' (Cash Out)
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentModeId, setPaymentModeId] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [entryDate, setEntryDate] = useState('');
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
        setCategoryId(editTransaction.categoryId || editTransaction.category?.id || '');

        // Match and set payment mode
        const matchedMode = paymentModes.find(m => 
          m.id === editTransaction.paymentModeId || 
          m.id === editTransaction.paymentMode?.id ||
          m.name?.toLowerCase() === (editTransaction.paymentMode?.name || '').toLowerCase()
        );
        const modeId = matchedMode ? matchedMode.id : (editTransaction.paymentModeId || (paymentModes.length > 0 ? paymentModes[0].id : ''));
        setPaymentModeId(modeId);

        const isCash = (matchedMode?.name || editTransaction.paymentMode?.name || '').toLowerCase().includes('cash');
        if (isCash) {
          const drawer = bankAccounts.find(a => a.account_name.toLowerCase().includes('drawer') || a.account_name.toLowerCase().includes('cash'));
          setBankAccountId(editTransaction.bankAccountId || drawer?.id || '');
        } else {
          const selAcc = bankAccounts.find(a => a.id === editTransaction.bankAccountId);
          if (selAcc && !selAcc.account_name.toLowerCase().includes('drawer') && !selAcc.account_name.toLowerCase().includes('cash')) {
            setBankAccountId(selAcc.id);
          } else {
            const realBanks = bankAccounts.filter(a => !a.account_name.toLowerCase().includes('drawer') && !a.account_name.toLowerCase().includes('cash'));
            setBankAccountId(realBanks.length > 0 ? realBanks[0].id : (editTransaction.bankAccountId || ''));
          }
        }
        setReferenceNo(editTransaction.reference_no || '');
        setRemarks(editTransaction.remarks || '');

        if (editTransaction.createdAt) {
          const d = new Date(editTransaction.createdAt);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          setEntryDate(`${y}-${m}-${day}`);
        } else {
          const now = new Date();
          const y = now.getFullYear();
          const m = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          setEntryDate(`${y}-${m}-${day}`);
        }

        setIsCreatingCategory(false);
        setNewCategoryName('');
      } else {
        // Set default date to today's date in YYYY-MM-DD
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        setEntryDate(`${y}-${m}-${day}`);

        // Default payment mode to "Cash" if available
        const cashMode = paymentModes.find(m => m.name.toLowerCase().includes('cash'));
        const drawer = bankAccounts.find(a => a.account_name.toLowerCase().includes('drawer') || a.account_name.toLowerCase().includes('cash'));
        if (cashMode) {
          setPaymentModeId(cashMode.id);
          setBankAccountId(drawer ? drawer.id : '');
        } else if (paymentModes.length > 0) {
          setPaymentModeId(paymentModes[0].id);
          setBankAccountId('');
        }

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

  // Filter categories based on transaction type (CREDIT -> INCOME, DEBIT -> EXPENSE, or BOTH)
  // Strictly exclude Cash and Bank asset ledgers (e.g. CASH ACC, BANK ACC, Drawer) because they are payment modes/accounts, not income/expense categories
  const targetCategoryType = type === 'CREDIT' ? 'INCOME' : 'EXPENSE';
  const filteredCategories = categories.filter(c => {
    const nameUpper = (c.name || '').toUpperCase();
    const grp = (c.account_group || '').toLowerCase();
    if (
      nameUpper === 'CASH ACC' || 
      nameUpper === 'BANK ACC' || 
      nameUpper.includes('CASH DRAWER') ||
      grp.includes('cash account') || 
      grp.includes('bank account')
    ) {
      return false;
    }
    return !c.category_type || c.category_type === 'BOTH' || c.category_type === targetCategoryType;
  });

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
        { headers: { Authorization: `Bearer ${effectiveToken}` } }
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
      const selMode = paymentModes.find(m => m.id === paymentModeId);
      const isCash = (selMode?.name || '').toLowerCase().includes('cash');
      let effectiveBankAccountId = bankAccountId || null;
      if (isCash) {
        if (!effectiveBankAccountId) {
          const drawer = bankAccounts.find(a => a.account_name.toLowerCase().includes('drawer') || a.account_name.toLowerCase().includes('cash'));
          effectiveBankAccountId = drawer?.id || null;
        }
      } else {
        // If non-cash, ensure it NEVER gets saved as Cash Drawer
        const selectedAcc = bankAccounts.find(a => a.id === effectiveBankAccountId);
        if (selectedAcc && (selectedAcc.account_name.toLowerCase().includes('drawer') || selectedAcc.account_name.toLowerCase().includes('cash'))) {
          effectiveBankAccountId = null;
        }
      }

      // Construct ISO timestamp keeping current time if new, or preserving original time on edited date
      let finalCreatedAtIso;
      if (entryDate) {
        const origDate = editTransaction?.createdAt ? new Date(editTransaction.createdAt) : new Date();
        const parts = entryDate.split('-').map(Number);
        if (parts.length === 3) {
          const [y, m, d] = parts;
          const targetDate = new Date(origDate.getTime());
          targetDate.setFullYear(y, m - 1, d);
          finalCreatedAtIso = targetDate.toISOString();
        } else {
          finalCreatedAtIso = new Date().toISOString();
        }
      } else {
        finalCreatedAtIso = new Date().toISOString();
      }

      const payload = {
        storeId,
        transaction_type: type,
        amount: numAmount,
        paymentModeId,
        categoryId: categoryId || null,
        bankAccountId: effectiveBankAccountId,
        reference_no: referenceNo.trim() || null,
        remarks: remarks.trim() || null,
        createdAt: finalCreatedAtIso
      };

      if (editTransaction) {
        await axios.put(`${API_BASE_URL}/api/transactions/${editTransaction.id}`, payload, {
          headers: { Authorization: `Bearer ${effectiveToken}` }
        });
        toast.success('Transaction updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/api/transactions`, payload, {
          headers: { Authorization: `Bearer ${effectiveToken}` }
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
                onChange={(e) => {
                  const newId = e.target.value;
                  setPaymentModeId(newId);
                  const sel = paymentModes.find((m) => m.id === newId);
                  const isCash = (sel?.name || '').toLowerCase().includes('cash');
                  if (isCash) {
                    const drawer = bankAccounts.find(
                      (a) =>
                        a.account_name.toLowerCase().includes('drawer') ||
                        a.account_name.toLowerCase().includes('cash')
                    );
                    setBankAccountId(drawer ? drawer.id : '');
                  } else {
                    const realBanks = bankAccounts.filter(
                      (a) =>
                        !a.account_name.toLowerCase().includes('drawer') &&
                        !a.account_name.toLowerCase().includes('cash')
                    );
                    setBankAccountId(realBanks.length > 0 ? realBanks[0].id : '');
                  }
                }}
                required
                className="select-field"
              >
                {!paymentModeId && (
                  <option value="" disabled>
                    -- Select Payment Mode --
                  </option>
                )}
                {paymentModes.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Bank Account Selection if Non-Cash and Bank Accounts exist */}
            {(() => {
              const selMode = paymentModes.find((m) => m.id === paymentModeId);
              const isCash = (selMode?.name || '').toLowerCase().includes('cash');
              const realBanks = bankAccounts.filter(
                (a) =>
                  !a.account_name.toLowerCase().includes('drawer') &&
                  !a.account_name.toLowerCase().includes('cash')
              );

              if (!isCash && realBanks.length > 0) {
                return (
                  <div className="form-group">
                    <label>Bank Account</label>
                    <select
                      value={bankAccountId}
                      onChange={(e) => setBankAccountId(e.target.value)}
                      className="select-field"
                    >
                      <option value="">-- General Bank / Default --</option>
                      {realBanks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.account_name} {b.account_number ? `(${b.account_number})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }
              return null;
            })()}

            {/* Date */}
            <div className="form-group">
              <label><FiCalendar /> Date</label>
              <DateInputDMY
                value={entryDate}
                onChange={setEntryDate}
                className="date-input-field"
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
