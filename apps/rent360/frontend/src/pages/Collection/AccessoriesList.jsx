import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { 
  FiPlus, FiSearch, FiSliders, FiEdit2, FiTrash2, FiBox, 
  FiAlertTriangle, FiLayers, FiImage, FiCheck, FiX, FiLink, FiShoppingBag 
} from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import { DataTable, RowActions, Select } from '../../components/ui';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import '../Stores/StoresList.scss';
import './AccessoriesList.scss';

const AccessoriesList = () => {
  const { user, token } = useSelector((state) => state.auth);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || !user?.role;
  const userStoreId = isSuperAdmin ? '' : (user?.store?.id || user?.storeId || '');

  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(() => (isSuperAdmin ? '' : userStoreId));

  // Active Tab: 'accessories' or 'link-accessories' (matching Competitor)
  const [activeTab, setActiveTab] = useState('accessories');

  // Main Data
  const [accessories, setAccessories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryLinks, setCategoryLinks] = useState([]);
  const [loading, setLoading] = useState(true);

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
    setFormData({
      item_name: '',
      categoryId: categories[0]?.id || '',
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
      categoryId: item.categoryId || (categories[0]?.id || ''),
      image_url: item.image_url || '',
      rent_price: item.rent_price ?? 0,
      total_stock: item.total_stock ?? 1,
      alert_limit: item.alert_limit ?? 1,
      is_sold: Boolean(item.is_sold),
      storeId: item.storeId || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.item_name.trim()) {
      toast.error('Please enter an accessory name');
      return;
    }

    try {
      const payload = {
        item_name: formData.item_name.trim(),
        categoryId: formData.categoryId || null,
        image_url: formData.image_url.trim() || null,
        rent_price: Number(formData.rent_price || 0),
        total_stock: Number(formData.total_stock || 0),
        alert_limit: Number(formData.alert_limit || 0),
        is_sold: Boolean(formData.is_sold),
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
      toast.success('Accessory deleted');
      setItemToDelete(null);
      fetchAccessories();
    } catch (err) {
      toast.error('Failed to delete accessory');
    } finally {
      setIsDeleting(false);
    }
  };

  // Tab 2 Handlers (Link Accessories)
  const handleOpenLinkModal = (catGroup) => {
    setSelectedCategoryForLink(catGroup);
    const existingIds = (catGroup.links || []).map((l) => l.accessoryId);
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
      const effectiveStoreId = isSuperAdmin ? selectedStoreId : (userStoreId || selectedStoreId);
      await axios.post(
        `${API_BASE_URL}/api/category-accessory-links`,
        {
          storeId: effectiveStoreId,
          categoryId: selectedCategoryForLink.categoryId,
          accessoryIds: selectedAccessoryIds
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Accessories linked to ${selectedCategoryForLink.categoryName}`);
      setIsLinkModalOpen(false);
      fetchCategoryLinks();
    } catch (err) {
      toast.error('Failed to save linked accessories');
    } finally {
      setIsSavingLinks(false);
    }
  };

  // Columns for Tab 1: Accessories
  const accessoryColumns = useMemo(() => [
    {
      header: 'Accessory Name',
      accessor: 'item_name',
      width: '32%',
      cell: (row) => (
        <div className="accessory-name-cell">
          {row.image_url ? (
            <img src={row.image_url} alt={row.item_name} className="acc-thumb" />
          ) : (
            <div className="acc-thumb-placeholder">
              <FiBox />
            </div>
          )}
          <span className="name-main">{row.item_name}</span>
        </div>
      )
    },
    {
      header: 'Category',
      accessor: 'category',
      width: '20%',
      cell: (row) => {
        const catName = row.category?.name || 'General';
        return <span className="category-pill">{catName}</span>;
      }
    },
    {
      header: 'Rent (₹)',
      accessor: 'rent_price',
      width: '15%',
      cell: (row) => (
        <span className="rent-text">
          ₹ {(row.rent_price || 0).toLocaleString('en-IN')}
        </span>
      )
    },
    {
      header: 'Stock / Qty',
      accessor: 'total_stock',
      width: '18%',
      cell: (row) => {
        const isLow = row.total_stock <= row.alert_limit && row.total_stock > 0;
        const isOut = row.total_stock === 0;
        return (
          <div className="stock-cell">
            <span className={`stock-number ${isOut ? 'out' : isLow ? 'low' : 'ok'}`}>
              {row.total_stock} Units
            </span>
            {isLow && (
              <span className="low-stock-alert">
                <FiAlertTriangle /> Low
              </span>
            )}
            {isOut && <span className="out-stock-alert">Out</span>}
          </div>
        );
      }
    },
    {
      header: 'Sale Status',
      accessor: 'is_sold',
      width: '15%',
      cell: (row) => (
        row.is_sold ? (
          <span className="sale-badge can-sell">Available for Sale</span>
        ) : (
          <span className="sale-badge rental-only">Rental Only</span>
        )
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      align: 'right',
      width: '10%',
      cell: (row) => (
        <RowActions
          onEdit={() => handleOpenEditModal(row)}
          onDelete={() => setItemToDelete(row)}
          deleteTitle={`Delete ${row.item_name}`}
        />
      )
    }
  ], []);

  // Columns for Tab 2: Link Accessories (matching Image 4)
  const linkColumns = useMemo(() => [
    {
      header: 'Category',
      accessor: 'categoryName',
      width: '25%',
      cell: (row) => (
        <div className="link-category-cell">
          <span className="category-title">{row.categoryName}</span>
          <span className="category-code">{row.categoryCode}</span>
        </div>
      )
    },
    {
      header: 'Accessories',
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
      width: '15%',
      cell: (row) => (
        <button
          type="button"
          className="link-edit-btn"
          onClick={() => handleOpenLinkModal(row)}
        >
          <FiLink /> Link Accessories
        </button>
      )
    }
  ], []);

  return (
    <div className="stores-view accessories-view">
      <div className="view-header">
        <div>
          <h2>Accessories</h2>
          <p className="subtitle">Manage matching rental accessories and link bundled accessories to outfit categories</p>
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
          {activeTab === 'accessories' && (
            <button className="pill-btn-primary" onClick={handleOpenAddModal}>
              <FiPlus />
              <span>Create Accessory</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs matching Competitor (Accessories vs Link Accessories) */}
      <div className="accessories-tabs-bar">
        <button
          type="button"
          className={`acc-tab-btn ${activeTab === 'accessories' ? 'active' : ''}`}
          onClick={() => setActiveTab('accessories')}
        >
          <FiBox /> Accessories
        </button>
        <button
          type="button"
          className={`acc-tab-btn ${activeTab === 'link-accessories' ? 'active' : ''}`}
          onClick={() => setActiveTab('link-accessories')}
        >
          <FiLink /> Link Accessories
        </button>
      </div>

      {/* Tab 1: Accessories */}
      {activeTab === 'accessories' && (
        <>
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

            <div className="controls-right-group">
              <Select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>

              {/* Checkbox filter for Is Sold (matching Image 5) */}
              <label className="checkbox-filter-label">
                <input
                  type="checkbox"
                  checked={isSoldFilter}
                  onChange={(e) => setIsSoldFilter(e.target.checked)}
                />
                <span>Is Sold</span>
              </label>
            </div>
          </div>

          <DataTable
            columns={accessoryColumns}
            data={accessories}
            loading={loading}
            emptyStateTitle="No accessories found"
            emptyStateSubtitle="Add matching rental jewellery, safas, and stoles for your collection"
          />
        </>
      )}

      {/* Tab 2: Link Accessories (matching Image 4) */}
      {activeTab === 'link-accessories' && (
        <>
          <div className="link-info-banner">
            <FiLink className="info-icon" />
            <span>
              Configure which accessories are bundled or suggested with each outfit category during customer bookings.
            </span>
          </div>

          <DataTable
            columns={linkColumns}
            data={categoryLinks}
            loading={loading}
            emptyStateTitle="No categories found to link"
            emptyStateSubtitle="Create categories in Store Setup to start linking accessories"
          />
        </>
      )}

      {/* Create / Edit Accessory Modal (matching Image 2 & 5) */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingItem ? 'Edit Accessory' : 'Create Accessory'}</h3>
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
                  <label>Category *</label>
                  <Select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    required
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                </div>

                <div className="form-group">
                  <label>Accessory Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Silk Safa, Mojdi, Velvet Dupatta"
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  />
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Qty (Quantity) *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.total_stock}
                      onChange={(e) => setFormData({ ...formData, total_stock: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Rent (INR) *</label>
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

                {/* Is Sold Checkbox (matching Image 5) */}
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>
                    <input
                      type="checkbox"
                      checked={formData.is_sold}
                      onChange={(e) => setFormData({ ...formData, is_sold: e.target.checked })}
                    />
                    <span>Is Sold (Available for direct retail purchase by customer)</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="pill-btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Reset
                </button>
                <button type="submit" className="pill-btn-primary">
                  {editingItem ? 'Save Changes' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Accessories to Category Modal (matching Image 4) */}
      {isLinkModalOpen && selectedCategoryForLink && (
        <div className="modal-backdrop">
          <div className="modal-card link-modal-card">
            <div className="modal-header">
              <div>
                <h3>Link Accessories</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Select matching accessories bundled with <strong>{selectedCategoryForLink.categoryName}</strong>
                </p>
              </div>
              <button className="close-btn" onClick={() => setIsLinkModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              {accessories.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
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
                          <span className="acc-item-cat">{acc.category?.name || 'General'}</span>
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
                {isSavingLinks ? 'Saving Links...' : 'Save Linked Accessories'}
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
