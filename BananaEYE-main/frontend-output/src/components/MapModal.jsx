import React, { useState, useEffect, useRef } from "react";
import { MapPin, X, CircleDotDashed, Maximize2, Minimize2, Layers, Info } from "lucide-react";

// Plantation coordinates
const PLANTATION_COORDS = [
    { name: "B1", lat: 14.153555, lon: 121.262457 },
    { name: "B2", lat: 14.153550, lon: 121.262419 },
    { name: "B3", lat: 14.153545, lon: 121.262378 },
    { name: "B4", lat: 14.153571, lon: 121.262358 },
    { name: "B5", lat: 14.153591, lon: 121.262399 },
    { name: "B6", lat: 14.153607, lon: 121.262382 },
    { name: "B7", lat: 14.153642, lon: 121.262391 },
    { name: "B8", lat: 14.153627, lon: 121.262436 },
    { name: "B9", lat: 14.153641, lon: 121.262457 },
    { name: "B10", lat: 14.153670, lon: 121.262459 },
    { name: "B11", lat: 14.153697, lon: 121.262457 },
    { name: "B12", lat: 14.153681, lon: 121.262390 },
    { name: "B13", lat: 14.153722, lon: 121.262441 },
    { name: "B14", lat: 14.153776, lon: 121.262452 },
    { name: "B15", lat: 14.153804, lon: 121.262428 },
    { name: "B16", lat: 14.153839, lon: 121.262448 },
    { name: "B17", lat: 14.153847, lon: 121.262428 },
    { name: "B18", lat: 14.153592, lon: 121.262434 },
    { name: "B19", lat: 14.153854, lon: 121.262402 },
    { name: "B20", lat: 14.153704, lon: 121.262422 },
];

