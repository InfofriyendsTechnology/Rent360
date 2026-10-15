import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FiLayers, FiMaximize2, FiPlus, FiEdit2, FiTrash2, FiX
} from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';

import '../Stores/StoresList.scss';
import './SettingsPage.scss';

export const DEFAULT_RENTAL_SIZES = [
  { id: 'size-1', name: '36 (XS)', code: '36' },
  { id: 'size-2', name: '38 (S)', code: '38' },
  { id: 'size-3', name: '40 (M)', code: '40' },
  { id: 'size-4', name: '42 (L)', code: '42' },
  { id: 'size-5', name: '44 (XL)', code: '44' },
  { id: 'size-6', name: '46 (XXL)', code: '46' },
  { id: 'size-7', name: 'Free Size (Adjustable)', code: 'FS' }
];

export const getStoreSizes = () => {
  try {
    const saved = localStorage.getItem('rent360_master_sizes');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return DEFAULT_RENTAL_SIZES;
};

const SettingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, token } = useSelector((state) => state.auth);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || !user?.role;
  const userStoreId = user?.store?.id || user?.storeId || '';

  // Active Tab: only the two essential priorities
  const activeTab = searchParams.get('tab') || 'categories';

  // Super Admin store selector
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(userStoreId);

  // Data
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState(getStoreSizes);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDesc, setFormDesc] = useState('');

  // 2 Priority Tabs matching CRM Setup Screenshot
  const setupTabs = [
    { id: 'categories', label: 'Categories', icon: <FiLayers /> },
    { id: 'sizes', label: 'Sizes', icon: <FiMaximize2 /> }
  ];

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
          if (list.length > 0 && !selectedStoreId) {
            setSelectedStoreId(userStoreId || list[0].id);
          }
        })
        .catch(() => {});
    } else if (userStoreId) {
      setSelectedStoreId(userStoreId);
    }
  }, [isSuperAdmin, userStoreId, token]);

  // Fetch Categories from API
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const url = selectedStoreId 
        ? `${API_BASE_URL}/api/categories?storeId=${selectedStoreId}`
        : `${API_BASE_URL}/api/categories`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(res.data.data || []);
    } catch (err) {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [selectedStoreId, token]);

  const handleSelectTab = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const currentTab = setupTabs.find((t) => t.id === activeTab) || setupTabs[0];

  // Open Add Modal
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormCode('');
    setFormDesc('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormName(item.name || '');
    setFormCode(item.category_code || item.code || '');
    setFormDesc(item.description || '');
    setIsModalOpen(true);
  };

  // Save (Create or Update)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName.trim() || isSaving) return;

    setIsSaving(true);
    try {
      if (activeTab === 'categories') {
        const payload = {
          name: formName.trim(),
          category_code: (formCode.trim() || formName.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 15)).toUpperCase(),
          description: formDesc.trim() || undefined,
          storeId: selectedStoreId || undefined
        };

        if (editingItem) {
          await axios.put(`${API_BASE_URL}/api/categories/${editingItem.id}`, payload, {
            headers: { Authorization: `Bearer ${token}` }
          });
          toast.success(`Category "${payload.name}" updated`);
        } else {
          await axios.post(`${API_BASE_URL}/api/categories`, payload, {
            headers: { Authorization: `Bearer ${token}` }
          });
          toast.success(`Category "${payload.name}" created`);
        }
        fetchCategories();
      } else if (activeTab === 'sizes') {
        let updated;
        const code = (formCode.trim() || formName.replace(/[^0-9A-Z]/gi, '').slice(0, 4)).toUpperCase();
        if (editingItem) {
          updated = sizes.map((s) => (s.id === editingItem.id ? { ...s, name: formName.trim(), code } : s));
        } else {
          updated = [...sizes, { id: `size-${Date.now()}`, name: formName.trim(), code }];
        }
        setSizes(updated);
        localStorage.setItem('rent360_master_sizes', JSON.stringify(updated));
        toast.success(`Size "${formName}" saved`);
      }

      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save item');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete
  const handleConfirmDelete = async () => {
    if (!itemToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      if (activeTab === 'categories') {
        await axios.delete(`${API_BASE_URL}/api/categories/${itemToDelete.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(`Category "${itemToDelete.name}" deleted`);
        fetchCategories();
      } else if (activeTab === 'sizes') {
        const updated = sizes.filter((s) => s.id !== itemToDelete.id);
        setSizes(updated);
        localStorage.setItem('rent360_master_sizes', JSON.stringify(updated));
        toast.success(`Size "${itemToDelete.name}" deleted`);
      }
      setItemToDelete(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete item with associated records');
    } finally {
      setIsDeleting(false);
    }
  };

  const activeItems = activeTab === 'categories' ? categories : sizes;

  return (
    <div className="system-setup-page">
      {/* Header matching Screenshot */}
      <div className="setup-page-header">
        <div className="header-info">
          <h1 className="header-title">System Setup</h1>
          <p className="header-subtitle">
            Manage your catalog setup preferences and settings.
          </p>
        </div>

        {isSuperAdmin && stores.length > 0 && (
          <div className="setup-store-pill">
            <label>Store:</label>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.store_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 2-Column Layout matching Screenshot */}
      <div className="setup-layout-grid">
        {/* Left Column: Vertical Menu Card */}
        <aside className="setup-sidebar-card">
          <nav className="setup-tabs-nav">
            {setupTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`setup-tab-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectTab(tab.id)}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span className="tab-label">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right Column: Table Card matching Screenshot */}
        <main className="setup-content-card">
          {/* Header with Title and Green Plus Button */}
          <div className="content-card-header">
            <h2 className="section-title">{currentTab.label}</h2>
            <button
              type="button"
              className="add-item-green-btn"
              onClick={handleOpenCreateModal}
              title={`Add New ${currentTab.label}`}
            >
              <FiPlus />
            </button>
          </div>

          {/* Table matching Screenshot: Name | Action */}
          <div className="setup-table-wrapper">
            <table className="setup-crm-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && activeTab === 'categories' ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan="2" style={{ padding: '16px 24px' }}>Loading...</td>
                    </tr>
                  ))
                ) : activeItems.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="empty-table-cell">
                      No {currentTab.label.toLowerCase()} added yet. Click the + button above to add one.
                    </td>
                  </tr>
                ) : (
                  activeItems.map((item) => {
                    const code = item.category_code || item.code;
                    return (
                      <tr key={item.id} className="setup-row">
                        <td>
                          <div className="item-name-cell">
                            <span className="item-title">{item.name}</span>
                            {code && (
                              <span className="item-code-badge">{code}</span>
                            )}
                            {item._count?.products !== undefined && (
                              <span className="item-count-tag">
                                {item._count.products} designs
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="row-actions-cell">
                            <button
                              type="button"
                              className="action-icon-btn edit-btn"
                              title="Edit item"
                              onClick={() => handleOpenEditModal(item)}
                            >
                              <FiEdit2 />
                            </button>
                            <button
                              type="button"
                              className="action-icon-btn delete-btn"
                              title="Delete item"
                              onClick={() => setItemToDelete(item)}
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="confirm-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="setup-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-info">
                <span className="modal-badge">{currentTab.label}</span>
                <h3 className="modal-title">
                  {editingItem ? `Edit ${currentTab.label}` : `Add New ${currentTab.label}`}
                </h3>
              </div>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => setIsModalOpen(false)}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-field">
                  <label>{activeTab === 'categories' ? 'Category Name *' : 'Size Label *'}</label>
                  <input
                    type="text"
                    placeholder={activeTab === 'categories' ? 'e.g. Royal Sherwani, Jodhpuri' : 'e.g. 38 (M), 40 (L), Free Size'}
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      if (!editingItem) {
                        const suggested = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 15);
                        setFormCode(suggested);
                      }
                    }}
                    autoFocus
                    required
                  />
                </div>

                <div className="form-field">
                  <label>{activeTab === 'categories' ? 'Category Code (SKU Prefix)' : 'Size Short Code'}</label>
                  <input
                    type="text"
                    placeholder={activeTab === 'categories' ? 'e.g. SHERWANI, JODHPURI' : 'e.g. 38, 40, FS'}
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  />
                  <span className="field-hint">
                    Used to automatically generate size-wise unit codes (e.g. SKU-38-01)
                  </span>
                </div>

                {activeTab === 'categories' && (
                  <div className="form-field">
                    <label>Description (Optional)</label>
                    <textarea
                      rows={3}
                      placeholder="Brief description of this collection category..."
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="confirm-btn primary"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(itemToDelete)}
        title={`Delete ${currentTab.label}`}
        message={`Are you sure you want to delete "${itemToDelete?.name}"?`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default SettingsPage;
