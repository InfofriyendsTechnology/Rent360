import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import axios from 'axios';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import '../Stores/StoresList.scss'; // Reuse store styles for consistency

const UsersList = () => {
  const { token } = useSelector((state) => state.auth);
  
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userForm, setUserForm] = useState({ name: '', mobile: '', password: '', roleId: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        axios.get('http://localhost:61026/api/users', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:61026/api/roles', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setUsers(usersRes.data.data || []);
      setRoles(rolesRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openUserModal = (userData = null) => {
    if (userData) {
      setEditingUserId(userData.id);
      setUserForm({ 
        name: userData.name || '', 
        mobile: userData.mobile || '', 
        password: '', 
        roleId: userData.roleId || '' 
      });
    } else {
      setEditingUserId(null);
      setUserForm({ name: '', mobile: '', password: '', roleId: roles.length > 0 ? roles[0].id : '' });
    }
    setIsUserModalOpen(true);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...userForm };
      if (editingUserId && !payload.password) {
        delete payload.password;
      }
      
      if (editingUserId) {
        await axios.put(`http://localhost:61026/api/users/${editingUserId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Team Member updated successfully');
      } else {
        await axios.post('http://localhost:61026/api/users', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Team Member added successfully');
      }
      setIsUserModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save member');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to remove this team member?')) return;
    try {
      await axios.delete(`http://localhost:61026/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Member removed');
      fetchData();
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'TM';
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
          <h1 className="main-title">Team Members</h1>
          <p className="subtitle">
            Manage your store staff, their access roles, and status
          </p>
        </div>

        <div className="top-actions">
          <div className="pill-filter">
            <span className="dot" />
            <span>Total Members ({users.length})</span>
          </div>

          <button className="pill-btn-primary" onClick={() => openUserModal()}>
            <FiPlus className="plus-icon" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      <div className="bond-card-container">
        <div className="table-responsive">
          <table className="bond-table">
            <thead>
              <tr>
                <th>Team Member</th>
                <th>Mobile Number</th>
                <th>Assigned Role</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center state-message">Loading members...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="5" className="text-center state-message">No team members found</td></tr>
              ) : (
                users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="store-identity">
                        <div className="avatar-initials">
                          {getInitials(u.name)}
                        </div>
                        <div className="store-text">
                          <span className="store-name">{u.name}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="phone-text">{u.mobile}</span></td>
                    <td>
                      <span className="bond-status-pill" style={{ background: 'var(--bg-card-alt)', color: 'var(--text-main)', border: '1px solid var(--border-main)' }}>
                        {u.role?.name || 'No Role'}
                      </span>
                    </td>
                    <td>
                      <span className={`bond-status-pill ${(u.status || 'ACTIVE').toLowerCase()}`}>
                        <span className="status-indicator" />
                        {u.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="row-action-btns">
                        <button className="icon-action-btn edit" onClick={() => openUserModal(u)}><FiEdit2 /></button>
                        <button className="icon-action-btn delete" onClick={() => handleDeleteUser(u.id)}><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isUserModalOpen && (
        <div className="bond-modal-overlay" onClick={() => setIsUserModalOpen(false)}>
          <div className="bond-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{editingUserId ? 'Edit Team Member' : 'Add Team Member'}</h2>
                <p>Provide contact and role assignment details</p>
              </div>
              <button className="modal-close" onClick={() => setIsUserModalOpen(false)}><FiX /></button>
            </div>
            <form onSubmit={handleUserSubmit}>
              <div className="modal-body">
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Full Name *</label>
                    <input required value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label>Mobile Number *</label>
                    <input required value={userForm.mobile} onChange={e => setUserForm({...userForm, mobile: e.target.value})} />
                  </div>
                </div>
                
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Assign Role *</label>
                    <select required value={userForm.roleId} onChange={e => setUserForm({...userForm, roleId: e.target.value})}>
                      <option value="" disabled>Select a role...</option>
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>{editingUserId ? 'New Password (Optional)' : 'Password *'}</label>
                    <input type="password" required={!editingUserId} value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="pill-btn-secondary" onClick={() => setIsUserModalOpen(false)}>Cancel</button>
                <button type="submit" className="pill-btn-primary">Save Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersList;
