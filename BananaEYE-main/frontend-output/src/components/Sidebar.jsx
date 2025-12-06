import React, { useState, useEffect, useRef } from "react";
import { Menu, Moon, Sun, Clock, Users, FileText, LogOut, Plus, Edit, Trash2, X, User } from "lucide-react";
import { API_BASE } from "../config";

const AdminModal = ({ isOpen, onClose, admins, onAddAdmin, onEditAdmin, onDeleteAdmin }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", role: "admin" });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const modalRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) onClose();
    };
    const handleKeyPress = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyPress);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [isOpen, onClose]);

  const handleSubmit = () => {
    if (!formData.name || !formData.email) return;
    if (editingId) {
      onEditAdmin(editingId, formData);
      setEditingId(null);
    } else {
      onAddAdmin(formData);
      setIsAdding(false);
    }
    setFormData({ name: "", email: "", role: "admin" });
  };

  const handleEdit = (admin) => {
    setEditingId(admin.id);
    setFormData({ name: admin.name, email: admin.email, role: admin.role });
    setIsAdding(true);
  };

  const handleDelete = (id) => {
    onDeleteAdmin(id);
    setDeleteConfirm(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div ref={modalRef} className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-2">
              <Users size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Admin Management</h2>
              <p className="text-blue-50 text-sm">Manage system administrators</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-all">
            <X size={24} className="text-white" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full mb-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 font-medium transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Add New Admin
            </button>
          )}

          {isAdding && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-gray-700 rounded-lg border-2 border-blue-200 dark:border-gray-600">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">
                {editingId ? "Edit Admin" : "New Admin"}
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border-2 border-blue-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500 outline-none dark:bg-gray-800 dark:text-white"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2 border-2 border-blue-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500 outline-none dark:bg-gray-800 dark:text-white"
                />
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-2 border-2 border-blue-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500 outline-none dark:bg-gray-800 dark:text-white"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                <div className="flex gap-2">
                  <button onClick={handleSubmit} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">
                    {editingId ? "Update" : "Add"}
                  </button>
                  <button
                    onClick={() => { setIsAdding(false); setEditingId(null); setFormData({ name: "", email: "", role: "admin" }); }}
                    className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {admins.map((admin) => (
              <div key={admin.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
                {deleteConfirm === admin.id ? (
                  <div className="bg-red-50 dark:bg-red-700 p-3 rounded-lg border border-red-200 dark:border-red-600">
                    <p className="text-red-800 dark:text-red-200 font-medium mb-3">Delete {admin.name}?</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleDelete(admin.id)} className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors">
                        Confirm
                      </button>
                      <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-800 dark:text-gray-200">{admin.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">{admin.email}</div>
                      <span className="inline-block mt-1 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {admin.role}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(admin)} className="p-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => setDeleteConfirm(admin.id)} className="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const LogsPanel = ({ isOpen, onClose, logs }) => {
  const modalRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) onClose();
    };
    const handleKeyPress = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyPress);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div ref={modalRef} className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-2">
              <FileText size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Activity Logs</h2>
              <p className="text-purple-50 text-sm">Admin actions and system changes</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-all">
            <X size={24} className="text-white" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-3">
            {logs.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-300 py-8">No activity logs yet</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-purple-500 dark:border-purple-400 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-semibold text-gray-800 dark:text-gray-200">{log.admin}</div>
                    <span className="px-2 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                      {log.action}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{log.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Clock size={12} />
                    {log.timestamp}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Sidebar({
  isLoggedIn = false,
  onLogin = () => {},
  onLogout = () => {},
  darkMode,
  setDarkMode
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [recentChanges, setRecentChanges] = useState([]);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showLogsPanel, setShowLogsPanel] = useState(false);
  const sidebarRef = useRef();

  const [admins, setAdmins] = useState([
    { id: 1, name: "John Doe", email: "john@example.com", role: "super_admin" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "admin" },
  ]);

  const [logs, setLogs] = useState([
    { admin: "John Doe", action: "UPDATE", description: "Changed infection status of B3 from healthy to infected", timestamp: "2024-12-03 14:30:22" },
    { admin: "Jane Smith", action: "CREATE", description: "Added new plantation B21", timestamp: "2024-12-03 13:15:10" },
    { admin: "John Doe", action: "DELETE", description: "Removed plantation B5", timestamp: "2024-12-03 12:05:45" },
  ]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && isOpen) {
        const isModal = event.target.closest('[role="dialog"]');
        if (!isModal) setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    async function fetchChanges() {
      try {
        const res = await fetch(`${API_BASE}/api/plantations`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        const sorted = data.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
        setRecentChanges(sorted);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    }
    fetchChanges();
    const interval = setInterval(fetchChanges, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAddAdmin = (adminData) => {
    const newAdmin = { id: admins.length + 1, ...adminData };
    setAdmins([...admins, newAdmin]);
    setLogs([{ admin: "System", action: "CREATE", description: `Added new admin: ${adminData.name}`, timestamp: new Date().toLocaleString() }, ...logs]);
  };

  const handleEditAdmin = (id, adminData) => {
    setAdmins(admins.map((admin) => (admin.id === id ? { ...admin, ...adminData } : admin)));
    setLogs([{ admin: "System", action: "UPDATE", description: `Updated admin: ${adminData.name}`, timestamp: new Date().toLocaleString() }, ...logs]);
  };

  const handleDeleteAdmin = (id) => {
    const admin = admins.find((a) => a.id === id);
    setAdmins(admins.filter((admin) => admin.id !== id));
    setLogs([{ admin: "System", action: "DELETE", description: `Removed admin: ${admin.name}`, timestamp: new Date().toLocaleString() }, ...logs]);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="fixed top-4 left-4 z-50 p-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-xl hover:shadow-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105">
        <Menu className="h-6 w-6" />
      </button>

      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 transition-opacity" />}

      <div ref={sidebarRef} className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-1 flex items-center justify-between">
          <h2 className="text-white text-2xl font-bold">Dashboard</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-gradient-to-br from-gray-50 dark:from-gray-800 to-gray-100 dark:to-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {darkMode ? <Moon className="h-5 w-5 text-indigo-600" /> : <Sun className="h-5 w-5 text-yellow-600" />}
                <span className="font-semibold text-gray-800 dark:text-gray-200">{darkMode ? "Dark Mode" : "Light Mode"}</span>
              </div>
              <button onClick={() => setDarkMode(!darkMode)} className={`relative w-14 h-7 rounded-full transition-all duration-300 ${darkMode ? "bg-indigo-600" : "bg-gray-300"}`}>
                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${darkMode ? "translate-x-7" : ""}`} />
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" /> Recent Changes
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentChanges.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-300 text-sm py-4">No recent changes</p>
              ) : (
                recentChanges.map((change, index) => (
                  <div key={index} className="p-3 bg-blue-50 dark:bg-gray-700 rounded-lg border border-blue-200 dark:border-gray-600 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-blue-900 dark:text-blue-200 text-sm">{change.name}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${change.blackSigatokaInfection === "infected" ? "bg-red-100 dark:bg-red-700 text-red-800 dark:text-red-200" : "bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-200"}`}>
                        {change.blackSigatokaInfection}
                      </span>
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-300">{formatDate(change.date)}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button onClick={() => setShowAdminModal(true)} className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transform hover:scale-105">
            <Users className="h-5 w-5" /> Admins
          </button>

          <button onClick={() => setShowLogsPanel(true)} className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transform hover:scale-105">
            <FileText className="h-5 w-5" /> Activity Logs
          </button>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          {isLoggedIn ? (
            <button onClick={onLogout} className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
              <LogOut className="h-5 w-5" /> Logout
            </button>
          ) : (
            <button onClick={onLogin} className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
              <User className="h-5 w-5" /> Sign In
            </button>
          )}
        </div>
      </div>

      <AdminModal isOpen={showAdminModal} onClose={() => setShowAdminModal(false)} admins={admins} onAddAdmin={handleAddAdmin} onEditAdmin={handleEditAdmin} onDeleteAdmin={handleDeleteAdmin} />
      <LogsPanel isOpen={showLogsPanel} onClose={() => setShowLogsPanel(false)} logs={logs} />
    </>
  );
}
