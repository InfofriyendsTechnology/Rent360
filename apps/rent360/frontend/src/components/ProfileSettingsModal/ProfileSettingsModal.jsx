import React from 'react';
import { FiX, FiCamera, FiTrash2, FiUser, FiPhone, FiShield } from 'react-icons/fi';
import './ProfileSettingsModal.scss';

const ProfileSettingsModal = ({ isOpen, onClose, user, onUploadClick, onRemoveClick }) => {
  if (!isOpen) return null;

  return (
    <div className="profile-settings-overlay" onClick={onClose}>
      <div className="profile-settings-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Profile Settings</h3>
          <button className="close-btn" onClick={onClose}><FiX /></button>
        </div>
        
        <div className="modal-body">
          <div className="avatar-section">
            <div className="avatar-wrapper" onClick={onUploadClick} title="Change Profile Picture">
              {user?.profile_pic ? (
                <img src={user.profile_pic} alt="DP" />
              ) : (
                <div className="avatar-placeholder">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
                </div>
              )}
              <div className="avatar-hover-overlay">
                <FiCamera size={24} />
                <span>Update</span>
              </div>
            </div>
            
            {user?.profile_pic && (
              <button className="remove-link-btn" onClick={onRemoveClick}>
                <FiTrash2 /> Remove Picture
              </button>
            )}
          </div>

          <div className="info-section">
            <div className="info-group">
              <label><FiUser /> Full Name</label>
              <div className="info-value">{user?.name || 'N/A'}</div>
            </div>
            <div className="info-group">
              <label><FiPhone /> Mobile Number</label>
              <div className="info-value">{user?.mobile || 'N/A'}</div>
            </div>
            <div className="info-group">
              <label><FiShield /> Role</label>
              <div className="info-value">{user?.role?.name || (user?.roleId ? 'Store Admin' : 'Super Admin')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsModal;
