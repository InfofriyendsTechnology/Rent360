import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import axios from 'axios';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import '../Stores/StoresList.scss';
import './RolesList.scss';
import { DataTable, RowActions, Checkbox } from '../../components/ui';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { API_BASE_URL } from '../../config/api';

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
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [isDeletingRole, setIsDeletingRole] = useState(false);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [roleForm, setRoleForm] = useState({ name: '', permissions: [] });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const staffRoles = (res.data.data || []).filter(
        r => r.name !== 'STORE_ADMIN' && r.name !== 'SUPER_ADMIN'
      );
      setRoles(staffRoles);
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
    if (isSavingRole) return;
    try {
      setIsSavingRole(true);
      if (editingRoleId) {
        await axios.put(`${API_BASE_URL}/api/roles/${editingRoleId}`, roleForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Role updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/api/roles`, roleForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Role created successfully');
      }
      setIsRoleModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save role');
    } finally {
      setIsSavingRole(false);
    }
  };


  const handleConfirmDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
      setIsDeletingRole(true);
      await axios.delete(`${API_BASE_URL}/api/roles/${roleToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Role deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete role');
    } finally {
      setIsDeletingRole(false);
      setRoleToDelete(null);
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
        <DataTable
          columns={[
            { label: 'Role Name', width: '22%' },
            { label: 'Permissions Granted', width: '66%' },
            { label: 'Actions', align: 'right', width: '12%' }
          ]}
          data={roles}
          loading={loading}
          emptyMessage="No roles found. Click + Create Role to define permissions."
          keyExtractor={(r) => r.id}
          renderRow={(r) => (
            <>
              <td>
                <span className="store-name" style={{ fontWeight: 600 }}>{r.name}</span>
              </td>
              <td>
                <div className="permissions-row-wrap">
                  {r.permissions && r.permissions.length > 0 ? (
                    r.permissions.map(p => (
                      <span key={p} className="perm-pill">
                        {p === 'INVENTORY_MANAGE' ? 'COLLECTION MANAGE' : p.replace(/_/g, ' ')}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted">No permissions</span>
                  )}
                </div>
              </td>
              <td className="text-right">
                <RowActions
                  onEdit={() => openRoleModal(r)}
                  onDelete={() => setRoleToDelete(r)}
                />
              </td>
            </>
          )}
        />
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
                      <Checkbox
                        key={perm}
                        checked={roleForm.permissions.includes(perm)}
                        onChange={() => togglePermission(perm)}
                        label={perm === 'INVENTORY_MANAGE' ? 'COLLECTION MANAGE' : perm.replace('_', ' ')}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="pill-btn-secondary" onClick={() => setIsRoleModalOpen(false)}>Cancel</button>
                <button type="submit" className="pill-btn-primary" disabled={isSavingRole}>
                  {isSavingRole ? 'Saving...' : 'Save Role'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={!!roleToDelete}
        title="Delete Role"
        message={roleToDelete ? `Are you sure you want to delete "${roleToDelete.name}"?` : ''}
        confirmText="Delete"
        onConfirm={handleConfirmDeleteRole}
        onCancel={() => setRoleToDelete(null)}
        isLoading={isDeletingRole}
        isDestructive={true}
      />
    </div>
  );
};

export default RolesList;
