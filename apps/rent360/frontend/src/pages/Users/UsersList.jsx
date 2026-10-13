import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import axios from 'axios';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import '../Stores/StoresList.scss'; // Reuse store styles for consistency
import { TableRowSkeleton } from '../../components/ui/Skeleton/Skeleton';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { API_BASE_URL } from '../../config/api';

const UsersList = () => {
  const { token } = useSelector((state) => state.auth);
  
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [isSavingMember, setIsSavingMember] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [userForm, setUserForm] = useState({ name: '', mobile: '', password: '', roleId: '' });

  // Quick Role Creation state
  const [isQuickRoleModalOpen, setIsQuickRoleModalOpen] = useState(false);
  const [isSavingQuickRole, setIsSavingQuickRole] = useState(false);
  const [quickRoleName, setQuickRoleName] = useState('');
  const [quickRolePermissions, setQuickRolePermissions] = useState([
    'INVENTORY_MANAGE',
    'CUSTOMERS_MANAGE',
    'BILLING_CREATE'
  ]);

  const AVAILABLE_PERMISSIONS = [
    'DASHBOARD_VIEW',
    'INVENTORY_MANAGE',
    'CUSTOMERS_MANAGE',
    'BILLING_CREATE',
    'REPORTS_VIEW',
    'SETTINGS_MANAGE'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/roles`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const staffRoles = (rolesRes.data.data || []).filter(
        r => r.name !== 'STORE_ADMIN' && r.name !== 'SUPER_ADMIN'
      );
      setUsers(usersRes.data.data || []);
      setRoles(staffRoles);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openUserModal = (userData = null) => {
    setFieldErrors({});
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
      const defaultRole = roles.find(r => r.name !== 'STORE_ADMIN' && r.name !== 'SUPER_ADMIN');
      setUserForm({ name: '', mobile: '', password: '', roleId: defaultRole ? defaultRole.id : '' });
    }
    setIsUserModalOpen(true);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    if (isSavingMember) return;
    try {
      setFieldErrors({});
      setIsSavingMember(true);
      const payload = { ...userForm };
      if (editingUserId && !payload.password) {
        delete payload.password;
      }
      
      if (editingUserId) {
        await axios.put(`${API_BASE_URL}/api/users/${editingUserId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Member updated');
      } else {
        await axios.post(`${API_BASE_URL}/api/users`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Member added');
      }
      setIsUserModalOpen(false);
      fetchData();
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to save member';
      if (errMsg.toLowerCase().includes('mobile') || errMsg.toLowerCase().includes('exists')) {
        setFieldErrors({ mobile: 'Mobile number already exists' });
      } else {
        setFieldErrors({ general: errMsg });
      }
    } finally {
      setIsSavingMember(false);
    }
  };


  const handleQuickRoleSubmit = async (e) => {
    e.preventDefault();
    if (!quickRoleName.trim()) {
      toast.error('Role name is required');
      return;
    }
    try {
      setIsSavingQuickRole(true);
      const res = await axios.post(`${API_BASE_URL}/api/roles`, {
        name: quickRoleName.trim(),
        permissions: quickRolePermissions
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const createdRole = res.data?.data;
      toast.success(`Role "${createdRole?.name || quickRoleName}" created successfully`);
      if (createdRole) {
        setRoles(prev => [...prev, createdRole]);
        setUserForm(prev => ({ ...prev, roleId: createdRole.id }));
      }
      setIsQuickRoleModalOpen(false);
      setQuickRoleName('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create role');
    } finally {
      setIsSavingQuickRole(false);
    }
  };

  const toggleQuickPermission = (perm) => {
    setQuickRolePermissions(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };


  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setIsDeletingUser(true);
      await axios.delete(`${API_BASE_URL}/api/users/${userToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Member removed successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to remove member');
    } finally {
      setIsDeletingUser(false);
      setUserToDelete(null);
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
                <TableRowSkeleton rows={5} columns={5} />
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
                        <button className="icon-action-btn delete" onClick={() => setUserToDelete(u)}><FiTrash2 /></button>
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
            <form onSubmit={handleUserSubmit} autoComplete="off">
              <div className="modal-body">
                {fieldErrors.general && (
                  <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', fontSize: '12px', marginBottom: '14px', fontWeight: 500 }}>
                    {fieldErrors.general}
                  </div>
                )}
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Full Name *</label>
                    <input 
                      required 
                      autoComplete="off"
                      value={userForm.name} 
                      onChange={e => setUserForm({...userForm, name: e.target.value})} 
                    />
                  </div>
                  <div className="form-field">
                    <label>Mobile Number *</label>
                    <input 
                      required 
                      type="tel"
                      autoComplete="off"
                      style={fieldErrors.mobile ? { borderColor: '#ef4444' } : {}}
                      value={userForm.mobile} 
                      onChange={e => {
                        setUserForm({...userForm, mobile: e.target.value});
                        if (fieldErrors.mobile) setFieldErrors(prev => ({ ...prev, mobile: '' }));
                      }} 
                    />
                    {fieldErrors.mobile && (
                      <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: 500, display: 'block' }}>
                        {fieldErrors.mobile}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="form-row-2">
                  <div className="form-field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ margin: 0 }}>Assign Role *</label>
                      <button 
                        type="button" 
                        onClick={() => setIsQuickRoleModalOpen(true)}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: '#0B60B0', 
                          cursor: 'pointer', 
                          fontSize: '12px', 
                          fontWeight: 600, 
                          padding: 0 
                        }}
                      >
                        + Create Role
                      </button>
                    </div>
                    <select 
                      required 
                      value={userForm.roleId} 
                      onChange={e => {
                        if (e.target.value === '__create_new__') {
                          setIsQuickRoleModalOpen(true);
                        } else {
                          setUserForm({...userForm, roleId: e.target.value});
                        }
                      }}
                    >
                      <option value="" disabled>Select a role...</option>
                      {roles.filter(r => r.name !== 'STORE_ADMIN' && r.name !== 'SUPER_ADMIN').map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                      <option value="__create_new__" style={{ fontWeight: 600, color: '#0B60B0' }}>
                        + Create New Custom Role...
                      </option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>{editingUserId ? 'New Password (Optional)' : 'Password *'}</label>
                    <input 
                      type="password" 
                      autoComplete="new-password"
                      required={!editingUserId} 
                      value={userForm.password} 
                      onChange={e => setUserForm({...userForm, password: e.target.value})} 
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="pill-btn-secondary" onClick={() => setIsUserModalOpen(false)}>Cancel</button>
                <button type="submit" className="pill-btn-primary" disabled={isSavingMember}>
                  {isSavingMember ? 'Saving...' : 'Save Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isQuickRoleModalOpen && (
        <div className="bond-modal-overlay" style={{ zIndex: 1100 }} onClick={() => setIsQuickRoleModalOpen(false)}>
          <div className="bond-modal-card" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Create Custom Role</h2>
                <p>Define role title and select permissions</p>
              </div>
              <button className="modal-close" onClick={() => setIsQuickRoleModalOpen(false)}><FiX /></button>
            </div>
            <form onSubmit={handleQuickRoleSubmit} autoComplete="off">
              <div className="modal-body">
                <div className="form-field">
                  <label>Role Name *</label>
                  <input 
                    required 
                    autoComplete="off"
                    placeholder="e.g. Sales Executive, Delivery Staff" 
                    value={quickRoleName} 
                    onChange={e => setQuickRoleName(e.target.value)} 
                    autoFocus
                  />

                </div>
                <div className="form-field" style={{ marginTop: '16px' }}>
                  <label>Permissions</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                    {AVAILABLE_PERMISSIONS.map(perm => (
                      <label key={perm} className="perm-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                        <input 
                          type="checkbox" 
                          checked={quickRolePermissions.includes(perm)}
                          onChange={() => toggleQuickPermission(perm)}
                        />
                        <span>{perm === 'INVENTORY_MANAGE' ? 'COLLECTION MANAGE' : perm.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="pill-btn-secondary" onClick={() => setIsQuickRoleModalOpen(false)}>Cancel</button>
                <button type="submit" className="pill-btn-primary" disabled={isSavingQuickRole}>
                  {isSavingQuickRole ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      <ConfirmModal 
        isOpen={!!userToDelete}
        title="Remove Member"
        message={userToDelete ? `Are you sure you want to remove "${userToDelete.name}"?` : ''}
        confirmText="Remove"
        onConfirm={handleConfirmDeleteUser}
        onCancel={() => setUserToDelete(null)}
        isLoading={isDeletingUser}
        isDestructive={true}
      />
    </div>
  );
};

export default UsersList;
