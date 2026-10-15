import React, { useState, useEffect } from 'react';
import { FiX, FiUploadCloud } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import { batchConvertToWebP } from '../../utils/imageOptimizer';
import { getStoreSizes } from '../../constants/sizes';

const ProductModal = ({
  isOpen,
  onClose,
  product = null,
  categories = [],
  onProductSaved,
  token,
  storeId
}) => {
  const isEditing = Boolean(product?.id);

  const [formData, setFormData] = useState({
    categoryId: '',
    name: '',
    product_code: '',
    base_rent_price: '',
    base_security_deposit: '',
    images: []
  });

  const masterSizes = getStoreSizes();
  const defaultSize = masterSizes[0]?.name || '38 (S)';
  const [selectedSizes, setSelectedSizes] = useState([defaultSize]);

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        categoryId: product.categoryId || '',
        name: product.name || '',
        product_code: product.product_code || '',
        base_rent_price: product.base_rent_price !== undefined ? String(product.base_rent_price) : '',
        base_security_deposit: product.base_security_deposit !== undefined ? String(product.base_security_deposit) : '',
        images: Array.isArray(product.image_urls) ? [...product.image_urls] : []
      });
      setSelectedSizes([]);
    } else {
      const defaultCatId = categories.length > 0 ? categories[0].id : '';
      setFormData({
        categoryId: defaultCatId,
        name: '',
        product_code: '',
        base_rent_price: '',
        base_security_deposit: '',
        images: []
      });
      setSelectedSizes([defaultSize]);
    }
    setFormErrors({});
  }, [product, categories, isOpen, defaultSize]);

  if (!isOpen) return null;

  const handleNameChange = (e) => {
    const name = e.target.value;
    if (!isEditing && !formData.product_code) {
      const prefix = name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 3) || 'ITM';
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      setFormData((prev) => ({
        ...prev,
        name,
        product_code: `${prefix}-${randomSuffix}`
      }));
    } else {
      setFormData((prev) => ({ ...prev, name }));
    }
  };

  const toggleSize = (sizeName) => {
    setSelectedSizes((prev) =>
      prev.includes(sizeName) ? prev.filter((s) => s !== sizeName) : [...prev, sizeName]
    );
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setOptimizing(true);
    try {
      const results = await batchConvertToWebP(files, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.82
      });

      const successful = results.filter((r) => r.success);
      const newImages = successful.map((r) => r.dataUrl);

      if (newImages.length > 0) {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...newImages]
        }));
        toast.success(`Added ${newImages.length} photo(s)`);
      } else {
        toast.error('Failed to process selected photos');
      }
    } catch (err) {
      toast.error('Error optimizing image');
    } finally {
      setOptimizing(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.categoryId) errs.categoryId = 'Please select a category';
    if (!formData.name.trim()) errs.name = 'Design name is required';
    if (!formData.product_code.trim()) errs.product_code = 'Product code is required';
    if (formData.base_rent_price === '' || isNaN(Number(formData.base_rent_price)) || Number(formData.base_rent_price) < 0) {
      errs.base_rent_price = 'Base rent must be a valid number';
    }
    if (formData.base_security_deposit === '' || isNaN(Number(formData.base_security_deposit)) || Number(formData.base_security_deposit) < 0) {
      errs.base_security_deposit = 'Security deposit must be a valid number';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    try {
      if (isEditing) {
        const payload = {
          categoryId: formData.categoryId,
          name: formData.name.trim(),
          product_code: formData.product_code.trim().toUpperCase(),
          base_rent_price: Number(formData.base_rent_price),
          base_security_deposit: Number(formData.base_security_deposit),
          images: formData.images
        };

        await axios.put(`${API_BASE_URL}/api/products/${product.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Design updated successfully');
      } else {
        const payload = {
          storeId: storeId || undefined,
          categoryId: formData.categoryId,
          name: formData.name.trim(),
          product_code: formData.product_code.trim().toUpperCase(),
          base_rent_price: Number(formData.base_rent_price),
          base_security_deposit: Number(formData.base_security_deposit),
          images: formData.images,
          items: selectedSizes.map((sz) => ({ size: sz }))
        };

        await axios.post(`${API_BASE_URL}/api/products`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('New design added to collection');
      }

      onProductSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bond-modal-overlay" onClick={onClose}>
      <div className="bond-modal-card product-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{isEditing ? 'Edit Design' : 'Add New Design'}</h2>
            <p>{isEditing ? 'Update pricing, category, or photos' : 'Register a new ethnic apparel design in your catalog'}</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="modal-body">
            {/* Row 1: Category & Design Code */}
            <div className="form-row-2">
              <div className="form-field">
                <label>Category *</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.category_code})
                    </option>
                  ))}
                </select>
                {formErrors.categoryId && <span className="field-error">{formErrors.categoryId}</span>}
              </div>

              <div className="form-field">
                <label>Design Code (SKU) *</label>
                <input
                  type="text"
                  placeholder="e.g. SHW-001"
                  value={formData.product_code}
                  onChange={(e) => setFormData({ ...formData, product_code: e.target.value.toUpperCase() })}
                />
                {formErrors.product_code && <span className="field-error">{formErrors.product_code}</span>}
              </div>
            </div>

            {/* Row 2: Design Name */}
            <div className="form-row">
              <div className="form-field">
                <label>Design Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Royal Silk Hand-Embroidered Sherwani"
                  value={formData.name}
                  onChange={handleNameChange}
                />
                {formErrors.name && <span className="field-error">{formErrors.name}</span>}
              </div>
            </div>

            {/* Row 3: Rent & Security Deposit */}
            <div className="form-row-2">
              <div className="form-field">
                <label>Rent Rate (INR / day) *</label>
                <div className="input-with-symbol">
                  <span className="currency-prefix">INR</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    placeholder="e.g. 2500"
                    value={formData.base_rent_price}
                    onChange={(e) => setFormData({ ...formData, base_rent_price: e.target.value })}
                  />
                </div>
                {formErrors.base_rent_price && <span className="field-error">{formErrors.base_rent_price}</span>}
              </div>

              <div className="form-field">
                <label>Security Deposit (INR) *</label>
                <div className="input-with-symbol">
                  <span className="currency-prefix">INR</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="e.g. 5000"
                    value={formData.base_security_deposit}
                    onChange={(e) => setFormData({ ...formData, base_security_deposit: e.target.value })}
                  />
                </div>
                {formErrors.base_security_deposit && <span className="field-error">{formErrors.base_security_deposit}</span>}
              </div>
            </div>

            {/* Initial Sizes (Only when creating design) */}
            {!isEditing && (
              <div className="form-row">
                <div className="form-field">
                  <label>Sizes in Stock</label>
                  <div className="sizes-pill-selector">
                    {masterSizes.map((sz) => {
                      const isSelected = selectedSizes.includes(sz.name);
                      return (
                        <button
                          key={sz.id || sz.name}
                          type="button"
                          className={`size-select-pill ${isSelected ? 'active' : ''}`}
                          onClick={() => toggleSize(sz.name)}
                        >
                          {sz.name}
                        </button>
                      );
                    })}
                  </div>
                  <span className="field-hint">
                    Click to select sizes currently in stock. More units can be added anytime in Stock Manager.
                  </span>
                </div>
              </div>
            )}

            {/* Design Photos (Optional) */}
            <div className="form-row">
              <div className="form-field">
                <label>Design Photos (Optional)</label>
                <div className="sleek-photo-upload-row">
                  <label className="photo-upload-btn" title="Choose photos">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                    <FiUploadCloud className="icon" />
                    <span>{optimizing ? 'Optimizing...' : 'Upload Photos'}</span>
                  </label>

                  {formData.images.length > 0 && (
                    <div className="photo-thumbs-list">
                      {formData.images.map((img, idx) => (
                        <div key={idx} className="photo-thumb-card">
                          <img src={img} alt={`Photo ${idx + 1}`} />
                          <button
                            type="button"
                            className="btn-remove-photo"
                            onClick={() => handleRemoveImage(idx)}
                            title="Remove photo"
                          >
                            <FiX />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="pill-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="pill-btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Design'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
