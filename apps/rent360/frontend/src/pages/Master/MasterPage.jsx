import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FiMaximize2, FiDroplet, FiClock, FiBell, FiBookOpen, FiShield, 
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiLayers, FiUsers, FiX, FiCheck,
  FiChevronDown, FiShoppingBag
} from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { DataTable, RowActions, Select, DatePicker } from '../../components/ui';

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
  const userStoreId = isSuperAdmin ? '' : (user?.store?.id || user?.storeId || '');

  // Current tab from URL query or prop
  const currentTab = searchParams.get('tab') || defaultTab;

  // Stores list for super admin
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(() => {
    return isSuperAdmin ? '' : (userStoreId || '');
  });

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
    hex_code: '',
    start_time: '',
    end_time: '',
    title: '',
    description: '',
    reminder_date: '',
    status: 'PENDING',
    category_type: 'INCOME',
    account_name: '',
    account_number: '',
    ifsc_code: '',
    contact_no: '',
    account_group: 'Expenses',
    opening_balance: 0,
    opening_date: new Date().toISOString().split('T')[0],
    address: '',
    remark: ''
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
      hex_code: '',
      start_time: '10:00 AM',
      end_time: '01:00 PM',
      title: '',
      description: '',
      reminder_date: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      category_type: 'INCOME',
      account_name: '',
      account_number: '',
      ifsc_code: '',
      contact_no: '',
      account_group: 'Expenses',
      opening_balance: 0,
      opening_date: new Date().toISOString().split('T')[0],
      address: '',
      remark: '',
      storeId: selectedStoreId || (stores[0]?.id || '')
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
      hex_code: item.hex_code || '',
      start_time: item.start_time || '',
      end_time: item.end_time || '',
      title: item.title || '',
      description: item.description || '',
      reminder_date: item.reminder_date ? item.reminder_date.split('T')[0] : '',
      status: item.status || 'PENDING',
      category_type: item.category_type || 'INCOME',
      account_name: item.account_name || item.name || '',
      account_number: item.account_number || '',
      ifsc_code: item.ifsc_code || '',
      contact_no: item.contact_no || '',
      account_group: item.account_group || (item.category_type === 'INCOME' ? 'Income' : 'Expenses'),
      opening_balance: item.opening_balance ?? 0,
      opening_date: item.opening_date ? item.opening_date.split('T')[0] : new Date().toISOString().split('T')[0],
      address: item.address || '',
      remark: item.remark || '',
      storeId: item.storeId || ''
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
      const effectiveStoreId = isSuperAdmin
        ? (formData.storeId || selectedStoreId)
        : (userStoreId || formData.storeId);
      if (effectiveStoreId) payload.storeId = effectiveStoreId;

      if (currentTab === 'security-accounts') {
        payload.account_name = (formData.name || formData.account_name || '').trim();
        payload.account_number = formData.account_number || null;
      }
      if (currentTab === 'accounts') {
        payload.opening_balance = Number(formData.opening_balance || 0);
        if (formData.account_group === 'Income') {
          payload.category_type = 'INCOME';
        } else {
          payload.category_type = 'EXPENSE';
        }
      }

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
            width: '32%',
            cell: (row) => (
              <div className="size-badge-cell">
                <span className="size-pill">{row.name}</span>
              </div>
            )
          },
          {
            header: 'Code / Tag',
            accessor: 'code',
            width: '28%',
            cell: (row) => <span className="cell-code">{row.code}</span>
          },
          {
            header: 'Sort Order',
            accessor: 'sort_order',
            width: '24%',
            cell: (row) => <span className="cell-text">{row.sort_order ?? 0}</span>
          },
          {
            header: 'Actions',
            accessor: 'actions',
            align: 'right',
            width: '16%',
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
            width: '80%',
            cell: (row) => <span className="cell-strong">{row.name}</span>
          },
          {
            header: 'Actions',
            accessor: 'actions',
            align: 'right',
            width: '20%',
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
            width: '36%',
            cell: (row) => <span className="cell-strong">{row.name}</span>
          },
          {
            header: 'Start Time',
            accessor: 'start_time',
            width: '24%',
            cell: (row) => <span className="slot-badge">{row.start_time}</span>
          },
          {
            header: 'End Time',
            accessor: 'end_time',
            width: '24%',
            cell: (row) => <span className="slot-badge">{row.end_time}</span>
          },
          {
            header: 'Actions',
            accessor: 'actions',
            align: 'right',
            width: '16%',
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
            width: '42%',
            cell: (row) => <span className="cell-strong">{row.title}</span>
          },
          {
            header: 'Date',
            accessor: 'reminder_date',
            width: '24%',
            cell: (row) => (
              <span className="cell-text">
                {row.reminder_date ? new Date(row.reminder_date).toLocaleDateString() : 'N/A'}
              </span>
            )
          },
          {
            header: 'Status',
            accessor: 'status',
            width: '18%',
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
            width: '16%',
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
            header: 'Account Name',
            accessor: 'name',
            width: '30%',
            cell: (row) => (
              <div className="account-name-cell">
                <span className="name-main">{row.name}</span>
                {row.address && <span className="address-hint" title={row.address}>{row.address}</span>}
              </div>
            )
          },
          {
            header: 'Account Group',
            accessor: 'account_group',
            width: '22%',
            cell: (row) => {
              const grp = row.account_group || (row.category_type === 'INCOME' ? 'Income' : 'Expenses');
              const cls = grp.toLowerCase().replace(/\s+/g, '-');
              return <span className={`group-pill ${cls}`}>{grp}</span>;
            }
          },
          {
            header: 'Contact No',
            accessor: 'contact_no',
            width: '20%',
            cell: (row) => <span className="cell-text">{row.contact_no || '—'}</span>
          },
          {
            header: 'Opening Balance',
            accessor: 'opening_balance',
            width: '16%',
            cell: (row) => (
              <span className="op-balance-text">
                ₹ {(row.opening_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            )
          },
          {
            header: 'Actions',
            accessor: 'actions',
            align: 'right',
            width: '12%',
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
            header: 'Security Account Name',
            accessor: 'account_name',
            width: '80%',
            cell: (row) => <span className="cell-strong">{row.account_name || row.name}</span>
          },
          {
            header: 'Actions',
            accessor: 'actions',
            align: 'right',
            width: '20%',
            cell: (row) => (
              <RowActions
                onEdit={() => handleOpenEditModal(row)}
                onDelete={() => setItemToDelete(row)}
                deleteTitle={`Delete ${row.account_name || row.name}`}
              />
            )
          }
        ];

      default:
        return [];
    }
  };

  const getTabMetadata = () => {
    switch (currentTab) {
      case 'sizes':
        return {
          title: 'Sizes',
          subtitle: 'Configure apparel and garment sizing options for inventory'
        };
      case 'colors':
        return {
          title: 'Colors',
          subtitle: 'Manage color swatches and codes for inventory attire'
        };
      case 'time-slots':
        return {
          title: 'Time Slots',
          subtitle: 'Configure rental booking time slots and business hours'
        };
      case 'reminders':
        return {
          title: 'Reminders',
          subtitle: 'Manage automated alerts and rental notifications'
        };
      case 'accounts':
        return {
          title: 'Accounts',
          subtitle: 'Manage financial ledger accounts, party and vendor contacts'
        };
      case 'security-accounts':
        return {
          title: 'Security Accounts',
          subtitle: 'Configure deposit & collateral holders (e.g. Cash, Cheque, ID Card, Bank/UPI)'
        };
      default:
        return {
          title: getActiveTabInfo().label,
          subtitle: `Manage ${getActiveTabInfo().label.toLowerCase()} configurations`
        };
    }
  };

  return (
    <div className="stores-view master-page-view">
      {/* Top Bar matching Rent360 Design */}
      <div className="stores-top-bar">
        <div className="title-section">
          <h1 className="main-title">{getTabMetadata().title}</h1>
          <p className="subtitle">{getTabMetadata().subtitle}</p>
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
                  if (val) {
                    localStorage.setItem('rent360_active_store_id', val);
                  } else {
                    localStorage.removeItem('rent360_active_store_id');
                  }
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

          {/* Create Button with Standard Sleek Design */}
          <button
            type="button"
            className="pill-btn-primary"
            onClick={handleOpenCreateModal}
          >
            <FiPlus className="plus-icon" />
            <span>Add {getActiveTabInfo().label.replace(/s$/, '')}</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
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
          Total {getActiveTabInfo().label}: {filteredItems.length}
        </div>
      </div>

      {/* Bond CRM DataTable */}
      <div className="bond-card-container">
        <DataTable
          columns={getColumns()}
          data={filteredItems}
          loading={loading}
          keyExtractor={(item) => item.id}
          emptyTitle={`No ${getActiveTabInfo().label.toLowerCase()} found`}
          emptyDescription={`Get started by clicking the "Add ${getActiveTabInfo().label.replace(/s$/, '')}" button above.`}
        />
      </div>

      {/* Unified Bond Modal Card for Create / Edit */}
      {isModalOpen && (
        <div className="bond-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="bond-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>
                  {editingItem ? 'Edit' : 'Add New'} {getActiveTabInfo().label.replace(/s$/, '')}
                </h2>
                <p>Configure {getActiveTabInfo().label.toLowerCase()} specification details below</p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setIsModalOpen(false)}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSave} autoComplete="off">
              <div className="modal-body">
                {isSuperAdmin && !editingItem && (
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                      Assign to Store *
                    </label>
                    <select
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: '13px'
                      }}
                      value={formData.storeId || ''}
                      onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                    >
                      <option value="">-- Select Store --</option>
                      {stores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name || s.store_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
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
                  <div className="form-group">
                    <label>Color Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Royal Blue, Wine, Maroon, Red"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
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
                      <DatePicker
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

                {/* Accounts Form (Competitor-Aligned Ledger) */}
                {currentTab === 'accounts' && (
                  <>
                    <div className="form-row-2col">
                      <div className="form-group">
                        <label>Account Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Royal Drycleaners, HDFC Current A/C"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Contact No</label>
                        <input
                          type="text"
                          placeholder="e.g. 9876543210"
                          value={formData.contact_no}
                          onChange={(e) => setFormData({ ...formData, contact_no: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-row-2col">
                      <div className="form-group">
                        <label>Account Group *</label>
                        <Select
                          value={formData.account_group}
                          onChange={(e) => setFormData({ ...formData, account_group: e.target.value })}
                        >
                          <option value="Parties">Parties</option>
                          <option value="Vendors">Vendors</option>
                          <option value="Income">Income</option>
                          <option value="Expenses">Expenses</option>
                          <option value="Bank Accounts">Bank Accounts</option>
                          <option value="Cash Accounts">Cash Accounts</option>
                          <option value="Capital Account">Capital Account</option>
                          <option value="Loans">Loans</option>
                        </Select>
                      </div>

                      <div className="form-group">
                        <label>Opening Balance</label>
                        <input
                          type="number"
                          step="any"
                          placeholder="0.00"
                          value={formData.opening_balance}
                          onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Opening Date</label>
                      <DatePicker
                        value={formData.opening_date}
                        onChange={(e) => setFormData({ ...formData, opening_date: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Address (Optional)</label>
                      <textarea
                        rows={2}
                        placeholder="Enter physical address or store location..."
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Remark (Optional)</label>
                      <textarea
                        rows={2}
                        placeholder="Enter remarks or payment terms..."
                        value={formData.remark}
                        onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {/* Security Accounts Form (Single Name Field matching Competitor) */}
                {currentTab === 'security-accounts' && (
                  <>
                    <div className="form-group">
                      <label>Security Account Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Cash Security, Cheque Guarantee, Original ID / Document, Bank Security"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value, account_name: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="pill-btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pill-btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : editingItem ? 'Save Changes' : `Add ${getActiveTabInfo().label.replace(/s$/, '')}`}
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
        message={`Are you sure you want to delete this ${getActiveTabInfo().label.replace(/s$/, '').toLowerCase()}? This action cannot be undone.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
        onClose={() => setItemToDelete(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default MasterPage;
