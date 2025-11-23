import React, { useState, useEffect, useRef } from "react";
import AddTreeModal from "./AddTreeModal";
import AddAdminModal from "./AddAdminModal";

const ManagePanel = ({ onClose, onAddTree, onAddAdmin }) => {
  const [showAddTree, setShowAddTree] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);

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

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div 
          ref={modalRef}
          className="bg-white p-6 rounded-xl w-[400px] shadow-xl"
        >
          <h2 className="text-2xl font-bold text-center mb-4">Admin Controls</h2>

          <button
            onClick={() => setShowAddTree(true)}
            className="w-full bg-green-600 text-white py-2 rounded-lg mb-3 hover:bg-green-700 transition-colors"
          >
            ➕ Add New Plantation Tree
          </button>

          <button
            onClick={() => setShowAddAdmin(true)}
            className="w-full bg-blue-600 text-white py-2 rounded-lg mb-3 hover:bg-blue-700 transition-colors"
          >
            ➕ Add New Admin Account
          </button>

          <button
            className="w-full py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg transition-colors"
            onClick={onClose}
          >
            Close
          </button>
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