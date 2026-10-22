import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { 
  FiSearch, FiShare2, FiImage, FiCopy, FiCheck, 
  FiShoppingBag, FiTag, FiDollarSign, FiShield, FiSliders 
} from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import { Select } from '../../components/ui';
import ImageGalleryModal from './ImageGalleryModal';
import '../Stores/StoresList.scss';
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
    <div className="stores-view lookbook-view">
      <div className="view-header">
        <div>
          <h2>Digital Lookbook</h2>
          <p className="subtitle">Visual catalogue of designer apparel, bridal wear, and sherwanis for customer showcases</p>
        </div>
        <div className="header-actions">
          {isSuperAdmin && stores.length > 0 && (
            <div className="store-selector-wrap">
              <Select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="store-select"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </div>
          )}
          <button className="pill-btn-secondary" onClick={handleCopyLink}>
            <FiShare2 />
            <span>Share Catalogue</span>
          </button>
        </div>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="lookbook-controls">
        <div className="category-pills-bar">
          <button
            type="button"
            className={`cat-pill ${selectedCategory === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('ALL')}
          >
            All Collection ({products.length})
          </button>
          {categories.map((cat) => {
            const count = products.filter((p) => p.categoryId === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                className={`cat-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        <div className="search-wrap">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by collection name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="lookbook-loading">Loading lookbook designs...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state-wrap">
          <FiShoppingBag className="empty-icon" />
          <h3>No designs found in this category</h3>
          <p>Add new designs in the Collection section to populate the lookbook</p>
        </div>
      ) : (
        <div className="lookbook-grid">
          {filteredProducts.map((prod) => {
            const images = Array.isArray(prod.image_urls) ? prod.image_urls : [];
            const coverImage = images[0] || '';
            const sizes = Array.isArray(prod.productItems)
              ? Array.from(new Set(prod.productItems.map((i) => i.size).filter(Boolean)))
              : [];

            return (
              <div key={prod.id} className="lookbook-card">
                <div 
                  className="card-media"
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
                  <div className="code-badge">{prod.product_code}</div>
                  {images.length > 1 && (
                    <div className="gallery-counter">
                      +{images.length} Photos
                    </div>
                  )}
                </div>

                <div className="card-content">
                  <div className="cat-name">{prod.category?.name || 'Collection'}</div>
                  <h4 className="collection-title" title={prod.name}>{prod.name}</h4>

                  <div className="pricing-box">
                    <div className="price-col">
                      <span className="price-label">Rental Price</span>
                      <span className="price-value">
                        ₹{(prod.base_rent_price || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="price-col deposit">
                      <span className="price-label">Deposit</span>
                      <span className="price-value">
                        ₹{(prod.base_security_deposit || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {sizes.length > 0 && (
                    <div className="sizes-row">
                      <span className="sizes-label">Sizes:</span>
                      <div className="sizes-chips">
                        {sizes.map((sz, idx) => (
                          <span key={idx} className="size-chip">{sz}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="card-actions">
                    <button
                      type="button"
                      className="view-gallery-btn"
                      onClick={() => handleOpenGallery(prod, 0)}
                    >
                      <FiImage /> View Photos
                    </button>
                    <button
                      type="button"
                      className="whatsapp-btn"
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
