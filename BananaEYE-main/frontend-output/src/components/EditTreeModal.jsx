import React, { useState, useEffect, useRef } from "react";
import { plantationAPI } from "../services/api";
import { AlertTriangle, MapPin, Calendar, Activity } from "lucide-react";

const EditTreeModal = ({ tree, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    blackSigatokaInfection: "healthy"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showInfectionWarning, setShowInfectionWarning] = useState(false);
  const [pendingInfectionStatus, setPendingInfectionStatus] = useState("");
  const [originalInfectionStatus, setOriginalInfectionStatus] = useState("");

  const modalRef = useRef();
  const infectionWarningRef = useRef();

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showInfectionWarning && infectionWarningRef.current) {
        // Don't close if clicking inside the warning modal
        if (!infectionWarningRef.current.contains(event.target)) {
          setShowInfectionWarning(false);
          setPendingInfectionStatus("");
        }
      } else if (!showInfectionWarning && modalRef.current) {
        // Only close main modal if warning is not showing and clicking outside main modal
        if (!modalRef.current.contains(event.target)) {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showInfectionWarning, onClose]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        if (showInfectionWarning) {
          setShowInfectionWarning(false);
          setPendingInfectionStatus("");
        } else {
          onClose();
        }
      } else if (e.key === 'Enter' && !showInfectionWarning && !loading) {
        handleSubmit();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [showInfectionWarning, loading, onClose]);

  // Initialize form data
  useEffect(() => {
    if (tree) {
      setFormData({
        blackSigatokaInfection: tree.blackSigatokaInfection || "healthy"
      });
      setOriginalInfectionStatus(tree.blackSigatokaInfection || "healthy");
    }
  }, [tree]);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const updateData = {
        blackSigatokaInfection: formData.blackSigatokaInfection
      };

      await plantationAPI.update(tree.id, updateData);
      onSuccess();
    } catch (err) {
      setError(err.message || "Failed to update plantation");
    } finally {
      setLoading(false);
    }
  };

  const handleInfectionChange = (newStatus) => {
    // Only show warning if changing from original status
    if (newStatus !== originalInfectionStatus) {
      setPendingInfectionStatus(newStatus);
      setShowInfectionWarning(true);
      // Don't change formData yet - wait for confirmation
    } else {
      // If selecting back to original, no warning needed
      setFormData(prev => ({ ...prev, blackSigatokaInfection: newStatus }));
    }
  };

  const handleInfectionConfirm = () => {
    // Apply the pending status change to the form
    setFormData(prev => ({ ...prev, blackSigatokaInfection: pendingInfectionStatus }));
    // Close the warning modal but keep the main modal open
    setShowInfectionWarning(false);
    setPendingInfectionStatus("");
    // The actual database update happens when user clicks "Save Changes"
  };

  const handleInfectionCancel = () => {
    setShowInfectionWarning(false);
    setPendingInfectionStatus("");
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCoordinate = (coord) => {
    return typeof coord === 'number' ? coord.toFixed(6) : coord;
  };

  if (!tree) return null;

  return (
    <>
      {/* Infection Status Warning Modal */}
      {showInfectionWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div 
            ref={infectionWarningRef}
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl mx-4 overflow-hidden animate-in"
          >
            {/* Warning Header */}
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6">
              <div className="flex flex-col items-center">
                <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-4 mb-3">
                  <AlertTriangle size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white text-center">Manual Override Warning</h2>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-700 text-center mb-2">
                You are about to manually change the infection status from
              </p>
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className={`font-bold ${originalInfectionStatus === 'infected' ? 'text-red-600' : 'text-green-600'}`}>
                  {originalInfectionStatus.toUpperCase()}
                </span>
                <span className="text-gray-400">→</span>
                <span className={`font-bold ${pendingInfectionStatus === 'infected' ? 'text-red-600' : 'text-green-600'}`}>
                  {pendingInfectionStatus.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-600 text-center mb-6 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                This action bypasses the AI detection system. Only proceed if you have manually verified this change through physical inspection.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleInfectionConfirm}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-lg hover:from-yellow-600 hover:to-orange-600 font-medium transition-all shadow-lg hover:shadow-xl transform active:scale-95"
                >
                  Confirm Change
                </button>
                <button
                  onClick={handleInfectionCancel}
                  className="flex-1 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Edit Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div 
          ref={modalRef}
          className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
            <h2 className="text-2xl font-bold text-white text-center">Edit Plantation {tree.name}</h2>
            <p className="text-green-50 text-center text-sm mt-1">Update infection status</p>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-4 flex items-start gap-2">
                <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-6">
              {/* Current Information Card */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Activity size={18} className="text-gray-600" />
                  Current Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">Plantation ID</div>
                    <div className="font-semibold text-gray-800">{tree.name}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">Status</div>
                    <div className={`font-semibold ${tree.blackSigatokaInfection === 'infected' ? 'text-red-600' : 'text-green-600'}`}>
                      {tree.blackSigatokaInfection?.toUpperCase()}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">Yield Prediction</div>
                    <div className="font-semibold text-gray-800">{tree.yieldPrediction}%</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">Date Planted</div>
                    <div className="font-semibold text-gray-800 text-xs">{formatDateForDisplay(tree.datePlanted)}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm col-span-2">
                    <div className="text-xs text-gray-500 mb-1">Coordinates</div>
                    <div className="font-mono text-sm text-gray-800">
                      {formatCoordinate(tree.position?.lat)}, {formatCoordinate(tree.position?.lon)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Infection Status - Radio Buttons */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-yellow-600" />
                  Black Sigatoka Infection Status
                  {formData.blackSigatokaInfection !== originalInfectionStatus && (
                    <span className="ml-auto text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Modified</span>
                  )}
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {/* Healthy Option */}
                  <label
                    className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.blackSigatokaInfection === 'healthy'
                        ? 'border-green-500 bg-green-50 shadow-md'
                        : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="infectionStatus"
                      value="healthy"
                      checked={formData.blackSigatokaInfection === 'healthy'}
                      onChange={(e) => handleInfectionChange(e.target.value)}
                      className="w-5 h-5 text-green-600 focus:ring-2 focus:ring-green-500"
                    />
                    <div className="ml-3">
                      <div className="font-semibold text-green-700">Healthy</div>
                      <div className="text-xs text-green-600">No infection detected</div>
                    </div>
                    {formData.blackSigatokaInfection === 'healthy' && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </label>

                  {/* Infected Option */}
                  <label
                    className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.blackSigatokaInfection === 'infected'
                        ? 'border-red-500 bg-red-50 shadow-md'
                        : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="infectionStatus"
                      value="infected"
                      checked={formData.blackSigatokaInfection === 'infected'}
                      onChange={(e) => handleInfectionChange(e.target.value)}
                      className="w-5 h-5 text-red-600 focus:ring-2 focus:ring-red-500"
                    />
                    <div className="ml-3">
                      <div className="font-semibold text-red-700">Infected</div>
                      <div className="text-xs text-red-600">Black Sigatoka present</div>
                    </div>
                    {formData.blackSigatokaInfection === 'infected' && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></div>
                    )}
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  className="flex-1 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 font-medium transition-all shadow-lg hover:shadow-xl transform active:scale-95 disabled:transform-none"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditTreeModal;