import React, { useState, useEffect } from "react";
import AddTreeModal from "./AddTreeModal";
import AddAdminModal from "./AddAdminModal";
import { TreePalm, UserPlus, Settings, X } from "lucide-react";

const ManagePanel = ({ onClose, onAddTree, onAddAdmin }) => {
  const [showAddTree, setShowAddTree] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);

  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Handle click outside modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-all"
            >
              <X size={20} />
            </button>
            
            <div className="flex flex-col items-center">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-4 mb-3">
                <Settings size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Admin Controls</h2>
              <p className="text-purple-100 text-sm mt-1">Manage plantation & users</p>
            </div>
          </div>

          {/* Action Cards */}
          <div className="p-6 space-y-3">
            {/* Add Tree Card */}
            <button
              onClick={() => setShowAddTree(true)}
              className="w-full bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-2 border-green-200 hover:border-green-300 rounded-xl p-4 transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-sm hover:shadow-md group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-green-600 rounded-lg p-3 group-hover:bg-green-700 transition-colors">
                  <TreePalm size={24} className="text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-green-900 text-lg">Add Plantation Tree</h3>
                  <p className="text-green-700 text-sm">Register a new banana tree</p>
                </div>
                <div className="text-green-600 group-hover:translate-x-1 transition-transform">
                  →
                </div>
              </div>
            </button>

            {/* Add Admin Card */}
            <button
              onClick={() => setShowAddAdmin(true)}
              className="w-full bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-200 hover:border-blue-300 rounded-xl p-4 transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-sm hover:shadow-md group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 rounded-lg p-3 group-hover:bg-blue-700 transition-colors">
                  <UserPlus size={24} className="text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-blue-900 text-lg">Add Admin Account</h3>
                  <p className="text-blue-700 text-sm">Create new administrator</p>
                </div>
                <div className="text-blue-600 group-hover:translate-x-1 transition-transform">
                  →
                </div>
              </div>
            </button>

            {/* Close Button */}
            <button
              className="w-full py-3 text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-50 rounded-lg transition-colors mt-4"
              onClick={onClose}
            >
              Close Panel
            </button>
          </div>
        </div>
      </div>

      {showAddTree && (
        <AddTreeModal
          onClose={() => setShowAddTree(false)}
          onSuccess={() => {
            setShowAddTree(false);
            onAddTree?.();
          }}
        />
      )}

      {showAddAdmin && (
        <AddAdminModal
          onClose={() => setShowAddAdmin(false)}
          onSuccess={() => {
            setShowAddAdmin(false);
            onAddAdmin?.();
          }}
        />
      )}
    </>
  );
};

export default ManagePanel;