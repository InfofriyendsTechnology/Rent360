import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiTag, FiLayers, 
  FiArrowUpRight, FiX, FiCheck, FiFolder, FiGrid, FiList,
  FiTrendingUp, FiBox, FiCheckCircle, FiChevronDown, FiShoppingBag
} from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { DataTable, RowActions, Select, Checkbox } from '../../components/ui';

import '../Stores/StoresList.scss';
import './CategoriesList.scss';

const CategoriesList = () => {
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || !user?.role;
  const userStoreId = isSuperAdmin ? '' : (user?.store?.id || user?.storeId || '');

  // Stores for super admin
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(() => {
    return isSuperAdmin ? '' : (userStoreId || '');
  });
  const [modalStoreId, setModalStoreId] = useState('');

  // Categories & UI state
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryTypeFilter, setCategoryTypeFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category_code: '',
    description: '',
    category_type: 'OUTFIT',
    skip_check_availability: false,
    washable: true,
    washing_price: 0
  });
  const [formErrors, setFormErrors] = useState({});

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
        })
        .catch(() => {});
    } else if (userStoreId) {
      setSelectedStoreId(userStoreId);
    }
  }, [isSuperAdmin, userStoreId, token]);

  // Fetch categories when storeId changes
  useEffect(() => {
    fetchCategories();
  }, [selectedStoreId, token]);

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
      toast.error(err.response?.data?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  // Open modal for Create / Edit
  const handleOpenCreateModal = (defaultType = 'OUTFIT') => {
    setEditingCategory(null);
    setFormData({
      name: '',
      category_code: '',
      description: '',
      category_type: defaultType,
      skip_check_availability: defaultType === 'ACCESSORY',
      washable: true,
      washing_price: 0
    });
    setModalStoreId(selectedStoreId || (stores[0]?.id || ''));
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name || '',
      category_code: cat.category_code || '',
      description: cat.description || '',
      category_type: cat.category_type || (cat.skip_check_availability ? 'ACCESSORY' : 'OUTFIT'),
      skip_check_availability: Boolean(cat.skip_check_availability),
      washable: cat.washable !== undefined ? Boolean(cat.washable) : true,
      washing_price: cat.washing_price ?? 0
    });
    setModalStoreId(cat.storeId || cat.store?.id || '');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleNameChange = (val) => {
    setFormData((prev) => {
      const updated = { ...prev, name: val };
      if (!editingCategory) {
        updated.category_code = val
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');
      }
      return updated;
    });
    if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: '' }));
  };

  const handleResetForm = () => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name || '',
        category_code: editingCategory.category_code || '',
        description: editingCategory.description || '',
        category_type: editingCategory.category_type || (editingCategory.skip_check_availability ? 'ACCESSORY' : 'OUTFIT'),
        skip_check_availability: Boolean(editingCategory.skip_check_availability),
        washable: editingCategory.washable !== undefined ? Boolean(editingCategory.washable) : true,
        washing_price: editingCategory.washing_price ?? 0
      });
    } else {
      setFormData({
        name: '',
        category_code: '',
        description: '',
        category_type: 'OUTFIT',
        skip_check_availability: false,
        washable: true,
        washing_price: 0
      });
    }
    setFormErrors({});
  };

  const validate = () => {
    const errs = {};
    if (isSuperAdmin && !editingCategory && !modalStoreId && stores.length > 1) {
      errs.storeId = 'Please select a store';
    }
    if (!formData.name.trim()) errs.name = 'Category name is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!validate() || isSaving) return;

    setIsSaving(true);
    try {
      const effectiveStoreId = isSuperAdmin
        ? (editingCategory ? (editingCategory.storeId || editingCategory.store?.id) : modalStoreId)
        : (userStoreId || undefined);

      const generatedCode = formData.name
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'CAT';

      const code = formData.category_code?.trim()
        ? formData.category_code.trim().toUpperCase()
        : generatedCode;

      const payload = {
        name: formData.name.trim(),
        category_code: code,
        description: formData.description?.trim() || null,
        category_type: formData.skip_check_availability ? 'ACCESSORY' : (formData.category_type || 'OUTFIT'),
        skip_check_availability: Boolean(formData.skip_check_availability),
        washable: Boolean(formData.washable),
        washing_price: Number(formData.washing_price || 0),
        storeId: effectiveStoreId || undefined
      };

      if (editingCategory) {
        await axios.put(`${API_BASE_URL}/api/categories/${editingCategory.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(`Category "${payload.name}" updated`);
      } else {
        await axios.post(`${API_BASE_URL}/api/categories`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(`Category "${payload.name}" created`);
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${API_BASE_URL}/api/categories/${categoryToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Category "${categoryToDelete.name}" deleted`);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete category with associated products');
    } finally {
      setIsDeleting(false);
    }
  };

  // Metrics
  const totalCategories = categories.length;
  const totalDesigns = categories.reduce((sum, c) => sum + (c._count?.products || 0), 0);
  const topCategory = categories.slice().sort((a, b) => (b._count?.products || 0) - (a._count?.products || 0))[0];
  const outfitCount = categories.filter((c) => c.category_type !== 'ACCESSORY' && !c.skip_check_availability).length;
  const accessoryCount = categories.filter((c) => c.category_type === 'ACCESSORY' || c.skip_check_availability).length;

  // Filtering
  const filteredCategories = categories.filter((cat) => {
    const isAccessory = cat.category_type === 'ACCESSORY' || Boolean(cat.skip_check_availability);
    if (categoryTypeFilter === 'OUTFIT' && isAccessory) return false;
    if (categoryTypeFilter === 'ACCESSORY' && !isAccessory) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      cat.name?.toLowerCase().includes(q) ||
      cat.category_code?.toLowerCase().includes(q) ||
      cat.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="stores-view categories-page-view">
      {/* Top Header */}
      <div className="stores-top-bar">
        <div className="title-section">
          <h1 className="main-title">Categories</h1>
          <p className="subtitle">
            Configure catalog taxonomy, SKU codes, and rental attire categories
          </p>
        </div>

        <div className="top-actions">
          {isSuperAdmin && stores.length > 0 && (
            <div className="store-selector-pill">
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
            </div>
          )}

          <button
            type="button"
            className="pill-btn-primary"
            onClick={() => handleOpenCreateModal('OUTFIT')}
          >
            <FiPlus className="plus-icon" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="cat-search-bar-wrap">
        <div className="cat-toolbar-left">
          <div className="search-pill-wrapper">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search category by name or SKU code..."
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

          {/* Clean Filter Tabs: All | Outfits | Accessories (Left-aligned, zero mismatched icons) */}
          <div className="category-filter-tabs">
            <button
              type="button"
              className={`cat-filter-btn ${categoryTypeFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setCategoryTypeFilter('ALL')}
            >
              <span>All ({totalCategories})</span>
            </button>
            <button
              type="button"
              className={`cat-filter-btn ${categoryTypeFilter === 'OUTFIT' ? 'active' : ''}`}
              onClick={() => setCategoryTypeFilter('OUTFIT')}
            >
              <span>Outfits ({outfitCount})</span>
            </button>
            <button
              type="button"
              className={`cat-filter-btn ${categoryTypeFilter === 'ACCESSORY' ? 'active' : ''}`}
              onClick={() => setCategoryTypeFilter('ACCESSORY')}
            >
              <span>Accessories ({accessoryCount})</span>
            </button>
          </div>
        </div>

        <div className="items-count-badge">
          Showing: {filteredCategories.length}
        </div>
      </div>

      {/* Content: Clean Bond CRM DataTable */}
      <div className="bond-card-container">
        <DataTable
          columns={[
            { label: '#', width: '60px' },
            ...(isSuperAdmin ? [{ label: 'Store', width: '150px' }] : []),
            { label: 'Type', width: '130px' },
            { label: 'Category Code', width: '160px' },
            { label: 'Category Name', width: '200px' },
            { label: 'Description' },
            { label: 'Availability', width: '140px' },
            { label: 'Designs', align: 'center', width: '100px' },
            { label: 'Actions', align: 'right', width: '100px' }
          ]}
          data={filteredCategories}
          loading={loading}
          emptyMessage="No categories found. Create a category to organize your inventory."
          keyExtractor={(cat) => cat.id}
          renderRow={(cat) => {
            const productCount = cat._count?.products || 0;
            const formattedIdx = String(filteredCategories.indexOf(cat) + 1).padStart(2, '0');
            const isAccessory = cat.category_type === 'ACCESSORY' || Boolean(cat.skip_check_availability);
            return (
              <>
                <td>
                  <span className="row-index-text">{formattedIdx}</span>
                </td>
                {isSuperAdmin && (
                  <td>
                    <span className="cat-store-badge">
                      {cat.store?.name || 'Unassigned'}
                    </span>
                  </td>
                )}
                <td>
                  <span className="cat-type-pill">
                    {isAccessory ? <FiBox className="pill-ico" /> : <FiShoppingBag className="pill-ico" />}
                    <span>{isAccessory ? 'Accessory' : 'Outfit'}</span>
                  </span>
                </td>
                <td>
                  <span className="cat-code-pill">
                    {cat.category_code || '—'}
                  </span>
                </td>
                <td>
                  <div className="table-cat-title-cell">
                    <span className="table-cat-name">{cat.name}</span>
                  </div>
                </td>
                <td>
                  <span className="table-cat-desc">
                    {cat.description || <span className="muted-italic">No description provided</span>}
                  </span>
                </td>
                <td>
                  <span className={`cat-avail-badge ${cat.skip_check_availability ? 'skip' : 'locked'}`}>
                    <span className="avail-dot" />
                    <span>{cat.skip_check_availability ? 'Skip Check' : 'Date Locked'}</span>
                  </span>
                </td>
                <td className="text-center">
                  <button
                    type="button"
                    className="designs-badge-btn"
                    onClick={() => navigate(`/collection?category=${cat.id}`)}
                    title={`View ${productCount} designs in this category`}
                  >
                    <span>{productCount}</span>
                  </button>
                </td>
                <td className="text-right">
                  <RowActions
                    onEdit={() => handleOpenEditModal(cat)}
                    onDelete={() => setCategoryToDelete(cat)}
                    deleteTitle={`Delete ${cat.name}`}
                  />
                </td>
              </>
            );
          }}
        />
      </div>

      {/* Add / Edit Category Modal - Clean, Simple & Fast */}
      {isModalOpen && (
        <div className="bond-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="category-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCategory ? 'Edit Category' : 'Create Category'}</h2>
              <button 
                type="button" 
                className="modal-close" 
                onClick={() => setIsModalOpen(false)}
                title="Close"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} autoComplete="off">
              <div className="modal-body">
                {isSuperAdmin && !editingCategory && stores.length > 0 && (
                  <div className="form-field-group">
                    <label className="field-label required">Store</label>
                    <Select
                      value={modalStoreId}
                      placeholder="-- Select Store --"
                      onChange={(e) => {
                        setModalStoreId(e.target.value);
                        if (formErrors.storeId) setFormErrors((prev) => ({ ...prev, storeId: '' }));
                      }}
                      options={stores.map((s) => ({ value: s.id, label: s.name || s.store_name }))}
                    />
                    {formErrors.storeId && <span className="field-error-text">{formErrors.storeId}</span>}
                  </div>
                )}

                <div className="form-two-cols">
                  <div className={`form-field-group ${formErrors.name ? 'has-error' : ''}`}>
                    <label className="field-label required">Category Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sherwani, Jodhpuri, Tuxedo"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      autoFocus
                    />
                    {formErrors.name && <span className="field-error-text">{formErrors.name}</span>}
                  </div>

                  <div className="form-field-group">
                    <label className="field-label">Category Code</label>
                    <input
                      type="text"
                      placeholder="e.g. SHERWANI, JODHPURI"
                      value={formData.category_code}
                      onChange={(e) => setFormData({ ...formData, category_code: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>

                <div className="form-field-group">
                  <label className="field-label">Description (Optional)</label>
                  <input
                    type="text"
                    placeholder="Short description of the collection"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="category-options-row">
                  <Checkbox
                    checked={formData.skip_check_availability}
                    onChange={(e) => setFormData({ ...formData, skip_check_availability: e.target.checked })}
                    label="Skip Check Availability"
                  />
                  <Checkbox
                    checked={formData.washable}
                    onChange={(e) => setFormData({ ...formData, washable: e.target.checked })}
                    label="Washable"
                  />
                  <div className="washing-field-inline">
                    <label>Washing (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.washing_price}
                      onChange={(e) => setFormData({ ...formData, washing_price: e.target.value })}
                    />
                  </div>
                </div>
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
                  {isSaving ? 'Saving...' : (editingCategory ? 'Update Category' : 'Save Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(categoryToDelete)}
        title="Delete Category"
        message={`Are you sure you want to delete category "${categoryToDelete?.name}" (${categoryToDelete?.category_code})? Categories with active designs cannot be removed.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Category'}
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setCategoryToDelete(null)}
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default CategoriesList;
