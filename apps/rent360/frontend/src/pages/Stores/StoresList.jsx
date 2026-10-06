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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:61026/api/stores', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Store created successfully!');
      setIsModalOpen(false);
      setFormData({ name: '', owner_name: '', mobile: '', email: '', address: '', city: '', state: '', pincode: '', gst_number: '' });
      fetchStores();
    } catch (error) {
      console.error('Error creating store:', error);
      toast.error(error.response?.data?.message || 'Failed to create store.');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Stores Management</h1>
          <p className="page-subtitle">Manage all tenant stores across the platform.</p>
        </div>
        <button className="brutal-btn primary" onClick={() => setIsModalOpen(true)}>
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
                        <button className="icon-btn edit" title="Edit">
                          <FiEdit />
                        </button>
                        <button className="icon-btn delete" title="Delete">
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
              <h2>Add New Store</h2>
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
                  <button type="submit" className="brutal-btn primary">Create Store</button>
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
