import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiTag, FiLayers, 
  FiArrowUpRight, FiX, FiCheck, FiFolder, FiGrid, FiList,
  FiTrendingUp, FiBox, FiCheckCircle
} from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { TableRowSkeleton } from '../../components/ui/Skeleton/Skeleton';

import '../Stores/StoresList.scss';
import './CategoriesList.scss';

// Vibrant accent colors for categories
const CATEGORY_COLORS = [
  { bg: 'rgba(11, 96, 176, 0.12)', color: '#0B60B0', border: 'rgba(11, 96, 176, 0.25)' },
  { bg: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6', border: 'rgba(139, 92, 246, 0.25)' },
  { bg: 'rgba(16, 185, 129, 0.12)', color: '#10B981', border: 'rgba(16, 185, 129, 0.25)' },
  { bg: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', border: 'rgba(245, 158, 11, 0.25)' },
  { bg: 'rgba(236, 72, 153, 0.12)', color: '#EC4899', border: 'rgba(236, 72, 153, 0.25)' },
  { bg: 'rgba(6, 182, 212, 0.12)', color: '#06B6D4', border: 'rgba(6, 182, 212, 0.25)' }
];

const CategoriesList = () => {
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || !user?.role;
  const userStoreId = user?.store?.id || user?.storeId || '';

  // View Mode: 'cards' or 'table'
  const [viewMode, setViewMode] = useState(localStorage.getItem('rent360_cat_view') || 'cards');

  // Stores for super admin
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(userStoreId);

  // Categories & UI state
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
    description: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const handleToggleViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('rent360_cat_view', mode);
  };

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
          if (list.length > 0) {
            const hasExisting = selectedStoreId && list.some((s) => s.id === selectedStoreId);
            if (!hasExisting) {
              const matched = userStoreId && list.some((s) => s.id === userStoreId);
              setSelectedStoreId(matched ? userStoreId : list[0].id);
            }
          }
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
  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', category_code: '', description: '' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name || '',
      category_code: cat.category_code || '',
      description: cat.description || ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    const suggested = val
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .slice(0, 20);

    setFormData((prev) => ({
      ...prev,
      name: val,
      category_code: !editingCategory ? suggested : prev.category_code
    }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Category name is required';
    if (!formData.category_code.trim()) errs.category_code = 'Category code is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!validate() || isSaving) return;

    setIsSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        category_code: formData.category_code.trim().toUpperCase(),
        description: formData.description.trim() || undefined,
        storeId: selectedStoreId || undefined
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

  // Filtering
  const filteredCategories = categories.filter((cat) => {
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
          <h1 className="main-title">Category Pipelines</h1>
          <p className="subtitle">
            Configure catalog taxonomy, SKU codes, and rental attire pipelines
          </p>
        </div>

        <div className="top-actions">
          {/* View Mode Toggle: Cards vs Table */}
          <div className="view-mode-toggle" title="Switch layout">
            <button 
              type="button"
              className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => handleToggleViewMode('cards')}
            >
              <FiGrid className="icon" />
              <span>Pipelines</span>
            </button>
            <button 
              type="button"
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => handleToggleViewMode('table')}
            >
              <FiList className="icon" />
              <span>Table</span>
            </button>
          </div>

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

          <button
            type="button"
            className="pill-btn-primary"
            onClick={handleOpenCreateModal}
          >
            <FiPlus className="plus-icon" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="category-metrics-grid">
        <div className="metric-pill-card">
          <div className="metric-icon-wrap">
            <FiTag />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Categories</span>
            <span className="metric-value">{totalCategories}</span>
          </div>
        </div>

        <div className="metric-pill-card">
          <div className="metric-icon-wrap accent">
            <FiLayers />
          </div>
          <div className="metric-info">
            <span className="metric-label">Mapped Designs</span>
            <span className="metric-value">{totalDesigns}</span>
          </div>
        </div>

        <div className="metric-pill-card">
          <div className="metric-icon-wrap success">
            <FiTrendingUp />
          </div>
          <div className="metric-info">
            <span className="metric-label">Top Pipeline</span>
            <span className="metric-value text-ellipsis">
              {topCategory ? `${topCategory.name} (${topCategory._count?.products || 0})` : 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="cat-search-bar-wrap">
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
        <div className="toolbar-count">
          Showing <strong>{filteredCategories.length}</strong> of {totalCategories} categories
        </div>
      </div>

      {/* Content: Cards View (CRM Pipeline Cards) */}
      {viewMode === 'cards' ? (
        <div className="category-cards-grid">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="cat-card skeleton-card">
                <div className="cat-card-header">
                  <div className="skeleton-line w-30" />
                  <div className="skeleton-line w-20" />
                </div>
                <div className="skeleton-line w-60 h-24" />
                <div className="skeleton-line w-90" />
                <div className="skeleton-line w-40" />
              </div>
            ))
          ) : filteredCategories.length === 0 ? (
            <div className="empty-pipeline-card">
              <FiTag className="empty-icon" />
              <h3>No categories found</h3>
              <p>
                {searchQuery
                  ? 'No categories match your search query.'
                  : 'Get started by creating your first rental category pipeline.'}
              </p>
              {!searchQuery && (
                <button
                  type="button"
                  className="pill-btn-primary"
                  onClick={handleOpenCreateModal}
                  style={{ marginTop: 14 }}
                >
                  <FiPlus />
                  <span>Create Category</span>
                </button>
              )}
            </div>
          ) : (
            filteredCategories.map((cat, idx) => {
              const colorTheme = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
              const productCount = cat._count?.products || 0;
              const formattedIdx = String(idx + 1).padStart(2, '0');

              return (
                <div key={cat.id} className="cat-pipeline-card">
                  {/* Card Header */}
                  <div className="pipeline-card-top">
                    <div className="pipeline-id-tag">
                      <span className="pipeline-index">#{formattedIdx}</span>
                      <span 
                        className="pipeline-code-pill"
                        style={{
                          backgroundColor: colorTheme.bg,
                          color: colorTheme.color,
                          borderColor: colorTheme.border
                        }}
                      >
                        {cat.category_code}
                      </span>
                    </div>

                    <div className="pipeline-actions">
                      <button
                        type="button"
                        className="card-action-btn"
                        title="Edit Category"
                        onClick={() => handleOpenEditModal(cat)}
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        type="button"
                        className="card-action-btn danger"
                        title="Delete Category"
                        onClick={() => setCategoryToDelete(cat)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="pipeline-card-body">
                    <h3 className="pipeline-name">{cat.name}</h3>
                    <p className="pipeline-desc">
                      {cat.description || 'Standard catalog attire pipeline for wedding and rental bookings.'}
                    </p>
                  </div>

                  {/* Card Footer / Metrics */}
                  <div className="pipeline-card-footer">
                    <div className="designs-count-badge">
                      <FiLayers className="badge-icon" />
                      <span>{productCount} {productCount === 1 ? 'Design' : 'Designs'}</span>
                    </div>

                    <button
                      type="button"
                      className="open-collection-link"
                      onClick={() => navigate('/collection')}
                      title="Browse designs in Collection"
                    >
                      <span>Collection</span>
                      <FiArrowUpRight className="arrow-icon" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Content: Table View (Bond CRM Table) */
        <div className="bond-card-container">
          <div className="table-responsive">
            <table className="bond-table cat-bond-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>#</th>
                  <th style={{ width: '180px' }}>Category Code</th>
                  <th style={{ width: '220px' }}>Category Name</th>
                  <th>Description</th>
                  <th style={{ width: '160px', textAlign: 'center' }}>Total Designs</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRowSkeleton key={i} columns={6} />
                  ))
                ) : filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="state-message">
                      No categories found. Create a category pipeline to organize your inventory.
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((cat, idx) => {
                    const colorTheme = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                    const productCount = cat._count?.products || 0;
                    const formattedIdx = String(idx + 1).padStart(2, '0');

                    return (
                      <tr key={cat.id} className="cat-table-row">
                        <td>
                          <span className="row-index-text">{formattedIdx}</span>
                        </td>
                        <td>
                          <span 
                            className="table-cat-code"
                            style={{
                              backgroundColor: colorTheme.bg,
                              color: colorTheme.color,
                              borderColor: colorTheme.border
                            }}
                          >
                            {cat.category_code}
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
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="table-designs-pill"
                            onClick={() => navigate('/collection')}
                            title="View designs in Collection"
                          >
                            <FiLayers />
                            <span>{productCount} designs</span>
                          </button>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="table-actions-cell">
                            <button
                              type="button"
                              className="tbl-btn-action"
                              title="Edit Category"
                              onClick={() => handleOpenEditModal(cat)}
                            >
                              <FiEdit2 />
                            </button>
                            <button
                              type="button"
                              className="tbl-btn-action danger"
                              title="Delete Category"
                              onClick={() => setCategoryToDelete(cat)}
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
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="confirm-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="category-edit-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-info">
                <span className="modal-badge">
                  <FiTag className="badge-icon" />
                  Category Pipeline
                </span>
                <h2 className="modal-title">
                  {editingCategory ? 'Edit Category' : 'Create Category'}
                </h2>
                <p className="modal-subtitle">
                  Configure garment classifications and standard SKU codes
                </p>
              </div>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => setIsModalOpen(false)}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSaveCategory}>
              <div className="modal-body">
                <div className="form-field">
                  <label>Category Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Royal Sherwani, Jodhpuri, Indo-Western"
                    value={formData.name}
                    onChange={handleNameChange}
                    autoFocus
                  />
                  {formErrors.name && <span className="field-error">{formErrors.name}</span>}
                </div>

                <div className="form-field">
                  <label>Category Code (SKU Prefix) *</label>
                  <input
                    type="text"
                    placeholder="e.g. SHERWANI, JODHPURI"
                    value={formData.category_code}
                    onChange={(e) => setFormData({ ...formData, category_code: e.target.value.toUpperCase() })}
                  />
                  <span className="field-hint">
                    Used as the SKU prefix for product items (e.g. SHERWANI-001)
                  </span>
                  {formErrors.category_code && <span className="field-error">{formErrors.category_code}</span>}
                </div>

                <div className="form-field">
                  <label>Description (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Brief description of fabrics, styles, or occasions for this pipeline..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
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
                  {isSaving ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
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
