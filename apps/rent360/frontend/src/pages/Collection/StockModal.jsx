import React, { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash2, FiBox, FiCheckCircle, FiClock, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import { getStoreSizes } from '../../constants/sizes';
import { Select } from '../../components/ui';

const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Available', colorClass: 'status-available' },
  { value: 'BOOKED', label: 'Booked', colorClass: 'status-booked' },
  { value: 'PICKED_UP', label: 'Picked Up', colorClass: 'status-picked' },
  { value: 'LAUNDRY', label: 'In Laundry', colorClass: 'status-laundry' },
  { value: 'DAMAGED', label: 'Damaged / Repair', colorClass: 'status-damaged' }
];

const StockModal = ({
  isOpen,
  onClose,
  product,
  onStockUpdated,
  token,
  storeId,
  limits
}) => {
  const masterSizes = getStoreSizes();
  const availableSizes = masterSizes.length > 0 ? masterSizes.map((s) => s.name) : ['36 (S)', '38 (M)', '40 (L)', '42 (XL)', '44 (XXL)', 'Free Size'];
  const defaultSize = availableSizes[0] || '38 (M)';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({
    size: defaultSize,
    color: '',
    sku_code: '',
    condition_notes: ''
  });

  useEffect(() => {
    if (product?.id && isOpen) {
      fetchItems();
      generateDefaultSku(defaultSize, '');
    }
  }, [product, isOpen]);

  const generateDefaultSku = (size, color) => {
    if (!product) return;
    const sizeShort = size.replace(/[^0-9A-Z]/gi, '').slice(0, 3) || 'STD';
    const colorShort = color ? color.replace(/[^A-Z]/gi, '').slice(0, 3).toUpperCase() : '';
    const randomSuffix = Math.floor(10 + Math.random() * 90);
    const suggested = `${product.product_code}-${sizeShort}${colorShort ? `-${colorShort}` : ''}-${randomSuffix}`;
    setNewItem((prev) => ({
      ...prev,
      size,
      color,
      sku_code: suggested
    }));
  };

  const fetchItems = async () => {
    if (!product?.id) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/productItems?productId=${product.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load physical stock items');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  const handleStatusChange = async (itemId, newStatus) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/productItems/${itemId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Item status updated to ${newStatus}`);
      setItems((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, status: newStatus } : it))
      );
      onStockUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update item status');
    }
  };

  const handleDeleteItem = async (itemId, skuCode) => {
    if (!window.confirm(`Delete item piece "${skuCode}"?`)) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/productItems/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Stock item deleted');
      setItems((prev) => prev.filter((it) => it.id !== itemId));
      onStockUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete item currently assigned to a booking');
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (!newItem.size.trim()) {
      toast.error('Size is required');
      return;
    }
    setAddingItem(true);
    try {
      const payload = {
        productId: product.id,
        size: newItem.size.trim(),
        color: newItem.color.trim() || undefined,
        sku_code: newItem.sku_code.trim().toUpperCase() || undefined,
        condition_notes: newItem.condition_notes.trim() || undefined
      };

      await axios.post(`${API_BASE_URL}/api/productItems`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Physical item added to stock');
      setNewItem({ size: '38 (M)', color: '', sku_code: '', condition_notes: '' });
      fetchItems();
      onStockUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add item. Check plan limits.');
    } finally {
      setAddingItem(false);
    }
  };

  const firstImage = Array.isArray(product.image_urls) && product.image_urls.length > 0
    ? product.image_urls[0]
    : null;

  return (
    <div className="collection-modal-overlay" onClick={onClose}>
      <div className="collection-modal-card stock-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header with Product Summary */}
        <div className="modal-header stock-modal-header">
          <div className="stock-product-summary">
            <div className="stock-product-thumb">
              {firstImage ? (
                <img src={firstImage} alt={product.name} />
              ) : (
                <div className="thumb-placeholder">
                  <FiBox />
                </div>
              )}
            </div>
            <div className="stock-product-details">
              <div className="stock-badges-row">
                <span className="code-pill">{product.product_code}</span>
                {product.category && (
                  <span className="category-pill">{product.category.name}</span>
                )}
                <span className="count-pill">{items.length} Units in Stock</span>
              </div>
              <h2 className="modal-title">{product.name}</h2>
              <p className="modal-subtitle">
                Base Rent: INR {product.base_rent_price?.toLocaleString('en-IN')} | Deposit: INR {product.base_security_deposit?.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          {/* Plan Limit notice */}
          {limits && (
            <div className={`plan-capacity-alert ${limits.allowed ? 'ok' : 'full'}`}>
              <div className="capacity-bar-wrap">
                <span className="capacity-text">
                  Store Capacity: {limits.currentItems} / {limits.maxItems} items used ({limits.planName} Plan)
                </span>
                <div className="capacity-progress">
                  <div
                    className="capacity-fill"
                    style={{
                      width: `${Math.min(100, (limits.currentItems / limits.maxItems) * 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Physical Items Table */}
          <div className="stock-table-container">
            <h3 className="section-label">Physical Pieces & Size Variants</h3>
            {loading ? (
              <div className="loading-state">Loading stock items...</div>
            ) : items.length === 0 ? (
              <div className="empty-stock-box">
                <p>No physical pieces registered for this design yet.</p>
                <span className="hint-text">Add your first size variant below to enable rental bookings.</span>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="stock-table">
                  <thead>
                    <tr>
                      <th>SKU Code</th>
                      <th>Size</th>
                      <th>Color</th>
                      <th>Status</th>
                      <th>Condition / Notes</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <span className="sku-mono">{item.sku_code}</span>
                        </td>
                        <td>
                          <span className="size-badge">{item.size || 'Standard'}</span>
                        </td>
                        <td>
                          <span className="color-text">{item.color || 'Default'}</span>
                        </td>
                        <td>
                          <select
                            className={`status-select ${item.status?.toLowerCase()}`}
                            value={item.status}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <span className="notes-text">{item.condition_notes || 'Good condition'}</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-icon-danger"
                            title="Delete piece"
                            onClick={() => handleDeleteItem(item.id, item.sku_code)}
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add New Piece Form */}
          <div className="add-piece-section">
            <h4 className="section-sublabel">+ Add New Physical Piece / SKU</h4>
            <form onSubmit={handleCreateItem} className="add-piece-form">
              <div className="piece-form-row">
                <div className="field-size">
                  <label>Size *</label>
                  <Select
                    value={newItem.size}
                    onChange={(e) => {
                      const sz = e.target.value;
                      generateDefaultSku(sz, newItem.color);
                    }}
                  >
                    {availableSizes.map((sz) => (
                      <option key={sz} value={sz}>
                        {sz}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="field-color">
                  <label>Color</label>
                  <input
                    type="text"
                    placeholder="e.g. Maroon & Gold"
                    value={newItem.color}
                    onChange={(e) => {
                      const clr = e.target.value;
                      generateDefaultSku(newItem.size, clr);
                    }}
                  />
                </div>

                <div className="field-sku">
                  <label>SKU Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SHW-001-38"
                    value={newItem.sku_code}
                    onChange={(e) => setNewItem({ ...newItem, sku_code: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="field-notes">
                  <label>Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Brand new arrival"
                    value={newItem.condition_notes}
                    onChange={(e) => setNewItem({ ...newItem, condition_notes: e.target.value })}
                  />
                </div>

                <div className="field-btn">
                  <button
                    type="submit"
                    className="btn-pill-primary"
                    disabled={addingItem}
                  >
                    {addingItem ? 'Adding...' : 'Add Piece'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-pill-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockModal;
