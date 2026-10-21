import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  FiSearch, FiX, FiMaximize2, FiMinimize2, 
  FiCamera, FiBox, FiCalendar, FiClock 
} from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { API_BASE_URL } from '../../config/api';
import './SearchProductModal.scss';

export const SearchProductModal = ({ isOpen, onClose }) => {
  const { token, user } = useSelector((state) => state.auth);
  const [codeQuery, setCodeQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCodeQuery('');
      setProductData(null);
      setShowAll(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!codeQuery.trim()) {
      toast.error('Please enter a product code');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/products/quick-lookup`, {
        params: { code: codeQuery.trim() },
        headers: { Authorization: `Bearer ${token}` }
      });
      setProductData(res.data.data);
    } catch (err) {
      setProductData(null);
      toast.error(err.response?.data?.message || 'No product found with this code');
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings based on showAll checkbox
  const rawBookings = productData?.bookings || [];
  const filteredBookings = showAll
    ? rawBookings
    : rawBookings.filter((b) => {
        const retDate = new Date(b.return_date);
        return retDate >= new Date() || b.status === 'UPCOMING' || b.status === 'PICKED_UP';
      });

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const modalContent = (
    <div className="search-prod-overlay" onClick={onClose}>
      <div 
        className={`search-prod-card ${isMaximized ? 'maximized' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="search-prod-header">
          <h2 className="title">Search Product</h2>
          <div className="actions">
            <button 
              type="button" 
              className="icon-btn" 
              onClick={() => setIsMaximized(!isMaximized)}
              title={isMaximized ? "Restore" : "Maximize"}
            >
              {isMaximized ? <FiMinimize2 /> : <FiMaximize2 />}
            </button>
            <button 
              type="button" 
              className="icon-btn close-btn" 
              onClick={onClose}
              title="Close"
            >
              <FiX />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="search-prod-body">
          {/* Top Code Input Bar */}
          <form className="code-search-bar" onSubmit={handleSearch}>
            <div className="input-group">
              <input
                type="text"
                placeholder="Code"
                value={codeQuery}
                onChange={(e) => setCodeQuery(e.target.value.toUpperCase())}
                autoFocus
              />
              <button 
                type="button" 
                className="cam-btn" 
                title="Scan Barcode"
              >
                <FiCamera />
              </button>
            </div>
            <button 
              type="submit" 
              className="btn-search-blue" 
              disabled={loading}
            >
              <FiSearch className="btn-icon" />
              <span>{loading ? 'Searching...' : 'Search'}</span>
            </button>
          </form>

          {/* Product Details & Image Layout */}
          <div className="prod-meta-layout">
            {/* Left Details Grid */}
            <div className="meta-left-col">
              <div className="meta-row">
                <span className="label">Name:</span>
                <span className="val bold">{productData?.name || 'N/A'}</span>
              </div>
              <div className="meta-row">
                <span className="label">Code:</span>
                <span className="val code-val">{productData?.product_code || 'N/A'}</span>
              </div>
              <div className="meta-row">
                <span className="label">Category:</span>
                <span className="val">{productData?.category_name || 'N/A'}</span>
              </div>
              <div className="meta-two-col">
                <div className="meta-row">
                  <span className="label">Qty:</span>
                  <span className="val bold">{productData ? productData.qty : 0}</span>
                </div>
                <div className="meta-row">
                  <span className="label">Rent:</span>
                  <span className="val price-val">
                    ₹{productData ? Number(productData.base_rent_price).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                  </span>
                </div>
              </div>
              <div className="meta-two-col">
                <div className="meta-row">
                  <span className="label">Color:</span>
                  <span className="val">{productData?.colors || 'N/A'}</span>
                </div>
                <div className="meta-row">
                  <span className="label">Size:</span>
                  <span className="val">{productData?.sizes || 'N/A'}</span>
                </div>
              </div>
              <div className="meta-row remarks-row">
                <span className="label">Remarks:</span>
                <span className="val muted">{productData?.remarks || 'N/A'}</span>
              </div>
            </div>

            {/* Right Photo Frame */}
            <div className="meta-right-col">
              <div className="photo-preview-box">
                {productData?.image_url ? (
                  <img src={productData.image_url} alt={productData.name} />
                ) : (
                  <div className="no-image-placeholder">
                    <FiBox className="no-img-icon" />
                    <span className="no-img-text">NO IMAGE AVAILABLE</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="filter-checkbox-bar">
            <label className="checkbox-wrap">
              <input 
                type="checkbox" 
                checked={showAll} 
                onChange={(e) => setShowAll(e.target.checked)} 
              />
              <span>Show All</span>
            </label>
          </div>

          {/* Bookings Table */}
          <div className="bookings-table-wrapper">
            <table className="bookings-table">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>Bill No.</th>
                  <th style={{ width: '22%' }}>Status</th>
                  <th style={{ width: '22%' }}>Delivery</th>
                  <th style={{ width: '22%' }}>Return</th>
                  <th style={{ width: '12%', textAlign: 'center' }}>Qty</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-row-cell">
                      No Record Found
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr key={b.id}>
                      <td className="bill-no-cell">
                        <span className="bill-pill">{b.bill_no}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${String(b.status).toLowerCase()}`}>
                          {b.status}
                        </span>
                      </td>
                      <td>
                        <span className="date-text">{formatDate(b.delivery)}</span>
                      </td>
                      <td>
                        <span className="date-text">{formatDate(b.return_date)}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="qty-pill">{b.qty || 1}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default SearchProductModal;
