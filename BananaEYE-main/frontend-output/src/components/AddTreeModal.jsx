import React, { useState, useEffect, useRef } from "react";
import { X, MapPin, Calendar, Leaf, TrendingUp, CheckCircle2, AlertCircle, TreePalm, Sparkles, Navigation } from "lucide-react";

// Plantation API - Replace API_BASE with your actual base URL
const API_BASE = "http://192.168.8.109:8000";

const plantationAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/api/plantations`);
    if (!response.ok) throw new Error("Failed to fetch plantations");
    return await response.json();
  },
  create: async (data) => {
    const response = await fetch(`${API_BASE}/api/plantations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create plantation");
    return await response.json();
  }
};

const AddTreeModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    datePlanted: "",
    blackSigatokaInfection: "healthy",
    yieldPrediction: 0,
    coordinates: { x: "", y: "" }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [existingPlantations, setExistingPlantations] = useState([]);
  const [validationState, setValidationState] = useState({
    idValid: null,
    coordinatesValid: null
  });
  const [focusedField, setFocusedField] = useState(null);

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
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [onClose]);

  // Fetch existing plantations
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

  // Validate ID and coordinates
  useEffect(() => {
    const idExists = existingPlantations.some(p => {
      const existingId = p.id || p._id;
      return existingId && existingId.toString().trim().toLowerCase() === formData.id.trim().toLowerCase();
    });
    
    const tolerance = 0.00001;
    const coordsOccupied = existingPlantations.some(p => {
      if (!formData.coordinates.x || !formData.coordinates.y) return false;
      
      const xVal = parseFloat(formData.coordinates.x);
      const yVal = parseFloat(formData.coordinates.y);
      
      if (isNaN(xVal) || isNaN(yVal)) return false;
      
      if (p.position && p.position.lat !== undefined && p.position.lon !== undefined) {
        const latDiff = Math.abs(p.position.lat - xVal);
        const lonDiff = Math.abs(p.position.lon - yVal);
        return latDiff < tolerance && lonDiff < tolerance;
      }
      if (p.coordinates && p.coordinates.x !== undefined && p.coordinates.y !== undefined) {
        const xDiff = Math.abs(p.coordinates.x - xVal);
        const yDiff = Math.abs(p.coordinates.y - yVal);
        return xDiff < tolerance && yDiff < tolerance;
      }
      return false;
    });

    setValidationState({
      idValid: formData.id ? !idExists : null,
      coordinatesValid: !coordsOccupied
    });
  }, [formData.id, formData.coordinates, existingPlantations]);

  // Suggest next available coordinates
  const suggestNextCoordinates = () => {
    if (existingPlantations.length === 0) return { x: 14.153555, y: 121.262457 };
    
    const tolerance = 0.00001;
    
    const isOccupied = (x, y) => {
      return existingPlantations.some(p => {
        if (p.position && p.position.lat !== undefined && p.position.lon !== undefined) {
          const latDiff = Math.abs(p.position.lat - x);
          const lonDiff = Math.abs(p.position.lon - y);
          return latDiff < tolerance && lonDiff < tolerance;
        }
        if (p.coordinates && p.coordinates.x !== undefined && p.coordinates.y !== undefined) {
          const xDiff = Math.abs(p.coordinates.x - x);
          const yDiff = Math.abs(p.coordinates.y - y);
          return xDiff < tolerance && yDiff < tolerance;
        }
        return false;
      });
    };
    
    const lastPlantation = existingPlantations[existingPlantations.length - 1];
    let startX = 14.153555;
    let startY = 121.262457;
    
    if (lastPlantation) {
      if (lastPlantation.position) {
        startX = lastPlantation.position.lat;
        startY = lastPlantation.position.lon;
      } else if (lastPlantation.coordinates) {
        startX = lastPlantation.coordinates.x;
        startY = lastPlantation.coordinates.y;
      }
    }
    
    const increment = 0.001;
    for (let offset = 0; offset < 100; offset++) {
      const testX = startX + (offset * increment);
      const testY = startY + (offset * increment);
      if (!isOccupied(testX, testY)) {
        return { x: parseFloat(testX.toFixed(6)), y: parseFloat(testY.toFixed(6)) };
      }
    }
    
    return { x: startX + 0.1, y: startY + 0.1 };
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    if (!formData.id.trim()) {
      setError("Plantation ID is required");
      setLoading(false);
      return;
    }

    if (validationState.idValid === false) {
      setError(`Plantation ID "${formData.id}" already exists`);
      setLoading(false);
      return;
    }

    if (!formData.datePlanted) {
      setError("Date planted is required");
      setLoading(false);
      return;
    }

    if (!formData.coordinates.x || !formData.coordinates.y) {
      setError("Location coordinates are required");
      setLoading(false);
      return;
    }

    if (!validationState.coordinatesValid) {
      setError(`Location (${formData.coordinates.x}, ${formData.coordinates.y}) is already occupied`);
      setLoading(false);
      return;
    }

    try {
      const plantationData = {
        ...formData,
        date: new Date().toISOString(),
        yieldPrediction: parseInt(formData.yieldPrediction) || 0,
        position: {
          lat: parseFloat(formData.coordinates.x) || 0,
          lon: parseFloat(formData.coordinates.y) || 0
        }
      };

      delete plantationData.coordinates;

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
    if (error) setError("");
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const applySuggestedCoordinates = () => {
    const suggested = suggestNextCoordinates();
    setFormData(prev => ({
      ...prev,
      coordinates: {
        x: suggested.x.toString(),
        y: suggested.y.toString()
      }
    }));
  };

  const suggestedCoords = suggestNextCoordinates();
  const isFormValid = validationState.idValid && validationState.coordinatesValid && formData.datePlanted && formData.coordinates.x && formData.coordinates.y;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4 animate-fadeIn">
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col animate-slideUp"
      >
        {/* Header with Gradient */}
        <div className="relative bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 p-6 rounded-t-2xl overflow-hidden">
          {/* Background Decorations */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>
          <TreePalm className="absolute top-4 right-20 text-white/20 animate-float" size={64} />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/90 hover:bg-white/20 rounded-xl p-2 transition-all hover:rotate-90 duration-300 z-10"
            disabled={loading}
          >
            <X size={20} />
          </button>
          
          <div className="relative flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
              <TreePalm className="text-white" size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                Add New Tree
                <Sparkles className="animate-pulse" size={20} />
              </h2>
              <p className="text-green-100 text-sm mt-1">Plant a new tree in your plantation</p>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 rounded-r-xl shadow-sm animate-shake">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-5">
            {/* Plantation ID */}
            <div className={`transition-all duration-300 ${focusedField === 'id' ? 'scale-[1.02]' : ''}`}>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${validationState.idValid ? 'bg-green-500' : validationState.idValid === false ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                Plantation ID <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <input
                  type="number"
                  required
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all outline-none text-lg font-medium ${
                    validationState.idValid === false
                      ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                      : validationState.idValid === true
                      ? 'border-green-300 bg-green-50 focus:border-green-500 focus:ring-4 focus:ring-green-100'
                      : 'border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 hover:border-gray-300'
                  }`}
                  value={formData.id}
                  onChange={(e) => handleChange('id', e.target.value)}
                  onFocus={() => setFocusedField('id')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter ID"
                />
                {validationState.idValid !== null && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 transition-all">
                    {validationState.idValid ? (
                      <CheckCircle2 className="text-green-500 animate-scaleIn" size={22} />
                    ) : (
                      <AlertCircle className="text-red-500 animate-shake" size={22} />
                    )}
                  </div>
                )}
              </div>
              {formData.id && (
                <p className={`text-xs mt-2 flex items-center gap-1.5 font-medium ${
                  validationState.idValid ? 'text-green-600' : 'text-red-600'
                }`}>
                  {validationState.idValid ? '✓ ID is available' : '✗ ID already exists'}
                </p>
              )}
            </div>

            {/* Name (Auto-generated) */}
            <div className={`transition-all duration-300 ${focusedField === 'name' ? 'scale-[1.02]' : ''}`}>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Leaf className="text-green-600" size={16} />
                Tree Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-green-50 outline-none text-lg font-medium hover:border-gray-300 transition-all"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Auto-generated"
                />
                <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 animate-pulse" size={18} />
              </div>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                Auto-generates as <span className="font-semibold text-green-600">B{formData.id || 'XX'}</span>
              </p>
            </div>
          </div>

          {/* Date Planted */}
          <div className={`transition-all duration-300 ${focusedField === 'date' ? 'scale-[1.02]' : ''}`}>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="text-blue-600" size={16} />
              Date Planted <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all hover:border-gray-300 text-base"
              value={formData.datePlanted}
              onChange={(e) => handleChange('datePlanted', e.target.value)}
              onFocus={() => setFocusedField('date')}
              onBlur={() => setFocusedField(null)}
              max={getTodayDate()}
            />
          </div>

          {/* Coordinates with Smart Suggestion */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border-2 border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <MapPin className="text-blue-600" size={16} />
                Location Coordinates <span className="text-red-500">*</span>
              </label>
            
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  className={`w-full px-3 py-2.5 border-2 rounded-lg transition-all outline-none focus:ring-4 ${
                    !validationState.coordinatesValid && formData.coordinates.x
                      ? 'border-orange-300 bg-orange-50 focus:border-orange-500 focus:ring-orange-100'
                      : 'border-white bg-white focus:border-blue-500 focus:ring-blue-100 hover:border-blue-300'
                  }`}
                  value={formData.coordinates.x}
                  onChange={(e) => handleChange('coordinates.x', e.target.value)}
                  placeholder={suggestedCoords.x.toString()}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Longitude</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  className={`w-full px-3 py-2.5 border-2 rounded-lg transition-all outline-none focus:ring-4 ${
                    !validationState.coordinatesValid && formData.coordinates.y
                      ? 'border-orange-300 bg-orange-50 focus:border-orange-500 focus:ring-orange-100'
                      : 'border-white bg-white focus:border-blue-500 focus:ring-blue-100 hover:border-blue-300'
                  }`}
                  value={formData.coordinates.y}
                  onChange={(e) => handleChange('coordinates.y', e.target.value)}
                  placeholder={suggestedCoords.y.toString()}
                />
              </div>
            </div>
            
            {!validationState.coordinatesValid && formData.coordinates.x && formData.coordinates.y && (
              <div className="mt-3 p-3 bg-orange-100 border border-orange-300 rounded-lg flex items-start gap-2 animate-shake">
                <AlertCircle className="text-orange-600 flex-shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-orange-700 font-medium">
                  This location is already occupied. Try the suggested coordinates.
                </p>
              </div>
            )}
          </div>

          {/* Health Status with Modern Toggle */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Health Status</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className={`relative px-4 py-4 rounded-xl border-2 font-semibold transition-all overflow-hidden group ${
                  formData.blackSigatokaInfection === 'healthy'
                    ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 text-green-700 shadow-lg shadow-green-200'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-green-300 hover:bg-green-50'
                }`}
                onClick={() => handleChange('blackSigatokaInfection', 'healthy')}
              >
                {formData.blackSigatokaInfection === 'healthy' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-green-500/20 animate-pulse"></div>
                )}
                <div className="relative flex items-center justify-center gap-2">
                  <CheckCircle2 size={20} />
                  Healthy
                </div>
              </button>
              <button
                type="button"
                className={`relative px-4 py-4 rounded-xl border-2 font-semibold transition-all overflow-hidden group ${
                  formData.blackSigatokaInfection === 'infected'
                    ? 'border-red-500 bg-gradient-to-br from-red-50 to-red-100 text-red-700 shadow-lg shadow-red-200'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-red-300 hover:bg-red-50'
                }`}
                onClick={() => handleChange('blackSigatokaInfection', 'infected')}
              >
                {formData.blackSigatokaInfection === 'infected' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-red-500/20 animate-pulse"></div>
                )}
                <div className="relative flex items-center justify-center gap-2">
                  <AlertCircle size={20} />
                  Infected
                </div>
              </button>
            </div>
          </div>

          {/* Yield Prediction with Visual Indicator */}
          <div className={`transition-all duration-300 ${focusedField === 'yield' ? 'scale-[1.02]' : ''}`}>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <TrendingUp className="text-purple-600" size={16} />
              Yield Prediction %
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all hover:border-gray-300"
                value={formData.yieldPrediction}
                onChange={(e) => handleChange('yieldPrediction', e.target.value)}
                onFocus={() => setFocusedField('yield')}
                onBlur={() => setFocusedField(null)}
                placeholder="0"
              />
              {formData.yieldPrediction > 0 && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 rounded-full"
                      style={{ width: `${Math.min(formData.yieldPrediction, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer with Enhanced Buttons */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button
            type="button"
            className="flex-1 px-6 py-3.5 text-gray-700 font-semibold bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-100 hover:border-gray-400 transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 px-6 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-green-600/30 disabled:shadow-none flex items-center justify-center gap-2"
            disabled={loading || !isFormValid}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating Tree...
              </>
            ) : (
              <>
                <TreePalm size={20} />
                Create Tree
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .animate-shake {
          animation: shake 0.4s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #10b981, #059669);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #059669, #047857);
        }
      `}</style>
    </div>
  );
};

export default AddTreeModal;