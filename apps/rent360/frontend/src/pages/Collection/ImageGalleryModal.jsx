import React, { useState, useEffect } from 'react';
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const ImageGalleryModal = ({ isOpen, onClose, images = [], initialIndex = 0, title = 'Product Gallery' }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images]);

  if (!isOpen || !images.length) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="gallery-modal-overlay" onClick={onClose}>
      <div className="gallery-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="gallery-header">
          <div className="gallery-title-wrap">
            <span className="gallery-title">{title}</span>
            <span className="gallery-counter">
              {currentIndex + 1} of {images.length}
            </span>
          </div>
          <button type="button" className="gallery-close-btn" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>

        <div className="gallery-main-view">
          {images.length > 1 && (
            <button type="button" className="gallery-nav-btn prev" onClick={handlePrev} aria-label="Previous">
              <FiChevronLeft />
            </button>
          )}

          <div className="gallery-image-wrapper">
            <img 
              src={images[currentIndex]} 
              alt={`${title} - Photo ${currentIndex + 1}`} 
              className="gallery-active-image" 
            />
          </div>

          {images.length > 1 && (
            <button type="button" className="gallery-nav-btn next" onClick={handleNext} aria-label="Next">
              <FiChevronRight />
            </button>
          )}
        </div>

        {images.length > 1 && (
          <div className="gallery-thumbnails">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                className={`gallery-thumb-btn ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(idx)}
              >
                <img src={img} alt={`Thumbnail ${idx + 1}`} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGalleryModal;
