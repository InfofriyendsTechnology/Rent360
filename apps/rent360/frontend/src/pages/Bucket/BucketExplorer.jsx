import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { 
  FiFolder, FiImage, FiHardDrive, FiChevronRight, FiRefreshCw, 
  FiHome, FiTrash2, FiDatabase, FiCheckCircle, FiClock, FiCopy, FiExternalLink,
  FiMoreVertical, FiEye, FiX
} from 'react-icons/fi';
import './BucketExplorer.scss';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { FolderGridSkeleton, Skeleton } from '../../components/ui/Skeleton/Skeleton';
import { API_BASE_URL } from '../../config/api';

const BucketExplorer = () => {
  const { token } = useSelector((state) => state.auth);
  
  const [stats, setStats] = useState(null);
  const [currentPath, setCurrentPath] = useState('');
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState(null);

  // Inline Image Preview Modal State
  const [previewImage, setPreviewImage] = useState(null);

  // Modal State
  const [fileToDelete, setFileToDelete] = useState(null);
  const [folderToDelete, setFolderToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/bucket/stats?_t=${Date.now()}`, {
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
        axios.get(`${API_BASE_URL}/api/bucket/folders?path=${path}&_t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/api/bucket/files?path=${path || 'rent360'}&_t=${Date.now()}`, {
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

  const initiateFolderDelete = (e, path) => {
    e.preventDefault();
    e.stopPropagation();
    setFolderToDelete(path);
  };

  const executeDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    
    try {
      await axios.delete(`${API_BASE_URL}/api/bucket/files`, {
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

  const executeFolderDelete = async () => {
    if (!folderToDelete) return;
    setIsDeleting(true);

    try {
      await axios.delete(`${API_BASE_URL}/api/bucket/folders`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { path: folderToDelete }
      });
      toast.success('Folder and any empty contents deleted');
      if (currentPath === folderToDelete) {
        // Go to parent folder
        const parent = folderToDelete.substring(0, folderToDelete.lastIndexOf('/')) || 'rent360';
        fetchContents(parent);
      } else {
        fetchContents(currentPath);
      }
      fetchStats();
    } catch (err) {
      toast.error('Failed to delete folder');
    } finally {
      setIsDeleting(false);
      setFolderToDelete(null);
    }
  };

  const handleFolderContextMenu = (e, folder) => {
    e.preventDefault();
    e.stopPropagation();
    const now = new Date();
    const timeString = `${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    
    const clickX = e.clientX || (e.currentTarget?.getBoundingClientRect ? e.currentTarget.getBoundingClientRect().right : 100);
    const clickY = e.clientY || (e.currentTarget?.getBoundingClientRect ? e.currentTarget.getBoundingClientRect().bottom : 100);

    setContextMenu({
      x: Math.max(10, Math.min(clickX, window.innerWidth - 260)),
      y: Math.max(10, Math.min(clickY, window.innerHeight - 280)),
      type: 'folder',
      name: folder.name,
      path: folder.path,
      time: timeString
    });
  };

  const handleFileContextMenu = (e, file) => {
    e.preventDefault();
    e.stopPropagation();
    const created = file.created_at ? new Date(file.created_at) : new Date();
    const timeString = `${created.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at ${created.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    
    const clickX = e.clientX || (e.currentTarget?.getBoundingClientRect ? e.currentTarget.getBoundingClientRect().right : 100);
    const clickY = e.clientY || (e.currentTarget?.getBoundingClientRect ? e.currentTarget.getBoundingClientRect().bottom : 100);

    setContextMenu({
      x: Math.max(10, Math.min(clickX, window.innerWidth - 260)),
      y: Math.max(10, Math.min(clickY, window.innerHeight - 300)),
      type: 'file',
      name: file.public_id.split('/').pop(),
      path: file.public_id,
      secure_url: file.secure_url,
      bytes: file.bytes,
      format: file.format,
      time: timeString
    });
  };

  useEffect(() => {
    fetchStats();
    fetchContents('rent360');

    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('contextmenu', handleGlobalClick);
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
        setPreviewImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('contextmenu', handleGlobalClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
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
              <span className="stat-value">{stats ? `${bytesToMB(stats.usage)} MB` : <Skeleton width="60px" height="22px" />}</span>
            </div>
          </div>
          <div className="stat-card">
            <FiCheckCircle className="stat-icon" style={{color: '#10b981'}} />
            <div className="stat-info">
              <span className="stat-label">Free Storage</span>
              <span className="stat-value">{stats ? `${bytesToGB(stats.free)} GB` : <Skeleton width="60px" height="22px" />}</span>
            </div>
          </div>
          <div className="stat-card">
            <FiDatabase className="stat-icon" style={{color: '#8b5cf6'}} />
            <div className="stat-info">
              <span className="stat-label">Total Limit</span>
              <span className="stat-value">{stats ? `${bytesToGB(stats.total)} GB` : <Skeleton width="60px" height="22px" />}</span>
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
            <FolderGridSkeleton count={8} />
          ) : (
            <div className="grid-view">
              {folders.map(folder => (
                <div 
                  className="grid-item folder-item" 
                  key={folder.path} 
                  onClick={() => handleFolderClick(folder.path)}
                  onContextMenu={(e) => handleFolderContextMenu(e, folder)}
                  title="Right-click or click 3-dots for options"
                >
                  <button 
                    className="btn-card-more"
                    onClick={(e) => handleFolderContextMenu(e, folder)}
                    title="Folder options"
                  >
                    <FiMoreVertical />
                  </button>
                  <div className="icon-wrapper"><FiFolder /></div>
                  <div className="file-info-row">
                    <span className="item-name" title={folder.name}>{folder.name}</span>
                  </div>
                </div>
              ))}
              
              {files.map(file => (
                <div 
                  className="grid-item file-item" 
                  key={file.public_id}
                  onClick={() => setPreviewImage({
                    url: file.secure_url,
                    name: file.public_id.split('/').pop(),
                    size: file.bytes,
                    format: file.format
                  })}
                  onContextMenu={(e) => handleFileContextMenu(e, file)}
                  title="Click to view image, right-click for options"
                >
                  <button 
                    className="btn-card-more"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileContextMenu(e, file);
                    }}
                    title="File options"
                  >
                    <FiMoreVertical />
                  </button>
                  <div className="image-preview">
                    <img src={file.secure_url} alt={file.public_id} />
                  </div>
                  <div className="file-info-row">
                    <span className="item-name" title={file.public_id.split('/').pop()}>{file.public_id.split('/').pop()}</span>
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

      {/* Right-Click Context Menu rendered at document.body level */}
      {contextMenu && createPortal(
        <div 
          className="custom-context-menu" 
          style={{ 
            top: `${contextMenu.y}px`, 
            left: `${contextMenu.x}px`,
            position: 'fixed',
            zIndex: 999999
          }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="menu-header">
            <div className="menu-title-row">
              {contextMenu.type === 'folder' ? <FiFolder className="menu-icon" /> : <FiImage className="menu-icon" />}
              <span className="menu-name" title={contextMenu.name}>{contextMenu.name}</span>
            </div>
            <div className="menu-time-tag">
              <FiClock className="tag-icon" />
              <span>Time: {contextMenu.time}</span>
            </div>
            {contextMenu.bytes && (
              <div className="menu-meta-tag">
                <span>Size: {(contextMenu.bytes / 1024).toFixed(1)} KB • {contextMenu.format?.toUpperCase()}</span>
              </div>
            )}
          </div>

          <div className="menu-divider" />

          <div className="menu-actions">
            {contextMenu.type === 'folder' ? (
              <button 
                className="menu-action-btn"
                onClick={() => {
                  handleFolderClick(contextMenu.path);
                  setContextMenu(null);
                }}
              >
                <FiExternalLink /> Open Folder
              </button>
            ) : (
              <button 
                className="menu-action-btn"
                onClick={() => {
                  setPreviewImage({
                    url: contextMenu.secure_url,
                    name: contextMenu.name,
                    size: contextMenu.bytes,
                    format: contextMenu.format
                  });
                  setContextMenu(null);
                }}
              >
                <FiEye /> View Image
              </button>
            )}

            {contextMenu.path && contextMenu.path !== 'rent360' && (
              <>
                <div className="menu-divider" />
                <button 
                  className="menu-action-btn delete-action"
                  onClick={() => {
                    if (contextMenu.type === 'folder') {
                      setFolderToDelete(contextMenu.path);
                    } else {
                      setFileToDelete(contextMenu.path);
                    }
                    setContextMenu(null);
                  }}
                >
                  <FiTrash2 /> {contextMenu.type === 'folder' ? 'Delete Folder' : 'Delete File'}
                </button>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Inline Image Preview Modal */}
      {previewImage && createPortal(
        <div 
          className="image-preview-modal-overlay"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="image-preview-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-top-bar">
              <div className="img-title-wrap">
                <FiImage className="img-icon" />
                <span className="img-filename" title={previewImage.name}>{previewImage.name}</span>
                {previewImage.size && (
                  <span className="img-meta-badge">
                    {(previewImage.size / 1024).toFixed(1)} KB • {previewImage.format?.toUpperCase()}
                  </span>
                )}
              </div>
              <button 
                className="close-modal-btn"
                onClick={() => setPreviewImage(null)}
                title="Close"
              >
                <FiX />
              </button>
            </div>

            <div className="modal-img-container">
              <img src={previewImage.url} alt={previewImage.name} />
            </div>
          </div>
        </div>,
        document.body
      )}
      
      <ConfirmModal 
        isOpen={!!fileToDelete}
        title="Delete Image"
        message="Are you sure you want to delete this file?"
        confirmText="Delete"
        onConfirm={executeDelete}
        onCancel={() => setFileToDelete(null)}
        isLoading={isDeleting}
        isDestructive={true}
      />

      <ConfirmModal 
        isOpen={!!folderToDelete}
        title="Delete Folder"
        message="Are you sure you want to delete this folder?"
        confirmText="Delete"
        onConfirm={executeFolderDelete}
        onCancel={() => setFolderToDelete(null)}
        isLoading={isDeleting}
        isDestructive={true}
      />
    </div>
  );
};

export default BucketExplorer;
