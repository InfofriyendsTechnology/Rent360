import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FiArrowLeft, FiUploadCloud, FiTrash2, FiX, FiCheck, 
  FiShoppingBag, FiImage, FiRefreshCw 
} from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import { convertToWebP } from '../../utils/imageOptimizer';
import { getStoreSizes } from '../../constants/sizes';
import { Select } from '../../components/ui';
import '../Stores/StoresList.scss';
import '../Master/MasterPage.scss';
import './OutfitFormPage.scss';

const DEFAULT_COLORS = [
  'Maroon', 'Royal Blue', 'Emerald Green', 'Wine / Burgundy', 
  'Gold / Mustard', 'Navy Blue', 'Pastel Pink', 'Ivory / Cream', 
  'Black', 'Rust / Orange', 'Silver / Grey', 'Peach', 'Teal', 'Standard'
];

const OutfitFormPage = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const { user, token } = useSelector((state) => state.auth);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || !user?.role;
  const userStoreId = isSuperAdmin ? '' : (user?.store?.id || user?.storeId || '');

  // Stores for Super Admin
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(() => {
    return isSuperAdmin 
      ? (localStorage.getItem('rent360_active_store_id') || '') 
      : userStoreId;
  });

  // Master lists
  const [categories, setCategories] = useState([]);
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [sizes, setSizes] = useState([]);

  // Loading states
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [optimizingMain, setOptimizingMain] = useState(false);
  const [optimizingGallery, setOptimizingGallery] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Form Fields
  const [formData, setFormData] = useState({
    categoryId: '',
    name: '',
    color: 'Standard',
    size: '38 (S)',
    base_rent_price: 0,
    mrp: 0,
    purchase_price: 0,
    base_security_deposit: 0,
    product_code: '',
    hsn_code: '',
    qty: 1,
    remark: ''
  });

  // Images: Primary cover + 4 gallery slots
  const [primaryImage, setPrimaryImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([null, null, null, null]);

  // Original snapshot for reset functionality
  const originalStateRef = useRef(null);
  const primaryInputRef = useRef(null);
  const galleryInputRefs = useRef([]);

  // Fetch stores if Super Admin
  useEffect(() => {
    if (isSuperAdmin && token) {
      axios
        .get(`${API_BASE_URL}/api/stores`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          const list = res.data.data || [];
          setStores(list);
          if (list.length > 0 && !selectedStoreId) {
            setSelectedStoreId(list[0].id);
          }
        })
        .catch(() => {});
    }
  }, [isSuperAdmin, token]);

  // Fetch Categories, Colors, Sizes
  const fetchLookups = () => {
    if (!token) return;
    const storeParam = selectedStoreId ? `?storeId=${selectedStoreId}` : '';

    // Categories
    axios
      .get(`${API_BASE_URL}/api/categories${storeParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        const catList = res.data.data || [];
        setCategories(catList);
        if (!isEditing && catList.length > 0 && !formData.categoryId) {
          setFormData((prev) => ({
            ...prev,
            categoryId: catList[0].id,
            product_code: prev.product_code || generateCode(catList[0])
          }));
        }
      })
      .catch(() => {});

    // Colors
    axios
      .get(`${API_BASE_URL}/api/colors${storeParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        const list = res.data.data || [];
        if (list.length > 0) {
          const colorNames = list.map((c) => c.name).filter(Boolean);
          setColors(colorNames.length > 0 ? colorNames : DEFAULT_COLORS);
        }
      })
      .catch(() => {});

    // Sizes
    axios
      .get(`${API_BASE_URL}/api/sizes${storeParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        const list = res.data.data || [];
        if (list.length > 0) {
          setSizes(list.map((s) => s.name || s.code));
        } else {
          setSizes(getStoreSizes().map((s) => s.name));
        }
      })
      .catch(() => {
        setSizes(getStoreSizes().map((s) => s.name));
      });
  };

  useEffect(() => {
    fetchLookups();
  }, [selectedStoreId, token]);

  // Helper: auto-generate product code
  const generateCode = (cat) => {
    if (!cat) return '';
    const prefix = (cat.category_code || cat.name || 'OUT').slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    return `${prefix}-${rand}`;
  };

  // Fetch existing product for Edit mode
  const fetchOutfitDetails = () => {
    if (!isEditing || !token) return;

    setLoading(true);
    axios
      .get(`${API_BASE_URL}/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        const p = res.data.data;
        if (!p) {
          toast.error('Outfit not found');
          navigate('/collection');
          return;
        }

        const firstItem = p.productItems && p.productItems.length > 0 ? p.productItems[0] : null;
        const initialForm = {
          categoryId: p.categoryId || '',
          name: p.name || '',
          color: firstItem?.color || 'Standard',
          size: firstItem?.size || '38 (S)',
          base_rent_price: p.base_rent_price !== undefined ? p.base_rent_price : 0,
          mrp: p.mrp !== undefined && p.mrp !== null ? p.mrp : 0,
          purchase_price: p.purchase_price !== undefined && p.purchase_price !== null ? p.purchase_price : 0,
          base_security_deposit: p.base_security_deposit !== undefined ? p.base_security_deposit : 0,
          product_code: p.product_code || '',
          hsn_code: p.hsn_code || '',
          qty: p.productItems && p.productItems.length > 0 ? p.productItems.length : 1,
          remark: p.remark || ''
        };

        setFormData(initialForm);

        // Images: first is primary, rest up to 4 are gallery
        const imgs = Array.isArray(p.image_urls) ? p.image_urls : [];
        const primary = imgs.length > 0 ? imgs[0] : null;
        const gallery = [null, null, null, null];
        imgs.slice(1, 5).forEach((url, idx) => {
          gallery[idx] = url;
        });

        setPrimaryImage(primary);
        setGalleryImages(gallery);

        originalStateRef.current = {
          form: initialForm,
          primary,
          gallery
        };
      })
      .catch((err) => {
        toast.error('Failed to load outfit details');
        navigate('/collection');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOutfitDetails();
  }, [id, isEditing, token]);

  // Listen for Header refresh button (refresh outlet data in-place without reloading window)
  useEffect(() => {
    const handleOutletRefresh = () => {
      fetchLookups();
      if (isEditing) {
        fetchOutfitDetails();
      }
    };

    window.addEventListener('rent360:refresh', handleOutletRefresh);
    return () => window.removeEventListener('rent360:refresh', handleOutletRefresh);
  }, [selectedStoreId, isEditing, id, token]);

  // Handle Form Change
  const handleChange = (field, value) => {
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }

    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto update code if category changed on Create
      if (field === 'categoryId' && !isEditing && !prev.product_code) {
        const cat = categories.find((c) => c.id === value);
        if (cat) updated.product_code = generateCode(cat);
      }
      return updated;
    });
  };

  // Primary Image Upload
  const handlePrimaryImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    try {
      setOptimizingMain(true);
      const optimized = await convertToWebP(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.85 });
      setPrimaryImage(optimized.dataUrl);
      toast.success('Cover image ready');
    } catch (err) {
      toast.error('Failed to process image');
    } finally {
      setOptimizingMain(false);
      if (primaryInputRef.current) primaryInputRef.current.value = '';
    }
  };

  const handleRemovePrimaryImage = (e) => {
    e.stopPropagation();
    setPrimaryImage(null);
  };

  // Gallery Slot Upload
  const handleGalleryImageSelect = async (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    try {
      setOptimizingGallery(index);
      const optimized = await convertToWebP(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.85 });
      setGalleryImages((prev) => {
        const copy = [...prev];
        copy[index] = optimized.dataUrl;
        return copy;
      });
    } catch (err) {
      toast.error('Failed to process gallery image');
    } finally {
      setOptimizingGallery(null);
      if (galleryInputRefs.current[index]) {
        galleryInputRefs.current[index].value = '';
      }
    }
  };

  const handleRemoveGalleryImage = (index, e) => {
    e.stopPropagation();
    setGalleryImages((prev) => {
      const copy = [...prev];
      copy[index] = null;
      return copy;
    });
  };

  // Reset Button
  const handleReset = () => {
    setFormErrors({});
    if (isEditing && originalStateRef.current) {
      setFormData(originalStateRef.current.form);
      setPrimaryImage(originalStateRef.current.primary);
      setGalleryImages([...originalStateRef.current.gallery]);
      toast.success('Form reset to saved outfit state');
    } else {
      const firstCat = categories.length > 0 ? categories[0] : null;
      setFormData({
        categoryId: firstCat?.id || '',
        name: '',
        color: colors[0] || 'Standard',
        size: sizes[0] || '38 (S)',
        base_rent_price: 0,
        mrp: 0,
        purchase_price: 0,
        base_security_deposit: 0,
        product_code: firstCat ? generateCode(firstCat) : '',
        hsn_code: '',
        qty: 1,
        remark: ''
      });
      setPrimaryImage(null);
      setGalleryImages([null, null, null, null]);
      toast.success('Form cleared');
    }
  };

  // Form Validation
  const validateForm = () => {
    const errs = {};
    if (!formData.categoryId) {
      errs.categoryId = 'Please select a Category';
    }
    if (!formData.name || !formData.name.trim()) {
      errs.name = 'Product Name is required';
    }
    if (formData.base_rent_price === '' || isNaN(Number(formData.base_rent_price)) || Number(formData.base_rent_price) < 0) {
      errs.base_rent_price = 'Valid Rent price is required';
    }
    if (!formData.product_code || !formData.product_code.trim()) {
      errs.product_code = 'Product Code is required';
    }

    setFormErrors(errs);

    if (Object.keys(errs).length > 0) {
      // Focus first error field for smooth interaction
      const firstField = Object.keys(errs)[0];
      const targetInput = document.querySelector(`[name="${firstField}"], .has-error input, .has-error .bond-select-trigger`);
      targetInput?.focus?.();
      return false;
    }
    return true;
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Combine images: primary first, followed by valid gallery images
    const allImages = [];
    if (primaryImage) allImages.push(primaryImage);
    galleryImages.forEach((img) => {
      if (img) allImages.push(img);
    });

    const qtyNum = Math.max(1, parseInt(formData.qty, 10) || 1);
    const code = (formData.product_code || '').trim().toUpperCase();

    // Prepare physical items array on creation
    const items = [];
    if (!isEditing) {
      const sizeTag = (formData.size || 'STD').replace(/[^A-Z0-9]+/gi, '');
      for (let i = 1; i <= qtyNum; i++) {
        items.push({
          size: formData.size || '38 (S)',
          color: formData.color || 'Standard',
          sku_code: code ? `${code}-${sizeTag}-${i}` : undefined,
          status: 'AVAILABLE'
        });
      }
    }

    const payload = {
      name: formData.name.trim(),
      categoryId: formData.categoryId,
      storeId: selectedStoreId || undefined,
      product_code: code || undefined,
      base_rent_price: Number(formData.base_rent_price) || 0,
      base_security_deposit: Number(formData.base_security_deposit) || 0,
      mrp: Number(formData.mrp) || 0,
      purchase_price: Number(formData.purchase_price) || 0,
      hsn_code: formData.hsn_code ? formData.hsn_code.trim() : null,
      remark: formData.remark ? formData.remark.trim() : null,
      images: allImages,
      items: !isEditing ? items : undefined
    };

    try {
      setSubmitting(true);
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/api/products/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(`Outfit "${payload.name}" updated successfully`);
      } else {
        await axios.post(`${API_BASE_URL}/api/products`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(`Outfit "${payload.name}" created with ${qtyNum} barcode unit(s)`);
      }

      navigate('/collection');
    } catch (err) {
      const msg = err.response?.data?.message || (isEditing ? 'Failed to update outfit' : 'Failed to create outfit');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="outfit-form-view loading-state">
        <div className="loading-card">
          <FiRefreshCw className="spin-icon" />
          <p>Loading outfit details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="outfit-form-view">
      {/* Top Header with Breadcrumbs matching benchmark */}
      <div className="outfit-top-header">
        <div className="header-left">
          <button 
            type="button" 
            className="back-pill-btn" 
            onClick={() => navigate('/collection')}
            title="Back to Collection"
          >
            <FiArrowLeft className="back-icon" />
          </button>
          <div className="title-wrap">
            <h1 className="page-heading">
              {isEditing ? 'Edit Product' : 'Create Product'}
            </h1>
          </div>
        </div>

        <div className="header-right">
          <nav className="competitor-breadcrumb" aria-label="Breadcrumb">
            <Link to="/dashboard">Dashboard</Link>
            <span className="crumb-sep">/</span>
            <Link to="/collection">Products</Link>
            <span className="crumb-sep">/</span>
            <span className="crumb-active">{isEditing ? 'Edit Product' : 'Create Product'}</span>
          </nav>

          {isSuperAdmin && stores.length > 0 && (
            <div className="store-selector-pill">
              <FiShoppingBag className="store-pill-icon" />
              <label>Store:</label>
              <select
                value={selectedStoreId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedStoreId(val);
                  if (val) localStorage.setItem('rent360_active_store_id', val);
                  else localStorage.removeItem('rent360_active_store_id');
                }}
              >
                <option value="">All Stores</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name || s.store_name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Outlay Card Canvas */}
      <form onSubmit={handleSubmit} className="outfit-form-canvas" autoComplete="off" noValidate>
        <div className="canvas-grid-layout">
          
          {/* Left Column: Primary Cover Image Upload Dropzone */}
          <div className="cover-image-column">
            <input
              type="file"
              ref={primaryInputRef}
              onChange={handlePrimaryImageSelect}
              accept="image/*"
              style={{ display: 'none' }}
            />
            
            <div 
              className={`primary-dropzone-box ${primaryImage ? 'has-image' : ''}`}
              onClick={() => primaryInputRef.current?.click()}
            >
              {primaryImage ? (
                <div className="preview-container">
                  <img src={primaryImage} alt="Cover preview" className="cover-preview-img" />
                  <div className="dropzone-hover-mask">
                    <span className="change-text">Change Cover</span>
                    <button
                      type="button"
                      className="remove-cover-btn"
                      onClick={handleRemovePrimaryImage}
                      title="Remove cover image"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="empty-dropzone-content">
                  <div className="cloud-icon-circle">
                    {optimizingMain ? <FiRefreshCw className="spin-icon" /> : <FiUploadCloud className="cloud-icon" />}
                  </div>
                  <span className="upload-prompt-text">
                    {optimizingMain ? 'Optimizing...' : 'Upload Image'}
                  </span>
                  <span className="upload-hint">PNG, JPG, WEBP</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Form Fields Outlay */}
          <div className="fields-outlay-column">
            
            {/* Row 1: 4 Fields (Category, Product Name, Color, Size) */}
            <div className="form-fields-row row-four-cols">
              <div className={`form-field-group ${formErrors.categoryId ? 'has-error' : ''}`}>
                <label className="field-label required">Category*</label>
                <Select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={(e) => handleChange('categoryId', e.target.value)}
                  size="md"
                  className={formErrors.categoryId ? 'is-invalid' : ''}
                >
                  <option value="" disabled>Select</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
                {formErrors.categoryId && <span className="field-error-text">{formErrors.categoryId}</span>}
              </div>

              <div className={`form-field-group name-field-group ${formErrors.name ? 'has-error' : ''}`}>
                <label className="field-label required">Product Name*</label>
                <input
                  type="text"
                  name="name"
                  className={`outfit-input ${formErrors.name ? 'is-invalid' : ''}`}
                  placeholder="Product Name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
                {formErrors.name && <span className="field-error-text">{formErrors.name}</span>}
              </div>

              <div className="form-field-group">
                <label className="field-label">Color</label>
                <Select
                  value={formData.color}
                  onChange={(e) => handleChange('color', e.target.value)}
                  size="md"
                >
                  <option value="">Select</option>
                  {colors.map((clr) => (
                    <option key={clr} value={clr}>{clr}</option>
                  ))}
                </Select>
              </div>

              <div className="form-field-group">
                <label className="field-label">Size</label>
                <Select
                  value={formData.size}
                  onChange={(e) => handleChange('size', e.target.value)}
                  size="md"
                >
                  <option value="">Select</option>
                  {sizes.map((sz) => (
                    <option key={sz} value={sz}>{sz}</option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Row 2: 7 Fields (Rent*, MRP, Purchase Price, Security Amt, Code*, HSN Code, Qty) */}
            <div className="form-fields-row row-seven-cols">
              <div className={`form-field-group ${formErrors.base_rent_price ? 'has-error' : ''}`}>
                <label className="field-label required">Rent*</label>
                <input
                  type="number"
                  name="base_rent_price"
                  min="0"
                  step="any"
                  className={`outfit-input ${formErrors.base_rent_price ? 'is-invalid' : ''}`}
                  value={formData.base_rent_price}
                  onChange={(e) => handleChange('base_rent_price', e.target.value)}
                  placeholder="0"
                />
                {formErrors.base_rent_price && <span className="field-error-text">{formErrors.base_rent_price}</span>}
              </div>

              <div className="form-field-group">
                <label className="field-label">MRP</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="outfit-input"
                  value={formData.mrp}
                  onChange={(e) => handleChange('mrp', e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="form-field-group">
                <label className="field-label">Purchase Price</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="outfit-input"
                  value={formData.purchase_price}
                  onChange={(e) => handleChange('purchase_price', e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="form-field-group">
                <label className="field-label">Security Amt.</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="outfit-input"
                  value={formData.base_security_deposit}
                  onChange={(e) => handleChange('base_security_deposit', e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className={`form-field-group ${formErrors.product_code ? 'has-error' : ''}`}>
                <label className="field-label required">Code*</label>
                <input
                  type="text"
                  name="product_code"
                  className={`outfit-input code-input ${formErrors.product_code ? 'is-invalid' : ''}`}
                  value={formData.product_code}
                  onChange={(e) => handleChange('product_code', e.target.value.toUpperCase())}
                  placeholder="Code"
                />
                {formErrors.product_code && <span className="field-error-text">{formErrors.product_code}</span>}
              </div>

              <div className="form-field-group">
                <label className="field-label">HSN Code</label>
                <input
                  type="text"
                  className="outfit-input"
                  value={formData.hsn_code}
                  onChange={(e) => handleChange('hsn_code', e.target.value)}
                  placeholder="HSN Code"
                />
              </div>

              <div className="form-field-group qty-field-group">
                <label className="field-label">Qty</label>
                <input
                  type="number"
                  min="1"
                  className="outfit-input"
                  value={formData.qty}
                  onChange={(e) => handleChange('qty', e.target.value)}
                  placeholder="1"
                  disabled={isEditing}
                  title={isEditing ? 'Manage inventory pieces directly in Barcode & Stock' : 'Initial stock count'}
                />
              </div>
            </div>

            {/* Row 3: Remark Full Width */}
            <div className="form-fields-row row-remark">
              <div className="form-field-group full-width">
                <label className="field-label">Remark</label>
                <textarea
                  className="outfit-textarea"
                  rows={3}
                  placeholder="Type your remark here"
                  value={formData.remark}
                  onChange={(e) => handleChange('remark', e.target.value)}
                />
              </div>
            </div>

            {/* Row 4: Additional Gallery Images (4 slots side by side) */}
            <div className="form-fields-row row-gallery-images">
              <label className="field-label section-label">Images</label>
              
              <div className="gallery-slots-strip">
                {[0, 1, 2, 3].map((slotIdx) => {
                  const img = galleryImages[slotIdx];
                  const isOptimizingThis = optimizingGallery === slotIdx;

                  return (
                    <div key={slotIdx} className="gallery-slot-wrap">
                      <input
                        type="file"
                        ref={(el) => (galleryInputRefs.current[slotIdx] = el)}
                        onChange={(e) => handleGalleryImageSelect(slotIdx, e)}
                        accept="image/*"
                        style={{ display: 'none' }}
                      />

                      <div 
                        className={`gallery-dropzone-box ${img ? 'has-thumb' : ''}`}
                        onClick={() => galleryInputRefs.current[slotIdx]?.click()}
                      >
                        {img ? (
                          <div className="thumb-preview-wrap">
                            <img src={img} alt={`Gallery ${slotIdx + 1}`} className="thumb-img" />
                            <button
                              type="button"
                              className="thumb-remove-btn"
                              onClick={(e) => handleRemoveGalleryImage(slotIdx, e)}
                              title="Remove image"
                            >
                              <FiX />
                            </button>
                          </div>
                        ) : (
                          <div className="thumb-empty-content">
                            {isOptimizingThis ? (
                              <FiRefreshCw className="spin-icon thumb-icon" />
                            ) : (
                              <FiUploadCloud className="thumb-icon" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions Right Aligned: Reset and Submit */}
            <div className="outfit-form-footer-actions">
              <button
                type="button"
                className="pill-btn-secondary"
                onClick={handleReset}
                disabled={submitting}
              >
                Reset
              </button>
              
              <button
                type="submit"
                className="pill-btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Submit')}
              </button>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
};

export default OutfitFormPage;
