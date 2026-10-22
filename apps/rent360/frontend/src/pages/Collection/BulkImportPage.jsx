import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  FiUploadCloud, FiDownload, FiCheckCircle, FiAlertCircle, 
  FiFileText, FiPlus, FiTrash2, FiLayers, FiCheck, FiShoppingBag, FiChevronDown 
} from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import '../Stores/StoresList.scss';
import '../Master/MasterPage.scss';
import './BulkImportPage.scss';

const BulkImportPage = () => {
  const { user, token } = useSelector((state) => state.auth);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || !user?.role;
  const userStoreId = isSuperAdmin ? '' : (user?.store?.id || user?.storeId || '');

  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(() => (isSuperAdmin ? '' : userStoreId));
  const [categories, setCategories] = useState([]);

  const [activeTab, setActiveTab] = useState('csv'); // 'csv' or 'quick'

  // CSV State
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // Quick Multi-Row State
  const [quickRows, setQuickRows] = useState([
    { product_code: '', name: '', categoryId: '', base_rent_price: '', base_security_deposit: '', initial_stock: 1 },
    { product_code: '', name: '', categoryId: '', base_rent_price: '', base_security_deposit: '', initial_stock: 1 },
    { product_code: '', name: '', categoryId: '', base_rent_price: '', base_security_deposit: '', initial_stock: 1 },
  ]);
  const [isQuickSaving, setIsQuickSaving] = useState(false);

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
          const cats = res.data.data || [];
          setCategories(cats);
          if (cats.length > 0) {
            setQuickRows((prev) =>
              prev.map((r) => ({ ...r, categoryId: r.categoryId || cats[0].id }))
            );
          }
        })
        .catch(() => {});
    }
  }, [selectedStoreId, token]);

  // Download Sample CSV
  const handleDownloadSample = () => {
    const csvContent =
      'product_code,name,category_name,base_rent_price,base_security_deposit,initial_stock\n' +
      'SHW-101,Royal Ivory Silk Sherwani,Sherwani,3500,7000,2\n' +
      'JOD-202,Midnight Velvet Jodhpuri,Jodhpuri,2800,5000,1\n' +
      'KOT-303,Pastel Mirror Work Koti Kurta,Indo Western,2200,4500,3\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Rent360_Outfits_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle CSV file upload
  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith('.csv')) {
      toast.error('Please upload a valid .csv file');
      return;
    }

    setFile(uploadedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length <= 1) {
          toast.error('CSV file is empty');
          return;
        }

        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
        const rows = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map((v) => v.trim());
          if (values.length < 2) continue;

          const rowData = {};
          headers.forEach((h, index) => {
            rowData[h] = values[index] || '';
          });

          // Match category
          const catName = (rowData.category_name || '').toLowerCase();
          const matchedCat = categories.find(
            (c) => c.name.toLowerCase() === catName
          );

          rows.push({
            id: i,
            product_code: rowData.product_code || `PRD-${Date.now().toString().slice(-4)}-${i}`,
            name: rowData.name || '',
            category_name: rowData.category_name || (categories[0]?.name || 'Default'),
            categoryId: matchedCat?.id || categories[0]?.id || '',
            base_rent_price: Number(rowData.base_rent_price || 0),
            base_security_deposit: Number(rowData.base_security_deposit || 0),
            initial_stock: Number(rowData.initial_stock || 1),
            isValid: Boolean(rowData.name.trim())
          });
        }

        setParsedRows(rows);
        toast.success(`Parsed ${rows.length} outfits from CSV`);
      } catch (err) {
        toast.error('Failed to parse CSV file');
      }
    };
    reader.readAsText(uploadedFile);
  };

  // Run Batch Import
  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid && r.categoryId);
    if (validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }

    const effectiveStoreId = isSuperAdmin ? selectedStoreId : (userStoreId || selectedStoreId);
    if (!effectiveStoreId) {
      toast.error('Store ID is required');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        const payload = {
          storeId: effectiveStoreId,
          categoryId: row.categoryId,
          product_code: row.product_code,
          name: row.name,
          base_rent_price: row.base_rent_price,
          base_security_deposit: row.base_security_deposit,
          image_urls: [],
          items: Array.from({ length: row.initial_stock || 1 }).map((_, idx) => ({
            size: 'Free Size',
            sku_code: `${row.product_code}-FS-${idx + 1}`
          }))
        };

        await axios.post(`${API_BASE_URL}/api/products`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        successCount++;
      } catch (err) {
        failCount++;
      }
      setImportProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    setIsImporting(false);
    if (successCount > 0) {
      toast.success(`Imported ${successCount} outfits successfully!`);
      setParsedRows([]);
      setFile(null);
    }
    if (failCount > 0) {
      toast.error(`${failCount} outfits failed to import`);
    }
  };

  // Quick Multi-Row Handlers
  const handleQuickRowChange = (index, field, value) => {
    setQuickRows((prev) => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  };

  const handleAddQuickRow = () => {
    setQuickRows((prev) => [
      ...prev,
      { product_code: '', name: '', categoryId: categories[0]?.id || '', base_rent_price: '', base_security_deposit: '', initial_stock: 1 }
    ]);
  };

  const handleRemoveQuickRow = (index) => {
    if (quickRows.length <= 1) return;
    setQuickRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveQuickRows = async () => {
    const validRows = quickRows.filter((r) => r.name.trim() && r.categoryId);
    if (validRows.length === 0) {
      toast.error('Please enter at least one outfit name and category');
      return;
    }

    const effectiveStoreId = isSuperAdmin ? selectedStoreId : (userStoreId || selectedStoreId);
    if (!effectiveStoreId) {
      toast.error('Store ID is required');
      return;
    }

    try {
      setIsQuickSaving(true);
      let successCount = 0;

      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i];
        const code = row.product_code.trim() || `PRD-${Date.now().toString().slice(-4)}-${i + 1}`;
        await axios.post(
          `${API_BASE_URL}/api/products`,
          {
            storeId: effectiveStoreId,
            categoryId: row.categoryId,
            product_code: code,
            name: row.name.trim(),
            base_rent_price: Number(row.base_rent_price || 0),
            base_security_deposit: Number(row.base_security_deposit || 0),
            image_urls: []
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        successCount++;
      }

      toast.success(`${successCount} outfits saved successfully!`);
      setQuickRows([
        { product_code: '', name: '', categoryId: categories[0]?.id || '', base_rent_price: '', base_security_deposit: '', initial_stock: 1 },
        { product_code: '', name: '', categoryId: categories[0]?.id || '', base_rent_price: '', base_security_deposit: '', initial_stock: 1 },
        { product_code: '', name: '', categoryId: categories[0]?.id || '', base_rent_price: '', base_security_deposit: '', initial_stock: 1 },
      ]);
    } catch (err) {
      toast.error('Failed to save some outfits');
    } finally {
      setIsQuickSaving(false);
    }
  };

  return (
    <div className="stores-view master-page-view bulk-import-page-view">
      {/* Top Bar matching Rent360 Master standard */}
      <div className="stores-top-bar">
        <div className="title-section">
          <h1 className="main-title">Bulk Import</h1>
          <p className="subtitle">Rapidly import multiple outfits via CSV spreadsheet or quick multi-row table entry</p>
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

      {/* Mode Tabs matching Master */}
      <div className="master-tabs-bar">
        <button
          type="button"
          className={`master-tab-btn ${activeTab === 'csv' ? 'active' : ''}`}
          onClick={() => setActiveTab('csv')}
        >
          <FiUploadCloud className="tab-icon" />
          <span>CSV / Excel Upload</span>
        </button>

        <button
          type="button"
          className={`master-tab-btn ${activeTab === 'quick' ? 'active' : ''}`}
          onClick={() => setActiveTab('quick')}
        >
          <FiLayers className="tab-icon" />
          <span>Quick Multi-Row Add</span>
        </button>
      </div>

      {/* Tab 1: CSV Import Section */}
      {activeTab === 'csv' && (
        <div className="csv-import-section">
          <div className="bond-card-container instructions-card">
            <div className="instruction-step">
              <div className="step-num">1</div>
              <div className="step-content">
                <h4>Download Pre-Formatted CSV Template</h4>
                <p>Use our standard template with columns for product code, name, category, and rental rates.</p>
                <button type="button" className="pill-btn-secondary" onClick={handleDownloadSample}>
                  <FiDownload /> Download Template (.csv)
                </button>
              </div>
            </div>

            <div className="instruction-step">
              <div className="step-num">2</div>
              <div className="step-content">
                <h4>Upload Completed CSV File</h4>
                <p>Drop your filled spreadsheet below to preview, validate, and import in one click.</p>
                <label className="upload-dropzone">
                  <FiFileText className="dropzone-icon" />
                  <span>{file ? file.name : 'Click to select or drop CSV file here'}</span>
                  <input
                    type="file"
                    accept=".csv"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Parsed Rows Preview */}
          {parsedRows.length > 0 && (
            <div className="bond-card-container preview-container">
              <div className="preview-header">
                <div>
                  <h3>Ready to Import: {parsedRows.length} Outfits</h3>
                  <p>Verify categories and details before importing into collection</p>
                </div>
                <button
                  type="button"
                  className="pill-btn-primary"
                  onClick={handleExecuteImport}
                  disabled={isImporting}
                >
                  <FiCheck className="plus-icon" />
                  <span>{isImporting ? `Importing... (${importProgress}%)` : `Import All ${parsedRows.length} Outfits`}</span>
                </button>
              </div>

              {isImporting && (
                <div className="progress-bar-wrap">
                  <div className="progress-bar-fill" style={{ width: `${importProgress}%` }} />
                </div>
              )}

              <div className="preview-table-wrap">
                <table className="master-styled-table">
                  <thead>
                    <tr>
                      <th style={{ width: '12%' }}>Status</th>
                      <th style={{ width: '20%' }}>Outfit Code</th>
                      <th style={{ width: '32%' }}>Outfit Name</th>
                      <th style={{ width: '20%' }}>Category</th>
                      <th style={{ width: '16%' }}>Rent Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((r, idx) => (
                      <tr key={idx}>
                        <td>
                          {r.isValid ? (
                            <span className="status-pill completed">Ready</span>
                          ) : (
                            <span className="status-pill pending">Missing Info</span>
                          )}
                        </td>
                        <td>
                          <span className="cell-code">{r.product_code}</span>
                        </td>
                        <td>
                          <span className="cell-strong">{r.name || '—'}</span>
                        </td>
                        <td>
                          <select
                            value={r.categoryId}
                            onChange={(e) => {
                              const val = e.target.value;
                              setParsedRows((prev) => {
                                const copy = [...prev];
                                copy[idx].categoryId = val;
                                return copy;
                              });
                            }}
                            className="table-inline-select"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <span className="op-balance-text">₹ {r.base_rent_price}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Quick Multi-Row Batch Entry */}
      {activeTab === 'quick' && (
        <div className="bond-card-container quick-entry-section">
          <div className="quick-table-wrap">
            <table className="master-styled-table">
              <thead>
                <tr>
                  <th style={{ width: '20%' }}>Outfit Code</th>
                  <th style={{ width: '32%' }}>Outfit Name *</th>
                  <th style={{ width: '22%' }}>Category *</th>
                  <th style={{ width: '14%' }}>Rent Rate (₹)</th>
                  <th style={{ width: '12%' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {quickRows.map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      <input
                        type="text"
                        placeholder="e.g. BR-001"
                        value={row.product_code}
                        onChange={(e) => handleQuickRowChange(idx, 'product_code', e.target.value)}
                        className="table-inline-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="e.g. Embroidered Sherwani"
                        value={row.name}
                        onChange={(e) => handleQuickRowChange(idx, 'name', e.target.value)}
                        className="table-inline-input"
                        required
                      />
                    </td>
                    <td>
                      <select
                        value={row.categoryId}
                        onChange={(e) => handleQuickRowChange(idx, 'categoryId', e.target.value)}
                        className="table-inline-select"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={row.base_rent_price}
                        onChange={(e) => handleQuickRowChange(idx, 'base_rent_price', e.target.value)}
                        className="table-inline-input"
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="remove-row-btn"
                        onClick={() => handleRemoveQuickRow(idx)}
                        title="Remove row"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="quick-actions-bar">
            <button
              type="button"
              className="pill-btn-secondary"
              onClick={handleAddQuickRow}
            >
              <FiPlus />
              <span>Add Another Row</span>
            </button>

            <button
              type="button"
              className="pill-btn-primary"
              onClick={handleSaveQuickRows}
              disabled={isQuickSaving}
            >
              <FiCheck className="plus-icon" />
              <span>{isQuickSaving ? 'Saving...' : 'Save All Outfits'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkImportPage;
