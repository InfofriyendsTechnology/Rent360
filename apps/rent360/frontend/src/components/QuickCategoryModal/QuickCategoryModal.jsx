import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiLayers } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import './QuickCategoryModal.scss';

export const QuickCategoryModal = ({
  isOpen,
  onClose,
  onSuccess,
  storeId,
  categoryType = 'OUTFIT'
}) => {
  const { token: reduxToken, user } = useSelector((state) => state.auth);
  const token = reduxToken || localStorage.getItem('token');
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || !user?.role;
  
  const [stores, setStores] = useState([]);
  const [customStoreId, setCustomStoreId] = useState(storeId || '');

  useEffect(() => {
    setCustomStoreId(storeId || '');
  }, [storeId, isOpen]);

  useEffect(() => {
    if (isSuperAdmin && !storeId && isOpen && token) {
      axios
        .get(`${API_BASE_URL}/api/stores`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          setStores(res.data.data || []);
        })
        .catch(() => {});
    }
  }, [isSuperAdmin, storeId, isOpen, token]);

  const activeStoreId = storeId || customStoreId || (!isSuperAdmin ? user?.storeId : '') || '';

  const [formData, setFormData] = useState({
    name: '',
    category_code: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({ name: '', category_code: '', description: '' });
      setFormErrors({});
      setIsSaving(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
      category_code: suggested
    }));
  };

  const validate = () => {
    const errs = {};
    if (isSuperAdmin && !activeStoreId) {
      errs.storeId = 'Please select a store';
    }
    if (!formData.name.trim()) errs.name = 'Category name is required';
    if (!formData.category_code.trim()) errs.category_code = 'Category code is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || isSaving) return;

    setIsSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        category_code: formData.category_code.trim().toUpperCase(),
        description: formData.description.trim() || undefined,
        category_type: categoryType,
        storeId: activeStoreId || undefined
      };

      const res = await axios.post(`${API_BASE_URL}/api/categories`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const newCategory = res.data?.data || res.data;
      toast.success(`Category "${newCategory?.name || payload.name}" created`);

      if (onSuccess) {
        onSuccess(newCategory);
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create category');
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="quick-category-modal-overlay" onClick={onClose}>
      <div 
        className="quick-category-modal-card" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-category-title"
      >
        <div className="quick-modal-header">
          <div className="title-group">
            <div className="header-icon-pill">
              <FiLayers />
            </div>
            <div>
              <h3 id="quick-category-title">Add New Category</h3>
              <p>Create a garment category without leaving this page</p>
            </div>
          </div>
          <button 
            type="button" 
            className="quick-modal-close" 
            onClick={onClose} 
            aria-label="Close"
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="quick-modal-body">
            {isSuperAdmin && !storeId && (
              <div className="quick-form-group">
                <label>Store *</label>
                <select
                  value={customStoreId}
                  onChange={(e) => {
                    setCustomStoreId(e.target.value);
                    if (formErrors.storeId) {
                      setFormErrors((prev) => ({ ...prev, storeId: '' }));
                    }
                  }}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-card-alt)',
                    border: '1px solid var(--border-main)',
                    borderRadius: '9px',
                    padding: '9px 12px',
                    fontSize: '0.88rem',
                    color: 'var(--text-main)',
                    outline: 'none'
                  }}
                >
                  <option value="">-- Select Store --</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {formErrors.storeId && <span className="field-error">{formErrors.storeId}</span>}
              </div>
            )}

            <div className="quick-form-group">
              <label>Category Name *</label>
              <input
                type="text"
                placeholder="e.g. Royal Sherwani, Jodhpuri, Tuxedo"
                value={formData.name}
                onChange={handleNameChange}
                autoFocus
              />
              {formErrors.name && <span className="field-error">{formErrors.name}</span>}
            </div>

            <div className="quick-form-group">
              <label>Category Code (SKU Prefix) *</label>
              <input
                type="text"
                placeholder="e.g. SHERWANI, JODHPURI"
                value={formData.category_code}
                onChange={(e) => setFormData({ ...formData, category_code: e.target.value.toUpperCase() })}
              />
              <span className="field-hint">
                Standard prefix for barcode & design SKU codes (e.g. SHERWANI-001)
              </span>
              {formErrors.category_code && <span className="field-error">{formErrors.category_code}</span>}
            </div>

            <div className="quick-form-group">
              <label>Description (Optional)</label>
              <textarea
                rows={2}
                placeholder="Brief notes regarding garment styling, fabrics, or catalog grouping..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="quick-modal-footer">
            <button
              type="button"
              className="quick-btn-cancel"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="quick-btn-save"
              disabled={isSaving}
            >
              {isSaving ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default QuickCategoryModal;
