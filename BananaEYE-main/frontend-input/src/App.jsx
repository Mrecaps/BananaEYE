import { useState } from "react";
import { API_BASE } from "./config";

function App() {
  const [plantationId, setPlantationId] = useState("");
  const [infection, setInfection] = useState("");
  const [yieldPrediction, setYieldPrediction] = useState("");
  const [message, setMessage] = useState("");

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    // --- 🔍 Get the folder name (e.g. B1, B2, etc.)
    const relativePath = files[0].webkitRelativePath || "";
    const folderName = relativePath.split("/")[0]; // first folder in path, e.g. "B1"

    if (!folderName) {
      setMessage("⚠️ Could not detect folder name from uploaded files.");
      return;
    }

    // Auto-fill Plantation ID (e.g., extract '1' from 'B1')
    const folderMatch = folderName.match(/B(\d+)/i);
    if (folderMatch) setPlantationId(folderMatch[1]);

    // --- 🧠 Send folder name to backend
    try {
      const response = await fetch(`${API_BASE}/predict_folder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_name: folderName }) // ✅ fixed key
      });

      const data = await response.json();
      console.log("AI Response:", data);

      if (!response.ok) {
        setMessage(`⚠️ AI Error: ${data.detail || "Unknown error"}`);
        return;
      }

      if (data.status) {
        setInfection(data.status);
        setMessage(`✅ Prediction for ${folderName}: ${data.status}`);
      } else {
        setMessage("⚠️ Unexpected AI response: " + JSON.stringify(data));
      }
    } catch (err) {
      console.error(err);
      setMessage("⚠️ Failed to connect to AI server");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/api/plantations/${plantationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blackSigatokaInfection: infection,
          yieldPrediction,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("✅ Data updated successfully!");
        console.log("Updated Plantation:", data);
      } else {
        setMessage("❌ Error: " + (data.detail || "Unknown error"));
      }
    } catch (err) {
      setMessage("⚠️ Failed to connect to API: " + err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-green-100">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-green-700 mb-4 text-center">
          Banana Plantation Update
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Plantation ID */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Plantation ID
            </label>
            <input
              type="text"
              value={plantationId}
              onChange={(e) => setPlantationId(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              required
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Upload Leaf Image Folder
            </label>
            <input
              type="file"
              onChange={handleImageUpload}
              webkitdirectory="true"
              directory="true"
              multiple
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              required
            />
          </div>

          {/* Infection Status */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Black Sigatoka Infection
            </label>
            <input
              type="text"
              value={infection}
              readOnly
              className="w-full border rounded px-3 py-2 bg-gray-100 focus:outline-none"
            />
          </div>

          {/* Yield Prediction */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Yield Prediction
            </label>
            <input
              type="text"
              value={yieldPrediction}
              onChange={(e) => setYieldPrediction(e.target.value)}
              placeholder="20"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
          >
            Update Plantation
          </button>
        </form>

        {message && <p className="mt-4 text-center">{message}</p>}
      </div>
    </div>
  );
}

export default App;
