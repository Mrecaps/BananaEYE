import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Calendar, Image, X, Maximize2 } from 'lucide-react';
import { API_BASE } from '../config';

const ImageModal = ({ tree, images, isOpen, onClose, onParentClose }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const modalRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (selectedImage) {
          setSelectedImage(null);
        } else {
          handleClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, selectedImage]);

  // Prevent body scroll and trap focus
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.pointerEvents = 'none';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.pointerEvents = 'auto';
    };
  }, [isOpen]);

  const openInNewTab = (imgUrl) => {
    const fullUrl = `${API_BASE}${imgUrl}`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  const handleClose = () => {
    setSelectedImage(null);
    onClose();
  };

  const handleBackdropClick = (e) => {
    // Check if click is on backdrop (not content)
    if (e.target === e.currentTarget || 
        e.target.classList.contains('modal-backdrop')) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      {/* Backdrop with higher z-index */}
      <div 
        className="fixed inset-0 z-[100] modal-backdrop"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          pointerEvents: 'auto'
        }}
        onClick={handleBackdropClick}
      >
        {/* Image Gallery Modal */}
        {!selectedImage && (
          <div 
            ref={modalRef}
            className="relative bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] mx-auto mt-8 overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ pointerEvents: 'auto' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 sm:p-6 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold">Tree {tree.name} - Photos</h3>
                <p className="text-sm opacity-90 mt-1">
                  {images.length} inspection photo{images.length !== 1 ? 's' : ''} • Plantation ID: {tree.id}
                </p>
              </div>
              <button 
                onClick={handleClose}
                className="p-2 hover:bg-white/20 rounded-full transition flex-shrink-0"
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>

            {/* Image Grid */}
            <div className="overflow-y-auto p-4 sm:p-6 flex-1">
              {images.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {images.map((img, index) => (
                    <div 
                      key={index} 
                      className="relative group rounded-xl overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition shadow-md hover:shadow-xl bg-gray-100 cursor-pointer"
                      onClick={() => setSelectedImage(img)}
                    >
                      <img
                        src={`${API_BASE}${img.url}`}
                        alt={`Tree ${tree.name} - ${img.status}`}
                        className="w-full h-64 object-cover"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not available%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openInNewTab(img.url);
                        }}
                        className="absolute top-3 left-3 bg-black/60 hover:bg-black/80 text-white p-2 rounded-lg backdrop-blur-sm transition z-10"
                        title="Open in new tab"
                        aria-label="Open in new tab"
                      >
                        <Maximize2 size={16} />
                      </button>
                      
                      <div className="absolute top-3 right-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg ${
                          img.status === 'infected' 
                            ? 'bg-red-500 text-white' 
                            : 'bg-green-500 text-white'
                        }`}>
                          {img.status === 'infected' ? '⚠️ INFECTED' : '✓ HEALTHY'}
                        </span>
                      </div>
                      
                      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg">
                        <div className="flex items-center gap-2 text-white text-xs">
                          <Calendar size={12} />
                          <span>{new Date(img.uploadDate).toLocaleDateString('en-PH')}</span>
                        </div>
                      </div>
                      
                      {img.yieldPrediction !== undefined && (
                        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg">
                          <div className="text-xs font-bold text-gray-800">
                            Yield: {img.yieldPrediction}%
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Image size={64} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg font-medium">No photos available for Tree {tree.name}</p>
                  <p className="text-gray-400 text-sm mt-2">Photos will appear here after AI detection scans</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Full Image Viewer */}
        {selectedImage && (
          <div 
            className="relative max-w-7xl max-h-full w-full h-full mx-auto flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition z-10"
              aria-label="Close image viewer"
            >
              <X size={24} />
            </button>

            <button
              onClick={() => openInNewTab(selectedImage.url)}
              className="absolute top-4 left-4 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition z-10"
              title="Open in new tab"
              aria-label="Open in new tab"
            >
              <Maximize2 size={20} />
            </button>
            
            <img
              src={`${API_BASE}${selectedImage.url}`}
              alt="Full view"
              className="max-w-full max-h-[80vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            
            <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-sm text-white p-4 rounded-lg mt-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    selectedImage.status === 'infected' ? 'bg-red-500' : 'bg-green-500'
                  }`}>
                    {selectedImage.status.toUpperCase()}
                  </span>
                  <span className="text-sm">{selectedImage.originalName || 'Inspection Photo'}</span>
                </div>
                <div className="text-right text-sm">
                  <p>Captured: {new Date(selectedImage.uploadDate).toLocaleString('en-PH')}</p>
                  {selectedImage.yieldPrediction !== undefined && (
                    <p>Yield Prediction: {selectedImage.yieldPrediction}%</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );

  return ReactDOM.createPortal(
    modalContent,
    document.body
  );
};

export default ImageModal;