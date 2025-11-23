const LOCAL_API = "http://localhost:8000/api";
const LAN_API = "http:/192.168.0.102:8000/api"; 

export const API_BASE = "http://1192.168.0.102:8000"; // replace with IP where the server is running
  window.location.hostname === "localhost" ? LOCAL_API : LAN_API;
