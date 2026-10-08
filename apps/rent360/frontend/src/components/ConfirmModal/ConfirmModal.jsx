import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import './ConfirmModal.scss';

const ConfirmModal = ({ 
  isOpen, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?", 
  onConfirm, 
  onCancel, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  isDestructive = true,
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay">
      <div className="confirm-modal bond-card-container">
        <div className="modal-icon">
          <FiAlertTriangle className={isDestructive ? 'destructive-icon' : 'warning-icon'} />
        </div>
        <div className="modal-content">
          <h3>{title}</h3>
          <p>{message}</p>
        </div>
        <div className="modal-actions">
          <button 
            className="cancel-btn" 
            onClick={onCancel} 
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button 
            className={`confirm-btn ${isDestructive ? 'destructive' : 'primary'}`} 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
