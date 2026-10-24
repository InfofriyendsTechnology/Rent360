import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { 
  FiPlus, FiSearch, FiLayers, FiImage, FiCheck, FiX, 
  FiLink, FiShoppingBag, FiChevronDown, FiBox, FiAlertTriangle 
} from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import { DataTable, RowActions, Select } from '../../components/ui';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import '../Stores/StoresList.scss';
import '../Master/MasterPage.scss';
import './AccessoriesList.scss';

const AccessoriesList = () => {
  const { user, token } = useSelector((state) => state.auth);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || !user?.role;
  const userStoreId = isSuperAdmin ? '' : (user?.store?.id || user?.storeId || '');

  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(() => (isSuperAdmin ? '' : userStoreId));

  // Active Tab: 'accessories' or 'link-accessories'
  const [activeTab, setActiveTab] = useState('accessories');

  // Main Data
  const [accessories, setAccessories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryLinks, setCategoryLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter Categories: Accessories vs Outfits
  const accessoryCategories = useMemo(() => {
    return categories.filter((c) => c.category_type === 'ACCESSORY');
  }, [categories]);

  const outfitCategories = useMemo(() => {
    return categories.filter((c) => c.category_type !== 'ACCESSORY');
  }, [categories]);

  // Filters for Tab 1
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [isSoldFilter, setIsSoldFilter] = useState(false);

  // Modals for Tab 1 (Create / Edit Accessory)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    item_name: '',
    categoryId: '',
    image_url: '',
    rent_price: 0,
    total_stock: 1,
    alert_limit: 1,
    is_sold: false,
    storeId: ''
  });

  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modals for Tab 2 (Link Accessories to Category)
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedCategoryForLink, setSelectedCategoryForLink] = useState(null);
  const [selectedAccessoryIds, setSelectedAccessoryIds] = useState([]);
  const [isSavingLinks, setIsSavingLinks] = useState(false);

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

  // Fetch accessories
  const fetchAccessories = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedStoreId) params.storeId = selectedStoreId;
      if (selectedCategoryFilter !== 'ALL') params.categoryId = selectedCategoryFilter;
      if (isSoldFilter) params.isSold = 'true';
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

  // Fetch category accessory links for Tab 2
  const fetchCategoryLinks = async () => {
    try {
      setLoading(true);
      const params = selectedStoreId ? { storeId: selectedStoreId } : {};
      const res = await axios.get(`${API_BASE_URL}/api/category-accessory-links`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setCategoryLinks(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load linked accessories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      if (activeTab === 'accessories') {
        fetchAccessories();
      } else {
        fetchCategoryLinks();
        fetchAccessories();
      }
    }
  }, [selectedStoreId, selectedCategoryFilter, isSoldFilter, searchQuery, activeTab, token]);

  // Tab 1 Handlers (Add / Edit Accessory)
  const handleOpenAddModal = () => {
    setEditingItem(null);
    const targetCats = accessoryCategories.length > 0 ? accessoryCategories : categories;
    setFormData({
      item_name: '',
      categoryId: targetCats[0]?.id || '',
      image_url: '',
      rent_price: 0,
      total_stock: 1,
      alert_limit: 1,
      is_sold: false,
      storeId: selectedStoreId || (stores[0]?.id || '')
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name || '',
      categoryId: item.categoryId || item.category?.id || (categories[0]?.id || ''),
      image_url: item.image_url || '',
      rent_price: item.rent_price !== undefined ? item.rent_price : 0,
      total_stock: item.total_stock !== undefined ? item.total_stock : 1,
      alert_limit: item.alert_limit !== undefined ? item.alert_limit : 1,
      is_sold: Boolean(item.is_sold),
      storeId: item.storeId || selectedStoreId || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.item_name.trim()) {
      toast.error('Accessory name is required');
      return;
    }
    if (!formData.categoryId) {
      toast.error('Please select a category');
      return;
    }

    try {
      const payload = {
        item_name: formData.item_name.trim(),
        categoryId: formData.categoryId,
        image_url: formData.image_url.trim() || undefined,
        rent_price: Number(formData.rent_price) || 0,
        total_stock: Number(formData.total_stock) || 1,
        alert_limit: Number(formData.alert_limit) || 1,
        is_sold: Boolean(formData.is_sold),
        item_type: 'other',
        storeId: isSuperAdmin ? (formData.storeId || selectedStoreId) : undefined
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
        toast.success('Accessory created successfully');
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
      toast.success('Accessory deleted successfully');
      setItemToDelete(null);
      fetchAccessories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete accessory');
    } finally {
      setIsDeleting(false);
    }
  };

  // Tab 2 Handlers (Link Accessories)
  const handleOpenLinkModal = (row) => {
    setSelectedCategoryForLink(row);
    const existingIds = (row.links || []).map((l) => l.accessoryId);
    setSelectedAccessoryIds(existingIds);
    setIsLinkModalOpen(true);
  };

  const handleToggleAccessoryId = (accId) => {
    setSelectedAccessoryIds((prev) =>
      prev.includes(accId) ? prev.filter((id) => id !== accId) : [...prev, accId]
    );
  };

  const handleSaveLinks = async () => {
    if (!selectedCategoryForLink) return;
    try {
      setIsSavingLinks(true);
      await axios.post(
        `${API_BASE_URL}/api/link-accessories`,
        {
          categoryId: selectedCategoryForLink.categoryId,
          accessoryIds: selectedAccessoryIds,
          storeId: isSuperAdmin ? selectedStoreId : undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Accessories linked to ${selectedCategoryForLink.categoryName}`);
      setIsLinkModalOpen(false);
      fetchCategoryLinks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save linked accessories');
    } finally {
      setIsSavingLinks(false);
    }
  };

  // Filter Tab 2 Category Links by search query
  const filteredCategoryLinks = useMemo(() => {
    if (!searchQuery.trim()) return categoryLinks;
    const q = searchQuery.toLowerCase().trim();
    return categoryLinks.filter(
      (c) =>
        (c.categoryName && c.categoryName.toLowerCase().includes(q)) ||
        (c.categoryCode && c.categoryCode.toLowerCase().includes(q))
    );
  }, [categoryLinks, searchQuery]);

  // Columns for Tab 1: Accessories
  const accessoryColumns = useMemo(() => [
    {
      header: 'Item',
      accessor: 'image_url',
      width: '8%',
      cell: (row) => (
        row.image_url ? (
          <img src={row.image_url} alt={row.item_name} className="acc-img-thumb" />
        ) : (
          <div className="acc-img-placeholder">
            <FiImage />
          </div>
        )
      )
    },
    {
      header: 'Accessory Name',
      accessor: 'item_name',
      width: '28%',
      cell: (row) => (
        <div className="account-name-cell">
          <span className="cell-strong">{row.item_name}</span>
          <span className="cell-code">{row.category?.name || 'General Accessory'}</span>
        </div>
      )
    },
    {
      header: 'Category',
      accessor: 'category',
      width: '18%',
      cell: (row) => (
        <span className="group-pill parties">
          {row.category?.name || 'Unassigned'}
        </span>
      )
    },
    {
      header: 'Rent Rate',
      accessor: 'rent_price',
      width: '15%',
      cell: (row) => (
        <span className="op-balance-text">
          ₹ {(row.rent_price || 0).toLocaleString('en-IN')}
        </span>
      )
    },
    {
      header: 'Stock Qty',
      accessor: 'total_stock',
      width: '13%',
      cell: (row) => {
        const isLow = row.total_stock <= row.alert_limit && row.total_stock > 0;
        const isOut = row.total_stock === 0;
        return (
          <span className={`status-pill ${isOut ? 'damaged' : isLow ? 'pending' : 'completed'}`}>
            {row.total_stock} Units
          </span>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'is_sold',
      width: '10%',
      cell: (row) => (
        row.is_sold ? (
          <span className="group-pill income">Retail Sale</span>
        ) : (
          <span className="group-pill bank-accounts">Rental Only</span>
        )
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      align: 'right',
      width: '8%',
      cell: (row) => (
        <RowActions
          onEdit={() => handleOpenEditModal(row)}
          onDelete={() => setItemToDelete(row)}
          deleteTitle={`Delete ${row.item_name}`}
        />
      )
    }
  ], []);

  // Columns for Tab 2: Link Accessories
  const linkColumns = useMemo(() => [
    {
      header: 'Outfit Category',
      accessor: 'categoryName',
      width: '24%',
      cell: (row) => (
        <div className="account-name-cell">
          <span className="cell-strong">{row.categoryName}</span>
          <span className="cell-code">{row.categoryCode}</span>
        </div>
      )
    },
    {
      header: 'Bundled / Suggested Accessories',
      accessor: 'links',
      width: '60%',
      cell: (row) => (
        <div className="linked-tags-container">
          {(!row.links || row.links.length === 0) ? (
            <span className="no-links-text">No accessories linked yet</span>
          ) : (
            row.links.map((link) => (
              <span key={link.linkId} className="linked-acc-tag">
                {link.accessoryName}
              </span>
            ))
          )}
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      align: 'right',
      width: '16%',
      cell: (row) => (
        <button
          type="button"
          className="link-edit-btn"
          onClick={() => handleOpenLinkModal(row)}
        >
          <FiLink className="btn-icon" />
          <span>Link Accessories</span>
        </button>
      )
    }
  ], []);

  return (
    <div className="stores-view master-page-view accessories-page-view">
      {/* Top Bar matching Rent360 Master standard */}
      <div className="stores-top-bar">
        <div className="title-section">
          <h1 className="main-title">Accessories</h1>
          <p className="subtitle">Manage matching rental accessories and link bundled accessories to outfit categories</p>
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

          {activeTab === 'accessories' && (
            <button
              type="button"
              className="pill-btn-primary"
              onClick={handleOpenAddModal}
            >
              <FiPlus className="plus-icon" />
              <span>Add Accessory</span>
            </button>
          )}
        </div>
      </div>

      {/* Master Pill Tabs */}
      <div className="master-tabs-bar">
        <button
          type="button"
          className={`master-tab-btn ${activeTab === 'accessories' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('accessories');
            setSearchQuery('');
          }}
        >
          <FiBox className="tab-icon" />
          <span>Accessories</span>
        </button>

        <button
          type="button"
          className={`master-tab-btn ${activeTab === 'link-accessories' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('link-accessories');
            setSearchQuery('');
          }}
        >
          <FiLink className="tab-icon" />
          <span>Link Accessories</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="setup-controls-bar">
        <div className="search-pill-wrapper">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder={activeTab === 'accessories' ? 'Search accessories by name...' : 'Search categories...'}
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

        {activeTab === 'accessories' && (
          <div className="controls-right-group">
            <div className="category-select-wrap">
              <Select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                size="md"
              >
                <option value="ALL">All Categories</option>
                {(accessoryCategories.length > 0 ? accessoryCategories : categories).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>

            <label className="checkbox-filter-pill">
              <input
                type="checkbox"
                checked={isSoldFilter}
                onChange={(e) => setIsSoldFilter(e.target.checked)}
              />
              <span>Is Sold</span>
            </label>
          </div>
        )}
      </div>

      {/* Info Banner for Link Accessories */}
      {activeTab === 'link-accessories' && (
        <div className="master-info-banner">
          <FiLink className="banner-icon" />
          <span>
            Link matching safas, mojdis, malas, and dupattas to garment categories. These suggested accessories will bundle automatically during customer order bookings.
          </span>
        </div>
      )}

      {/* Data Table */}
      <div className="bond-card-container">
        <DataTable
          columns={activeTab === 'accessories' ? accessoryColumns : linkColumns}
          data={activeTab === 'accessories' ? accessories : filteredCategoryLinks}
          loading={loading}
          keyExtractor={(row) => row.id || row.categoryId}
          emptyTitle={activeTab === 'accessories' ? 'No accessories found' : 'No categories found to link'}
          emptyDescription={
            activeTab === 'accessories'
              ? 'Get started by clicking the "Add Accessory" button above.'
              : 'Create categories in Store Setup first to link accessories.'
          }
        />
      </div>

      {/* Create / Edit Accessory Modal */}
      {isModalOpen && (
        <div className="bond-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="bond-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{editingItem ? 'Edit' : 'Add New'} Accessory</h2>
                <p>Configure matching rental accessory specifications</p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setIsModalOpen(false)}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} autoComplete="off">
              <div className="modal-body">
                {isSuperAdmin && !editingItem && (
                  <div className="form-group">
                    <label>Store *</label>
                    <select
                      value={formData.storeId || ''}
                      onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                      required
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

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ margin: 0 }}>Category *</label>
                    <span style={{ fontSize: '0.74rem', color: '#8B5CF6', fontWeight: 600 }}>
                      {accessoryCategories.length > 0 ? 'Accessory Categories Only' : 'All Categories'}
                    </span>
                  </div>
                  <Select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    size="md"
                  >
                    <option value="" disabled>-- Select Accessory Category --</option>
                    {(accessoryCategories.length > 0 ? accessoryCategories : categories).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                  {accessoryCategories.length === 0 && (
                    <span className="field-hint" style={{ color: '#8B5CF6', marginTop: '4px', display: 'block' }}>
                      Tip: Categorize items as 'Accessory' in Categories Master to keep them organized.
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label>Accessory Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Silk Safa, Handcrafted Mojdi, Velvet Dupatta"
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  />
                </div>

                <div className="form-row-2col">
                  <div className="form-group">
                    <label>Stock Quantity *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.total_stock}
                      onChange={(e) => setFormData({ ...formData, total_stock: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Rent Rate (INR) *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.rent_price}
                      onChange={(e) => setFormData({ ...formData, rent_price: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Image URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  />
                </div>

                <div className="form-group checkbox-form-group">
                  <label className="checkbox-field-label">
                    <input
                      type="checkbox"
                      checked={formData.is_sold}
                      onChange={(e) => setFormData({ ...formData, is_sold: e.target.checked })}
                    />
                    <span>Is Sold (Available for direct retail customer purchase)</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="pill-btn-secondary"
                  onClick={() => {
                    const targetCats = accessoryCategories.length > 0 ? accessoryCategories : categories;
                    setFormData({
                      item_name: '',
                      categoryId: targetCats[0]?.id || '',
                      image_url: '',
                      rent_price: 0,
                      total_stock: 1,
                      alert_limit: 1,
                      is_sold: false,
                      storeId: selectedStoreId || (stores[0]?.id || '')
                    });
                  }}
                >
                  Reset
                </button>
                <button
                  type="button"
                  className="pill-btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="pill-btn-primary">
                  {editingItem ? 'Save Changes' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Accessories to Category Modal */}
      {isLinkModalOpen && selectedCategoryForLink && (
        <div className="bond-modal-overlay" onClick={() => setIsLinkModalOpen(false)}>
          <div className="bond-modal-card link-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Link Accessories</h2>
                <p>Select accessories bundled with <strong>{selectedCategoryForLink.categoryName}</strong></p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setIsLinkModalOpen(false)}
              >
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              {accessories.length === 0 ? (
                <div className="checklist-empty">
                  No accessories created in the store yet. Add accessories first.
                </div>
              ) : (
                <div className="accessories-checklist">
                  {accessories.map((acc) => {
                    const isChecked = selectedAccessoryIds.includes(acc.id);
                    return (
                      <label key={acc.id} className={`checklist-item ${isChecked ? 'selected' : ''}`}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleAccessoryId(acc.id)}
                        />
                        <div className="checklist-meta">
                          <span className="acc-item-title">{acc.item_name}</span>
                          <span className="acc-item-cat">{acc.category?.name || 'General Accessory'}</span>
                        </div>
                        {acc.rent_price > 0 && (
                          <span className="acc-item-rent">₹ {acc.rent_price}</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="pill-btn-secondary"
                onClick={() => setIsLinkModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="pill-btn-primary"
                onClick={handleSaveLinks}
                disabled={isSavingLinks}
              >
                {isSavingLinks ? 'Saving...' : 'Save Linked Accessories'}
              </button>
            </div>
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
