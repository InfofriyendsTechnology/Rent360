import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { 
  FiBox, FiPlus, FiSearch, FiGrid, FiList, 
  FiEdit2, FiTrash2, FiImage, FiX, FiChevronDown, FiShoppingBag 
} from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import { DataTable, RowActions } from '../../components/ui';
import ProductModal from './ProductModal';
import StockModal from './StockModal';
import ImageGalleryModal from './ImageGalleryModal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import '../Stores/StoresList.scss';
import './CollectionList.scss';

// Safe image fallback component to prevent broken image icons and text overlap
const ProductImageFallback = ({ src, alt, code, className = '', onClick }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div className={`product-fallback-box ${className}`} onClick={onClick}>
        <FiBox className="fallback-icon" />
        {code && <span className="fallback-code">{code}</span>}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || code || 'Design'}
      className={className}
      onError={() => setHasError(true)}
      onClick={onClick}
    />
  );
};

const CollectionList = () => {
  const { user, token } = useSelector((state) => state.auth);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || !user?.role;

  // Stores (for Super Admin selector)
  const userStoreId = user?.store?.id || user?.storeId || '';
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(userStoreId);

  // Main Data
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [limits, setLimits] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters & Controls
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState(localStorage.getItem('rent360_collection_view') || 'cards');

  const handleToggleViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('rent360_collection_view', mode);
  };

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState(null);

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState(null);

  const [galleryState, setGalleryState] = useState({
    isOpen: false,
    images: [],
    initialIndex: 0,
    title: ''
  });

  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch stores if Super Admin
  useEffect(() => {
    if (isSuperAdmin) {
      axios
        .get(`${API_BASE_URL}/api/stores`, { headers: { Authorization: `Bearer ${token}` } })
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

  // Fetch products, categories, and limits
  useEffect(() => {
    fetchData();
  }, [selectedStoreId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const storeParam = selectedStoreId ? `?storeId=${selectedStoreId}` : '';
      
      const [prodRes, catRes, limRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/products${storeParam}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/api/categories${storeParam}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/api/products/limits/summary${storeParam}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { data: null } }))
      ]);

      setProducts(prodRes.data.data || []);
      setCategories(catRes.data.data || []);
      setLimits(limRes.data.data || null);
    } catch (err) {
      toast.error('Failed to load collection data');
    } finally {
      setLoading(false);
    }
  };

  // Filter products locally for snappy UI response
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // Category filter
      if (selectedCategory !== 'ALL' && prod.categoryId !== selectedCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = prod.name?.toLowerCase().includes(q);
        const matchCode = prod.product_code?.toLowerCase().includes(q);
        const matchCategory = prod.category?.name?.toLowerCase().includes(q);
        const matchSku = prod.productItems?.some((item) =>
          item.sku_code?.toLowerCase().includes(q) || item.size?.toLowerCase().includes(q)
        );
        if (!matchName && !matchCode && !matchCategory && !matchSku) {
          return false;
        }
      }

      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  // Handlers
  const handleOpenAddProduct = () => {
    setSelectedProductForEdit(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod) => {
    setSelectedProductForEdit(prod);
    setIsProductModalOpen(true);
  };

  const handleOpenStockModal = (prod) => {
    setSelectedProductForStock(prod);
    setIsStockModalOpen(true);
  };

  const handleOpenGallery = (prod, initialIndex = 0) => {
    const imgs = Array.isArray(prod.image_urls) && prod.image_urls.length > 0
      ? prod.image_urls
      : [];
    if (!imgs.length) return;
    setGalleryState({
      isOpen: true,
      images: imgs,
      initialIndex,
      title: prod.name
    });
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${API_BASE_URL}/api/products/${productToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Design deleted from collection');
      setProductToDelete(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete design with active bookings');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper for stock status pill class
  const getItemStatusBadge = (item) => {
    const st = item.status?.toUpperCase();
    if (st === 'AVAILABLE') return 'status-avail';
    if (st === 'BOOKED') return 'status-booked';
    if (st === 'LAUNDRY') return 'status-laundry';
    if (st === 'DAMAGED') return 'status-damaged';
    return 'status-other';
  };

  return (
    <div className="stores-view collection-page-view">
      {/* Top Header Bar matching Bond CRM Header */}
      <div className="stores-top-bar">
        <div className="title-section">
          <h1 className="main-title">Collection & Inventory</h1>
          <p className="subtitle">
            Manage ethnic apparel designs, rental prices, security deposits, and individual physical size SKUs
          </p>
        </div>

        <div className="top-actions">
          {/* Super Admin Store Selector */}
          {isSuperAdmin && stores.length > 0 && (
            <div className="store-selector-pill">
              <FiShoppingBag className="store-pill-icon" />
              <label>Store:</label>
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name || s.store_name}
                  </option>
                ))}
              </select>
              <FiChevronDown className="chevron-icon" />
            </div>
          )}


          {/* View Mode Toggle: Cards vs Table */}
          <div className="view-mode-toggle" title="Switch layout">
            <button
              type="button"
              className={`view-btn ${viewMode === 'cards' || viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => handleToggleViewMode('cards')}
            >
              <FiGrid className="icon" />
              <span>Cards</span>
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

          <button
            type="button"
            className="pill-btn-primary"
            onClick={handleOpenAddProduct}
          >
            <FiPlus className="plus-icon" />
            <span>New Design</span>
          </button>
        </div>
      </div>

      {/* Category Pills Strip */}
      <div className="category-pills-strip">
        <button
          type="button"
          className={`cat-pill ${selectedCategory === 'ALL' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('ALL')}
        >
          <span>All Designs</span>
          <span className="pill-count">{products.length}</span>
        </button>
        {categories.map((cat) => {
          const count = cat._count?.products || 0;
          return (
            <button
              key={cat.id}
              type="button"
              className={`cat-pill ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span>{cat.name}</span>
              <span className="pill-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search Toolbar */}
      <div className="collection-controls-bar">
        <div className="search-pill-wrapper">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by design name, product code, or size..."
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
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="collection-loading-grid">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="collection-card-skeleton">
              <div className="skeleton-img" />
              <div className="skeleton-body">
                <div className="skeleton-line title" />
                <div className="skeleton-line text" />
                <div className="skeleton-line text short" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-collection-card">
          <div className="empty-icon-pill">
            <FiBox />
          </div>
          <h3 className="empty-title">No Designs Found</h3>
          <p className="empty-desc">
            {searchQuery || selectedCategory !== 'ALL'
              ? 'No collection designs match the selected filters. Try clearing your search.'
              : 'Start your rental catalog by registering your first design (e.g. Sherwani, Jodhpuri suit).'}
          </p>
          <div className="empty-actions">
            {searchQuery || selectedCategory !== 'ALL' ? (
              <button
                type="button"
                className="pill-filter"
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSearchQuery('');
                }}
                style={{ cursor: 'pointer' }}
              >
                Reset Filters
              </button>
            ) : (
              <button
                type="button"
                className="pill-btn-primary"
                onClick={handleOpenAddProduct}
              >
                <FiPlus className="plus-icon" />
                <span>Add First Design</span>
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW USING COMMON DataTable COMPONENT */
        <div className="bond-card-container">
          <DataTable
            columns={[
              { label: 'Design / Code' },
              { label: 'Category' },
              { label: 'Rent Rate' },
              { label: 'Security Deposit' },
              { label: 'Stock Units' },
              { label: 'Sizes & Status' },
              { label: 'Actions', align: 'right' }
            ]}
            data={filteredProducts}
            loading={loading}
            emptyMessage="No designs found in collection."
            keyExtractor={(prod) => prod.id}
            renderRow={(prod) => {
              const images = Array.isArray(prod.image_urls) ? prod.image_urls : [];
              const firstImg = images.length > 0 ? images[0] : null;
              const items = prod.productItems || [];
              const availableCount = items.filter((it) => it.status === 'AVAILABLE').length;

              return (
                <>
                  <td>
                    <div className="table-product-cell">
                      <div
                        className="table-thumb"
                        onClick={() => images.length > 0 && handleOpenGallery(prod, 0)}
                        style={{ cursor: images.length > 0 ? 'pointer' : 'default' }}
                      >
                        <ProductImageFallback
                          src={firstImg}
                          alt={prod.name}
                          code={prod.product_code}
                          className="thumb-image"
                        />
                      </div>
                      <div className="table-name-wrap">
                        <span className="table-product-code">{prod.product_code}</span>
                        <strong className="table-product-name" title={prod.name}>
                          {prod.name}
                        </strong>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className="category-pill-tag clickable"
                      onClick={() => prod.categoryId && setSelectedCategory(prod.categoryId)}
                      title={`Filter by ${prod.category?.name || 'Category'}`}
                    >
                      {prod.category?.name || 'Standard'}
                    </span>
                  </td>
                  <td>
                    <span className="table-price">
                      INR {prod.base_rent_price?.toLocaleString('en-IN')}
                      <span className="per-day-muted"> / day</span>
                    </span>
                  </td>
                  <td>
                    <span className="table-price-muted">
                      INR {prod.base_security_deposit?.toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="table-stock-pill-btn"
                      onClick={() => handleOpenStockModal(prod)}
                      title="Click to manage stock items"
                    >
                      <FiBox className="stock-icon" />
                      <span className="stock-count">{items.length} Units</span>
                      <span className="stock-avail">({availableCount} avail)</span>
                    </button>
                  </td>
                  <td>
                    <div className="table-sizes-list">
                      {items.slice(0, 4).map((it) => (
                        <span key={it.id} className={`size-chip-mini ${getItemStatusBadge(it)}`}>
                          {it.size || 'STD'}
                        </span>
                      ))}
                      {items.length > 4 && (
                        <span className="size-more-mini">+{items.length - 4}</span>
                      )}
                      {items.length === 0 && <span className="muted-text">0 units</span>}
                    </div>
                  </td>
                  <td className="text-right">
                    <RowActions
                      actions={[
                        {
                          icon: FiBox,
                          variant: 'default',
                          title: 'Manage Stock Units',
                          onClick: () => handleOpenStockModal(prod)
                        },
                        {
                          icon: FiEdit2,
                          variant: 'edit',
                          title: 'Edit Design',
                          onClick: () => handleOpenEditProduct(prod)
                        },
                        {
                          icon: FiTrash2,
                          variant: 'delete',
                          title: 'Delete Design',
                          onClick: () => setProductToDelete(prod)
                        }
                      ]}
                    />
                  </td>
                </>
              );
            }}
          />
        </div>
      ) : (
        /* CARD VIEW (GRID) */
        <div className="collection-grid-container">
          {filteredProducts.map((prod) => {
            const images = Array.isArray(prod.image_urls) ? prod.image_urls : [];
            const firstImg = images.length > 0 ? images[0] : null;
            const items = prod.productItems || [];
            const availableCount = items.filter((it) => it.status === 'AVAILABLE').length;

            return (
              <div key={prod.id} className="design-product-card">
                {/* Photo Header */}
                <div
                  className="card-media-wrap"
                  onClick={() => images.length > 0 && handleOpenGallery(prod, 0)}
                  style={{ cursor: images.length > 0 ? 'pointer' : 'default' }}
                >
                  <ProductImageFallback
                    src={firstImg}
                    alt={prod.name}
                    code={prod.product_code}
                    className="card-photo"
                  />

                  {/* Overlays */}
                  <div className="media-overlay-top">
                    <span className="code-badge">{prod.product_code}</span>
                    {images.length > 1 && (
                      <span className="photo-count-badge">
                        <FiImage /> {images.length} Photos
                      </span>
                    )}
                  </div>

                  <div className="media-overlay-bottom">
                    {prod.category && (
                      <span
                        className="category-tag clickable"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCategory(prod.categoryId);
                        }}
                        title={`Filter by ${prod.category.name}`}
                      >
                        {prod.category.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="card-content-wrap">
                  <h3 className="design-name" title={prod.name}>
                    {prod.name}
                  </h3>

                  {/* Pricing Row */}
                  <div className="pricing-strip">
                    <div className="price-item">
                      <span className="price-label">Rent</span>
                      <span className="price-val">INR {prod.base_rent_price?.toLocaleString('en-IN')}</span>
                      <span className="price-sub">/ day</span>
                    </div>
                    <div className="price-divider" />
                    <div className="price-item">
                      <span className="price-label">Deposit</span>
                      <span className="price-val">INR {prod.base_security_deposit?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Physical Stock Variants */}
                  <div className="stock-breakdown-section">
                    <div className="stock-header">
                      <span className="stock-title">Physical Stock</span>
                      <span className={`stock-status-pill ${availableCount > 0 ? 'available' : 'booked'}`}>
                        {availableCount} of {items.length} Avail
                      </span>
                    </div>

                    {items.length > 0 ? (
                      <div className="size-chips-wrap">
                        {items.slice(0, 4).map((it) => (
                          <span key={it.id} className={`size-chip ${getItemStatusBadge(it)}`}>
                            {it.size || 'STD'}
                          </span>
                        ))}
                        {items.length > 4 && (
                          <span className="size-chip-more">+{items.length - 4} more</span>
                        )}
                      </div>
                    ) : (
                      <p className="no-items-hint">No physical pieces registered</p>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="card-footer-actions">
                  <button
                    type="button"
                    className="action-stock-btn"
                    onClick={() => handleOpenStockModal(prod)}
                  >
                    <FiBox />
                    <span>Manage Stock ({items.length})</span>
                  </button>

                  <div className="quick-action-btns">
                    <RowActions
                      actions={[
                        {
                          icon: FiEdit2,
                          variant: 'edit',
                          title: 'Edit Design',
                          onClick: () => handleOpenEditProduct(prod)
                        },
                        {
                          icon: FiTrash2,
                          variant: 'delete',
                          title: 'Delete Design',
                          onClick: () => setProductToDelete(prod)
                        }
                      ]}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={selectedProductForEdit}
        categories={categories}
        onProductSaved={fetchData}
        token={token}
        storeId={selectedStoreId}
      />

      <StockModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        product={selectedProductForStock}
        onStockUpdated={fetchData}
        token={token}
        storeId={selectedStoreId}
        limits={limits}
      />

      <ImageGalleryModal
        isOpen={galleryState.isOpen}
        onClose={() => setGalleryState({ ...galleryState, isOpen: false })}
        images={galleryState.images}
        initialIndex={galleryState.initialIndex}
        title={galleryState.title}
      />

      <ConfirmModal
        isOpen={Boolean(productToDelete)}
        title="Delete Design"
        message={`Are you sure you want to remove design "${productToDelete?.name}" (${productToDelete?.product_code}) from your collection? This will also remove its physical items.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Design'}
        cancelText="Cancel"
        onConfirm={handleDeleteProduct}
        onCancel={() => setProductToDelete(null)}
        isDestructive={true}
      />
    </div>
  );
};

export default CollectionList;
