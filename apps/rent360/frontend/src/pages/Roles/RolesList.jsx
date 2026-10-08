import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import axios from 'axios';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import '../Stores/StoresList.scss';
import './RolesList.scss';

const ALL_PERMISSIONS = [
  'DASHBOARD_VIEW',
  'INVENTORY_MANAGE',
  'CUSTOMERS_MANAGE',
  'BILLING_CREATE',
  'REPORTS_VIEW',
  'SETTINGS_MANAGE'
];

const RolesList = () => {
  const { token } = useSelector((state) => state.auth);
  
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [roleForm, setRoleForm] = useState({ name: '', permissions: [] });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:61026/api/roles', { headers: { Authorization: `Bearer ${token}` } });
      setRoles(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const openRoleModal = (roleData = null) => {
    if (roleData) {
      setEditingRoleId(roleData.id);
      setRoleForm({ 
        name: roleData.name || '', 
        permissions: roleData.permissions || [] 
      });
    } else {
      setEditingRoleId(null);
      setRoleForm({ name: '', permissions: [] });
    }
    setIsRoleModalOpen(true);
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRoleId) {
        await axios.put(`http://localhost:61026/api/roles/${editingRoleId}`, roleForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Role updated successfully');
      } else {
        await axios.post('http://localhost:61026/api/roles', roleForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Role created successfully');
      }
      setIsRoleModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save role');
    }
  };

  const handleDeleteRole = async (id) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    try {
      await axios.delete(`http://localhost:61026/api/roles/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Role deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete role');
    }
  };

  const togglePermission = (perm) => {
    setRoleForm(prev => {
      const perms = prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm];
      return { ...prev, permissions: perms };
    });
  };

  return (
    <div className="stores-view">
      <div className="stores-top-bar">
        <div className="title-section">
          <h1 className="main-title">Roles & Permissions</h1>
          <p className="subtitle">
            Define access control roles and permissions for your staff
          </p>
        </div>

        <div className="top-actions">
          <div className="pill-filter">
            <span className="dot" />
            <span>Total Roles ({roles.length})</span>
          </div>

          <button className="pill-btn-primary" onClick={() => openRoleModal()}>
            <FiPlus className="plus-icon" />
            <span>Create Role</span>
          </button>
        </div>
      </div>

      <div className="bond-card-container">
        <div className="table-responsive">
          <table className="bond-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Role Name</th>
                <th style={{ width: '60%' }}>Permissions Granted</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="3" className="text-center state-message">Loading roles...</td></tr>
              ) : roles.length === 0 ? (
                <tr><td colSpan="3" className="text-center state-message">No roles found</td></tr>
              ) : (
                roles.map(r => (
                  <tr key={r.id}>
                    <td>
                      <span className="store-name">{r.name}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {r.permissions && r.permissions.length > 0 ? (
                          r.permissions.map(p => (
                            <span key={p} className="perm-pill">
                              {p.replace('_', ' ')}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted">No permissions</span>
                        )}
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="row-action-btns">
                        <button className="icon-action-btn edit" onClick={() => openRoleModal(r)}><FiEdit2 /></button>
                        <button className="icon-action-btn delete" onClick={() => handleDeleteRole(r.id)}><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isRoleModalOpen && (
        <div className="bond-modal-overlay" onClick={() => setIsRoleModalOpen(false)}>
          <div className="bond-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{editingRoleId ? 'Edit Role' : 'Create Role'}</h2>
                <p>Define role name and select access permissions</p>
              </div>
              <button className="modal-close" onClick={() => setIsRoleModalOpen(false)}><FiX /></button>
            </div>
            <form onSubmit={handleRoleSubmit}>
              <div className="modal-body">
                <div className="form-field">
                  <label>Role Name *</label>
                  <input required placeholder="e.g. Sales Executive" value={roleForm.name} onChange={e => setRoleForm({...roleForm, name: e.target.value})} />
                </div>
                <div className="form-field" style={{ marginTop: '20px' }}>
                  <label>Select Permissions</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '10px' }}>
                    {ALL_PERMISSIONS.map(perm => (
                      <label key={perm} className="perm-checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={roleForm.permissions.includes(perm)}
                          onChange={() => togglePermission(perm)}
                        />
                        <span>{perm.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="pill-btn-secondary" onClick={() => setIsRoleModalOpen(false)}>Cancel</button>
                <button type="submit" className="pill-btn-primary">Save Role</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesList;
