import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiTag, FiLayers, 
  FiExternalLink, FiX, FiCheck, FiFolder
} from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { TableRowSkeleton } from '../../components/ui/Skeleton/Skeleton';

import '../Stores/StoresList.scss';
import './CategoriesList.scss';

const CategoriesList = () => {
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || !user?.role;
  const userStoreId = user?.store?.id || user?.storeId || '';

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
          <h1 className="main-title">Category Pipeline</h1>
          <p className="subtitle">
            Manage your catalog classifications, taxonomy codes, and rental garment pipelines
          </p>
        </div>

        <div className="top-actions">
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
            <FiFolder />
          </div>
          <div className="metric-info">
            <span className="metric-label">Top Pipeline</span>
            <span className="metric-value text-ellipsis">
              {topCategory ? `${topCategory.name} (${topCategory._count?.products || 0})` : 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bond-card-container">
        {/* Search & Filter Toolbar */}
        <div className="categories-toolbar">
          <div className="search-pill-wrapper">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search category by name or code..."
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

        {/* Table View */}
        <div className="stores-table-wrapper">
          <table className="stores-table">
            <thead>
              <tr>
                <th style={{ width: '160px' }}>Category Code</th>
                <th>Category Name</th>
                <th>Description</th>
                <th style={{ width: '140px', textAlign: 'center' }}>Total Designs</th>
                <th style={{ width: '140px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRowSkeleton key={i} columns={5} />
                ))
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-state-cell">
                    <div className="empty-message-wrap">
                      <FiTag className="empty-icon" />
                      <h4>No categories found</h4>
                      <p>
                        {searchQuery
                          ? 'No categories match your search criteria.'
                          : 'Create your first apparel category pipeline to start adding designs.'}
                      </p>
                      {!searchQuery && (
                        <button
                          type="button"
                          className="btn-pill-subtle"
                          onClick={handleOpenCreateModal}
                          style={{ marginTop: 12 }}
                        >
                          <FiPlus /> Create Category
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => {
                  const productCount = cat._count?.products || 0;
                  return (
                    <tr key={cat.id} className="category-row">
                      <td>
                        <span className="cat-code-badge">{cat.category_code}</span>
                      </td>
                      <td>
                        <div className="cat-primary-info">
                          <span className="cat-name-text">{cat.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="cat-desc-text">
                          {cat.description || <span className="text-muted-italics">No description</span>}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="cat-designs-badge"
                          onClick={() => navigate('/collection')}
                          title="Open in Collection"
                        >
                          <FiLayers />
                          <span>{productCount} designs</span>
                        </button>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="actions-cell-wrap">
                          <button
                            type="button"
                            className="btn-icon-action"
                            title="Edit Category"
                            onClick={() => handleOpenEditModal(cat)}
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            type="button"
                            className="btn-icon-action danger"
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
                  <label>Category Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. SHERWANI, JODHPURI"
                    value={formData.category_code}
                    onChange={(e) => setFormData({ ...formData, category_code: e.target.value.toUpperCase() })}
                  />
                  <span className="field-hint">
                    Used as SKU prefix for garments and designs
                  </span>
                  {formErrors.category_code && <span className="field-error">{formErrors.category_code}</span>}
                </div>

                <div className="form-field">
                  <label>Description</label>
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
