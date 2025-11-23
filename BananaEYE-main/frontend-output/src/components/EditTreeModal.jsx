import React, { useState, useEffect, useRef } from "react";
import { plantationAPI } from "../services/api";
import { AlertTriangle } from "lucide-react";

const EditTreeModal = ({ tree, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    datePlanted: "",
    blackSigatokaInfection: "healthy",
    yieldPrediction: 0,
    position: { row: 0, col: 0 }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [existingPlantations, setExistingPlantations] = useState([]);
  const [showInfectionWarning, setShowInfectionWarning] = useState(false);
  const [showYieldWarning, setShowYieldWarning] = useState(false);
  const [originalInfectionStatus, setOriginalInfectionStatus] = useState("");
  const [originalYield, setOriginalYield] = useState(0);
  const [originalDatePlanted, setOriginalDatePlanted] = useState("");

  const modalRef = useRef();
  const infectionWarningRef = useRef();
  const yieldWarningRef = useRef();

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showInfectionWarning && infectionWarningRef.current && !infectionWarningRef.current.contains(event.target)) {
        setShowInfectionWarning(false);
        setFormData(prev => ({
          ...prev,
          blackSigatokaInfection: originalInfectionStatus
        }));
      } else if (showYieldWarning && yieldWarningRef.current && !yieldWarningRef.current.contains(event.target)) {
        setShowYieldWarning(false);
        setFormData(prev => ({
          ...prev,
          yieldPrediction: originalYield
        }));
      } else if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showInfectionWarning, showYieldWarning, onClose, originalInfectionStatus, originalYield]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        if (showInfectionWarning) {
          setShowInfectionWarning(false);
          setFormData(prev => ({
            ...prev,
            blackSigatokaInfection: originalInfectionStatus
          }));
        } else if (showYieldWarning) {
          setShowYieldWarning(false);
          setFormData(prev => ({
            ...prev,
            yieldPrediction: originalYield
          }));
        } else {
          onClose();
        }
      } else if (e.key === 'Enter' && !showInfectionWarning && !showYieldWarning) {
        // Only submit if we're in the main form and not in a warning modal
        const form = e.target.form;
        if (form && !loading && !isPositionOccupied(formData.position.row, formData.position.col)) {
          handleSubmit(e);
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [showInfectionWarning, showYieldWarning, loading, formData, originalInfectionStatus, originalYield, onClose]);

  // Fetch existing plantations to check for position conflicts
  useEffect(() => {
    const fetchPlantations = async () => {
      try {
        const data = await plantationAPI.getAll();
        setExistingPlantations(data.filter(p => p.id !== tree.id)); // Exclude current tree
      } catch (err) {
        console.error("Failed to fetch plantations:", err);
      }
    };
    fetchPlantations();
  }, [tree.id]);

  // Initialize form data with tree data
  useEffect(() => {
    if (tree) {
      setFormData({
        datePlanted: tree.datePlanted || "",
        blackSigatokaInfection: tree.blackSigatokaInfection || "healthy",
        yieldPrediction: tree.yieldPrediction || 0,
        position: tree.position || { row: 0, col: 0 }
      });
      setOriginalInfectionStatus(tree.blackSigatokaInfection || "healthy");
      setOriginalYield(tree.yieldPrediction || 0);
      setOriginalDatePlanted(tree.datePlanted || "");
    }
  }, [tree]);

  // Check if position is already occupied (excluding current tree)
  const isPositionOccupied = (row, col) => {
    return existingPlantations.some(plantation => 
      plantation.position.row === row && plantation.position.col === col
    );
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");

    // Validate date
    if (!formData.datePlanted) {
      setError("Date planted is required");
      setLoading(false);
      return;
    }

    // Check if position is occupied
    if (isPositionOccupied(formData.position.row, formData.position.col)) {
      setError(`Position (Row ${formData.position.row}, Column ${formData.position.col}) is already occupied. Please choose a different position.`);
      setLoading(false);
      return;
    }

    try {
      // Prepare update data
      const updateData = {
        datePlanted: formData.datePlanted,
        blackSigatokaInfection: formData.blackSigatokaInfection,
        yieldPrediction: parseInt(formData.yieldPrediction) || 0,
        position: {
          row: parseInt(formData.position.row) || 0,
          col: parseInt(formData.position.col) || 0
        }
      };

      await plantationAPI.update(tree.id, updateData);
      onSuccess();
    } catch (err) {
      setError(err.message || "Failed to update plantation");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    // Show warning if infection status is being changed
    if (field === 'blackSigatokaInfection' && value !== originalInfectionStatus) {
      setShowInfectionWarning(true);
    }

    // Show warning if yield prediction is being changed significantly
    if (field === 'yieldPrediction' && Math.abs(parseInt(value) - originalYield) > 10) {
      setShowYieldWarning(true);
    }
  };

  const handleInfectionConfirm = () => {
    setShowInfectionWarning(false);
  };

  const handleYieldConfirm = () => {
    setShowYieldWarning(false);
  };

  // Get today's date in YYYY-MM-DD format for the date input
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Format date for display (convert from YYYY-MM-DD to readable format)
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!tree) return null;

  return (
    <>
      {/* Infection Status Warning Modal */}
      {showInfectionWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100]">
          <div 
            ref={infectionWarningRef}
            className="bg-white p-6 rounded-xl w-80 shadow-2xl mx-4"
          >
            <div className="flex items-center mb-4">
              <AlertTriangle className="text-yellow-500 mr-3" size={24} />
              <h3 className="text-lg font-bold">Manual Infection Status Change</h3>
            </div>
            <p className="text-gray-700 mb-4">
              Changing this manually is outside of the system automation function. 
              Only change this if the AI detection result is proven wrong by manual inspection.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInfectionConfirm}
                className="flex-1 bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition-colors"
              >
                I Understand - Continue
              </button>
              <button
                onClick={() => {
                  setShowInfectionWarning(false);
                  setFormData(prev => ({
                    ...prev,
                    blackSigatokaInfection: originalInfectionStatus
                  }));
                }}
                className="flex-1 py-2 text-gray-600 border border-gray-300 rounded-lg hover:text-gray-800 transition-colors"
              >
                Cancel Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yield Prediction Warning Modal */}
      {showYieldWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100]">
          <div 
            ref={yieldWarningRef}
            className="bg-white p-6 rounded-xl w-80 shadow-2xl mx-4"
          >
            <div className="flex items-center mb-4">
              <AlertTriangle className="text-yellow-500 mr-3" size={24} />
              <h3 className="text-lg font-bold">Manual Yield Prediction Change</h3>
            </div>
            <p className="text-gray-700 mb-4">
              Changing this manually is outside of the system automation function. 
              Only change this if the AI prediction result is proven wrong by actual yield data.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleYieldConfirm}
                className="flex-1 bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition-colors"
              >
                I Understand - Continue
              </button>
              <button
                onClick={() => {
                  setShowYieldWarning(false);
                  setFormData(prev => ({
                    ...prev,
                    yieldPrediction: originalYield
                  }));
                }}
                className="flex-1 py-2 text-gray-600 border border-gray-300 rounded-lg hover:text-gray-800 transition-colors"
              >
                Cancel Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Edit Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div 
          ref={modalRef}
          className="bg-white p-6 rounded-xl w-96 shadow-xl mx-4"
        >
          <h2 className="text-xl font-bold text-center mb-4">Edit {tree.name}</h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Tree Info */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-semibold text-sm mb-2">Current Information</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>ID: <span className="font-medium">{tree.id}</span></div>
                <div>Name: <span className="font-medium">{tree.name}</span></div>
                <div>Status: <span className={`font-medium ${tree.blackSigatokaInfection === 'infected' ? 'text-red-600' : 'text-green-600'}`}>
                  {tree.blackSigatokaInfection}
                </span></div>
                <div>Yield: <span className="font-medium">{tree.yieldPrediction}</span></div>
                <div className="col-span-2">
                  Date Planted: <span className="font-medium">{formatDateForDisplay(originalDatePlanted)}</span>
                </div>
                <div className="col-span-2">
                  Position: <span className="font-medium">Row {tree.position?.row}, Col {tree.position?.col}</span>
                </div>
              </div>
            </div>

            {/* Date Planted */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Date Planted *
                {formData.datePlanted !== originalDatePlanted && (
                  <span className="ml-2 text-blue-600 text-xs">(Changed)</span>
                )}
              </label>
              <input
                type="date"
                required
                className="w-full p-2 border rounded"
                value={formData.datePlanted}
                onChange={(e) => handleChange('datePlanted', e.target.value)}
                max={getTodayDate()}
              />
              <p className="text-xs text-gray-500 mt-1">
                Current: <span className="font-medium">{formatDateForDisplay(originalDatePlanted)}</span>
              </p>
            </div>

            {/* Position */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Row</label>
                <input
                  type="number"
                  min="0"
                  className={`w-full p-2 border rounded ${
                    isPositionOccupied(formData.position.row, formData.position.col) ? 'border-orange-500 bg-orange-50' : ''
                  }`}
                  value={formData.position.row}
                  onChange={(e) => handleChange('position.row', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current: <span className="font-medium">{tree.position?.row}</span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Column</label>
                <input
                  type="number"
                  min="0"
                  className={`w-full p-2 border rounded ${
                    isPositionOccupied(formData.position.row, formData.position.col) ? 'border-orange-500 bg-orange-50' : ''
                  }`}
                  value={formData.position.col}
                  onChange={(e) => handleChange('position.col', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current: <span className="font-medium">{tree.position?.col}</span>
                </p>
              </div>
            </div>

            {isPositionOccupied(formData.position.row, formData.position.col) && (
              <div className="bg-orange-100 border border-orange-400 text-orange-700 px-3 py-2 rounded text-sm">
                ⚠️ Position (Row {formData.position.row}, Column {formData.position.col}) is occupied
              </div>
            )}

            {/* Infection Status */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Infection Status
                {formData.blackSigatokaInfection !== originalInfectionStatus && (
                  <span className="ml-2 text-yellow-600 text-xs">(Changed)</span>
                )}
              </label>
              <select
                className="w-full p-2 border rounded"
                value={formData.blackSigatokaInfection}
                onChange={(e) => handleChange('blackSigatokaInfection', e.target.value)}
              >
                <option value="healthy">Healthy</option>
                <option value="infected">Infected</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Current: <span className={`font-medium ${originalInfectionStatus === 'infected' ? 'text-red-600' : 'text-green-600'}`}>
                  {originalInfectionStatus}
                </span>
              </p>
            </div>

            {/* Yield Prediction */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Yield Prediction
                {Math.abs(formData.yieldPrediction - originalYield) > 10 && (
                  <span className="ml-2 text-yellow-600 text-xs">(Changed)</span>
                )}
              </label>
              <input
                type="number"
                min="0"
                step="1"
                className="w-full p-2 border rounded"
                value={formData.yieldPrediction}
                onChange={(e) => handleChange('yieldPrediction', e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Current: <span className="font-medium">{originalYield}</span>
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-colors"
                disabled={loading || isPositionOccupied(formData.position.row, formData.position.col)}
              >
                {loading ? "Updating..." : "Update Plantation"}
              </button>
              <button
                type="button"
                className="flex-1 py-2 text-gray-600 border border-gray-300 rounded-lg hover:text-gray-800 transition-colors"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditTreeModal;