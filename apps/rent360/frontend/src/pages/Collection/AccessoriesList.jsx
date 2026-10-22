import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { FiPlus, FiSearch, FiSliders, FiEdit2, FiTrash2, FiBox, FiAlertTriangle } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import { DataTable, RowActions, Select } from '../../components/ui';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import '../Stores/StoresList.scss';
import './AccessoriesList.scss';

const ACCESSORY_TYPES = [
  { value: 'ALL', label: 'All Accessories' },
  { value: 'JEWELLERY', label: 'Jewellery' },
  { value: 'HEADWEAR', label: 'Headwear / Safa' },
  { value: 'FOOTWEAR', label: 'Footwear / Mojdi' },
  { value: 'BROOCH_MALA', label: 'Brooch & Mala' },
  { value: 'DUPATTA_BELT', label: 'Dupatta & Belt' },
  { value: 'OTHER', label: 'Other' },
];

const AccessoriesList = () => {
  const { user, token } = useSelector((state) => state.auth);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || !user?.role;
  const userStoreId = isSuperAdmin ? '' : (user?.store?.id || user?.storeId || '');

  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(() => (isSuperAdmin ? '' : userStoreId));

  const [accessories, setAccessories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    item_name: '',
    item_type: 'JEWELLERY',
    total_stock: 1,
    alert_limit: 1,
    storeId: ''
  });

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

  const fetchAccessories = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedStoreId) params.storeId = selectedStoreId;
      if (selectedType !== 'ALL') params.type = selectedType;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await axios.get(`${API_BASE_URL}/api/accessories`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setAccessories(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load accessories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAccessories();
    }
  }, [selectedStoreId, selectedType, searchQuery, token]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      item_name: '',
      item_type: 'JEWELLERY',
      total_stock: 1,
      alert_limit: 1,
      storeId: selectedStoreId || (stores[0]?.id || '')
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name || '',
      item_type: item.item_type || 'JEWELLERY',
      total_stock: item.total_stock ?? 1,
      alert_limit: item.alert_limit ?? 1,
      storeId: item.storeId || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.item_name.trim()) {
      toast.error('Please enter an item name');
      return;
    }

    try {
      const payload = {
        item_name: formData.item_name.trim(),
        item_type: formData.item_type,
        total_stock: Number(formData.total_stock || 0),
        alert_limit: Number(formData.alert_limit || 0),
        storeId: isSuperAdmin ? (formData.storeId || selectedStoreId) : (userStoreId || selectedStoreId)
      };

      if (editingItem) {
        await axios.put(`${API_BASE_URL}/api/accessories/${editingItem.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Accessory updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/api/accessories`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Accessory added successfully');
      }

      setIsModalOpen(false);
      fetchAccessories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save accessory');
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      setIsDeleting(true);
      await axios.delete(`${API_BASE_URL}/api/accessories/${itemToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Accessory deleted');
      setItemToDelete(null);
      fetchAccessories();
    } catch (err) {
      toast.error('Failed to delete accessory');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo(() => [
    {
      header: 'Accessory Name',
      accessor: 'item_name',
      width: '40%',
      cell: (row) => (
        <div className="accessory-name-cell">
          <span className="name-main">{row.item_name}</span>
        </div>
      )
    },
    {
      header: 'Category / Type',
      accessor: 'item_type',
      width: '25%',
      cell: (row) => {
        const typeObj = ACCESSORY_TYPES.find((t) => t.value === row.item_type) || { label: row.item_type };
        const cls = (row.item_type || 'other').toLowerCase().replace(/_/g, '-');
        return <span className={`acc-type-pill ${cls}`}>{typeObj.label}</span>;
      }
    },
    {
      header: 'Stock Quantity',
      accessor: 'total_stock',
      width: '20%',
      cell: (row) => {
        const isLow = row.total_stock <= row.alert_limit && row.total_stock > 0;
        const isOut = row.total_stock === 0;
        return (
          <div className="stock-cell">
            <span className={`stock-number ${isOut ? 'out' : isLow ? 'low' : 'ok'}`}>
              {row.total_stock} Units
            </span>
            {isLow && (
              <span className="low-stock-alert" title="Low stock alert">
                <FiAlertTriangle /> Low
              </span>
            )}
            {isOut && <span className="out-stock-alert">Out of Stock</span>}
          </div>
        );
      }
    },
    {
      header: 'Actions',
      accessor: 'actions',
      align: 'right',
      width: '15%',
      cell: (row) => (
        <RowActions
          onEdit={() => handleOpenEditModal(row)}
          onDelete={() => setItemToDelete(row)}
          deleteTitle={`Delete ${row.item_name}`}
        />
      )
    }
  ], []);

  return (
    <div className="stores-view accessories-view">
      <div className="view-header">
        <div>
          <h2>Accessories</h2>
          <p className="subtitle">Manage rental jewellery, royal safas, mojdis, dupattas, and matching add-ons</p>
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
          <button className="pill-btn-primary" onClick={handleOpenAddModal}>
            <FiPlus />
            <span>Add Accessory</span>
          </button>
        </div>
      </div>

      <div className="table-controls-bar">
        <div className="search-wrap">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search accessories by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="type-filter-group">
          <Select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            {ACCESSORY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={accessories}
        loading={loading}
        emptyStateTitle="No accessories found"
        emptyStateSubtitle="Add matching rental jewellery, safas, and stoles for your collection"
      />

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingItem ? 'Edit Accessory' : 'Add New Accessory'}</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {isSuperAdmin && !editingItem && (
                  <div className="form-group">
                    <label>Store *</label>
                    <Select
                      value={formData.storeId}
                      onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                      required
                    >
                      {stores.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </Select>
                  </div>
                )}

                <div className="form-group">
                  <label>Accessory Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kundan Necklace Set, Royal Silk Safa, Velvet Mojdi"
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Accessory Type *</label>
                  <Select
                    value={formData.item_type}
                    onChange={(e) => setFormData({ ...formData, item_type: e.target.value })}
                  >
                    {ACCESSORY_TYPES.filter((t) => t.value !== 'ALL').map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </Select>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Total Stock Quantity *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.total_stock}
                      onChange={(e) => setFormData({ ...formData, total_stock: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Alert Limit (Low Stock Warning)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.alert_limit}
                      onChange={(e) => setFormData({ ...formData, alert_limit: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="pill-btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="pill-btn-primary">
                  {editingItem ? 'Save Changes' : 'Create Accessory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <ConfirmModal
          isOpen={true}
          title="Delete Accessory"
          message={`Are you sure you want to delete "${itemToDelete.item_name}"? This action cannot be undone.`}
          confirmText={isDeleting ? 'Deleting...' : 'Delete Accessory'}
          onConfirm={handleDelete}
          onCancel={() => setItemToDelete(null)}
          isDanger={true}
        />
      )}
    </div>
  );
};

export default AccessoriesList;
