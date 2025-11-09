"use client";

import { useState } from "react";
import ChatBot from "./ChatBot";
import GoogleMaps from "./GoogleMaps";
import {
  MapsGroundingResponse,
  setCurrentRoute,
  getCurrentRoute,
  ROUTE_DATA_MAP,
  RouteId,
} from "./backend";

export default function Home() {
  const [mapData, setMapData] = useState<MapsGroundingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteId>(
    getCurrentRoute()
  );

  const handleRouteChange = (routeId: RouteId) => {
    setCurrentRoute(routeId);
    setSelectedRoute(routeId);
    setMapData(null); // Clear map data when switching routes
  };

  return (
    <div className="flex flex-col h-screen w-screen">
      {/* Route Selector */}
      <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">🚌 UCM Trip Assistant</h1>
        <div className="flex items-center gap-4">
          <label className="font-semibold">Bus Route:</label>
          <select
            value={selectedRoute}
            onChange={(e) => handleRouteChange(e.target.value as RouteId)}
            className="px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(ROUTE_DATA_MAP).map(([key, data]) => (
              <option key={key} value={key}>
                {data.route} - {data.direction}
              </option>
            ))}
          </select>
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
