import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiShoppingBag, FiChevronDown } from 'react-icons/fi';
import axios from 'axios';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import '../Stores/StoresList.scss'; // Reuse store styles for consistency
import { DataTable, AvatarCell, RowActions } from '../../components/ui';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { API_BASE_URL } from '../../config/api';

const CustomersList = () => {
  const { user, token } = useSelector((state) => state.auth);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || !user?.role;
  const userStoreId = user?.store?.id || user?.storeId || '';

  // Stores for super admin
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(() => {
    return userStoreId || '';
  });
  
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState({ 
    full_name: '', 
    mobile: '', 
    alternate_mobile: '', 
    address: '', 
    city: '', 
    pincode: '', 
    reference_by: '',
    storeId: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetch stores if Super Admin
  useEffect(() => {
    if (isSuperAdmin && token) {
      axios
        .get(`${API_BASE_URL}/api/stores`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => {
          const list = res.data.data || [];
          setStores(list);
        })
        .catch(() => {});
    } else if (userStoreId) {
      setSelectedStoreId(userStoreId);
    }
  }, [isSuperAdmin, userStoreId, token]);

  useEffect(() => {
    fetchData();
  }, [selectedStoreId, token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = selectedStoreId
        ? `${API_BASE_URL}/api/customers?storeId=${selectedStoreId}`
        : `${API_BASE_URL}/api/customers`;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setCustomers(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const openCustomerModal = (customerData = null) => {
    setFormErrors({});
    if (customerData) {
      setEditingCustomerId(customerData.id);
      setCustomerForm({ 
        full_name: customerData.full_name || '', 
        mobile: customerData.mobile || '', 
        alternate_mobile: customerData.alternate_mobile || '', 
        address: customerData.address || '',
        city: customerData.city || '',
        pincode: customerData.pincode || '',
        reference_by: customerData.reference_by || '',
        storeId: customerData.storeId || ''
      });
    } else {
      setEditingCustomerId(null);
      setCustomerForm({ 
        full_name: '', 
        mobile: '', 
        alternate_mobile: '', 
        address: '', 
        city: '', 
        pincode: '', 
        reference_by: '',
        storeId: selectedStoreId || (stores[0]?.id || '')
      });
    }
    setIsCustomerModalOpen(true);
  };

  const closeCustomerModal = () => {
    setIsCustomerModalOpen(false);
    setEditingCustomerId(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errs = {};
    if (!customerForm.full_name || customerForm.full_name.trim().length < 2) {
      errs.full_name = 'Full name must be at least 2 characters';
    }
    if (!/^[0-9]{10}$/.test(customerForm.mobile)) {
      errs.mobile = 'Mobile number must be exactly 10 digits';
    }
    if (customerForm.alternate_mobile && !/^[0-9]{10}$/.test(customerForm.alternate_mobile)) {
      errs.alternate_mobile = 'Alternate mobile must be exactly 10 digits';
    }
    if (customerForm.pincode && !/^[0-9]{6}$/.test(customerForm.pincode)) {
      errs.pincode = 'Pincode must be exactly 6 digits';
    }
    if (isSuperAdmin && !editingCustomerId && !customerForm.storeId && !selectedStoreId) {
      errs.storeId = 'Please assign a store for this customer';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      if (editingCustomerId) {
        await axios.put(`${API_BASE_URL}/api/customers/${editingCustomerId}`, customerForm, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Customer updated successfully');
      } else {
        const payload = { ...customerForm };
        const effectiveStoreId = selectedStoreId || customerForm.storeId || userStoreId;
        if (effectiveStoreId) {
          payload.storeId = effectiveStoreId;
        }
        await axios.post(`${API_BASE_URL}/api/customers`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Customer added successfully');
      }
      closeCustomerModal();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save customer');
    }
  };

  const handleConfirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    try {
      setIsDeletingCustomer(true);
      await axios.delete(`${API_BASE_URL}/api/customers/${customerToDelete.id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Customer deleted successfully');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete customer');
    } finally {
      setIsDeletingCustomer(false);
      setCustomerToDelete(null);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'CU';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="stores-view">
      <div className="stores-top-bar">
        <div className="title-section">
          <h1 className="main-title">Customers</h1>
          <p className="subtitle">
            Manage your customers and their contact details
          </p>
        </div>

        <div className="top-actions">
          {/* Super Admin Store Selector */}
          {isSuperAdmin && stores.length > 0 && (
            <div className="store-selector-pill">
              <FiShoppingBag className="store-pill-icon" />
              <label>Store:</label>
              <select
                value={selectedStoreId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedStoreId(val);
                  if (val) {
                    localStorage.setItem('rent360_active_store_id', val);
                  } else {
                    localStorage.removeItem('rent360_active_store_id');
                  }
                }}
              >
                <option value="">All Stores</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name || s.store_name}
                  </option>
                ))}
              </select>
              <FiChevronDown className="chevron-icon" />
            </div>
          )}

          <div className="pill-filter">
            <span className="dot" />
            <span>Total Customers ({customers.length})</span>
          </div>

          <button className="pill-btn-primary" onClick={() => openCustomerModal()}>
            <FiPlus className="plus-icon" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      <div className="bond-card-container">
        <DataTable
          columns={[
            { label: 'Customer Name' },
            ...(isSuperAdmin ? [{ label: 'Store' }] : []),
            { label: 'Mobile Number' },
            { label: 'City & Address' },
            { label: 'Actions', align: 'right' }
          ]}
          data={customers}
          loading={loading}
          emptyMessage="No customers found. Click + Add Customer to register one."
          keyExtractor={(c) => c.id}
          renderRow={(c) => (
            <>
              <td>
                <AvatarCell
                  title={c.full_name}
                  subtitle={c.reference_by ? `Ref: ${c.reference_by}` : null}
                  fallbackChars={getInitials(c.full_name)}
                />
              </td>
              {isSuperAdmin && (
                <td>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: 'var(--bg-tertiary, #f1f5f9)',
                      color: 'var(--primary, #6366f1)',
                      border: '1px solid var(--border-color, #e2e8f0)',
                      display: 'inline-block'
                    }}
                  >
                    {c.store?.name || 'Unknown Store'}
                  </span>
                </td>
              )}
              <td>
                <div className="store-text">
                  <span className="phone-text">{c.mobile}</span>
                  {c.alternate_mobile && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                      Alt: {c.alternate_mobile}
                    </span>
                  )}
                </div>
              </td>
              <td>
                <div className="store-text">
                  <span className="store-name">{c.city || '—'}</span>
                  {c.address && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                      {c.address} {c.pincode ? `- ${c.pincode}` : ''}
                    </span>
                  )}
                </div>
              </td>
              <td className="text-right">
                <RowActions
                  onEdit={() => openCustomerModal(c)}
                  onDelete={() => setCustomerToDelete(c)}
                />
              </td>
            </>
          )}
        />
      </div>

      {isCustomerModalOpen && (
        <div className="bond-modal-overlay" onClick={closeCustomerModal}>
          <div className="bond-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{editingCustomerId ? 'Edit Customer' : 'Add Customer'}</h2>
                <p>Provide contact and address details</p>
              </div>
              <button className="modal-close" onClick={closeCustomerModal}><FiX /></button>
            </div>
            <form onSubmit={handleCustomerSubmit} autoComplete="off">
              <div className="modal-body">
                {isSuperAdmin && !editingCustomerId && (
                  <div className="form-field" style={{ marginBottom: '14px' }}>
                    <label>Assign to Store *</label>
                    <select
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: '13px'
                      }}
                      value={customerForm.storeId || ''}
                      onChange={(e) => {
                        setCustomerForm({ ...customerForm, storeId: e.target.value });
                        if (formErrors.storeId) setFormErrors({ ...formErrors, storeId: null });
                      }}
                    >
                      <option value="">-- Select Store --</option>
                      {stores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name || s.store_name}
                        </option>
                      ))}
                    </select>
                    {formErrors.storeId && (
                      <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '2px', display: 'block' }}>
                        {formErrors.storeId}
                      </span>
                    )}
                  </div>
                )}

                <div className="form-row-2">
                  <div className="form-field">
                    <label>Full Name *</label>
                    <input 
                      value={customerForm.full_name} 
                      onChange={e => {
                        setCustomerForm({...customerForm, full_name: e.target.value});
                        if (formErrors.full_name) setFormErrors({...formErrors, full_name: null});
                      }} 
                    />
                    {formErrors.full_name && <span style={{color: "var(--danger)", fontSize: "0.75rem", marginTop: "2px"}}>{formErrors.full_name}</span>}
                  </div>
                  <div className="form-field">
                    <label>Mobile Number *</label>
                    <input 
                      value={customerForm.mobile} 
                      onChange={e => {
                        setCustomerForm({...customerForm, mobile: e.target.value});
                        if (formErrors.mobile) setFormErrors({...formErrors, mobile: null});
                      }} 
                    />
                    {formErrors.mobile && <span style={{color: "var(--danger)", fontSize: "0.75rem", marginTop: "2px"}}>{formErrors.mobile}</span>}
                  </div>
                </div>
                
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Alternate Mobile</label>
                    <input 
                      value={customerForm.alternate_mobile} 
                      onChange={e => {
                        setCustomerForm({...customerForm, alternate_mobile: e.target.value});
                        if (formErrors.alternate_mobile) setFormErrors({...formErrors, alternate_mobile: null});
                      }} 
                    />
                    {formErrors.alternate_mobile && <span style={{color: "var(--danger)", fontSize: "0.75rem", marginTop: "2px"}}>{formErrors.alternate_mobile}</span>}
                  </div>
                  <div className="form-field">
                    <label>City</label>
                    <input 
                      value={customerForm.city} 
                      onChange={e => setCustomerForm({...customerForm, city: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-field">
                    <label>Pincode</label>
                    <input 
                      value={customerForm.pincode} 
                      onChange={e => {
                        setCustomerForm({...customerForm, pincode: e.target.value});
                        if (formErrors.pincode) setFormErrors({...formErrors, pincode: null});
                      }} 
                    />
                    {formErrors.pincode && <span style={{color: "var(--danger)", fontSize: "0.75rem", marginTop: "2px"}}>{formErrors.pincode}</span>}
                  </div>
                  <div className="form-field">
                    <label>Reference By</label>
                    <input 
                      value={customerForm.reference_by} 
                      onChange={e => setCustomerForm({...customerForm, reference_by: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label>Address</label>
                  <textarea 
                    rows="3" 
                    value={customerForm.address} 
                    onChange={e => setCustomerForm({...customerForm, address: e.target.value})}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="pill-btn-secondary" onClick={closeCustomerModal}>Cancel</button>
                <button type="submit" className="pill-btn-primary">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={!!customerToDelete}
        title="Delete Customer"
        message={customerToDelete ? `Are you sure you want to delete "${customerToDelete.full_name}"?` : ''}
        confirmText="Delete"
        onConfirm={handleConfirmDeleteCustomer}
        onCancel={() => setCustomerToDelete(null)}
        isLoading={isDeletingCustomer}
        isDestructive={true}
      />
    </div>
  );
};

export default CustomersList;
