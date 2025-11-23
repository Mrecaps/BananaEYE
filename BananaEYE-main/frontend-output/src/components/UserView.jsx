import React from "react";
import usePlantations from "../hooks/Database";
import { TreePalm, Edit, Trash2, LogOut } from "lucide-react";

const PlantationGrid = ({ onTreeClick, selectedTree, isAdmin, onEdit, onDelete, onManage, onLogout }) => {
  const { plantations, loading } = usePlantations();

  // FIX: Sort plantations by numerical ID
  const sortedPlantations = React.useMemo(() => {
    return [...plantations].sort((a, b) => parseInt(a.id) - parseInt(b.id));
  }, [plantations]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <p className="text-gray-500">Loading plantation data... Please wait</p>
      </div>
    );
  }

  // Fixed base grid that expands when needed
  const calculateGrid = () => {
    const baseCols = 4; // Fixed 4 columns
    const baseRows = 5; // Start with 5 rows (5x4 = 20 slots)
    const totalTrees = sortedPlantations.length; // Use sortedPlantations
    
    // Calculate how many rows we need
    const neededRows = Math.ceil(totalTrees / baseCols);
    const rows = Math.max(baseRows, neededRows);
    
    return { rows, cols: baseCols, totalSlots: rows * baseCols };
  };

  const { rows, cols, totalSlots } = calculateGrid();

  const renderGrid = () => {
    const gridRows = [];
    let treeIndex = 0;

    for (let row = 0; row < rows; row++) {
      const rowCells = [];

      for (let col = 0; col < cols; col++) {
        const tree = sortedPlantations[treeIndex]; // Use sortedPlantations
        treeIndex++;

        if (tree) {
          const isInfected = tree.blackSigatokaInfection === "infected";

          rowCells.push(
            <div
              key={tree.id}
              onClick={() => onTreeClick(tree)}
              className={`

                relative flex flex-col items-center justify-center p-6 rounded-lg border-6
              
                
                ${isInfected
                  ? "bg-red-100 border-red-300 hover:bg-red-500 hover:border-red-600"
                  : "bg-green-100 border-green-300 hover:bg-green-500 hover:border-green-600"
                }
              `}
            >
              {/* ADMIN BUTTONS - Top Left, Always Visible */}
              {isAdmin && (
                <div className="absolute top-2 left-2 flex gap-1">
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
                      onDelete(tree.id);
                    }}
                    className="p-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}

              {/* infection status dot */}
              <span
                className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
                  isInfected ? "bg-red-500" : "bg-green-500"
                }`}
              ></span>

              {/* icon */}
              <TreePalm
                size={50}
                className={`
                  mb-2 transition-colors duration-300
                  ${isInfected ? "text-red-600" : "text-green-600"}
                  group-hover:text-white
                `}
              />

              {/* tree name */}
              <span
                className={`
                  text-sm font-bold transition-colors duration-300 text-center
                  ${isInfected ? "text-red-800 group-hover:text-white" : "text-green-800 group-hover:text-white"}
                `}
              >
                {tree.name}
              </span>

              {/* tree ID */}
              <span
                className={`
                  text-xs transition-colors duration-300
                  ${isInfected ? "text-red-600 group-hover:text-white" : "text-green-600 group-hover:text-white"}
                `}
              >
              </span>
            </div>
          );
        } else {
          // Empty slot
          rowCells.push(
            <div
              key={`empty-${row}-${col}`}
              className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border-2 border-gray-200 min-h-[120px] min-w-[120px]"
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
      className="p-6 min-h-screen overflow-y-auto relative"
      style={{ background: `hsl(var(--plantation-bg, 154, 100%, 96%))` }}
    >
      {/* TOP RIGHT Admin buttons (admin only) */}
      {isAdmin && (
        <div className="absolute top-4 right-6 flex gap-2">
          <button
            onClick={onManage}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Manage
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            title="Logout"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="mb-5 text-center">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: `hsl(var(--plantation-header, 154, 50%, 35%))` }}
          >
            Banana Plantation Monitor
          </h1>
          <p style={{ color: `hsl(var(--plantation-accent, 154, 60%, 45%))` }}>
            Black Sigatoka Detection & Yield Prediction System
          </p>
        </div>

        <div
          className="rounded-xl shadow-lg p-7"
          style={{ backgroundColor: `hsl(var(--card-bg, 0, 0%, 100%))` }}
        >
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: `hsl(var(--plantation-accent, 154, 60%, 45%))` }}
          >
            Plantation Map ({sortedPlantations.length} Trees) {/* Updated count */}
          </h2>

          {sortedPlantations.length === 0 ? ( // Use sortedPlantations
            <div className="text-center py-12">
              <TreePalm size={50} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">No banana trees added yet.</p>
              <p className="text-gray-400">Use the Manage button to add your first tree!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {renderGrid()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlantationGrid;