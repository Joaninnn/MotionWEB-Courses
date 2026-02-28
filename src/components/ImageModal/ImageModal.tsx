'use client'
import React, { useCallback } from 'react';
import Image from 'next/image';
import styles from './ImageModal.module.scss';

interface ImageModalProps {
  imageUrl: string;
  alt: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, alt, onClose }) => {
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [handleKeyDown]);

  return (
    <div 
      className={styles.modalOverlay}
      onClick={handleBackdropClick}
    >
      <div className={styles.modalContent}>
        <button 
          className={styles.closeButton}
          onClick={onClose}
          title="Закрыть (Esc)"
        >
          ×
        </button>
        <div className={styles.imageContainer}>
          <Image
            src={imageUrl}
            alt={alt}
            fill
            className={styles.modalImage}
            style={{ objectFit: 'contain' }}
            sizes="(max-width: 768px) 100vw, 90vw"
          />
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
