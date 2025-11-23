import React, { useState, useEffect, useRef } from "react";
import { plantationAPI } from "../services/api";

const AddTreeModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    datePlanted: "",
    blackSigatokaInfection: "healthy",
    yieldPrediction: 0,
    position: { row: 0, col: 0 }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [existingPlantations, setExistingPlantations] = useState([]);

  const modalRef = useRef();

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        // Prevent default form submission to handle it manually
        e.preventDefault();
        const form = e.target.form;
        if (form && !loading && !isIdExists(formData.id) && !isPositionOccupied(formData.position.row, formData.position.col)) {
          handleSubmit(e);
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [loading, formData, onClose]);

  // Fetch existing plantations to check for duplicates
  useEffect(() => {
    const fetchPlantations = async () => {
      try {
        const data = await plantationAPI.getAll();
        setExistingPlantations(data);
      } catch (err) {
        console.error("Failed to fetch plantations:", err);
      }
    };
    fetchPlantations();
  }, []);

  // Auto-generate name when ID changes
  useEffect(() => {
    if (formData.id.trim()) {
      const generatedName = `B${formData.id}`;
      setFormData(prev => ({
        ...prev,
        name: generatedName
      }));
    }
  }, [formData.id]);

  // Check if ID already exists
  const isIdExists = (id) => {
    return existingPlantations.some(plantation => plantation.id === id);
  };

  // Check if position is already occupied
  const isPositionOccupied = (row, col) => {
    return existingPlantations.some(plantation => 
      plantation.position.row === row && plantation.position.col === col
    );
  };

  // Calculate next available position in the expanding grid
  const getNextAvailablePosition = () => {
    const totalTrees = existingPlantations.length;
    const baseCols = 4;
    
    // Start from the logical next position
    let row = Math.floor(totalTrees / baseCols);
    let col = totalTrees % baseCols;
    
    // Keep looking for an available position
    while (isPositionOccupied(row, col)) {
      col++;
      if (col >= baseCols) {
        col = 0;
        row++;
      }
      // Safety check to prevent infinite loop
      if (row > 100) break; // Maximum 100 rows
    }
    
    return { row, col };
  };

  // Use it in your form initialization
  useEffect(() => {
    if (existingPlantations.length > 0) {
      const nextPos = getNextAvailablePosition();
      setFormData(prev => ({
        ...prev,
        position: nextPos
      }));
    }
  }, [existingPlantations]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");

    // Validate ID
    if (!formData.id.trim()) {
      setError("Plantation ID is required");
      setLoading(false);
      return;
    }

    // Check if ID already exists
    if (isIdExists(formData.id)) {
      setError(`Plantation ID "${formData.id}" already exists. Please use a different ID.`);
      setLoading(false);
      return;
    }

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
      // Add current date and convert numbers
      const plantationData = {
        ...formData,
        date: new Date().toISOString(),
        yieldPrediction: parseInt(formData.yieldPrediction) || 0,
        position: {
          row: parseInt(formData.position.row) || 0,
          col: parseInt(formData.position.col) || 0
        }
      };

      await plantationAPI.create(plantationData);
      onSuccess();
    } catch (err) {
      setError(err.message || "Failed to create plantation");
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
  };

  // Get today's date in YYYY-MM-DD format for the date input
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div 
        ref={modalRef}
        className="bg-white p-6 rounded-xl w-96 shadow-xl"
      >
        <h2 className="text-xl font-bold text-center mb-4">Add New Tree</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Plantation ID *</label>
            <input
              type="text"
              required
              className={`w-full p-2 border rounded ${
                formData.id && isIdExists(formData.id) ? 'border-red-500 bg-red-50' : ''
              }`}
              value={formData.id}
              onChange={(e) => handleChange('id', e.target.value)}
              placeholder="e.g., 21, 22, 23"
            />
            {formData.id && isIdExists(formData.id) && (
              <p className="text-red-500 text-xs mt-1">
                ❌ ID already exists. Choose a different ID.
              </p>
            )}
            {formData.id && !isIdExists(formData.id) && (
              <p className="text-green-500 text-xs mt-1">
                ✅ ID is available
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              required
              className="w-full p-2 border rounded bg-gray-50"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Auto-generated from ID"
            />
            <p className="text-gray-500 text-xs mt-1">
              Auto-generated as B{formData.id || 'XX'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date Planted *</label>
            <input
              type="date"
              required
              className="w-full p-2 border rounded"
              value={formData.datePlanted}
              onChange={(e) => handleChange('datePlanted', e.target.value)}
              max={getTodayDate()} // Can't select future dates
            />
          </div>

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
                placeholder="Any row number"
              />
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
                placeholder="Any column number"
              />
            </div>
          </div>

          {isPositionOccupied(formData.position.row, formData.position.col) && (
            <div className="bg-orange-100 border border-orange-400 text-orange-700 px-3 py-2 rounded text-sm">
              ⚠️ Position (Row {formData.position.row}, Column {formData.position.col}) is occupied
            </div>
          )}

          <div className="text-xs text-gray-500">
            💡 Next available position: Row {getNextAvailablePosition().row}, Column {getNextAvailablePosition().col}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Initial Status</label>
            <select
              className="w-full p-2 border rounded"
              value={formData.blackSigatokaInfection}
              onChange={(e) => handleChange('blackSigatokaInfection', e.target.value)}
            >
              <option value="healthy">Healthy</option>
              <option value="infected">Infected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Yield Prediction</label>
            <input
              type="number"
              min="0"
              step="1"
              className="w-full p-2 border rounded"
              value={formData.yieldPrediction}
              onChange={(e) => handleChange('yieldPrediction', e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-colors"
              disabled={loading || (formData.id && isIdExists(formData.id)) || isPositionOccupied(formData.position.row, formData.position.col)}
            >
              {loading ? "Creating..." : "Create Plantation"}
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
  );
};

export default AddTreeModal;