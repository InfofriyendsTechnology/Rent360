import React, { useState } from 'react';
import { FiX, FiPlus, FiTag, FiTrash2, FiLayers } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';

const CategoryModal = ({ isOpen, onClose, categories = [], onCategoryUpdated, token, storeId }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category_code: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState({});

  if (!isOpen) return null;

  const handleNameChange = (e) => {
    const name = e.target.value;
    const suggestedCode = name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .slice(0, 20);

    setFormData((prev) => ({
      ...prev,
      name,
      category_code: prev.category_code === '' || prev.category_code === prev.name.toUpperCase().replace(/[^A-Z0-9\s]/g, '').trim().replace(/\s+/g, '_').slice(0, 20) 
        ? suggestedCode 
        : prev.category_code
    }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Category name is required';
    if (!formData.category_code.trim()) errs.category_code = 'Category code is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        category_code: formData.category_code.trim().toUpperCase(),
        description: formData.description.trim() || undefined,
        storeId: storeId || undefined
      };

      await axios.post(`${API_BASE_URL}/api/categories`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Category created successfully');
      setFormData({ name: '', category_code: '', description: '' });
      setIsAdding(false);
      onCategoryUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (catId, catName) => {
    if (!window.confirm(`Delete category "${catName}"?`)) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/categories/${catId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Category deleted');
      onCategoryUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete category with associated products');
    }
  };

  return (
    <div className="collection-modal-overlay" onClick={onClose}>
      <div className="collection-modal-card category-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-info">
            <span className="modal-badge">
              <FiLayers className="badge-icon" />
              Taxonomy
            </span>
            <h2 className="modal-title">Categories</h2>
            <p className="modal-subtitle">Organize designs by attire category and collection types</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          {/* Add Category Toggle Button */}
          {!isAdding ? (
            <div className="add-cat-trigger-wrap">
              <button
                type="button"
                className="btn-pill-subtle"
                onClick={() => setIsAdding(true)}
              >
                <FiPlus />
                <span>Create New Category</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateCategory} className="new-category-form">
              <div className="form-grid-2">
                <div className="form-field">
                  <label>Category Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Royal Jodhpuri Suits"
                    value={formData.name}
                    onChange={handleNameChange}
                  />
                  {formErrors.name && <span className="field-error">{formErrors.name}</span>}
                </div>
                <div className="form-field">
                  <label>Category Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. JODHPURI"
                    value={formData.category_code}
                    onChange={(e) => setFormData({ ...formData, category_code: e.target.value.toUpperCase() })}
                  />
                  {formErrors.category_code && <span className="field-error">{formErrors.category_code}</span>}
                </div>
              </div>

              <div className="form-field">
                <label>Description</label>
                <input
                  type="text"
                  placeholder="e.g. Classic Bandhgala and Italian silk coats"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-actions-inline">
                <button
                  type="button"
                  className="btn-pill-ghost"
                  onClick={() => setIsAdding(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-pill-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          )}

          {/* Existing Categories List */}
          <div className="categories-list-section">
            <h3 className="section-label">Configured Categories ({categories.length})</h3>
            <div className="categories-table-wrapper">
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Designs</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id}>
                      <td>
                        <span className="code-pill">{cat.category_code}</span>
                      </td>
                      <td>
                        <div className="cat-cell-name">
                          <strong>{cat.name}</strong>
                          {cat.description && <span className="cat-cell-desc">{cat.description}</span>}
                        </div>
                      </td>
                      <td>
                        <span className="count-badge">{cat._count?.products || 0} designs</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-icon-danger"
                          title="Delete category"
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={4} className="empty-cell">
                        No categories found. Create your first category above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-pill-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;
