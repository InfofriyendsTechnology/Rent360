import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import axios from 'axios';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import '../Stores/StoresList.scss'; // Reuse store styles for consistency

const CustomersList = () => {
  const { token } = useSelector((state) => state.auth);
  
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [customerForm, setCustomerForm] = useState({ 
    full_name: '', 
    mobile: '', 
    alternate_mobile: '', 
    address: '', 
    city: '', 
    pincode: '', 
    reference_by: '' 
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:61026/api/customers', { headers: { Authorization: `Bearer ${token}` } });
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
        reference_by: customerData.reference_by || ''
      });
    } else {
      setEditingCustomerId(null);
      setCustomerForm({ full_name: '', mobile: '', alternate_mobile: '', address: '', city: '', pincode: '', reference_by: '' });
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
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      if (editingCustomerId) {
        await axios.put(`http://localhost:61026/api/customers/${editingCustomerId}`, customerForm, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Customer updated successfully');
      } else {
        await axios.post('http://localhost:61026/api/customers', customerForm, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Customer added successfully');
      }
      closeCustomerModal();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save customer');
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await axios.delete(`http://localhost:61026/api/customers/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Customer deleted successfully');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete customer');
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
        <div className="table-responsive">
          <table className="bond-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Mobile Number</th>
                <th>City & Address</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="text-center state-message">Loading customers...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan="4" className="text-center state-message">No customers found</td></tr>
              ) : (
                customers.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="store-identity">
                        <div className="avatar-initials">
                          {getInitials(c.full_name)}
                        </div>
                        <div className="store-text">
                          <span className="store-name">{c.full_name}</span>
                          {c.reference_by && (
                            <span style={{fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block'}}>
                              Ref: {c.reference_by}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="store-text">
                        <span className="phone-text">{c.mobile}</span>
                        {c.alternate_mobile && (
                          <span style={{fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block'}}>
                            Alt: {c.alternate_mobile}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="store-text">
                        <span className="store-name">{c.city || 'N/A'}</span>
                        {c.address && (
                          <span style={{fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block'}}>
                            {c.address} {c.pincode ? `- ${c.pincode}` : ''}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="row-action-btns">
                        <button className="icon-action-btn edit" onClick={() => openCustomerModal(c)}><FiEdit2 /></button>
                        <button className="icon-action-btn delete" onClick={() => handleDeleteCustomer(c.id)}><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
            <form onSubmit={handleCustomerSubmit}>
              <div className="modal-body">
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
    </div>
  );
};

export default CustomersList;
