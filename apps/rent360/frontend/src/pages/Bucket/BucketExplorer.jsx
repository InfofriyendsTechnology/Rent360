import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { FiFolder, FiImage, FiHardDrive, FiChevronRight, FiRefreshCw, FiHome, FiTrash2, FiDatabase, FiCheckCircle } from 'react-icons/fi';
import './BucketExplorer.scss';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';

const BucketExplorer = () => {
  const { token } = useSelector((state) => state.auth);
  
  const [stats, setStats] = useState(null);
  const [currentPath, setCurrentPath] = useState('');
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [fileToDelete, setFileToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`http://localhost:61026/api/bucket/stats?_t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data.data);
    } catch (e) {
      console.error('Failed to fetch stats', e);
    }
  };

  const fetchContents = async (path) => {
    setLoading(true);
    try {
      const [folderRes, filesRes] = await Promise.all([
        axios.get(`http://localhost:61026/api/bucket/folders?path=${path}&_t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:61026/api/bucket/files?path=${path || 'rent360'}&_t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setFolders(folderRes.data.data || []);
      setFiles(filesRes.data.data || []);
      setCurrentPath(path);
    } catch (e) {
      console.error('Failed to fetch contents', e);
      toast.error('Failed to load bucket contents');
    } finally {
      setLoading(false);
    }
  };

  const initiateDelete = (e, public_id) => {
    e.preventDefault();
    e.stopPropagation();
    setFileToDelete(public_id);
  };

  const executeDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    
    try {
      await axios.delete('http://localhost:61026/api/bucket/files', {
        headers: { Authorization: `Bearer ${token}` },
        data: { public_id: fileToDelete }
      });
      toast.success('File deleted completely from Cloudinary API & Cache');
      fetchContents(currentPath);
      fetchStats();
    } catch (err) {
      toast.error('Failed to delete file');
    } finally {
      setIsDeleting(false);
      setFileToDelete(null);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchContents('rent360');
  }, []);

  const handleFolderClick = (folderPath) => {
    fetchContents(folderPath);
  };

  const handleBreadcrumbClick = (index) => {
    if (index === -1) {
      fetchContents('rent360');
      return;
    }
    const parts = currentPath.split('/');
    const newPath = parts.slice(0, index + 1).join('/');
    fetchContents(newPath);
  };

  const bytesToMB = (bytes) => {
    const validBytes = Math.max(0, bytes || 0);
    if (validBytes > 0 && validBytes < 10485) return "< 0.01";
    return (validBytes / (1024 * 1024)).toFixed(2);
  };

  const bytesToGB = (bytes) => {
    const validBytes = Math.max(0, bytes || 0);
    return (validBytes / (1024 * 1024 * 1024)).toFixed(2);
  };

  const breadcrumbs = currentPath.split('/').filter(Boolean);

  return (
    <div className="bucket-explorer-view">
      <div className="bucket-header">
        <div className="title-section">
          <h1 className="main-title">Cloud Storage</h1>
          <p className="subtitle">Manage and view your Cloudinary bucket assets</p>
        </div>
        <div className="stats-cards">
          <div className="stat-card">
            <FiHardDrive className="stat-icon" />
            <div className="stat-info">
              <span className="stat-label">Storage Used</span>
              <span className="stat-value">{stats ? bytesToMB(stats.usage) : '0'} MB</span>
            </div>
          </div>
          <div className="stat-card">
            <FiCheckCircle className="stat-icon" style={{color: '#10b981'}} />
            <div className="stat-info">
              <span className="stat-label">Free Storage</span>
              <span className="stat-value">{stats ? bytesToGB(stats.free) : '0'} GB</span>
            </div>
          </div>
          <div className="stat-card">
            <FiDatabase className="stat-icon" style={{color: '#8b5cf6'}} />
            <div className="stat-info">
              <span className="stat-label">Total Limit</span>
              <span className="stat-value">{stats ? bytesToGB(stats.total) : '25.00'} GB</span>
            </div>
          </div>
        </div>
      </div>

      <div className="explorer-card bond-card-container">
        <div className="explorer-toolbar">
          <div className="breadcrumbs">
            <button className="crumb-btn" onClick={() => handleBreadcrumbClick(-1)}>
              <FiHome />
            </button>
            {breadcrumbs.map((part, idx) => (
              <React.Fragment key={idx}>
                <FiChevronRight className="crumb-sep" />
                <button className="crumb-btn" onClick={() => handleBreadcrumbClick(idx)}>{part}</button>
              </React.Fragment>
            ))}
          </div>
          <button className="refresh-btn" onClick={() => { fetchStats(); fetchContents(currentPath); }} disabled={loading} title="Refresh">
            <FiRefreshCw className={loading ? 'spinning' : ''} />
          </button>
        </div>

        <div className="explorer-content">
          {loading ? (
            <div className="loading-state">Loading contents...</div>
          ) : (
            <div className="grid-view">
              {folders.map(folder => (
                <div className="grid-item folder-item" key={folder.path} onClick={() => handleFolderClick(folder.path)}>
                  <div className="icon-wrapper"><FiFolder /></div>
                  <span className="item-name">{folder.name}</span>
                </div>
              ))}
              
              {files.map(file => (
                <div className="grid-item file-item" key={file.public_id}>
                  <a 
                    href={file.secure_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="image-preview"
                  >
                    <img src={file.secure_url} alt={file.public_id} />
                  </a>
                  <div className="file-info-row">
                    <span className="item-name">{file.public_id.split('/').pop()}</span>
                    <button 
                      className="delete-file-btn btn-3d-trash" 
                      onClick={(e) => initiateDelete(e, file.public_id)}
                      title="Delete File"
                    >
                      <FiTrash2 className="btn-icon" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!loading && folders.length === 0 && files.length === 0 && (
            <div className="empty-state">
              <FiFolder style={{fontSize: '48px', color: '#4b5563', marginBottom: '16px'}} />
              <h3 style={{fontSize: '1.2rem', color: '#f3f4f6', marginBottom: '8px'}}>This folder is empty</h3>
              <p style={{color: '#9ca3af', fontSize: '0.9rem'}}>No images or subfolders found here.</p>
            </div>
          )}
        </div>
      </div>
      
      <ConfirmModal 
        isOpen={!!fileToDelete}
        title="Delete Image"
        message="Are you sure you want to permanently delete this image from your Cloudinary bucket? This action cannot be undone."
        confirmText="Delete File"
        onConfirm={executeDelete}
        onCancel={() => setFileToDelete(null)}
        isLoading={isDeleting}
        isDestructive={true}
      />
    </div>
  );
};

export default BucketExplorer;
