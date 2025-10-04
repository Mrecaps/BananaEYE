import React from 'react';
import usePlantations from "../hooks/usePlantations";
import { TreePalm, TreePineIcon } from 'lucide-react';

const PlantationGrid = ({ onTreeClick, selectedTree }) => {
  const { plantations, loading } = usePlantations();

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
          cols.push(
            <div
              key={tree.id}
              className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg border-2 border-green-200 hover:border-green-300 transition-all duration-200 cursor-pointer transform hover:scale-105"
              onClick={() => onTreeClick(tree)}
              
            >
              <TreePalm
                size={60}
                className="text-green-500 hover:text-green-700 transition-colors duration-200 mb-2"
              />
              <span className="text-sm font-bold text-green-800">
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

      // Responsive: stack differently based on screen size
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
