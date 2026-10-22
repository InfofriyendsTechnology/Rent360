import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { 
  FiSearch, FiLayers, FiCheckCircle, FiClock, 
  FiShoppingBag, FiTool, FiAlertOctagon, FiCopy, FiCheck, FiEdit2, FiTrash2 
} from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import { DataTable, RowActions, Select } from '../../components/ui';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import '../Stores/StoresList.scss';
import './StockInventoryPage.scss';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'AVAILABLE', label: 'Available for Rent' },
  { value: 'BOOKED', label: 'Reserved / Booked' },
  { value: 'RENTED', label: 'Out on Rent' },
  { value: 'DRY_CLEANING', label: 'In Dry Cleaning / Laundry' },
  { value: 'DAMAGED', label: 'Damaged / In Repair' },
];

const StockInventoryPage = () => {
  const { user, token } = useSelector((state) => state.auth);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || !user?.role;
  const userStoreId = isSuperAdmin ? '' : (user?.store?.id || user?.storeId || '');

  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(() => (isSuperAdmin ? '' : userStoreId));

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sizeFilter, setSizeFilter] = useState('ALL');

  // Copy state
  const [copiedSku, setCopiedSku] = useState(null);

  // Edit Status Modal
  const [editingItem, setEditingItem] = useState(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState('AVAILABLE');
  const [modalCondition, setModalCondition] = useState('');
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  // Delete modal
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedStoreId) params.storeId = selectedStoreId;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (sizeFilter !== 'ALL') params.size = sizeFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await axios.get(`${API_BASE_URL}/api/productItems`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setItems(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load stock items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchItems();
    }
  }, [selectedStoreId, statusFilter, sizeFilter, searchQuery, token]);

  // Summary counts
  const stats = useMemo(() => {
    const total = items.length;
    let available = 0;
    let bookedOrRented = 0;
    let dryCleaning = 0;
    let damaged = 0;

    items.forEach((it) => {
      const s = (it.status || '').toUpperCase();
      if (s === 'AVAILABLE') available++;
      else if (s === 'BOOKED' || s === 'RENTED') bookedOrRented++;
      else if (s === 'DRY_CLEANING') dryCleaning++;
      else if (s === 'DAMAGED') damaged++;
    });

    return { total, available, bookedOrRented, dryCleaning, damaged };
  }, [items]);

  const handleCopySku = (sku) => {
    navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    toast.success(`Copied barcode: ${sku}`);
    setTimeout(() => setCopiedSku(null), 2000);
  };

  const handleOpenStatusModal = (item) => {
    setEditingItem(item);
    setModalStatus(item.status || 'AVAILABLE');
    setModalCondition(item.condition_notes || '');
    setStatusModalOpen(true);
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setIsSavingStatus(true);
      await axios.put(
        `${API_BASE_URL}/api/productItems/${editingItem.id}`,
        {
          status: modalStatus,
          condition_notes: modalCondition
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Stock item updated successfully');
      setStatusModalOpen(false);
      setEditingItem(null);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update stock item');
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      setIsDeleting(true);
      await axios.delete(`${API_BASE_URL}/api/productItems/${itemToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Stock piece removed');
      setItemToDelete(null);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete piece');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || 'AVAILABLE').toUpperCase();
    switch (s) {
      case 'AVAILABLE':
        return <span className="status-pill available">Available</span>;
      case 'BOOKED':
        return <span className="status-pill booked">Reserved</span>;
      case 'RENTED':
        return <span className="status-pill rented">Out on Rent</span>;
      case 'DRY_CLEANING':
        return <span className="status-pill laundry">Dry Cleaning</span>;
      case 'DAMAGED':
        return <span className="status-pill damaged">Damaged</span>;
      default:
        return <span className="status-pill available">{s}</span>;
    }
  };

  const columns = useMemo(() => [
    {
      header: 'Barcode / SKU',
      accessor: 'sku_code',
      width: '20%',
      cell: (row) => (
        <div className="sku-cell">
          <span className="sku-code">{row.sku_code}</span>
          <button
            type="button"
            className="copy-btn"
            title="Copy SKU / Barcode"
            onClick={() => handleCopySku(row.sku_code)}
          >
            {copiedSku === row.sku_code ? <FiCheck className="text-green" /> : <FiCopy />}
          </button>
        </div>
      )
    },
    {
      header: 'Outfit / Design',
      accessor: 'product',
      width: '30%',
      cell: (row) => {
        const prod = row.product || {};
        const images = Array.isArray(prod.image_urls) ? prod.image_urls : [];
        const thumb = images[0] || '';
        return (
          <div className="product-summary-cell">
            {thumb ? (
              <img src={thumb} alt={prod.name} className="product-thumb" />
            ) : (
              <div className="thumb-placeholder">{prod.name ? prod.name.charAt(0) : 'P'}</div>
            )}
            <div className="prod-meta">
              <span className="prod-name">{prod.name || 'Unnamed Design'}</span>
              <span className="prod-code">{prod.product_code || '—'}</span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Size & Color',
      accessor: 'size',
      width: '18%',
      cell: (row) => (
        <div className="variant-cell">
          <span className="size-badge">{row.size || 'Free Size'}</span>
          {row.color && <span className="color-badge">{row.color}</span>}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      width: '18%',
      cell: (row) => (
        <div className="status-cell-wrap" onClick={() => handleOpenStatusModal(row)} title="Click to change status">
          {getStatusBadge(row.status)}
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      align: 'right',
      width: '14%',
      cell: (row) => (
        <RowActions
          onEdit={() => handleOpenStatusModal(row)}
          onDelete={() => setItemToDelete(row)}
          deleteTitle={`Delete SKU ${row.sku_code}`}
        />
      )
    }
  ], [copiedSku]);

  return (
    <div className="stores-view stock-inventory-view">
      <div className="view-header">
        <div>
          <h2>Barcode & Stock Items</h2>
          <p className="subtitle">Track physical rental garments, barcode SKUs, availability, and dry cleaning cycles</p>
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
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="stock-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon total"><FiLayers /></div>
          <div className="kpi-details">
            <span className="kpi-title">Total Pieces</span>
            <span className="kpi-value">{stats.total}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon available"><FiCheckCircle /></div>
          <div className="kpi-details">
            <span className="kpi-title">Available</span>
            <span className="kpi-value">{stats.available}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon rented"><FiShoppingBag /></div>
          <div className="kpi-details">
            <span className="kpi-title">Booked / Out</span>
            <span className="kpi-value">{stats.bookedOrRented}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon laundry"><FiClock /></div>
          <div className="kpi-details">
            <span className="kpi-title">Dry Cleaning</span>
            <span className="kpi-value">{stats.dryCleaning}</span>
          </div>
        </div>
      </div>

      {/* Table Filters */}
      <div className="table-controls-bar">
        <div className="search-wrap">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by Barcode / SKU, Outfit name, or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filters-group">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>

          <Select
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value)}
          >
            <option value="ALL">All Sizes</option>
            <option value="XS">XS</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
            <option value="XXL">XXL</option>
            <option value="Free Size">Free Size</option>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        emptyStateTitle="No stock pieces found"
        emptyStateSubtitle="Add sizes and barcode pieces in the Outfits section to see inventory units here"
      />

      {/* Edit Status Modal */}
      {statusModalOpen && editingItem && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Update Piece Status</h3>
              <button className="close-btn" onClick={() => setStatusModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSaveStatus}>
              <div className="modal-body">
                <div className="piece-summary-banner">
                  <span className="banner-sku">{editingItem.sku_code}</span>
                  <span className="banner-collection">{editingItem.product?.name} ({editingItem.size})</span>
                </div>

                <div className="form-group">
                  <label>Current Status *</label>
                  <Select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                    required
                  >
                    <option value="AVAILABLE">Available (In Store / Ready to Rent)</option>
                    <option value="BOOKED">Booked / Reserved for Customer</option>
                    <option value="RENTED">Out on Rent</option>
                    <option value="DRY_CLEANING">In Dry Cleaning / Laundry</option>
                    <option value="DAMAGED">Damaged / Under Repair</option>
                  </Select>
                </div>

                <div className="form-group">
                  <label>Condition Notes</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Minor embroidery loose on collar, dry cleaned on 15 Oct..."
                    value={modalCondition}
                    onChange={(e) => setModalCondition(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="pill-btn-secondary"
                  onClick={() => setStatusModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pill-btn-primary"
                  disabled={isSavingStatus}
                >
                  {isSavingStatus ? 'Updating...' : 'Save Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Item Modal */}
      {itemToDelete && (
        <ConfirmModal
          isOpen={true}
          title="Delete Stock Piece"
          message={`Are you sure you want to delete barcode "${itemToDelete.sku_code}"? This will remove this physical piece from available inventory.`}
          confirmText={isDeleting ? 'Deleting...' : 'Delete Piece'}
          onConfirm={handleDeleteItem}
          onCancel={() => setItemToDelete(null)}
          isDanger={true}
        />
      )}
    </div>
  );
};

export default StockInventoryPage;
