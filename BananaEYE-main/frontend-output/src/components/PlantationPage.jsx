import React, { useState } from "react";
import UserView from "./UserView";
import AdminLoginModal from "./AdminLoginModal";
import ManagePanel from "./ManagePanel";
import EditTreeModal from "./EditTreeModal";
import usePlantations from "../hooks/Database";
import { Banana, BananaIcon, ShieldCheck, Sparkles } from "lucide-react";

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
          className="absolute top-4 right-6 px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg z-50 hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center gap-2 font-medium group"
        >
          <BananaIcon size={14} className="opacity-70 group-hover:opacity-100 transition-opacity" />
          <span>Admin Login</span>
          <ShieldCheck size={18} className="group-hover:rotate-12 transition-transform duration-300" />
        </button>
      )}

      <UserView
        onTreeClick={onTreeClick}
        selectedTree={selectedTree}
        isAdmin={isAdmin}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onManage={() => setShowManage(true)}
        onLogout={handleLogout}
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