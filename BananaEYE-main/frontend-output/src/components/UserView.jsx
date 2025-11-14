import React from "react";
import Database from "../hooks/Database";
import { TreePalm } from "lucide-react";

const PlantationGrid = ({ onTreeClick, selectedTree }) => {
  const { plantations, loading } = Database();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <p className="text-gray-500">Loading plantation data... Please wait</p>
      </div>
    );
  }

  const renderGrid = () => {
    const rows = [];
    let plantationIndex = 0;

    for (let row = 0; row < 5; row++) {
      const cols = [];

      for (let col = 0; col < 4; col++) {
        const tree = plantations[plantationIndex];
        plantationIndex++;

        if (tree) {
          // ✅ Match field from MongoDB
          const isInfected = tree.blackSigatokaInfection === "infected";

          cols.push(
            <div
              key={tree.id}
              onClick={() => onTreeClick(tree)}
              className={`
                relative flex flex-col items-center justify-center p-4 rounded-lg border-2 
                transition-all duration-300 cursor-pointer transform hover:scale-105
                ${isInfected
                  ? "bg-red-100 border-red-300 hover:bg-red-500 hover:border-red-600"
                  : "bg-green-100 border-green-300 hover:bg-green-500 hover:border-green-600"
                }
              `}
            >
              
              <span
                className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
                  isInfected ? "bg-red-500" : "bg-green-500"
                }`}
              ></span>

              <TreePalm
                size={60}
                className={`
                  mb-2 transition-colors duration-300
                  ${isInfected ? "text-red-600" : "text-green-600"}
                  hover:text-white
                `}
              />
              <span
                className={`
                  text-sm font-bold transition-colors duration-300
                  ${isInfected ? "text-red-800 hover:text-white" : "text-green-800 hover:text-white"}
                `}
              >
                {tree.name}
              </span>
            </div>
          );
        } else {
          cols.push(
            <div
              key={`empty-${row}-${col}`}
              className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border-2 border-gray-200"
            >
              <span className="text-gray-400 text-sm">Empty</span>
            </div>
          );
        }
      }

      rows.push(
        <div
          key={row}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4"
        >
          {cols}
        </div>
      );
    }

    return rows;
  };

  return (
    <div
      className="p-6 min-h-screen overflow-y-auto"
      style={{ background: `hsl(var(--plantation-bg, 154, 100%, 96%))` }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
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
          className="rounded-xl shadow-lg p-6"
          style={{ backgroundColor: `hsl(var(--card-bg, 0, 0%, 100%))` }}
        >
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: `hsl(var(--plantation-accent, 154, 60%, 45%))` }}
          >
            Plantation Map
          </h2>
          
          {renderGrid()}
        </div>
      </div>
    </div>
  );
};

export default PlantationGrid;
