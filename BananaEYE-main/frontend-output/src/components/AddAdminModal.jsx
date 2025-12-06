import React, { useState, useEffect, useRef } from "react";
import { UserPlus, X, Eye, EyeOff, Check, AlertCircle, Lock, User } from "lucide-react";

const AddAdminModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [focusedField, setFocusedField] = useState(null);

  const modalRef = useRef();

  // Password strength calculator
  useEffect(() => {
    const password = formData.password;
    let strength = 0;
    
    if (password.length >= 3) strength += 25;
    if (password.length >= 6) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) strength += 25;
    
    setPasswordStrength(strength);
  }, [formData.password]);

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
      } else if (e.key === 'Enter' && !loading) {
        e.preventDefault();
        handleSubmit(e);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [loading, onClose, formData]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 3) {
      setError("Password must be at least 3 characters long");
      return;
    }

    setLoading(true);

    try {
      // Simulated API call - replace with: await adminAPI.create(formData.username, formData.password);
      await new Promise(resolve => setTimeout(resolve, 1500));
      onSuccess();
    } catch (err) {
      setError(err.message || "Failed to create admin account");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError("");
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 25) return "bg-red-500";
    if (passwordStrength <= 50) return "bg-orange-500";
    if (passwordStrength <= 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStrengthText = () => {
    if (passwordStrength <= 25) return "Weak";
    if (passwordStrength <= 50) return "Fair";
    if (passwordStrength <= 75) return "Good";
    return "Strong";
  };

  const passwordsMatch = formData.password && formData.confirmPassword && 
                         formData.password === formData.confirmPassword;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm animate-fadeIn">
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl transform transition-all animate-slideUp"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-12 -mb-12"></div>
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-all"
            disabled={loading}
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
              <UserPlus className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Add New Admin</h2>
              <p className="text-blue-100 text-sm">Create a new administrator account</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3 animate-shake">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {/* Username Field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Username</label>
            <div className={`relative transition-all ${focusedField === 'username' ? 'scale-[1.02]' : ''}`}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className={`${focusedField === 'username' ? 'text-blue-600' : 'text-gray-400'} transition-colors`} size={20} />
              </div>
              <input
                type="text"
                required
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl transition-all focus:outline-none ${
                  focusedField === 'username' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
                placeholder="Enter username"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Password</label>
            <div className={`relative transition-all ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className={`${focusedField === 'password' ? 'text-blue-600' : 'text-gray-400'} transition-colors`} size={20} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                className={`w-full pl-10 pr-12 py-3 border-2 rounded-xl transition-all focus:outline-none ${
                  focusedField === 'password' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            {formData.password && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Password strength:</span>
                  <span className={`font-semibold ${
                    passwordStrength <= 25 ? 'text-red-500' :
                    passwordStrength <= 50 ? 'text-orange-500' :
                    passwordStrength <= 75 ? 'text-yellow-500' : 'text-green-500'
                  }`}>
                    {getStrengthText()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full ${getStrengthColor()} transition-all duration-300 rounded-full`}
                    style={{ width: `${passwordStrength}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Confirm Password</label>
            <div className={`relative transition-all ${focusedField === 'confirmPassword' ? 'scale-[1.02]' : ''}`}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className={`${focusedField === 'confirmPassword' ? 'text-blue-600' : 'text-gray-400'} transition-colors`} size={20} />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                className={`w-full pl-10 pr-12 py-3 border-2 rounded-xl transition-all focus:outline-none ${
                  focusedField === 'confirmPassword' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                } ${passwordsMatch ? 'border-green-500 bg-green-50' : ''}`}
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField(null)}
                placeholder="Confirm password"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-2">
                {passwordsMatch && (
                  <Check className="text-green-500" size={20} />
                )}
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              className="flex-1 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-semibold transition-all hover:scale-[1.02] active:scale-95"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-blue-300 disabled:to-blue-400 font-semibold transition-all hover:scale-[1.02] active:scale-95 shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  Create Admin
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AddAdminModal;