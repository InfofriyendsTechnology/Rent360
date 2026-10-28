import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiShoppingBag, FiChevronDown } from 'react-icons/fi';
import axios from 'axios';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import '../Stores/StoresList.scss'; // Reuse store styles for consistency
import { DataTable, AvatarCell, StatusPill, RowActions, Select, Checkbox } from '../../components/ui';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { API_BASE_URL } from '../../config/api';

const UsersList = () => {
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || !user?.role;
  const userStoreId = isSuperAdmin ? '' : (user?.store?.id || user?.storeId || '');

  // Stores for super admin
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(() => {
    return isSuperAdmin ? '' : userStoreId;
  });
  
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [userForm, setUserForm] = useState({ name: '', mobile: '', password: '', roleId: '', storeId: '' });

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

  // Fetch stores if Super Admin
  useEffect(() => {
    if (isSuperAdmin && token) {
      axios
        .get(`${API_BASE_URL}/api/stores`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => {
          setStores(res.data.data || []);
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
      const usersUrl = selectedStoreId 
        ? `${API_BASE_URL}/api/users?storeId=${selectedStoreId}`
        : `${API_BASE_URL}/api/users`;
      const rolesUrl = selectedStoreId 
        ? `${API_BASE_URL}/api/roles?storeId=${selectedStoreId}`
        : `${API_BASE_URL}/api/roles`;
      const [usersRes, rolesRes] = await Promise.all([
        axios.get(usersUrl, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(rolesUrl, { headers: { Authorization: `Bearer ${token}` } })
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
        roleId: userData.roleId || '',
        storeId: userData.storeId || ''
      });
    } else {
      setEditingUserId(null);
      const defaultRole = roles.find(r => r.name !== 'STORE_ADMIN' && r.name !== 'SUPER_ADMIN');
      setUserForm({ 
        name: '', 
        mobile: '', 
        password: '', 
        roleId: defaultRole ? defaultRole.id : '',
        storeId: selectedStoreId || (stores[0]?.id || '')
      });
    }
    setIsUserModalOpen(true);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    if (isSavingUser) return;
    try {
      setFieldErrors({});
      setIsSavingUser(true);
      const payload = { ...userForm };
      
      const effectiveStoreId = isSuperAdmin
        ? (userForm.storeId || selectedStoreId)
        : (userStoreId || userForm.storeId);
      if (!editingUserId && effectiveStoreId) {
        payload.storeId = effectiveStoreId;
      }
      if (editingUserId && !payload.password) {
        delete payload.password;
      }
      
      if (editingUserId) {
        await axios.put(`${API_BASE_URL}/api/users/${editingUserId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('User updated');
      } else {
        await axios.post(`${API_BASE_URL}/api/users`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('User added');
      }
      setIsUserModalOpen(false);
      fetchData();
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to save user';
      if (errMsg.toLowerCase().includes('mobile') || errMsg.toLowerCase().includes('exists')) {
        setFieldErrors({ mobile: 'Mobile number already exists' });
      } else {
        setFieldErrors({ general: errMsg });
      }
    } finally {
      setIsSavingUser(false);
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
      const roleStoreId = isSuperAdmin
        ? (userForm.storeId || selectedStoreId)
        : (userStoreId || undefined);
      const res = await axios.post(`${API_BASE_URL}/api/roles`, {
        name: quickRoleName.trim(),
        permissions: quickRolePermissions,
        storeId: roleStoreId || undefined
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
      toast.success('User removed successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to remove user');
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
          <h1 className="main-title">Users</h1>
          <p className="subtitle">
            {isSuperAdmin
              ? 'Browse and manage all users across tenant stores'
              : 'Manage your store users, their access roles, and status'}
          </p>
        </div>

        <div className="top-actions">
          {/* Super Admin Store Selector with All Stores default */}
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
            <span>Total Users ({users.length})</span>
          </div>

          <button className="pill-btn-primary" onClick={() => navigate('/users/create')}>
            <FiPlus className="plus-icon" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      <div className="bond-card-container">
        <DataTable
          columns={[
            { label: 'User' },
            ...(isSuperAdmin ? [{ label: 'Store' }] : []),
            { label: 'Mobile Number' },
            { label: 'Assigned Role' },
            { label: 'Status' },
            { label: 'Actions', align: 'right' }
          ]}
          data={users}
          loading={loading}
          emptyMessage="No users found. Click + Add User to create one."
          keyExtractor={(u) => u.id}
          renderRow={(u) => (
            <>
              <td>
                <AvatarCell
                  src={u.profile_pic}
                  title={u.name}
                  subtitle={u.username ? `@${u.username}` : (u.email || null)}
                  fallbackChars={getInitials(u.name)}
                />
              </td>
              {isSuperAdmin && (
                <td>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {u.store?.name || 'All Platform'}
                  </span>
                </td>
              )}
              <td><span className="phone-text">{u.mobile}</span></td>
              <td>
                <span className="bond-status-pill" style={{ background: 'var(--bg-card-alt)', color: 'var(--text-main)', border: '1px solid var(--border-main)' }}>
                  {u.role?.name || 'No Role'}
                </span>
              </td>
              <td><StatusPill status={u.status || 'ACTIVE'} /></td>
              <td className="text-right">
                <RowActions
                  onEdit={() => navigate(`/users/edit/${u.id}`)}
                  onDelete={() => setUserToDelete(u)}
                />
              </td>
            </>
          )}
        />
      </div>

      {isUserModalOpen && (
        <div className="bond-modal-overlay" onClick={() => setIsUserModalOpen(false)}>
          <div className="bond-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{editingUserId ? 'Edit User' : 'Add User'}</h2>
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
                
                {isSuperAdmin && !editingUserId && (
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                      Assign to Store *
                    </label>
                    <Select
                      value={userForm.storeId}
                      placeholder="-- Select Store --"
                      onChange={(e) => setUserForm({ ...userForm, storeId: e.target.value })}
                      options={stores.map((s) => ({ value: s.id, label: s.name || s.store_name }))}
                    />
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
                    <Select 
                      required 
                      value={userForm.roleId} 
                      placeholder="Select a role..."
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
                    </Select>
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
                <button type="submit" className="pill-btn-primary" disabled={isSavingUser}>
                  {isSavingUser ? 'Saving...' : (editingUserId ? 'Update User' : 'Save User')}
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
                    {AVAILABLE_PERMISSIONS.map(perm => (
                      <Checkbox
                        key={perm}
                        checked={quickRolePermissions.includes(perm)}
                        onChange={() => toggleQuickPermission(perm)}
                        label={perm === 'INVENTORY_MANAGE' ? 'COLLECTION MANAGE' : perm.replace('_', ' ')}
                      />
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
        title="Remove User"
        message={userToDelete ? `Are you sure you want to remove user "${userToDelete.name}"?` : ''}
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
