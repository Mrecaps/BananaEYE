import React, { useState } from "react";
import UserView from "./UserView";
import AdminLoginModal from "./AdminLoginModal";
import ManagePanel from "./ManagePanel";
import EditTreeModal from "./EditTreeModal";
import usePlantations from "../hooks/Database";

const PlantationPage = ({ onTreeClick, selectedTree }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [editingTree, setEditingTree] = useState(null);
  const { plantations, refetch, deletePlantation } = usePlantations();

  const handleLoginSuccess = () => {
    setIsAdmin(true);
    setShowLogin(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin');
    setIsAdmin(false);
    alert("Logged out successfully!");
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this plantation?")) {
      const success = await deletePlantation(id);
      if (success) {
        alert("Plantation deleted successfully");
      } else {
        alert("Failed to delete plantation");
      }
    }
  };

  const handleEdit = (tree) => {
    setEditingTree(tree);
  };

  const handleEditSuccess = () => {
    setEditingTree(null);
    refetch();
    alert("Plantation updated successfully!");
  };

  const handleAddTree = () => {
    refetch();
    alert("New tree added successfully!");
  };

  const handleAddAdmin = () => {
    alert("New admin account created successfully!");
  };

  // Check if user is already logged in as admin
  React.useEffect(() => {
    const adminData = localStorage.getItem('admin');
    if (adminData) {
      setIsAdmin(true);
    }
  }, []);

  return (
    <>
      {!isAdmin && (
        <button
          onClick={() => setShowLogin(true)}
          className="absolute top-4 right-6 px-4 py-2 bg-blue-600 text-white rounded-lg z-50 hover:bg-blue-700"
        >
          Admin Login
        </button>
      )}

      <UserView
        onTreeClick={onTreeClick}
        selectedTree={selectedTree}
        isAdmin={isAdmin}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onManage={() => setShowManage(true)}
        onLogout={handleLogout} // Add this prop
      />

      {showLogin && (
        <AdminLoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={handleLoginSuccess}
        />
      )}

      {showManage && (
        <ManagePanel
          onClose={() => setShowManage(false)}
          onAddTree={handleAddTree}
          onAddAdmin={handleAddAdmin}
        />
      )}

      {editingTree && (
        <EditTreeModal
          tree={editingTree}
          onClose={() => setEditingTree(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
};

export default PlantationPage;