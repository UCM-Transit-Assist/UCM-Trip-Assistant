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
  const [isAutoMode, setIsAutoMode] = useState(true);

  const handleRouteChange = (routeId: RouteId) => {
    setCurrentRoute(routeId);
    setSelectedRoute(routeId);
    setMapData(null);
  };

  const toggleAutoMode = () => {
    const newAutoState = !isAutoMode;
    setIsAutoMode(newAutoState);
    setBackendAuto(newAutoState);
    setMapData(null);
  };

  React.useEffect(() => {
    setBackendAuto(true);
  }, []);


  React.useEffect(() => {
    if (mapData?.nearestBusStop?.routeId) {
      setSelectedRoute(mapData.nearestBusStop.routeId);
    }
  
  }, [mapData]);

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-50">
      {/* Header with UC Merced Branding */}
      <header className="bg-white shadow-md border-b-4 border-blue-600">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="UC Merced Logo" width={64} height={64} />
              <div>
                <h1 className="text-3xl font-bold text-blue-900">
                  UCM Transit Assistant
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  Smart Route Planning • AI-Powered Navigation
                </p>
              </div>
            </div>

            {/* Route Controls */}
            <div className="flex items-center gap-3">
              {/* Auto Mode Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleAutoMode}
                  className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                    isAutoMode
                      ? "bg-yellow-500 text-white shadow-lg hover:bg-yellow-600"
                      : "bg-white text-blue-900 border-2 border-blue-600 hover:bg-blue-50"
                  }`}
                >
                  {isAutoMode ? "AUTO MODE: ON" : "MANUAL MODE"}
                </button>
               
              </div>

              {/* Route Selector */}
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border-2 border-gray-300">
                <label className="font-semibold text-gray-700 text-sm">
                  {isAutoMode ? "Auto-Selected:" : "Bus Route:"}
                </label>
                <select
                  value={selectedRoute}
                  onChange={(e) => handleRouteChange(e.target.value as RouteId)}
                  disabled={isAutoMode}
                  className={`px-3 py-1.5 rounded-lg font-semibold text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isAutoMode
                      ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                      : "bg-white text-blue-900 hover:bg-gray-50 cursor-pointer border-gray-300"
                  }`}
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
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-row flex-1 overflow-hidden">
        {/* Left Panel - Chatbot */}
        <div className="w-1/2 h-full border-r border-gray-300">
          <ChatBot
            onResponse={setMapData}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        </div>

        {/* Right Panel - Maps */}
        <div className="w-1/2 h-full">
          <GoogleMaps mapData={mapData} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
