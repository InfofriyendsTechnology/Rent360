import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { 
  FiBox, FiPlus, FiSearch, FiFilter, FiGrid, FiList, 
  FiEdit2, FiTrash2, FiLayers, FiImage, FiExternalLink, 
  FiCheckCircle, FiClock, FiAlertTriangle, FiRefreshCw, FiChevronRight 
} from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import ProductModal from './ProductModal';
import StockModal from './StockModal';
import CategoryModal from './CategoryModal';
import ImageGalleryModal from './ImageGalleryModal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import './CollectionList.scss';

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
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState(null);

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

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

      // Status filter
      if (statusFilter !== 'ALL') {
        const hasItemWithStatus = prod.productItems?.some(
          (item) => item.status?.toUpperCase() === statusFilter.toUpperCase()
        );
        if (!hasItemWithStatus) return false;
      }

      return true;
    });
  }, [products, selectedCategory, searchQuery, statusFilter]);

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
    <div className="collection-page-view">
      {/* Top Header Bar */}
      <div className="collection-top-bar">
        <div className="title-area">
          <div className="title-row">
            <h1 className="main-heading">Collection & Inventory</h1>
            {limits && (
              <div className="plan-usage-pill">
                <span className="dot" />
                <span className="usage-text">
                  {limits.currentItems} / {limits.maxItems} Items Used
                </span>
                <span className="plan-tag">{limits.planName}</span>
              </div>
            )}
          </div>
          <p className="sub-heading">
            Manage ethnic apparel designs, rental prices, security deposits, and individual physical size SKUs
          </p>
        </div>

        <div className="top-actions-wrap">
          {/* Super Admin Store Selector */}
          {isSuperAdmin && stores.length > 0 && (
            <div className="store-selector-pill">
              <label>Store:</label>
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            className="btn-pill-outline"
            onClick={() => setIsCategoryModalOpen(true)}
          >
            <FiLayers />
            <span>Categories</span>
          </button>

          <button
            type="button"
            className="btn-pill-primary"
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
          All Designs ({products.length})
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
        <button
          type="button"
          className="cat-pill new-cat-pill"
          onClick={() => setIsCategoryModalOpen(true)}
          title="Create New Category"
        >
          <FiPlus className="plus-icon" />
          <span>New Category</span>
        </button>
      </div>

      {/* Search, Status & View Controls Bar */}
      <div className="collection-controls-bar">
        <div className="search-field-pill">
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
              &times;
            </button>
          )}
        </div>

        <div className="controls-right-group">
          <div className="status-filter-wrapper">
            <FiFilter className="filter-icon" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Item Statuses</option>
              <option value="AVAILABLE">Available Now</option>
              <option value="BOOKED">Booked Units</option>
              <option value="LAUNDRY">In Laundry</option>
              <option value="DAMAGED">Damaged / Repair</option>
            </select>
          </div>

          <div className="view-mode-toggle">
            <button
              type="button"
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
              aria-label="Grid View"
            >
              <FiGrid />
            </button>
            <button
              type="button"
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
              aria-label="Table View"
            >
              <FiList />
            </button>
          </div>
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
            {searchQuery || selectedCategory !== 'ALL' || statusFilter !== 'ALL'
              ? 'No collection designs match the selected filters. Try clearing your search.'
              : 'Start your rental catalog by registering your first design (e.g. Sherwani, Jodhpuri suit).'}
          </p>
          <div className="empty-actions">
            {searchQuery || selectedCategory !== 'ALL' || statusFilter !== 'ALL' ? (
              <button
                type="button"
                className="btn-pill-secondary"
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
              >
                Reset All Filters
              </button>
            ) : (
              <button
                type="button"
                className="btn-pill-primary"
                onClick={handleOpenAddProduct}
              >
                <FiPlus />
                <span>Add First Design</span>
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
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
                  {firstImg ? (
                    <img src={firstImg} alt={prod.name} className="card-photo" />
                  ) : (
                    <div className="card-photo-placeholder">
                      <FiImage />
                      <span>No Photos</span>
                    </div>
                  )}

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
                    <button
                      type="button"
                      className="icon-btn-edit"
                      onClick={() => handleOpenEditProduct(prod)}
                      title="Edit Design"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      type="button"
                      className="icon-btn-delete"
                      onClick={() => setProductToDelete(prod)}
                      title="Delete Design"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="collection-table-card">
          <div className="table-responsive">
            <table className="collection-main-table">
              <thead>
                <tr>
                  <th>Design / Code</th>
                  <th>Category</th>
                  <th>Rent Rate</th>
                  <th>Security Deposit</th>
                  <th>Stock Units</th>
                  <th>Sizes & Availability</th>
                  <th className="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((prod) => {
                  const images = Array.isArray(prod.image_urls) ? prod.image_urls : [];
                  const firstImg = images.length > 0 ? images[0] : null;
                  const items = prod.productItems || [];
                  const availableCount = items.filter((it) => it.status === 'AVAILABLE').length;

                  return (
                    <tr key={prod.id}>
                      <td>
                        <div className="table-product-cell">
                          <div
                            className="table-thumb"
                            onClick={() => images.length > 0 && handleOpenGallery(prod, 0)}
                          >
                            {firstImg ? (
                              <img src={firstImg} alt={prod.name} />
                            ) : (
                              <div className="thumb-none">
                                <FiBox />
                              </div>
                            )}
                          </div>
                          <div className="table-name-wrap">
                            <span className="table-product-code">{prod.product_code}</span>
                            <strong className="table-product-name">{prod.name}</strong>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className="category-pill clickable"
                          onClick={() => prod.categoryId && setSelectedCategory(prod.categoryId)}
                          title={`Filter by ${prod.category?.name}`}
                        >
                          {prod.category?.name || 'Standard'}
                        </span>
                      </td>
                      <td>
                        <span className="table-price">INR {prod.base_rent_price?.toLocaleString('en-IN')}</span>
                      </td>
                      <td>
                        <span className="table-price-muted">INR {prod.base_security_deposit?.toLocaleString('en-IN')}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="table-stock-pill-btn"
                          onClick={() => handleOpenStockModal(prod)}
                        >
                          <span className="stock-count">{items.length} Units</span>
                          <span className="stock-avail">({availableCount} avail)</span>
                        </button>
                      </td>
                      <td>
                        <div className="table-sizes-list">
                          {items.map((it) => (
                            <span key={it.id} className={`size-chip-mini ${getItemStatusBadge(it)}`}>
                              {it.size} ({it.status.slice(0, 4)})
                            </span>
                          ))}
                          {items.length === 0 && <span className="muted-text">0 items</span>}
                        </div>
                      </td>
                      <td className="td-actions">
                        <div className="row-actions-group">
                          <button
                            type="button"
                            className="btn-table-action"
                            onClick={() => handleOpenStockModal(prod)}
                            title="Manage Physical Stock"
                          >
                            <FiBox />
                          </button>
                          <button
                            type="button"
                            className="btn-table-action"
                            onClick={() => handleOpenEditProduct(prod)}
                            title="Edit Design"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            type="button"
                            className="btn-table-action delete"
                            onClick={() => setProductToDelete(prod)}
                            title="Delete Design"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={selectedProductForEdit}
        categories={categories}
        onProductSaved={fetchData}
        onCategoryCreated={(newCat) => {
          setCategories((prev) => {
            if (prev.some((c) => c.id === newCat.id)) return prev;
            return [...prev, { ...newCat, _count: { products: 0 } }];
          });
        }}
        token={token}
        storeId={selectedStoreId}
        onOpenCategoryModal={() => {
          setIsCategoryModalOpen(true);
        }}
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

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onCategoryUpdated={fetchData}
        token={token}
        storeId={selectedStoreId}
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
