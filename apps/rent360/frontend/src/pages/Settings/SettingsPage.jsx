import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FiLayers, FiMaximize2, FiPlus, FiEdit2, FiTrash2, FiX, FiSearch
} from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { DataTable, RowActions } from '../../components/ui';

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

  // Active Tab: strictly Categories or Sizes
  const activeTab = searchParams.get('tab') === 'sizes' ? 'sizes' : 'categories';

  // Super Admin store selector
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(userStoreId);

  // Data
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState(getStoreSizes);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'categories') {
      fetchCategories();
    }
  }, [activeTab, selectedStoreId, token]);

  // Tab switcher
  const handleSelectTab = (tabId) => {
    setSearchParams({ tab: tabId });
    setSearchQuery('');
  };

  // Open Create Modal
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

  // Save Item (Create or Edit)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Please enter a name');
      return;
    }

    setIsSaving(true);
    try {
      if (activeTab === 'categories') {
        const payload = {
          name: formName.trim(),
          category_code: formCode.trim() || undefined,
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

  // Filtered Items
  const filteredCategories = categories.filter((cat) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (cat.name || '').toLowerCase().includes(q) ||
      (cat.category_code || '').toLowerCase().includes(q) ||
      (cat.description || '').toLowerCase().includes(q)
    );
  });

  const filteredSizes = sizes.filter((sz) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (sz.name || '').toLowerCase().includes(q) ||
      (sz.code || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="stores-view settings-page-view">
      {/* Top Bar matching Rent360 Common Design */}
      <div className="stores-top-bar">
        <div className="title-section">
          <h1 className="main-title">System Setup</h1>
          <p className="subtitle">
            Configure catalog attire categories and rental garment sizes master
          </p>
        </div>

        <div className="top-actions">
          {/* Top Pill Tabs Switcher */}
          <div className="view-mode-toggle">
            <button
              type="button"
              className={`view-btn ${activeTab === 'categories' ? 'active' : ''}`}
              onClick={() => handleSelectTab('categories')}
            >
              <FiLayers className="icon" />
              <span>Categories ({categories.length})</span>
            </button>
            <button
              type="button"
              className={`view-btn ${activeTab === 'sizes' ? 'active' : ''}`}
              onClick={() => handleSelectTab('sizes')}
            >
              <FiMaximize2 className="icon" />
              <span>Sizes ({sizes.length})</span>
            </button>
          </div>

          {/* Super Admin Store Selector Pill */}
          {isSuperAdmin && stores.length > 0 && (
            <div className="store-selector-pill">
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

          {/* Primary Pill Button */}
          <button
            type="button"
            className="pill-btn-primary"
            onClick={handleOpenCreateModal}
          >
            <FiPlus className="plus-icon" />
            <span>Add {activeTab === 'categories' ? 'Category' : 'Size'}</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="setup-controls-bar">
        <div className="search-pill-wrapper">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder={activeTab === 'categories' ? 'Search categories by name or code...' : 'Search sizes...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
            >
              <FiX />
            </button>
          )}
        </div>
      </div>

      {/* Main Full-Width Common DataTable */}
      <div className="bond-card-container">
        {activeTab === 'categories' ? (
          <DataTable 
            columns={[
              { label: 'Category Name' },
              { label: 'Code (Prefix)' },
              { label: 'Total Designs' },
              { label: 'Description' },
              { label: 'Actions', align: 'right' }
            ]}
            data={filteredCategories}
            loading={loading}
            emptyMessage={searchQuery ? 'No categories matched your search.' : 'No categories added yet. Click "+ Add Category" to create one.'}
            keyExtractor={(cat) => cat.id}
            renderRow={(cat) => (
              <>
                <td>
                  <div className="category-title-cell">
                    <span className="cat-icon-badge"><FiLayers /></span>
                    <span className="cat-name-text">{cat.name}</span>
                  </div>
                </td>
                <td>
                  <span className="sku-badge">{cat.category_code || '—'}</span>
                </td>
                <td>
                  <span className="count-pill">{cat._count?.products || 0} designs</span>
                </td>
                <td>
                  <span className="desc-text">{cat.description || '—'}</span>
                </td>
                <td className="text-right">
                  <RowActions 
                    actions={[
                      { 
                        icon: FiEdit2, 
                        variant: 'edit', 
                        title: 'Edit Category', 
                        onClick: () => handleOpenEditModal(cat) 
                      },
                      { 
                        icon: FiTrash2, 
                        variant: 'delete', 
                        title: 'Delete Category', 
                        onClick: () => setItemToDelete(cat) 
                      }
                    ]}
                  />
                </td>
              </>
            )}
          />
        ) : (
          <DataTable 
            columns={[
              { label: 'Size Label' },
              { label: 'Short Code' },
              { label: 'Sample Unit SKU' },
              { label: 'Actions', align: 'right' }
            ]}
            data={filteredSizes}
            loading={false}
            emptyMessage={searchQuery ? 'No sizes matched your search.' : 'No sizes added yet. Click "+ Add Size" to create one.'}
            keyExtractor={(sz) => sz.id}
            renderRow={(sz) => (
              <>
                <td>
                  <div className="category-title-cell">
                    <span className="cat-icon-badge"><FiMaximize2 /></span>
                    <span className="cat-name-text">{sz.name}</span>
                  </div>
                </td>
                <td>
                  <span className="sku-badge">{sz.code || sz.name.replace(/[^0-9A-Z]/gi, '').slice(0, 4)}</span>
                </td>
                <td>
                  <span className="sample-sku-mono">{`ITEM-${sz.code || sz.name.replace(/[^0-9A-Z]/gi, '').slice(0, 3) || 'STD'}-01`}</span>
                </td>
                <td className="text-right">
                  <RowActions 
                    actions={[
                      { 
                        icon: FiEdit2, 
                        variant: 'edit', 
                        title: 'Edit Size', 
                        onClick: () => handleOpenEditModal(sz) 
                      },
                      { 
                        icon: FiTrash2, 
                        variant: 'delete', 
                        title: 'Delete Size', 
                        onClick: () => setItemToDelete(sz) 
                      }
                    ]}
                  />
                </td>
              </>
            )}
          />
        )}
      </div>

      {/* CREATE / EDIT MODAL using standard Bond Modal */}
      {isModalOpen && (
        <div className="bond-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="bond-modal-card setup-modal-compact" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{editingItem ? `Edit ${activeTab === 'categories' ? 'Category' : 'Size'}` : `Add New ${activeTab === 'categories' ? 'Category' : 'Size'}`}</h2>
                <p>Configure {activeTab === 'categories' ? 'catalog attire category' : 'rental garment size label'}</p>
              </div>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSave} autoComplete="off">
              <div className="modal-body">
                <div className="form-group">
                  <label>{activeTab === 'categories' ? 'Category Name *' : 'Size Label *'}</label>
                  <input
                    type="text"
                    className="form-input"
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

                <div className="form-group">
                  <label>{activeTab === 'categories' ? 'Category Code (SKU Prefix)' : 'Size Short Code'}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={activeTab === 'categories' ? 'e.g. SHERWANI, JODHPURI' : 'e.g. 38, 40, FS'}
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  />
                  <small className="help-text">
                    Used to automatically generate size-wise unit SKUs (e.g. ITEM-38-01)
                  </small>
                </div>

                {activeTab === 'categories' && (
                  <div className="form-group">
                    <label>Description (Optional)</label>
                    <textarea
                      rows={3}
                      className="form-input"
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
                  className="pill-btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pill-btn-primary"
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
        title={`Delete ${activeTab === 'categories' ? 'Category' : 'Size'}`}
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
