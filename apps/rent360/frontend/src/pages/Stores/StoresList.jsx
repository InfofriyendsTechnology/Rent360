import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import axios from 'axios';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import './StoresList.scss';

const StoresList = () => {
  const { token } = useSelector((state) => state.auth);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', owner_name: '', mobile: '', email: '', 
    address: '', city: '', state: '', pincode: '', gst_number: ''
  });

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:61026/api/stores', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStores(res.data.data || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
      toast.error('Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    setEditingStoreId(null);
    setFormData({ name: '', owner_name: '', mobile: '', email: '', address: '', city: '', state: '', pincode: '', gst_number: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (store) => {
    setEditingStoreId(store.id);
    setFormData({
      name: store.name || '',
      owner_name: store.owner_name || '',
      mobile: store.mobile || '',
      email: store.email || '',
      address: store.address || '',
      city: store.city || '',
      state: store.state || '',
      pincode: store.pincode || '',
      gst_number: store.gst_number || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this store?')) return;
    try {
      await axios.delete(`http://localhost:61026/api/stores/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Store deleted successfully!');
      fetchStores();
    } catch (error) {
      console.error('Error deleting store:', error);
      toast.error('Failed to delete store.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStoreId) {
        await axios.put(`http://localhost:61026/api/stores/${editingStoreId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Store updated successfully!');
      } else {
        await axios.post('http://localhost:61026/api/stores', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Store created successfully!');
      }
      setIsModalOpen(false);
      fetchStores();
    } catch (error) {
      console.error('Error saving store:', error);
      toast.error(error.response?.data?.message || 'Failed to save store.');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Stores Management</h1>
          <p className="page-subtitle">Manage all tenant stores across the platform.</p>
        </div>
        <button className="brutal-btn primary" onClick={openAddModal}>
          <FiPlus />
          <span>Add New Store</span>
        </button>
      </div>

      <div 
        className="brutal-card"
      >
        <div className="table-responsive">
          <table className="brutal-table">
            <thead>
              <tr>
                <th>Store Name</th>
                <th>Owner Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center">Loading stores...</td>
                </tr>
              ) : stores.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center empty-state">No stores found. Create one to get started!</td>
                </tr>
              ) : (
                stores.map((store) => (
                  <tr key={store.id}>
                    <td className="font-bold">{store.name}</td>
                    <td>{store.owner_name}</td>
                    <td>{store.email}</td>
                    <td>{store.mobile}</td>
                    <td>
                      <span className={`status-badge ${(store.subscription_status || 'ACTIVE').toLowerCase()}`}>
                        {store.subscription_status || 'ACTIVE'}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="icon-btn edit" title="Edit" onClick={() => handleEdit(store)}>
                          <FiEdit />
                        </button>
                        <button className="icon-btn delete" title="Delete" onClick={() => handleDelete(store.id)}>
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Brutal Modal for Add Store */}
      {isModalOpen && (
        <div className="brutal-modal-overlay">
          <div 
            className="brutal-modal"
          >
            <div className="modal-header">
              <h2>{editingStoreId ? 'Edit Store' : 'Add New Store'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Store Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className="brutal-input" />
                  </div>
                  <div className="form-group">
                    <label>Owner Name *</label>
                    <input type="text" name="owner_name" value={formData.owner_name} onChange={handleChange} required className="brutal-input" />
                  </div>
                  <div className="form-group">
                    <label>Mobile Number *</label>
                    <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} required className="brutal-input" />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="brutal-input" />
                  </div>
                  <div className="form-group full-width">
                    <label>Address</label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} className="brutal-input" />
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange} className="brutal-input" />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input type="text" name="state" value={formData.state} onChange={handleChange} className="brutal-input" />
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} className="brutal-input" />
                  </div>
                  <div className="form-group">
                    <label>GST Number</label>
                    <input type="text" name="gst_number" value={formData.gst_number} onChange={handleChange} className="brutal-input" />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="brutal-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className="brutal-btn primary">{editingStoreId ? 'Save Changes' : 'Create Store'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoresList;
