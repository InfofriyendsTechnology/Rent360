import React, { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash2, FiUploadCloud, FiImage, FiLayers, FiDollarSign, FiShield } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';

const POPULAR_SIZES = ['36 (S)', '38 (M)', '40 (L)', '42 (XL)', '44 (XXL)', '46 (3XL)', 'Free Size'];

const ProductModal = ({
  isOpen,
  onClose,
  product = null,
  categories = [],
  onProductSaved,
  token,
  storeId,
  onOpenCategoryModal
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

  // Initial physical variants for new design
  const [initialItems, setInitialItems] = useState([
    { size: '38 (M)', color: 'Maroon & Gold', condition_notes: 'Showroom display' }
  ]);

  const [customImageUrl, setCustomImageUrl] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

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
      setInitialItems([]);
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
      setInitialItems([
        { size: '38 (M)', color: '', condition_notes: 'Fresh stock' }
      ]);
    }
    setFormErrors({});
    setCustomImageUrl('');
  }, [product, categories, isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (e) => {
    const name = e.target.value;
    if (!isEditing && !formData.product_code) {
      // Auto-suggest product code prefix
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

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      if (file.size > 8 * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds 8MB limit`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, reader.result]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
    // Reset file input
    e.target.value = '';
  };

  const handleAddImageUrl = () => {
    if (!customImageUrl.trim()) return;
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, customImageUrl.trim()]
    }));
    setCustomImageUrl('');
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  // Initial Item variant helpers
  const handleAddItemVariant = () => {
    setInitialItems((prev) => [
      ...prev,
      { size: '40 (L)', color: '', condition_notes: '' }
    ]);
  };

  const handleItemVariantChange = (index, field, value) => {
    setInitialItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveItemVariant = (index) => {
    setInitialItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const validate = () => {
    const errs = {};
    if (!formData.categoryId) errs.categoryId = 'Please select a category';
    if (!formData.name.trim()) errs.name = 'Design name is required';
    if (!formData.product_code.trim()) errs.product_code = 'Product code is required';
    if (formData.base_rent_price === '' || isNaN(Number(formData.base_rent_price)) || Number(formData.base_rent_price) < 0) {
      errs.base_rent_price = 'Base rent must be a valid positive number';
    }
    if (formData.base_security_deposit === '' || isNaN(Number(formData.base_security_deposit)) || Number(formData.base_security_deposit) < 0) {
      errs.base_security_deposit = 'Security deposit must be a valid positive number';
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
        const validItems = initialItems
          .filter((it) => it.size && it.size.trim())
          .map((it) => ({
            size: it.size.trim(),
            color: it.color?.trim() || undefined,
            condition_notes: it.condition_notes?.trim() || undefined
          }));

        const payload = {
          storeId: storeId || undefined,
          categoryId: formData.categoryId,
          name: formData.name.trim(),
          product_code: formData.product_code.trim().toUpperCase(),
          base_rent_price: Number(formData.base_rent_price),
          base_security_deposit: Number(formData.base_security_deposit),
          images: formData.images,
          items: validItems
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
    <div className="collection-modal-overlay" onClick={onClose}>
      <div className="collection-modal-card product-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-info">
            <span className="modal-badge">
              <FiLayers className="badge-icon" />
              {isEditing ? 'Edit Design' : 'New Design'}
            </span>
            <h2 className="modal-title">
              {isEditing ? 'Modify Collection Design' : 'Add Design to Collection'}
            </h2>
            <p className="modal-subtitle">
              {isEditing
                ? 'Update pricing, photos, or category information'
                : 'Register a design and create its physical rental units'}
            </p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-scroll-form">
          <div className="modal-body-content">
            {/* Category and Product Code */}
            <div className="form-grid-2">
              <div className="form-field">
                <div className="label-with-action">
                  <label>Category *</label>
                  {onOpenCategoryModal && (
                    <button
                      type="button"
                      className="link-inline-btn"
                      onClick={onOpenCategoryModal}
                    >
                      + Manage Categories
                    </button>
                  )}
                </div>
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
                <label>Product Code (Design SKU) *</label>
                <input
                  type="text"
                  placeholder="e.g. SHW-001"
                  value={formData.product_code}
                  onChange={(e) => setFormData({ ...formData, product_code: e.target.value.toUpperCase() })}
                />
                {formErrors.product_code && <span className="field-error">{formErrors.product_code}</span>}
              </div>
            </div>

            {/* Design Name */}
            <div className="form-field">
              <label>Design / Product Name *</label>
              <input
                type="text"
                placeholder="e.g. Imperial Velvet Hand-Embroidered Sherwani"
                value={formData.name}
                onChange={handleNameChange}
              />
              {formErrors.name && <span className="field-error">{formErrors.name}</span>}
            </div>

            {/* Pricing Details */}
            <div className="form-grid-2">
              <div className="form-field">
                <label>Base Rent Price (INR / day) *</label>
                <div className="input-with-symbol">
                  <span className="currency-prefix">INR</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    placeholder="e.g. 3500"
                    value={formData.base_rent_price}
                    onChange={(e) => setFormData({ ...formData, base_rent_price: e.target.value })}
                  />
                </div>
                {formErrors.base_rent_price && <span className="field-error">{formErrors.base_rent_price}</span>}
              </div>

              <div className="form-field">
                <label>Base Security Deposit (INR) *</label>
                <div className="input-with-symbol">
                  <span className="currency-prefix">INR</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="e.g. 7000"
                    value={formData.base_security_deposit}
                    onChange={(e) => setFormData({ ...formData, base_security_deposit: e.target.value })}
                  />
                </div>
                {formErrors.base_security_deposit && <span className="field-error">{formErrors.base_security_deposit}</span>}
              </div>
            </div>

            {/* Photo Gallery & Uploader */}
            <div className="form-section-card">
              <div className="section-card-header">
                <div>
                  <h4 className="card-section-title">Product Photos</h4>
                  <p className="card-section-desc">Upload multiple angle photos for showroom presentation</p>
                </div>
                <span className="photo-count-pill">{formData.images.length} Photos</span>
              </div>

              <div className="photo-uploader-box">
                <label className="dropzone-label">
                  <FiUploadCloud className="upload-icon" />
                  <span className="upload-main-text">Click to choose image files</span>
                  <span className="upload-sub-text">PNG, JPG, WebP up to 8MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden-file-input"
                  />
                </label>
              </div>

              {/* Paste URL option */}
              <div className="url-input-row">
                <input
                  type="url"
                  placeholder="Or paste external image URL..."
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddImageUrl();
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn-pill-subtle"
                  onClick={handleAddImageUrl}
                  disabled={!customImageUrl.trim()}
                >
                  Add URL
                </button>
              </div>

              {/* Image Previews */}
              {formData.images.length > 0 && (
                <div className="image-previews-grid">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="preview-item-card">
                      <img src={img} alt={`Preview ${idx + 1}`} />
                      <button
                        type="button"
                        className="remove-img-btn"
                        onClick={() => handleRemoveImage(idx)}
                        title="Remove photo"
                      >
                        <FiTrash2 />
                      </button>
                      <span className="preview-badge">#{idx + 1}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Initial Physical Stock Items (only when creating) */}
            {!isEditing && (
              <div className="form-section-card">
                <div className="section-card-header">
                  <div>
                    <h4 className="card-section-title">Physical Stock Pieces (Sizes)</h4>
                    <p className="card-section-desc">Create initial physical units for this design</p>
                  </div>
                  <button
                    type="button"
                    className="btn-pill-subtle"
                    onClick={handleAddItemVariant}
                  >
                    <FiPlus />
                    <span>Add Size</span>
                  </button>
                </div>

                <div className="variants-repeater-list">
                  {initialItems.map((item, idx) => (
                    <div key={idx} className="variant-row-item">
                      <div className="variant-field size-field">
                        <label>Size</label>
                        <select
                          value={item.size}
                          onChange={(e) => handleItemVariantChange(idx, 'size', e.target.value)}
                        >
                          {POPULAR_SIZES.map((sz) => (
                            <option key={sz} value={sz}>
                              {sz}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="variant-field color-field">
                        <label>Color</label>
                        <input
                          type="text"
                          placeholder="e.g. Maroon"
                          value={item.color}
                          onChange={(e) => handleItemVariantChange(idx, 'color', e.target.value)}
                        />
                      </div>

                      <div className="variant-field notes-field">
                        <label>Condition Notes</label>
                        <input
                          type="text"
                          placeholder="e.g. New piece"
                          value={item.condition_notes}
                          onChange={(e) => handleItemVariantChange(idx, 'condition_notes', e.target.value)}
                        />
                      </div>

                      {initialItems.length > 1 && (
                        <button
                          type="button"
                          className="btn-row-remove"
                          onClick={() => handleRemoveItemVariant(idx)}
                          title="Remove variant"
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-pill-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-pill-primary" disabled={submitting}>
              {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Design'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
