import React, { useState, useEffect, useRef } from "react";
import { TreePalm, Edit, Trash2, LogOut, AlertTriangle, MapPin, Activity, CheckCircle, XCircle } from "lucide-react";
import usePlantations from '../hooks/Database'
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import MapModal from "./MapModal";
import { API_BASE } from "../config";

const QuickStatsCard = ({ icon: Icon, label, value, subtext, bgColor, iconColor, textColor }) => (
  <div className={`${bgColor} rounded-lg sm:rounded-xl p-3 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105`}>
    <div className="flex items-start justify-between mb-2 sm:mb-3">
      <div className={`${iconColor} bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-2 sm:p-3`}>
        <Icon size={20} className="text-white sm:w-7 sm:h-7" />
      </div>
      <div className="text-right">
        <p className={`text-xl sm:text-3xl font-bold ${textColor}`}>{value}</p>
        <p className={`text-xs sm:text-sm ${textColor} opacity-90 font-medium`}>{subtext}</p>
      </div>
    </div>
    <p className={`text-xs sm:text-sm ${textColor} opacity-80 font-medium`}>{label}</p>
  </div>
);

const UserView = ({
  onTreeClick = () => {},
  selectedTree = null,
  isAdmin = true,
  onEdit = () => {},
  onDelete = () => {},
  onManage = () => {},
  onLogout = () => {}
}) => {
  const { plantations, loading, refetch } = usePlantations();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTreeForDelete, setSelectedTreeForDelete] = useState(null);
  
  // Filter state
  const [filter, setFilter] = useState('all');
  
  // Store card positions for FLIP animation
  const cardPositions = useRef(new Map());
  const [isAnimating, setIsAnimating] = useState(false);
  const sortedPlantations = React.useMemo(() => {
    return [...plantations].sort(
      (a, b) => parseInt(a.id) - parseInt(b.id)
    );
  }, [plantations]);

  const stats = React.useMemo(() => {
    const total = plantations.length;
    const infected = plantations.filter(p => p.blackSigatokaInfection === "infected").length;
    const healthy = total - infected;
    const infectionRate = total > 0 ? Math.round((infected / total) * 100) : 0;
    
    return { total, healthy, infected, infectionRate };
  }, [plantations]);

  // Filtered plantations based on filter state
  const filteredPlantations = React.useMemo(() => {
    if (filter === 'all') return sortedPlantations;
    if (filter === 'healthy') return sortedPlantations.filter(p => p.blackSigatokaInfection !== "infected");
    if (filter === 'infected') return sortedPlantations.filter(p => p.blackSigatokaInfection === "infected");
    return sortedPlantations;
  }, [sortedPlantations, filter]);

  // FLIP Animation handler
