import { useState } from "react";
import { API_BASE } from "./config";

function App() {
  const [plantationId, setPlantationId] = useState("");
  const [infection, setInfection] = useState("");
  const [yieldPrediction, setYieldPrediction] = useState("");
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");


  const handleFileChange = async (e) => {
    const uploadedFiles = [...e.target.files];
    if (uploadedFiles.length === 0) return;

    setFiles(uploadedFiles);
    setMessage("⏳ Running AI prediction...");

    try {
      const formData = new FormData();
      uploadedFiles.forEach((file) => formData.append("files", file)); 

      const predictRes = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        body: formData,
      });

      const predictData = await predictRes.json();
      console.log("Prediction Result:", predictData);

      if (!predictRes.ok) {
        setMessage("❌ Prediction error: " + JSON.stringify(predictData));
        return;
      }

      // ⭐ Auto-fill infection using "overall_status"
      if (predictData.overall_status) {
        setInfection(predictData.overall_status);
        setMessage(`✅ AI Prediction: ${predictData.overall_status}`);
      } else {
        setMessage("⚠️ AI returned no prediction");
      }
    } catch (err) {
      setMessage("⚠️ Failed to run prediction: " + err.message);
    }
  };

  // ===========================
  // 🟩 Update Plantation Button
  // ===========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("⏳ Updating plantation...");

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
        setMessage("✅ Plantation updated successfully!");
      } else {
        setMessage("❌ Update error: " + (data.detail || "Unknown"));
      }
    } catch (err) {
      setMessage("⚠️ Failed to connect: " + err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-green-100">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-green-700 mb-4 text-center">
          Banana Plantation Update + AI Diagnosis
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Plantation ID */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Plantation ID
            </label>
            <input
              value={plantationId}
              onChange={(e) => setPlantationId(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Upload Images for AI Prediction
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="w-full"
              required
            />
          </div>

          {/* Auto-filled infection */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Black Sigatoka Infection (Auto-filled)
            </label>
            <input
              value={infection}
              onChange={(e) => setInfection(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Yield Prediction */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Yield Prediction
            </label>
            <input
              value={yieldPrediction}
              onChange={(e) => setYieldPrediction(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

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
