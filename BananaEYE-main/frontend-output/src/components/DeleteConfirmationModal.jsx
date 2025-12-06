import React, { useState, useRef, useEffect } from "react";
import { AlertTriangle, Trash2, ChevronRight } from "lucide-react";

const DeleteConfirmationModal = ({ tree, isOpen, onClose, onConfirm }) => {
  const [isChecked, setIsChecked] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const modalRef = useRef(null);
  const sliderRef = useRef(null);
  const sliderContainerRef = useRef(null);

  const SLIDER_THRESHOLD = 0.85;

  useEffect(() => {
    if (isOpen) {
      setIsChecked(false);
      setSliderPosition(0);
      setIsDragging(false);
      setIsDeleting(false);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, isDeleting, onClose]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target) && !isDeleting) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isDeleting, onClose]);

  const handleMouseDown = (e) => {
    if (!isChecked) return;
    setIsDragging(true);
    e.preventDefault();
  };

  const handleTouchStart = (e) => {
    if (!isChecked) return;
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !sliderContainerRef.current) return;

    const container = sliderContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const sliderWidth = sliderRef.current.offsetWidth;
    const maxPosition = containerRect.width - sliderWidth;

    let newPosition = e.clientX - containerRect.left - sliderWidth / 2;
    newPosition = Math.max(0, Math.min(newPosition, maxPosition));

    setSliderPosition(newPosition);

  };

  const handleTouchMove = (e) => {
    if (!isDragging || !sliderContainerRef.current) return;

    const container = sliderContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const sliderWidth = sliderRef.current.offsetWidth;
    const maxPosition = containerRect.width - sliderWidth;

    const touch = e.touches[0];
    let newPosition = touch.clientX - containerRect.left - sliderWidth / 2;
    newPosition = Math.max(0, Math.min(newPosition, maxPosition));

    setSliderPosition(newPosition);

    // Check if threshold is reached
    
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const containerWidth = sliderContainerRef.current.offsetWidth;
    const sliderWidth = sliderRef.current.offsetWidth;
    const maxPosition = containerWidth - sliderWidth;

  // ✔️ Trigger delete AFTER releasing
    if (sliderPosition / maxPosition >= SLIDER_THRESHOLD) {
      handleDelete();
    } else {
      setSliderPosition(0);
    }
    };
    
  const handleTouchEnd = () => {
    if (!isDragging) return;
      setIsDragging(false);

    const containerWidth = sliderContainerRef.current.offsetWidth;
    const sliderWidth = sliderRef.current.offsetWidth;
    const maxPosition = containerWidth - sliderWidth;

  // ✔️ Trigger delete AFTER releasing
    if (sliderPosition / maxPosition >= SLIDER_THRESHOLD) {
      handleDelete();
    } else {
      setSliderPosition(0);
    }
  };


  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, sliderPosition]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(tree.id);
    } catch (error) {
      console.error("Delete failed:", error);
      setIsDeleting(false);
      setSliderPosition(0);
    }
  };

  if (!isOpen || !tree) return null;

  const sliderProgress = sliderContainerRef.current
    ? (sliderPosition / (sliderContainerRef.current.offsetWidth - (sliderRef.current?.offsetWidth || 60))) * 100
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl w-full max-w-md max-h-[95vh] shadow-2xl overflow-hidden animate-in flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 sm:p-6 flex-shrink-0">
          <div className="flex flex-col items-center">
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-3 sm:p-4 mb-2 sm:mb-3">
              <Trash2 size={28} className="text-white sm:w-8 sm:h-8" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white text-center">Delete Plantation</h2>
            <p className="text-red-100 text-center text-xs sm:text-sm mt-1">This action cannot be undone</p>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
          {/* Tree Information */}
          <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 rounded-r-lg">
            <div className="flex items-start gap-2 sm:gap-3">
              <AlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5 sm:w-5 sm:h-5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-semibold text-red-800 mb-2">
                  You are about to permanently delete:
                </p>
                <div className="space-y-1 text-xs sm:text-sm text-red-700">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">Plantation:</span>
                    <span className="font-bold">{tree.name}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">Status:</span>
                    <span className={`font-medium ${tree.blackSigatokaInfection === 'infected' ? 'text-red-600' : 'text-green-600'}`}>
                      {tree.blackSigatokaInfection?.toUpperCase()}
                    </span>
                  </div>
                  {tree.detectionHistory && tree.detectionHistory.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">Detection Records:</span>
                      <span className="font-medium">{tree.detectionHistory.length} entries</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-yellow-50 border border-yellow-200 p-3 sm:p-4 rounded-lg">
            <p className="text-xs sm:text-sm text-yellow-800 text-center font-medium">
              ⚠️ All plantation data, detection history, and yield predictions will be permanently deleted
            </p>
          </div>

          {/* Step 1: Checkbox Confirmation */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="font-semibold text-gray-800 text-xs sm:text-sm">Step 1: Acknowledge Warning</h3>
            <label className="flex items-start gap-2 sm:gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 text-red-600 border-gray-300 rounded focus:ring-2 focus:ring-red-500 cursor-pointer flex-shrink-0"
                disabled={isDeleting}
              />
              <span className="text-xs sm:text-sm text-gray-700 group-hover:text-gray-900 select-none">
                I understand that this action is <strong>permanent and irreversible</strong>. All data associated with <strong>{tree.name}</strong> will be lost forever.
              </span>
            </label>
          </div>

          {/* Step 2: Slide to Delete */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="font-semibold text-gray-800 text-xs sm:text-sm">
              Step 2: Slide to Confirm Deletion
            </h3>
            <div
              ref={sliderContainerRef}
              className={`relative h-12 sm:h-14 rounded-xl overflow-hidden transition-all ${
                isChecked
                  ? 'bg-gradient-to-r from-red-500 to-red-600 cursor-pointer'
                  : 'bg-gray-200 cursor-not-allowed'
              }`}
            >
              {/* Progress Background */}
              <div
                className="absolute inset-0 bg-red-700 transition-all duration-100"
                style={{
                  width: `${sliderProgress}%`,
                  opacity: isChecked ? 0.5 : 0
                }}
              ></div>

              {/* Slide Text */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className={`text-sm sm:text-base font-semibold transition-all ${
                  isChecked ? 'text-white' : 'text-gray-500'
                } ${sliderProgress > 50 ? 'opacity-0' : 'opacity-100'}`}>
                  {isDeleting ? 'Deleting...' : 'Slide to Delete →'}
                </span>
              </div>

              {/* Slider Button */}
              <div
                ref={sliderRef}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                className={`absolute top-1 left-1 h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center transition-all ${
                  isChecked
                    ? 'bg-white shadow-lg cursor-grab active:cursor-grabbing'
                    : 'bg-gray-300 cursor-not-allowed'
                } ${isDragging ? 'scale-105' : 'scale-100'}`}
                style={{
                  left: `${sliderPosition}px`,
                  transition: isDragging ? 'none' : 'left 0.3s ease-out, transform 0.2s'
                }}
              >
                {isDeleting ? (
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-3 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <ChevronRight
                    size={20}
                    className={`sm:w-6 sm:h-6 ${isChecked ? 'text-red-600' : 'text-gray-400'}`}
                  />
                )}
              </div>
            </div>
            {!isChecked && (
              <p className="text-[10px] sm:text-xs text-gray-500 text-center">
                Please check the box above to enable deletion
              </p>
            )}
          </div>

          {/* Cancel Button */}
          <button
            onClick={onClose}
            className="w-full py-2.5 sm:py-3 text-sm sm:text-base text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isDeleting}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;