const handleFilterChange = (newFilter) => {
  // Record First positions
  const firstPositions = new Map();
  document.querySelectorAll('[data-tree-id]').forEach(el => {
    const id = el.getAttribute('data-tree-id');
    const rect = el.getBoundingClientRect();
    firstPositions.set(id, { x: rect.left, y: rect.top });
  });

  // Change filter (this causes re-render with Last positions)
  setFilter(newFilter);
  setIsAnimating(true);

  // Use requestAnimationFrame to get Last positions after render
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.querySelectorAll('[data-tree-id]').forEach(el => {
        const id = el.getAttribute('data-tree-id');
        const rect = el.getBoundingClientRect();
        const first = firstPositions.get(id);
        
        if (first) {
          // Calculate Invert
          const deltaX = first.x - rect.left;
          const deltaY = first.y - rect.top;
          
          // Apply invert transform
          el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
          el.style.transition = 'none';
          
          // Play animation
          requestAnimationFrame(() => {
            el.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
            el.style.transform = 'translate(0, 0)';
          });
        } else {
          // New card appearing - fade in
          el.style.opacity = '0';
          el.style.transform = 'scale(0.8)';
          requestAnimationFrame(() => {
            el.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
            el.style.opacity = '1';
            el.style.transform = 'scale(1)';
          });
        }
      });

      // Reset animation flag after animation completes
      setTimeout(() => setIsAnimating(false), 500);
    });
  });
};

  // Handle keyboard events for logout modal
  React.useEffect(() => {
    if (!showLogoutModal) return;

    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        setShowLogoutModal(false);
      } else if (e.key === 'Enter') {
        confirmLogout();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [showLogoutModal]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  const handleDeleteClick = (tree) => {
    setSelectedTreeForDelete(tree);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async (treeId) => {
  try {
    await fetch(`${API_BASE}/api/plantations/${treeId}`, {
      method: "DELETE",
    });

    setShowDeleteModal(false);
    setSelectedTreeForDelete(null);

    if (typeof refetch === "function") refetch();

  } catch (error) {
    console.error("Failed to delete plantation:", error);
    throw error; 
  }
};

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <p className="text-gray-500">Loading plantation data... Please wait</p>
      </div>
    );
  }

  const calculateGrid = () => {
    const baseCols = 4;
    const baseRows = 5;
    const totalTrees = filteredPlantations.length;

    const neededRows = Math.ceil(totalTrees / baseCols);
    const rows = Math.max(baseRows, neededRows);

    return { rows, cols: baseCols, totalSlots: rows * baseCols };
  };

  const { rows, cols } = calculateGrid();

  const renderGrid = () => {
    const gridRows = [];
    let treeIndex = 0;

    for (let row = 0; row < rows; row++) {
      const rowCells = [];

      for (let col = 0; col < cols; col++) {
        const tree = filteredPlantations[treeIndex];
        treeIndex++;

        if (tree) {
          const isInfected = tree.blackSigatokaInfection === "infected";

          rowCells.push(
            <div
              key={tree.id}
              data-tree-id={tree.id}
              onClick={() => onTreeClick(tree)}
              className={`
                relative flex flex-col items-center justify-center
                h-32 w-full
                rounded-lg border-3 p-3
                transition-all duration-300 ease-in-out
                hover:scale-105 hover:shadow-xl cursor-pointer
                ${
                  isInfected
                    ? "bg-red-300 border-red-600 hover:bg-red-100 hover:border-red-600"
                    : "bg-green-300 border-green-600 hover:bg-green-100 hover:border-green-600"
                }
              `}
            >
              {/* Admin Buttons */}
              {isAdmin && (
                <div className="absolute top-2 left-2 flex gap-1 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(tree);
                    }}
                    className="p-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                    title="Edit"
                  >
                    <Edit size={14} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(tree);
                    }}
                    className="p-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}

              {/* Infection Dot */}
              <span
                className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
                  isInfected ? "bg-red-500" : "bg-green-500"
                }`}
              ></span>

              {/* Tree Icon */}
              <TreePalm
                size={50}
                className={`${isInfected ? "text-red-700" : "text-green-700"} mb-2`}
              />

              {/* Tree Name */}
              <span
                className={`text-sm font-bold ${
                  isInfected ? "text-red-800" : "text-green-800"
                }`}
              >
                {tree.name}
              </span>
            </div>
          );
        } else {
          // Empty slot
          rowCells.push(
            <div
              key={`empty-${row}-${col}`}
              className="flex items-center justify-center 
              h-32 w-full 
              bg-gray-50 rounded-lg border-2 border-gray-200"
            >
              <span className="text-gray-400 text-sm">Empty</span>
            </div>
          );
        }
      }

      gridRows.push(
        <div key={row} className="grid grid-cols-4 gap-4 mb-4">
          {rowCells}
        </div>
      );
    }

    return gridRows;
  };

  return (
    <div
      className="p-2 min-h-screen overflow-y-auto relative"
      style={{ background: `hsl(154, 100%, 96%)` }}
    >
      {/* Admin Buttons (Top Right) */}
      {isAdmin && (
        <div className="absolute top-2 right-2 sm:top-4 sm:right-6 flex gap-1 sm:gap-2 z-20">
          <button
            onClick={onManage}
            className="px-2 py-1.5 sm:px-4 sm:py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs sm:text-base font-medium"
          >
            Manage
          </button>

          <button
            onClick={handleLogoutClick}
            className="px-2 py-1.5 sm:px-4 sm:py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-base font-medium"
            title="Logout"
          >
            <LogOut size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Logout</span>
            <span className="xs:hidden">Out</span>
          </button>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-2 sm:px-4">
        <div className="mb-3 text-center pt-12 sm:pt-0">
          <h1
            className="text-2xl sm:text-3xl font-bold mb-2"
            style={{ color: `hsl(154, 50%, 35%)` }}
          >
            Banana Plantation Monitor
          </h1>
          <p className="text-sm sm:text-base" style={{ color: `hsl(154, 60%, 45%)` }}>
            Black Sigatoka Detection & Yield Prediction System
          </p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <QuickStatsCard
            icon={Activity}
            label="Total Trees"
            value={stats.total}
            subtext="Monitored"
            bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
            iconColor="bg-blue-600"
            textColor="text-white"
          />
          <QuickStatsCard
            icon={CheckCircle}
            label="Healthy Trees"
            value={stats.healthy}
            subtext={`${stats.total > 0 ? Math.round((stats.healthy / stats.total) * 100) : 0}% of total`}
            bgColor="bg-gradient-to-br from-green-500 to-green-600"
            iconColor="bg-green-600"
            textColor="text-white"
          />
          <QuickStatsCard
            icon={XCircle}
            label="Infected Trees"
            value={stats.infected}
            subtext={`${stats.infectionRate}% infection rate`}
            bgColor="bg-gradient-to-br from-red-500 to-red-600"
            iconColor="bg-red-600"
            textColor="text-white"
          />
          <QuickStatsCard
            icon={MapPin}
            label="Geotagged"
            value={stats.total}
            subtext="Locations"
            bgColor="bg-gradient-to-br from-purple-500 to-purple-600"
            iconColor="bg-purple-600"
            textColor="text-white"
          />
        </div>

        <div
          className="rounded-xl shadow-lg p-7"
          style={{ backgroundColor: `hsl(0, 0%, 100%)` }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-xl font-semibold"
              style={{ color: `hsl(154, 60%, 45%)` }}
            >
              Plantation Map ({filteredPlantations.length} Trees)
            </h2>
            
            <button
              onClick={() => setShowMapModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
              title="View Map"
            >
              <MapPin size={18} />
              Map View
            </button>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => handleFilterChange('all')}
              disabled={isAnimating}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-md scale-105'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } ${isAnimating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              All Trees ({stats.total})
            </button>
            <button
              onClick={() => handleFilterChange('healthy')}
              disabled={isAnimating}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                filter === 'healthy'
                  ? 'bg-green-600 text-white shadow-md scale-105'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } ${isAnimating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Healthy ({stats.healthy})
            </button>
            <button
              onClick={() => handleFilterChange('infected')}
              disabled={isAnimating}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                filter === 'infected'
                  ? 'bg-red-600 text-white shadow-md scale-105'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } ${isAnimating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Infected ({stats.infected})
            </button>
          </div>

          {sortedPlantations.length === 0 ? (
            <div className="text-center py-12">
              <TreePalm size={50} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">No banana trees added yet.</p>
              <p className="text-gray-400">
                Use the Manage button to add your first tree!
              </p>
            </div>
          ) : (
            <div className="p-5">{renderGrid()}</div>
          )}
        </div>
      </div>

      {/* Map Modal */}
      <MapModal 
        isOpen={showMapModal} 
        onClose={() => setShowMapModal(false)}
        plantations={sortedPlantations}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        tree={selectedTreeForDelete}
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedTreeForDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
      />

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowLogoutModal(false)}
        >
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in">
            {/* Warning Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6">
              <div className="flex flex-col items-center">
                <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-4 mb-3">
                  <AlertTriangle size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Confirm Logout</h2>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-700 text-center mb-6">
                Are you sure you want to logout from admin mode?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 font-medium transition-all shadow-lg hover:shadow-xl transform active:scale-95"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserView;