import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { FiX, FiCheck, FiZoomIn, FiZoomOut } from 'react-icons/fi';
import './ProfileUploadModal.scss';

const ProfileUploadModal = ({ isOpen, onClose, imageSrc, onUpload }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async () => {
    try {
      setIsUploading(true);
      const canvas = document.createElement('canvas');
      const image = new Image();
      image.src = imageSrc;

      await new Promise((resolve) => {
        image.onload = resolve;
      });

      const ctx = canvas.getContext('2d');

      canvas.width = 250;
      canvas.height = 250;

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        250,
        250
      );

      const base64Image = canvas.toDataURL('image/webp', 0.85);
      await onUpload(base64Image);
      setIsUploading(false);
      onClose();
    } catch (e) {
      console.error(e);
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="profile-upload-modal-overlay">
      <div className="profile-upload-modal">
        <div className="modal-header">
          <h3>Adjust Profile Picture</h3>
          <button className="close-btn" onClick={onClose} disabled={isUploading}>
            <FiX />
          </button>
        </div>
        
        <div className="crop-container">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        <div className="controls">
          <FiZoomOut />
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(e.target.value)}
            className="zoom-slider"
          />
          <FiZoomIn />
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose} disabled={isUploading}>
            Cancel
          </button>
          <button className="save-btn" onClick={createCroppedImage} disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Save Picture'} <FiCheck />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileUploadModal;
