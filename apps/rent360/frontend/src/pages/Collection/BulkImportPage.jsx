import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  FiUploadCloud, FiDownload, FiCheckCircle, FiAlertCircle, 
  FiFileText, FiPlus, FiTrash2, FiLayers, FiCheck 
} from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import { Select } from '../../components/ui';
import '../Stores/StoresList.scss';
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
          const list = res.data.data || [];
          setCategories(list);
          if (list.length > 0) {
            setQuickRows((prev) =>
              prev.map((r) => ({ ...r, categoryId: r.categoryId || list[0].id }))
            );
          }
        })
        .catch(() => {});
    }
  }, [selectedStoreId, token]);

  // Download Sample CSV
  const handleDownloadSample = () => {
    const defaultCat = categories[0]?.name || 'Bridal Wear';
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'product_code,name,category_name,base_rent_price,base_security_deposit,initial_stock\n' +
      `BW-001,Red Velvet Bridal Lehenga,${defaultCat},5000,10000,2\n` +
      `SW-002,Ivory Raw Silk Sherwani,${defaultCat},4500,8000,1\n` +
      `GW-003,Navy Blue Indo-Western Gown,${defaultCat},3500,6000,3\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Rent360_Outfits_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Sample CSV template downloaded');
  };

  // Parse CSV
  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith('.csv')) {
      toast.error('Please upload a valid CSV file (.csv)');
      return;
    }

    setFile(uploadedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          toast.error('CSV file has no data rows');
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
        await axios.post(
          `${API_BASE_URL}/api/products`,
          {
            storeId: effectiveStoreId,
            categoryId: row.categoryId,
            product_code: row.product_code,
            name: row.name,
            base_rent_price: row.base_rent_price,
            base_security_deposit: row.base_security_deposit,
            image_urls: []
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        successCount++;
      } catch (err) {
        failCount++;
      }
      setImportProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    setIsImporting(false);
    toast.success(`Import complete! ${successCount} outfits created.`);
    if (failCount > 0) {
      toast.error(`${failCount} items failed or already exist`);
    }

    setFile(null);
    setParsedRows([]);
  };

  // Quick Multi-Row Handlers
  const handleQuickRowChange = (index, field, value) => {
    setQuickRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddMoreRows = () => {
    setQuickRows((prev) => [
      ...prev,
      { product_code: '', name: '', categoryId: categories[0]?.id || '', base_rent_price: '', base_security_deposit: '', initial_stock: 1 },
      { product_code: '', name: '', categoryId: categories[0]?.id || '', base_rent_price: '', base_security_deposit: '', initial_stock: 1 }
    ]);
  };

  const handleSaveQuickRows = async () => {
    const validRows = quickRows.filter((r) => r.name.trim() && r.categoryId);
    if (validRows.length === 0) {
      toast.error('Please enter at least one outfit name');
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
    <div className="stores-view bulk-import-view">
      <div className="view-header">
        <div>
          <h2>Bulk Import & Quick Add</h2>
          <p className="subtitle">Upload multiple outfits via CSV spreadsheet or rapid batch entry</p>
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

      {/* Tab Navigation */}
      <div className="import-mode-tabs">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'csv' ? 'active' : ''}`}
          onClick={() => setActiveTab('csv')}
        >
          <FiUploadCloud /> CSV / Excel Import
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'quick' ? 'active' : ''}`}
          onClick={() => setActiveTab('quick')}
        >
          <FiLayers /> Quick Batch Entry
        </button>
      </div>

      {activeTab === 'csv' && (
        <div className="csv-import-section">
          <div className="instructions-card">
            <div className="instruction-step">
              <div className="step-num">1</div>
              <div className="step-content">
                <h4>Download CSV Template</h4>
                <p>Use our pre-configured format with product code, name, category, and pricing.</p>
                <button type="button" className="pill-btn-secondary" onClick={handleDownloadSample}>
                  <FiDownload /> Download Template (.csv)
                </button>
              </div>
            </div>

            <div className="instruction-step">
              <div className="step-num">2</div>
              <div className="step-content">
                <h4>Upload Filled CSV File</h4>
                <p>Select or drag your CSV file into the dropzone below to preview and validate data.</p>
                <label className="upload-dropzone">
                  <FiFileText className="dropzone-icon" />
                  <span>{file ? file.name : 'Click to browse or drop CSV file here'}</span>
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
            <div className="preview-container">
              <div className="preview-header">
                <h3>Preview Collection ({parsedRows.length} rows detected)</h3>
                <button
                  type="button"
                  className="pill-btn-primary"
                  onClick={handleExecuteImport}
                  disabled={isImporting}
                >
                  <FiCheck /> {isImporting ? `Importing... (${importProgress}%)` : `Import All ${parsedRows.length} Outfits`}
                </button>
              </div>

              {isImporting && (
                <div className="progress-bar-wrap">
                  <div className="progress-bar-fill" style={{ width: `${importProgress}%` }} />
                </div>
              )}

              <div className="preview-table-wrap">
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Product Code</th>
                      <th>Outfit Name</th>
                      <th>Category</th>
                      <th>Rent Price (₹)</th>
                      <th>Deposit (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((r, idx) => (
                      <tr key={idx} className={r.isValid ? 'row-valid' : 'row-invalid'}>
                        <td>
                          {r.isValid ? (
                            <span className="valid-badge"><FiCheckCircle /> Ready</span>
                          ) : (
                            <span className="invalid-badge"><FiAlertCircle /> Missing Name</span>
                          )}
                        </td>
                        <td><code>{r.product_code}</code></td>
                        <td><strong>{r.name || '—'}</strong></td>
                        <td>
                          <Select
                            value={r.categoryId}
                            onChange={(e) => {
                              const val = e.target.value;
                              setParsedRows((prev) => {
                                const copy = [...prev];
                                copy[idx].categoryId = val;
                                return copy;
                              });
                            }}
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </Select>
                        </td>
                        <td>₹ {r.base_rent_price}</td>
                        <td>₹ {r.base_security_deposit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'quick' && (
        <div className="quick-entry-section">
          <div className="quick-table-wrap">
            <table className="quick-table">
              <thead>
                <tr>
                  <th style={{ width: '18%' }}>Product Code</th>
                  <th style={{ width: '32%' }}>Outfit Name *</th>
                  <th style={{ width: '22%' }}>Category *</th>
                  <th style={{ width: '14%' }}>Rent Price (₹)</th>
                  <th style={{ width: '14%' }}>Deposit (₹)</th>
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
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Royal Maroon Sherwani"
                        value={row.name}
                        onChange={(e) => handleQuickRowChange(idx, 'name', e.target.value)}
                      />
                    </td>
                    <td>
                      <Select
                        value={row.categoryId}
                        onChange={(e) => handleQuickRowChange(idx, 'categoryId', e.target.value)}
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </Select>
                    </td>
                    <td>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={row.base_rent_price}
                        onChange={(e) => handleQuickRowChange(idx, 'base_rent_price', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={row.base_security_deposit}
                        onChange={(e) => handleQuickRowChange(idx, 'base_security_deposit', e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="quick-footer-bar">
            <button type="button" className="pill-btn-secondary" onClick={handleAddMoreRows}>
              <FiPlus /> Add More Rows
            </button>
            <button
              type="button"
              className="pill-btn-primary"
              onClick={handleSaveQuickRows}
              disabled={isQuickSaving}
            >
              <FiCheck /> {isQuickSaving ? 'Saving Outfits...' : 'Save All Outfits'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkImportPage;