const MapModal = ({ isOpen, onClose, plantations }) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const layersRef = useRef({ street: null, satellite: null });
    const markersRef = useRef([]);
    const [currentLayer, setCurrentLayer] = useState('street');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [selectedPlantation, setSelectedPlantation] = useState(null);
    const [showLayerMenu, setShowLayerMenu] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);
    const leafletLoadedRef = useRef(false);

    // Initialize map only once
    const initializeMap = React.useCallback(() => {
        if (!mapRef.current || !window.L || mapInstanceRef.current) return;

        // Initialize map with custom options
        const map = window.L.map(mapRef.current, {
            zoomControl: false,
            attributionControl: false,
            // Set a fixed view to prevent auto-centering on markers
            center: [14.15370, 121.26241],
            zoom: 19
        });

        // Add zoom control to bottom right
        window.L.control.zoom({
            position: 'bottomright'
        }).addTo(map);

        // Create tile layers
        const streetLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 20.5
        });

        const satelliteLayer = window.L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
            attribution: '© Google',
            maxZoom: 20.5,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        });

        // Add default layer (street)
        streetLayer.addTo(map);

        // Store layer references
        layersRef.current = { street: streetLayer, satellite: satelliteLayer };

        // Custom marker icons
        const healthyIcon = window.L.divIcon({
            className: 'custom-marker',
            html: `<div style="
        width: 32px; 
        height: 32px; 
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });

        const infectedIcon = window.L.divIcon({
            className: 'custom-marker',
            html: `<div style="
        width: 32px; 
        height: 32px; 
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulse 2s infinite;
      ">
        <div style="
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      </style>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });

        // Clear existing markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        // Add markers with plantation data
        PLANTATION_COORDS.forEach(p => {
            // Find matching plantation data
            const plantationData = plantations.find(pl => pl.name === p.name);

            // Get infection status and yield from database
            const infectionStatus = plantationData?.blackSigatokaInfection || 'N/A';
            const yieldValue = plantationData?.yieldPrediction || '0';
            const isInfected = infectionStatus === 'infected';

            const marker = window.L.marker([p.lat, p.lon], {
                icon: isInfected ? infectedIcon : healthyIcon
            }).addTo(map);

            // Enhanced popup content
            const popupContent = `
        <div style="
          font-family: system-ui, -apple-system, sans-serif; 
          min-width: 220px;
          padding: 4px;
        ">
          <div style="
            background: ${isInfected ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'};
            color: white;
            padding: 12px;
            margin: -4px -4px 12px -4px;
            border-radius: 8px 8px 0 0;
          ">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="
                width: 10px;
                height: 10px;
                background: white;
                border-radius: 50%;
                animation: pulse 2s infinite;
              "></div>
              <strong style="font-size: 18px; letter-spacing: 0.5px;">
                Plantation ${p.name}
              </strong>
            </div>
          </div>
          
          <div style="padding: 0 4px 4px 4px;">
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 10px;
              background: ${isInfected ? '#fee2e2' : '#d1fae5'};
              border-radius: 8px;
              margin-bottom: 10px;
              border-left: 4px solid ${isInfected ? '#ef4444' : '#10b981'};
            ">
              <div style="
                width: 8px;
                height: 8px;
                background: ${isInfected ? '#ef4444' : '#10b981'};
                border-radius: 50%;
              "></div>
              <div>
                <div style="
                  font-size: 11px;
                  color: ${isInfected ? '#991b1b' : '#065f46'};
                  font-weight: 600;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                ">Status</div>
                <div style="
                  font-size: 15px;
                  color: ${isInfected ? '#dc2626' : '#059669'};
                  font-weight: 700;
                  text-transform: capitalize;
                ">${infectionStatus}</div>
              </div>
            </div>
            
            <div style="
              padding: 10px;
              background: #f3f4f6;
              border-radius: 8px;
              border-left: 4px solid #6366f1;
            ">
              <div style="
                font-size: 11px;
                color: #4b5563;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 4px;
              ">Yield Prediction</div>
              <div style="display: flex; align-items: baseline; gap: 4px;">
                <span style="
                  font-size: 24px;
                  color: #1f2937;
                  font-weight: 700;
                ">${yieldValue}</span>
                <span style="
                  font-size: 16px;
                  color: #6b7280;
                  font-weight: 600;
                ">%</span>
              </div>
            </div>
          </div>
        </div>
      `;

            marker.bindPopup(popupContent, {
                maxWidth: 280,
                className: 'custom-popup'
            });

            // Track selected plantation
            marker.on('click', () => {
                setSelectedPlantation(plantationData || { name: p.name, blackSigatokaInfection: 'N/A', yieldPrediction: '0' });
            });

            markersRef.current.push(marker);
        });

      
        mapInstanceRef.current = map;
        setMapLoaded(true);
    }, [plantations]);


    useEffect(() => {
        if (!isOpen || leafletLoadedRef.current) return;

        const loadLeaflet = () => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
            document.head.appendChild(link);

            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
            script.onload = () => {
                leafletLoadedRef.current = true;
                if (isOpen) {
                    initializeMap();
                }
            };
            document.body.appendChild(script);

            return { link, script };
        };

        const elements = loadLeaflet();

        return () => {
            if (elements) {
                document.head.removeChild(elements.link);
                document.body.removeChild(elements.script);
            }
        };
    }, [isOpen, initializeMap]);

    // Initialize map when Leaflet is loaded and modal is open
    useEffect(() => {
        if (isOpen && leafletLoadedRef.current && !mapInstanceRef.current) {
            initializeMap();
        }
    }, [isOpen, initializeMap]);

    // Cleanup when modal closes
    useEffect(() => {
        if (!isOpen) {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
            markersRef.current = [];
            layersRef.current = { street: null, satellite: null };
            setMapLoaded(false);
            setSelectedPlantation(null);
        }
    }, [isOpen]);

    // Handle layer switching
    const switchLayer = (layerType) => {
        if (!mapInstanceRef.current || !layersRef.current.street) return;

        const map = mapInstanceRef.current;
        const { street, satellite } = layersRef.current;

        if (layerType === 'satellite') {
            if (map.hasLayer(street)) map.removeLayer(street);
            if (!map.hasLayer(satellite)) satellite.addTo(map);
            setCurrentLayer('satellite');
        } else {
            if (map.hasLayer(satellite)) map.removeLayer(satellite);
            if (!map.hasLayer(street)) street.addTo(map);
            setCurrentLayer('street');
        }
        setShowLayerMenu(false);
    };

    // Center map on all markers (only when explicitly called)
    const centerMap = () => {
        if (!mapInstanceRef.current) return;
        const bounds = PLANTATION_COORDS.map(p => [p.lat, p.lon]);
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 19 });
    };

    // Handle ESC key
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyPress = (e) => {
            if (e.key === 'Escape') {
                if (showLayerMenu) {
                    setShowLayerMenu(false);
                } else {
                    onClose();
                }
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [isOpen, onClose, showLayerMenu]);

    if (!isOpen) return null;

    const stats = {
        total: plantations.length,
        infected: plantations.filter(p => p.blackSigatokaInfection === "infected").length,
        healthy: plantations.filter(p => p.blackSigatokaInfection !== "infected").length
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            style={{ animation: 'fadeIn 0.2s ease-out' }}
        >
            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          padding: 0;
        }
        .custom-popup .leaflet-popup-tip {
          background: transparent;
        }
      `}</style>

            <div
               
                className={`bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
                    isFullscreen ? 'w-full h-full' : 'w-full max-w-5xl h-[85vh] sm:h-[700px]'
                }`}
                style={{ animation: 'slideUp 0.3s ease-out' }}
            >
                {/* Enhanced Header */}
                <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 p-5 relative overflow-hidden">
        
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute inset-0" style={{
                            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)',
                            backgroundSize: '40px 40px'
                        }}></div>
                    </div>

                    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0"> 
                        <div className="flex items-start gap-4">
                            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-3 shadow-lg">
                                <MapPin size={28} className="text-white" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Plantation Map</h2>
                                {/* RESPONSIVENESS IMPROVEMENT: Allow stats to wrap on smaller screens */}
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                                    <span className="text-emerald-50 text-xs sm:text-sm font-medium bg-white bg-opacity-20 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                                        {stats.total} Locations
                                    </span>
                                    <span className="text-green-50 text-xs sm:text-sm font-medium bg-white bg-opacity-20 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                                        {stats.healthy} Healthy
                                    </span>
                                    <span className="text-red-50 text-xs sm:text-sm font-medium bg-white bg-opacity-20 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                                        {stats.infected} Infected
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto"> 
                            <button
                                onClick={() => setIsFullscreen(!isFullscreen)}
                                className="p-2.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl transition-all hover:scale-105 active:scale-95"
                                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                            >
                                {isFullscreen ? <Minimize2 size={20} className="text-white" /> : <Maximize2 size={20} className="text-white" />}
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl transition-all hover:scale-105 active:scale-95"
                                title="Close"
                            >
                                <X size={20} className="text-white" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Map Container */}
                <div className="flex-1 relative bg-gray-100">
                    {!mapLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                            <div className="text-center">
                                <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-gray-600 font-medium">Loading map...</p>
                            </div>
                        </div>
                    )}

                    <div ref={mapRef} className="absolute inset-0 w-full h-full"></div>

                    {/* Floating Controls */}
                    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                        {/* Layer Toggle Button */}
                        <div className="relative">
                            <button
                                onClick={() => setShowLayerMenu(!showLayerMenu)}
                                className="bg-white rounded-xl shadow-xl p-3 hover:shadow-2xl transition-all hover:scale-105 active:scale-95 border-2 border-gray-200"
                                title="Change Map Layer"
                            >
                                <Layers size={20} className="text-gray-700" />
                            </button>

                            {/* Layer Menu */}
                            {showLayerMenu && (
                                <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-gray-200 min-w-[140px] z-[1001]" // Ensure layer menu is above other controls
                                     style={{ animation: 'slideUp 0.2s ease-out' }}>
                                    <button
                                        onClick={() => switchLayer('street')}
                                        className={`w-full px-4 py-3 text-sm font-medium transition-all text-left flex items-center gap-2 ${
                                            currentLayer === 'street'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${currentLayer === 'street' ? 'bg-white' : 'bg-gray-400'}`}></div>
                                        Street View
                                    </button>
                                    <button
                                        onClick={() => switchLayer('satellite')}
                                        className={`w-full px-4 py-3 text-sm font-medium transition-all text-left flex items-center gap-2 border-t border-gray-200 ${
                                            currentLayer === 'satellite'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${currentLayer === 'satellite' ? 'bg-white' : 'bg-gray-400'}`}></div>
                                        Satellite
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Center Map Button */}
                        <button
                            onClick={centerMap}
                            className="bg-white rounded-xl shadow-xl p-3 hover:shadow-2xl transition-all hover:scale-105 active:scale-95 border-2 border-gray-200"
                            title="Center Map"
                        >
                            <CircleDotDashed size={20} className="text-gray-700" />
                        </button>
                    </div>

                </div>

      
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 sm:px-6 py-3 sm:py-4 border-t-2 border-gray-200">
                
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                            <Info size={16} className="text-blue-500 shrink-0" />
                            
                            <span className="font-medium hidden sm:inline">Click markers for details • Scroll to zoom • Drag to pan</span>
                            <span className="font-medium inline sm:hidden">Click markers for details</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-100 rounded-lg border border-green-300">
                                <div className="w-2 h-2 bg-green-500 rounded-full shrink-0"></div>
                                <span className="text-xs font-semibold text-green-700">Healthy</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-red-100 rounded-lg border border-red-300">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0"></div>
                                <span className="text-xs font-semibold text-red-700">Infected</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MapModal;