// hooks/Database.js - Updated version with sorting and duplicate removal
import { useEffect, useState } from "react";
import { API_BASE } from "../config";
import { plantationAPI } from "../services/api";

export default function usePlantations() {
  const [plantations, setPlantations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPlantations = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/plantations`);
      const data = await res.json();
      
      // Remove duplicates and sort by numerical ID
      const uniqueAndSorted = processPlantations(data);
      setPlantations(uniqueAndSorted);
    } catch (error) {
      console.error("Failed to fetch plantations:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to remove duplicates and sort
  const processPlantations = (data) => {
    if (!data || !Array.isArray(data)) return [];
    
    // Remove duplicates - keep the most recent entry based on date
    const uniqueMap = new Map();
    
    data.forEach(tree => {
      const existing = uniqueMap.get(tree.id);
      if (!existing || new Date(tree.date) > new Date(existing.date)) {
        uniqueMap.set(tree.id, tree);
      }
    });
    
    // Convert back to array and sort by numerical ID
    const uniqueTrees = Array.from(uniqueMap.values());
    
    return uniqueTrees.sort((a, b) => {
      return parseInt(a.id) - parseInt(b.id);
    });
  };

  const deletePlantation = async (id) => {
    try {
      await plantationAPI.delete(id);
      await fetchPlantations(); // Refresh the list after deletion
      return true;
    } catch (err) {
      console.error('Failed to delete plantation:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchPlantations();
    const interval = setInterval(fetchPlantations, 5000);
    return () => clearInterval(interval);
  }, []);

  return { 
    plantations, 
    loading, 
    refetch: fetchPlantations,
    deletePlantation 
  };
}