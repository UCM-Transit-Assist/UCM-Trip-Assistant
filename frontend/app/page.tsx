"use client";

import React, { useState } from "react";
import ChatBot from "./ChatBot";
import GoogleMaps from "./GoogleMaps";
import {
  MapsGroundingResponse,
  setCurrentRoute,
  getCurrentRoute,
  ROUTE_DATA_MAP,
  RouteId,
  setAuto as setBackendAuto,
} from "./backend";

export default function Home() {
  const [mapData, setMapData] = useState<MapsGroundingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteId>(
    getCurrentRoute()
  );
  const [isAutoMode, setIsAutoMode] = useState(false);

  const handleRouteChange = (routeId: RouteId) => {
    setCurrentRoute(routeId);
    setSelectedRoute(routeId);
    setMapData(null); // Clear map data when switching routes
  };

  const toggleAutoMode = () => {
    const newAutoState = !isAutoMode;
    setIsAutoMode(newAutoState);
    setBackendAuto(newAutoState);
    setMapData(null); // Clear map data when toggling auto mode
  };

  // Sync the selected route when map data changes (for auto mode)
  React.useEffect(() => {
    if (mapData?.nearestBusStop?.routeId) {
      setSelectedRoute(mapData.nearestBusStop.routeId);
    }
  }, [mapData]);

  return (
    <div className="flex flex-col h-screen w-screen">
      {/* Route Selector */}
      <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">🚌 UCM Trip Assistant</h1>
        <div className="flex items-center gap-4">
          {/* Auto Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAutoMode}
              className={`px-4 py-2 rounded font-semibold transition-all ${
                isAutoMode
                  ? "bg-green-500 text-white shadow-lg shadow-green-500/50 ring-2 ring-green-400"
                  : "bg-gray-700 text-white border border-gray-600 hover:bg-gray-600"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              {isAutoMode ? "🤖 AUTO: ON" : "AUTO: OFF"}
            </button>
          </div>

          {/* Manual Route Selector */}
          <div className="flex items-center gap-2">
            <label className="font-semibold">
              {isAutoMode ? "Auto-Selected:" : "Bus Route:"}
            </label>
            <select
              value={selectedRoute}
              onChange={(e) => handleRouteChange(e.target.value as RouteId)}
              disabled={isAutoMode}
              className={`px-4 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isAutoMode
                  ? "bg-gray-600 text-gray-300 cursor-not-allowed border-gray-500"
                  : "bg-gray-700 text-white border-gray-600"
              }`}
              title={
                isAutoMode ? "Disabled in auto mode" : "Select a bus route"
              }
            >
              {Object.entries(ROUTE_DATA_MAP).map(([key, data]) => (
                <option key={key} value={key}>
                  {data.route} - {data.direction}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-row flex-1 overflow-hidden">
        <div className="border-r-2 h-full w-1/2">
          <ChatBot
            onResponse={setMapData}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        </div>

        <div className="w-1/2 h-full">
          <GoogleMaps mapData={mapData} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
