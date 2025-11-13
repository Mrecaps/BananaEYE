import { useEffect, useState } from "react";
import { API_BASE } from "../config";

export default function usePlantations() {
  const [plantations, setPlantations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlantations() {
      try {
          const res = await fetch(`${API_BASE}/api/plantations`); //LAN
       // const res = await fetch("http://127.0.0.1:8000/api/plantations"); //LOCALHOST 
        const data = await res.json();
        setPlantations(data);
      } catch (error) {
        console.error("Failed to fetch plantations:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPlantations();
    const interval = setInterval(fetchPlantations, 5000);
    return () => clearInterval(interval);
  }, []);

  return { plantations, loading };
}
