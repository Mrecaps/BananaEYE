import React, { useState, useEffect } from "react";
import { TreePalm, UserPlus, Settings, X, ChevronRight, Sparkles, Shield } from "lucide-react";
import AddTreeModal from "./AddTreeModal";
import AddAdminModal from "./AddAdminModal";

const ManagePanel = ({ onClose, onAddTree, onAddAdmin }) => {
  const [showAddTree, setShowAddTree] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

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
        className="fixed inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-slideUp">
          {/* Header with Enhanced Gradient & Animations */}
          <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 p-8 overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full -ml-20 -mb-20"></div>
            <Settings className="absolute top-6 right-24 text-white/10 animate-spin-slow" size={80} />
            <Shield className="absolute bottom-4 left-6 text-white/10 animate-float" size={60} />
            
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/90 hover:bg-white/20 rounded-xl p-2 transition-all hover:rotate-90 duration-300 z-10"
            >
              <X size={22} />
            </button>
            
            <div className="relative flex flex-col items-center text-center">
              <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-5 mb-4 shadow-lg relative">
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-2xl"></div>
                <Settings size={40} className="text-white relative animate-float" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                Admin Controls
                <Sparkles className="animate-pulse" size={24} />
              </h2>
              <p className="text-purple-100 text-sm">Manage your plantation & users with ease</p>
            </div>
          </div>

          {/* Action Cards with Enhanced Interactivity */}
          <div className="p-6 space-y-4">
            {/* Add Tree Card */}
            <button
              onClick={() => setShowAddTree(true)}
              onMouseEnter={() => setHoveredCard('tree')}
              onMouseLeave={() => setHoveredCard(null)}
              className="w-full relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 hover:from-green-100 hover:via-emerald-100 hover:to-green-200 border-2 border-green-300 hover:border-green-400 rounded-2xl p-5 transition-all duration-300 transform hover:scale-[1.03] active:scale-98 shadow-lg hover:shadow-2xl hover:shadow-green-200/50 group"
            >
              {/* Animated Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 transition-opacity duration-300 ${hoveredCard === 'tree' ? 'opacity-100' : 'opacity-0'}`}></div>
              
              <div className="relative flex items-center gap-4">
                <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <TreePalm size={28} className="text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-green-900 text-xl mb-1 flex items-center gap-2">
                    Add Plantation Tree
                    {hoveredCard === 'tree' && <Sparkles className="animate-pulse" size={16} />}
                  </h3>
                  <p className="text-green-700 text-sm font-medium">Register a new banana tree to your plantation</p>
                </div>
                <div className={`transition-all duration-300 ${hoveredCard === 'tree' ? 'translate-x-2' : ''}`}>
                  <ChevronRight className="text-green-600" size={28} strokeWidth={3} />
                </div>
              </div>
              
              {/* Hover Glow Effect */}
              <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${hoveredCard === 'tree' ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute inset-0 bg-green-400/10 animate-pulse"></div>
              </div>
            </button>

            {/* Add Admin Card */}
            <button
              onClick={() => setShowAddAdmin(true)}
              onMouseEnter={() => setHoveredCard('admin')}
              onMouseLeave={() => setHoveredCard(null)}
              className="w-full relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 hover:from-blue-100 hover:via-indigo-100 hover:to-blue-200 border-2 border-blue-300 hover:border-blue-400 rounded-2xl p-5 transition-all duration-300 transform hover:scale-[1.03] active:scale-98 shadow-lg hover:shadow-2xl hover:shadow-blue-200/50 group"
            >
              {/* Animated Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 transition-opacity duration-300 ${hoveredCard === 'admin' ? 'opacity-100' : 'opacity-0'}`}></div>
              
              <div className="relative flex items-center gap-4">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <UserPlus size={28} className="text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-blue-900 text-xl mb-1 flex items-center gap-2">
                    Add Admin Account
                    {hoveredCard === 'admin' && <Sparkles className="animate-pulse" size={16} />}
                  </h3>
                  <p className="text-blue-700 text-sm font-medium">Create a new administrator account</p>
                </div>
                <div className={`transition-all duration-300 ${hoveredCard === 'admin' ? 'translate-x-2' : ''}`}>
                  <ChevronRight className="text-blue-600" size={28} strokeWidth={3} />
                </div>
              </div>
              
              {/* Hover Glow Effect */}
              <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${hoveredCard === 'admin' ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute inset-0 bg-blue-400/10 animate-pulse"></div>
              </div>
            </button>

            {/* Enhanced Close Button */}
            <button
              className="w-full py-4 mt-6 text-gray-600 hover:text-gray-900 font-semibold bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-300 border-2 border-gray-200 hover:border-gray-300 hover:scale-[1.02] active:scale-98"
              onClick={onClose}
            >
              Close Panel
            </button>
          </div>

          {/* Bottom Decoration */}
          <div className="h-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600"></div>
        </div>
      </div>

      {/* Modals */}
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
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(3deg); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        
        .active\\:scale-98:active {
          transform: scale(0.98);
        }
      `}</style>
    </>
  );
};

export default ManagePanel;