import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { 
  FiSearch, FiShare2, FiImage, FiCopy, FiCheck, 
  FiShoppingBag, FiTag, FiDollarSign, FiShield, FiX, FiChevronDown
} from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import ImageGalleryModal from './ImageGalleryModal';
import '../Stores/StoresList.scss';
import '../Master/MasterPage.scss';
import './LookbookPage.scss';

const LookbookPage = () => {
  const { user, token } = useSelector((state) => state.auth);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || !user?.role;
  const userStoreId = isSuperAdmin ? '' : (user?.store?.id || user?.storeId || '');

  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(() => (isSuperAdmin ? '' : userStoreId));

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Gallery Modal
  const [galleryState, setGalleryState] = useState({
    isOpen: false,
    images: [],
    initialIndex: 0,
    title: ''
  });

  // Fetch stores for Super Admin
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

  // Fetch categories
  useEffect(() => {
    if (token) {
      const params = selectedStoreId ? { storeId: selectedStoreId } : {};
      axios
        .get(`${API_BASE_URL}/api/categories`, {
          headers: { Authorization: `Bearer ${token}` },
          params
        })
        .then((res) => {
          setCategories(res.data.data || []);
        })
        .catch(() => {});
    }
  }, [selectedStoreId, token]);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedStoreId) params.storeId = selectedStoreId;

      const res = await axios.get(`${API_BASE_URL}/api/products`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setProducts(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load lookbook collection');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProducts();
    }
  }, [selectedStoreId, token]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === 'ALL' || p.categoryId === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.product_code && p.product_code.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleOpenGallery = (prod, index = 0) => {
    const images = Array.isArray(prod.image_urls) ? prod.image_urls : [];
    if (images.length === 0) {
      toast.error('No photos uploaded for this design yet');
      return;
    }
    setGalleryState({
      isOpen: true,
      images,
      initialIndex: index,
      title: `${prod.name} (${prod.product_code})`
    });
  };

  const handleShareWhatsApp = (prod) => {
    const sizes = Array.isArray(prod.productItems)
      ? Array.from(new Set(prod.productItems.map((i) => i.size).filter(Boolean))).join(', ')
      : '';
    const text = `*${prod.name}* (${prod.product_code})%0A` +
      `Rent: ₹${(prod.base_rent_price || 0).toLocaleString('en-IN')}%0A` +
      `Deposit: ₹${(prod.base_security_deposit || 0).toLocaleString('en-IN')}%0A` +
      (sizes ? `Available Sizes: ${sizes}%0A` : '') +
      `Enquire with us at Rent360!`;

    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Lookbook catalogue link copied to clipboard!');
  };

  return (
    <div className="stores-view master-page-view lookbook-page-view">
      {/* Top Bar matching Rent360 Master standard */}
      <div className="stores-top-bar">
        <div className="title-section">
          <h1 className="main-title">Digital Lookbook</h1>
          <p className="subtitle">Visual catalogue of designer apparel, bridal wear, and sherwanis for customer showcases</p>
        </div>

        <div className="top-actions">
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
                  <option key={s.id} value={s.id}>
                    {s.name || s.store_name}
                  </option>
                ))}
              </select>
              <FiChevronDown className="chevron-icon" />
            </div>
          )}

          <button
            type="button"
            className="pill-btn-primary"
            onClick={handleCopyLink}
          >
            <FiShare2 className="plus-icon" />
            <span>Share Catalogue</span>
          </button>
        </div>
      </div>

      {/* Category Tabs Pill Bar matching Master */}
      <div className="master-tabs-bar">
        <button
          type="button"
          className={`master-tab-btn ${selectedCategory === 'ALL' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('ALL')}
        >
          <FiTag className="tab-icon" />
          <span>All Outfits ({products.length})</span>
        </button>

        {categories.map((cat) => {
          const count = products.filter((p) => p.categoryId === cat.id).length;
          return (
            <button
              key={cat.id}
              type="button"
              className={`master-tab-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <FiTag className="tab-icon" />
              <span>{cat.name} ({count})</span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="setup-controls-bar">
        <div className="search-pill-wrapper">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by outfit name or design code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search"
              onClick={() => setSearchQuery('')}
            >
              <FiX />
            </button>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="lookbook-loading">Loading lookbook collection...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="bond-card-container empty-lookbook-container">
          <div className="empty-icon-box">
            <FiShoppingBag />
          </div>
          <h3>No outfits found in this category</h3>
          <p>Add new designs in the Outfits section to populate your customer lookbook.</p>
        </div>
      ) : (
        <div className="lookbook-cards-grid">
          {filteredProducts.map((prod) => {
            const images = Array.isArray(prod.image_urls) ? prod.image_urls : [];
            const coverImage = images[0] || '';
            const sizes = Array.isArray(prod.productItems)
              ? Array.from(new Set(prod.productItems.map((i) => i.size).filter(Boolean)))
              : [];

            return (
              <div key={prod.id} className="lookbook-item-card">
                <div 
                  className="card-media-wrapper"
                  onClick={() => handleOpenGallery(prod, 0)}
                  title="Click to view full photo gallery"
                >
                  {coverImage ? (
                    <img src={coverImage} alt={prod.name} className="cover-img" />
                  ) : (
                    <div className="no-image-box">
                      <FiImage />
                      <span>No Photo</span>
                    </div>
                  )}
                  <span className="code-pill">{prod.product_code}</span>
                  {images.length > 1 && (
                    <span className="photos-counter-pill">
                      +{images.length} Photos
                    </span>
                  )}
                </div>

                <div className="card-info-body">
                  <span className="group-pill parties">{prod.category?.name || 'General Outfit'}</span>
                  <h4 className="outfit-title" title={prod.name}>{prod.name}</h4>

                  <div className="rates-row">
                    <div className="rate-col">
                      <span className="rate-lbl">Rental Rate</span>
                      <span className="op-balance-text">
                        ₹ {(prod.base_rent_price || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="rate-col deposit">
                      <span className="rate-lbl">Security Deposit</span>
                      <span className="op-balance-text">
                        ₹ {(prod.base_security_deposit || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {sizes.length > 0 && (
                    <div className="sizes-strip">
                      <span className="sizes-strip-label">Sizes:</span>
                      <div className="sizes-chips-wrap">
                        {sizes.map((sz, idx) => (
                          <span key={idx} className="group-pill bank-accounts">{sz}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="lookbook-actions-bar">
                    <button
                      type="button"
                      className="lookbook-pill-btn"
                      onClick={() => handleOpenGallery(prod, 0)}
                    >
                      <FiImage /> View Photos
                    </button>
                    <button
                      type="button"
                      className="lookbook-pill-btn whatsapp"
                      onClick={() => handleShareWhatsApp(prod)}
                      title="Share details via WhatsApp"
                    >
                      <FiShare2 /> WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Gallery Modal */}
      <ImageGalleryModal
        isOpen={galleryState.isOpen}
        onClose={() => setGalleryState((prev) => ({ ...prev, isOpen: false }))}
        images={galleryState.images}
        initialIndex={galleryState.initialIndex}
        title={galleryState.title}
      />
    </div>
  );
};

export default LookbookPage;
