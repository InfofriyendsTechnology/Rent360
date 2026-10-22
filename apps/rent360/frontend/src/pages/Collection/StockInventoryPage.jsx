import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { 
  FiSearch, FiLayers, FiCheckCircle, FiClock, 
  FiShoppingBag, FiTool, FiAlertOctagon, FiCopy, FiCheck, FiX, FiChevronDown
} from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import { DataTable, RowActions, Select } from '../../components/ui';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import '../Stores/StoresList.scss';
import '../Master/MasterPage.scss';
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
      toast.success('Piece status updated');
      setStatusModalOpen(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
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
      toast.success('Piece deleted from inventory');
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
        return <span className="status-pill completed">Available</span>;
      case 'BOOKED':
        return <span className="status-pill pending">Booked</span>;
      case 'RENTED':
        return <span className="group-pill parties">On Rent</span>;
      case 'DRY_CLEANING':
        return <span className="group-pill loans">Dry Cleaning</span>;
      case 'DAMAGED':
        return <span className="group-pill expenses">Damaged</span>;
      default:
        return <span className="status-pill pending">{s}</span>;
    }
  };

  const columns = useMemo(() => [
    {
      header: 'Barcode / SKU',
      accessor: 'sku_code',
      width: '26%',
      cell: (row) => (
        <div className="sku-cell">
          <span className="sku-code">{row.sku_code}</span>
          <button
            type="button"
            className="copy-sku-btn"
            onClick={() => handleCopySku(row.sku_code)}
            title="Copy Barcode SKU"
          >
            {copiedSku === row.sku_code ? <FiCheck className="copied" /> : <FiCopy />}
          </button>
        </div>
      )
    },
    {
      header: 'Outfit Design',
      accessor: 'product',
      width: '32%',
      cell: (row) => (
        <div className="account-name-cell">
          <span className="cell-strong">{row.product?.name || 'Unnamed Outfit'}</span>
          <span className="cell-code">{row.product?.product_code}</span>
        </div>
      )
    },
    {
      header: 'Size & Color',
      accessor: 'size',
      width: '18%',
      cell: (row) => (
        <div className="variant-cell">
          <span className="group-pill bank-accounts">{row.size || 'Free Size'}</span>
          {row.color && <span className="group-pill capital-account">{row.color}</span>}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      width: '14%',
      cell: (row) => (
        <div
          className="status-cell-wrap"
          onClick={() => handleOpenStatusModal(row)}
          title="Click to change status"
          style={{ cursor: 'pointer' }}
        >
          {getStatusBadge(row.status)}
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      align: 'right',
      width: '10%',
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
    <div className="stores-view master-page-view stock-inventory-view">
      {/* Top Bar matching Rent360 Master standard */}
      <div className="stores-top-bar">
        <div className="title-section">
          <h1 className="main-title">Barcode & Stock</h1>
          <p className="subtitle">Track physical rental garments, barcode SKUs, availability, and dry cleaning cycles</p>
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
        </div>
      </div>

      {/* KPI Metrics Summary Bar matching Bond CRM standard */}
      <div className="category-metrics-grid">
        <div className="metric-pill-card">
          <div className="metric-icon-wrap">
            <FiLayers />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Stock Pieces</span>
            <span className="metric-value">{stats.total}</span>
          </div>
        </div>

        <div className="metric-pill-card">
          <div className="metric-icon-wrap success">
            <FiCheckCircle />
          </div>
          <div className="metric-info">
            <span className="metric-label">Available for Rent</span>
            <span className="metric-value">{stats.available}</span>
          </div>
        </div>

        <div className="metric-pill-card">
          <div className="metric-icon-wrap accent">
            <FiShoppingBag />
          </div>
          <div className="metric-info">
            <span className="metric-label">Booked / Out on Rent</span>
            <span className="metric-value">{stats.bookedOrRented}</span>
          </div>
        </div>

        <div className="metric-pill-card">
          <div className="metric-icon-wrap warning">
            <FiClock />
          </div>
          <div className="metric-info">
            <span className="metric-label">In Dry Cleaning</span>
            <span className="metric-value">{stats.dryCleaning}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="setup-controls-bar">
        <div className="search-pill-wrapper">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by Barcode / SKU, Outfit name, or code..."
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

        <div className="controls-right-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="filter-select-wrap">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              size="md"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          </div>

          <div className="filter-select-wrap">
            <Select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              size="md"
            >
              <option value="ALL">All Sizes</option>
              <option value="36 (XS)">36 (XS)</option>
              <option value="38 (S)">38 (S)</option>
              <option value="40 (M)">40 (M)</option>
              <option value="42 (L)">42 (L)</option>
              <option value="44 (XL)">44 (XL)</option>
              <option value="46 (XXL)">46 (XXL)</option>
              <option value="Free Size">Free Size</option>
            </Select>
          </div>
        </div>
      </div>

      {/* DataTable in Bond Card Container */}
      <div className="bond-card-container">
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          keyExtractor={(row) => row.id}
          emptyTitle="No stock pieces found"
          emptyDescription="Add sizes and barcode pieces in the Outfits section to see inventory units here."
        />
      </div>

      {/* Edit Status Modal matching Master bond-modal standard */}
      {statusModalOpen && editingItem && (
        <div className="bond-modal-overlay" onClick={() => setStatusModalOpen(false)}>
          <div className="bond-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Update Piece Status</h2>
                <p>Manage barcode physical status and dry cleaning notes</p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setStatusModalOpen(false)}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} autoComplete="off">
              <div className="modal-body">
                <div className="piece-summary-banner">
                  <span className="cell-code banner-sku">{editingItem.sku_code}</span>
                  <span className="banner-collection">{editingItem.product?.name} ({editingItem.size || 'Free Size'})</span>
                </div>

                <div className="form-group">
                  <label>Current Status *</label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                    required
                  >
                    <option value="AVAILABLE">Available (In Store / Ready to Rent)</option>
                    <option value="BOOKED">Booked / Reserved for Customer</option>
                    <option value="RENTED">Out on Rent</option>
                    <option value="DRY_CLEANING">In Dry Cleaning / Laundry</option>
                    <option value="DAMAGED">Damaged / Under Repair</option>
                  </select>
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
