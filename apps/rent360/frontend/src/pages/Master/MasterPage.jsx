import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FiMaximize2, FiDroplet, FiClock, FiBell, FiBookOpen, FiShield, 
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiLayers, FiUsers, FiX, FiCheck
} from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { DataTable, RowActions } from '../../components/ui';

import '../Stores/StoresList.scss';
import './MasterPage.scss';

const MASTER_TABS = [
  { id: 'sizes', label: 'Sizes', icon: FiMaximize2, path: '/sizes' },
  { id: 'colors', label: 'Colors', icon: FiDroplet, path: '/colors' },
  { id: 'time-slots', label: 'Time Slots', icon: FiClock, path: '/time-slots' },
  { id: 'reminders', label: 'Reminders', icon: FiBell, path: '/reminders' },
  { id: 'accounts', label: 'Accounts', icon: FiBookOpen, path: '/accounts' },
  { id: 'security-accounts', label: 'Security Accounts', icon: FiShield, path: '/security-accounts' },
  { id: 'categories', label: 'Categories', icon: FiLayers, path: '/categories' },
  { id: 'users', label: 'Users', icon: FiUsers, path: '/users' }
];

const MasterPage = ({ defaultTab = 'sizes' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || !user?.role;
  const userStoreId = user?.store?.id || user?.storeId || '';

  // Current tab from URL query or prop
  const currentTab = searchParams.get('tab') || defaultTab;

  // Stores list for super admin
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(userStoreId);

  // Data & loading
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    sort_order: 0,
    hex_code: '#2563EB',
    start_time: '',
    end_time: '',
    title: '',
    description: '',
    reminder_date: '',
    status: 'PENDING',
    category_type: 'INCOME',
    account_name: '',
    account_number: '',
    ifsc_code: ''
  });

  // Fetch Stores for Super Admin
  useEffect(() => {
    if (isSuperAdmin && token) {
      axios
        .get(`${API_BASE_URL}/api/stores`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => {
          const list = res.data.data || [];
          setStores(list);
          if (list.length > 0 && !selectedStoreId) {
            setSelectedStoreId(userStoreId || list[0].id);
          }
        })
        .catch(() => {});
    } else if (userStoreId) {
      setSelectedStoreId(userStoreId);
    }
  }, [isSuperAdmin, userStoreId, token]);

  // Tab switch handler
  const handleTabChange = (tabId) => {
    if (tabId === 'categories') {
      navigate('/categories');
      return;
    }
    if (tabId === 'users') {
      navigate('/users');
      return;
    }
    setSearchParams({ tab: tabId });
    setSearchQuery('');
  };

  // Determine API endpoint based on active tab
  const getApiEndpoint = () => {
    switch (currentTab) {
      case 'sizes': return `${API_BASE_URL}/api/sizes`;
      case 'colors': return `${API_BASE_URL}/api/colors`;
      case 'time-slots': return `${API_BASE_URL}/api/timeSlots`;
      case 'reminders': return `${API_BASE_URL}/api/reminders`;
      case 'accounts': return `${API_BASE_URL}/api/transactionCategorys`;
      case 'security-accounts': return `${API_BASE_URL}/api/storeBankAccounts`;
      default: return `${API_BASE_URL}/api/sizes`;
    }
  };

  // Fetch Items
  const fetchItems = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const endpoint = getApiEndpoint();
      const params = new URLSearchParams();
      if (selectedStoreId) params.append('storeId', selectedStoreId);
      if (searchQuery) params.append('search', searchQuery);

      const url = `${endpoint}?${params.toString()}`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(res.data.data || []);
    } catch (err) {
      toast.error(`Failed to load ${currentTab} data`);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [currentTab, selectedStoreId, token]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      code: '',
      sort_order: items.length + 1,
      hex_code: '#2563EB',
      start_time: '10:00 AM',
      end_time: '01:00 PM',
      title: '',
      description: '',
      reminder_date: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      category_type: 'INCOME',
      account_name: '',
      account_number: '',
      ifsc_code: ''
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      code: item.code || '',
      sort_order: item.sort_order || 0,
      hex_code: item.hex_code || '#2563EB',
      start_time: item.start_time || '',
      end_time: item.end_time || '',
      title: item.title || '',
      description: item.description || '',
      reminder_date: item.reminder_date ? item.reminder_date.split('T')[0] : '',
      status: item.status || 'PENDING',
      category_type: item.category_type || 'INCOME',
      account_name: item.account_name || '',
      account_number: item.account_number || '',
      ifsc_code: item.ifsc_code || ''
    });
    setIsModalOpen(true);
  };

  // Save Item (Create or Update)
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const endpoint = getApiEndpoint();
      const payload = { ...formData };
      if (selectedStoreId) payload.storeId = selectedStoreId;

      if (editingItem) {
        await axios.put(`${endpoint}/${editingItem.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(`${getActiveTabInfo().label} updated successfully`);
      } else {
        await axios.post(endpoint, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(`${getActiveTabInfo().label} created successfully`);
      }

      setIsModalOpen(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Item
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const endpoint = getApiEndpoint();
      await axios.delete(`${endpoint}/${itemToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`${getActiveTabInfo().label} deleted successfully`);
      setItemToDelete(null);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  // Active Tab Info
  const getActiveTabInfo = () => {
    return MASTER_TABS.find((t) => t.id === currentTab) || MASTER_TABS[0];
  };

  // Filter items locally by search query
  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const str = JSON.stringify(item).toLowerCase();
    return str.includes(q);
  });

  // Table Columns Definition based on Active Tab
  const getColumns = () => {
    switch (currentTab) {
      case 'sizes':
        return [
          {
            header: 'Size Name',
            accessor: 'name',
            cell: (row) => (
              <div className="size-badge-cell">
                <span className="size-pill">{row.name}</span>
              </div>
            )
          },
          {
            header: 'Code / Tag',
            accessor: 'code',
            cell: (row) => <span className="cell-code">{row.code}</span>
          },
          {
            header: 'Sort Order',
            accessor: 'sort_order',
            cell: (row) => <span className="cell-text">{row.sort_order ?? 0}</span>
          },
          {
            header: 'Actions',
            accessor: 'actions',
            align: 'right',
            cell: (row) => (
              <RowActions
                onEdit={() => handleOpenEditModal(row)}
                onDelete={() => setItemToDelete(row)}
                deleteTitle={`Delete ${row.name}`}
              />
            )
          }
        ];

      case 'colors':
        return [
          {
            header: 'Color Name',
            accessor: 'name',
            cell: (row) => (
              <div className="color-preview-cell">
                <span 
                  className="color-dot" 
                  style={{ backgroundColor: row.hex_code || '#cbd5e1' }} 
                />
                <span className="color-name">{row.name}</span>
              </div>
            )
          },
          {
            header: 'Hex Code',
            accessor: 'hex_code',
            cell: (row) => (
              <span className="hex-pill">{row.hex_code || 'N/A'}</span>
            )
          },
          {
            header: 'Actions',
            accessor: 'actions',
            align: 'right',
            cell: (row) => (
              <RowActions
                onEdit={() => handleOpenEditModal(row)}
                onDelete={() => setItemToDelete(row)}
                deleteTitle={`Delete ${row.name}`}
              />
            )
          }
        ];

      case 'time-slots':
        return [
          {
            header: 'Slot Name',
            accessor: 'name',
            cell: (row) => <span className="cell-strong">{row.name}</span>
          },
          {
            header: 'Start Time',
            accessor: 'start_time',
            cell: (row) => <span className="slot-badge">{row.start_time}</span>
          },
          {
            header: 'End Time',
            accessor: 'end_time',
            cell: (row) => <span className="slot-badge">{row.end_time}</span>
          },
          {
            header: 'Actions',
            accessor: 'actions',
            align: 'right',
            cell: (row) => (
              <RowActions
                onEdit={() => handleOpenEditModal(row)}
                onDelete={() => setItemToDelete(row)}
                deleteTitle={`Delete ${row.name}`}
              />
            )
          }
        ];

      case 'reminders':
        return [
          {
            header: 'Title',
            accessor: 'title',
            cell: (row) => <span className="cell-strong">{row.title}</span>
          },
          {
            header: 'Date',
            accessor: 'reminder_date',
            cell: (row) => (
              <span className="cell-text">
                {row.reminder_date ? new Date(row.reminder_date).toLocaleDateString() : 'N/A'}
              </span>
            )
          },
          {
            header: 'Status',
            accessor: 'status',
            cell: (row) => (
              <span className={`status-pill ${row.status?.toLowerCase() || 'pending'}`}>
                {row.status || 'PENDING'}
              </span>
            )
          },
          {
            header: 'Actions',
            accessor: 'actions',
            align: 'right',
            cell: (row) => (
              <RowActions
                onEdit={() => handleOpenEditModal(row)}
                onDelete={() => setItemToDelete(row)}
                deleteTitle={`Delete ${row.title}`}
              />
            )
          }
        ];

      case 'accounts':
        return [
          {
            header: 'Account / Category Name',
            accessor: 'name',
            cell: (row) => <span className="cell-strong">{row.name}</span>
          },
          {
            header: 'Type',
            accessor: 'category_type',
            cell: (row) => (
              <span className={`type-badge ${row.category_type === 'INCOME' ? 'income' : 'expense'}`}>
                {row.category_type || 'INCOME'}
              </span>
            )
          },
          {
            header: 'Actions',
            accessor: 'actions',
            align: 'right',
            cell: (row) => (
              <RowActions
                onEdit={() => handleOpenEditModal(row)}
                onDelete={() => setItemToDelete(row)}
                deleteTitle={`Delete ${row.name}`}
              />
            )
          }
        ];

      case 'security-accounts':
        return [
          {
            header: 'Account Name',
            accessor: 'account_name',
            cell: (row) => <span className="cell-strong">{row.account_name}</span>
          },
          {
            header: 'Account Number',
            accessor: 'account_number',
            cell: (row) => <span className="cell-code">{row.account_number}</span>
          },
          {
            header: 'IFSC Code',
            accessor: 'ifsc_code',
            cell: (row) => <span className="cell-text">{row.ifsc_code || 'N/A'}</span>
          },
          {
            header: 'Actions',
            accessor: 'actions',
            align: 'right',
            cell: (row) => (
              <RowActions
                onEdit={() => handleOpenEditModal(row)}
                onDelete={() => setItemToDelete(row)}
                deleteTitle={`Delete ${row.account_name}`}
              />
            )
          }
        ];

      default:
        return [];
    }
  };

  return (
    <div className="stores-view master-page-view">
      {/* Top Bar matching Rent360 Design */}
      <div className="stores-top-bar">
        <div className="title-section">
          <h1 className="main-title">Master Data</h1>
          <p className="subtitle">
            Manage system-wide configuration, sizes, colors, time slots, and financial accounts
          </p>
        </div>

        <div className="top-actions">
          {/* Store Selector Pill for Super Admin */}
          {isSuperAdmin && stores.length > 0 && (
            <div className="store-selector-pill">
              <label>Store:</label>
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
              >
                {stores.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Create Button */}
          <button
            type="button"
            className="create-btn"
            onClick={handleOpenCreateModal}
          >
            <FiPlus />
            <span>Add {getActiveTabInfo().label.replace(/s$/, '')}</span>
          </button>
        </div>
      </div>

      {/* Top Pill Navigation Tabs */}
      <div className="master-tabs-bar">
        {MASTER_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`master-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <Icon className="tab-icon" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search & Stats Bar */}
      <div className="setup-controls-bar">
        <div className="search-pill-wrapper">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder={`Search ${getActiveTabInfo().label.toLowerCase()}...`}
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

        <div className="items-count-badge">
          <span>{filteredItems.length} items</span>
        </div>
      </div>

      {/* Bond CRM DataTable */}
      <DataTable
        columns={getColumns()}
        data={filteredItems}
        loading={loading}
        emptyTitle={`No ${getActiveTabInfo().label.toLowerCase()} found`}
        emptyDescription={`Get started by clicking the "Add ${getActiveTabInfo().label.replace(/s$/, '')}" button above.`}
      />

      {/* Unified Bond Modal Card for Create / Edit */}
      {isModalOpen && (
        <div className="bond-modal-overlay">
          <div className="bond-modal-backdrop" onClick={() => setIsModalOpen(false)} />
          <div className="bond-modal-card">
            <div className="bond-modal-header">
              <div className="header-info">
                <h3>
                  {editingItem ? 'Edit' : 'Add New'} {getActiveTabInfo().label.replace(/s$/, '')}
                </h3>
                <p>Fill in the master specification details below</p>
              </div>
              <button
                type="button"
                className="close-icon-btn"
                onClick={() => setIsModalOpen(false)}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSave} className="bond-modal-body">
              {/* Size Form */}
              {currentTab === 'sizes' && (
                <>
                  <div className="form-group">
                    <label>Size Name / Display *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 38, XL, Free Size"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Code / Tag *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 38, XL, FS"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Sort Order</label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                    />
                  </div>
                </>
              )}

              {/* Color Form */}
              {currentTab === 'colors' && (
                <>
                  <div className="form-group">
                    <label>Color Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Royal Blue, Wine, Maroon"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Color Preview & Hex Code</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={formData.hex_code || '#2563EB'}
                        onChange={(e) => setFormData({ ...formData, hex_code: e.target.value })}
                        style={{ width: '48px', height: '40px', padding: '2px', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        placeholder="#2563EB"
                        value={formData.hex_code}
                        onChange={(e) => setFormData({ ...formData, hex_code: e.target.value })}
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Time Slot Form */}
              {currentTab === 'time-slots' && (
                <>
                  <div className="form-group">
                    <label>Slot Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Morning Slot, Evening Fitting"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="form-row" style={{ display: 'flex', gap: '12px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Start Time *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 10:00 AM"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>End Time *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 01:00 PM"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Reminders Form */}
              {currentTab === 'reminders' && (
                <>
                  <div className="form-group">
                    <label>Reminder Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Return collection fitting reminder"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.reminder_date}
                      onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      rows={3}
                      placeholder="Enter optional description..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* Accounts Form */}
              {currentTab === 'accounts' && (
                <>
                  <div className="form-group">
                    <label>Account / Category Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rental Revenue, Dry Cleaning Expense"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Category Type *</label>
                    <select
                      value={formData.category_type}
                      onChange={(e) => setFormData({ ...formData, category_type: e.target.value })}
                    >
                      <option value="INCOME">Income</option>
                      <option value="EXPENSE">Expense</option>
                    </select>
                  </div>
                </>
              )}

              {/* Security Accounts Form */}
              {currentTab === 'security-accounts' && (
                <>
                  <div className="form-group">
                    <label>Account Holder / Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Store Security Deposit A/C"
                      value={formData.account_name}
                      onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Account Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 50100456789123"
                      value={formData.account_number}
                      onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>IFSC Code</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC0001234"
                      value={formData.ifsc_code}
                      onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value.toUpperCase() })}
                    />
                  </div>
                </>
              )}

              <div className="bond-modal-footer">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : editingItem ? 'Update Master' : 'Create Master'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(itemToDelete)}
        title={`Delete ${getActiveTabInfo().label.replace(/s$/, '')}`}
        message={`Are you sure you want to delete this master record? This action cannot be undone.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Record'}
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onClose={() => setItemToDelete(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default MasterPage;
