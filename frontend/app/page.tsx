"use client";

import { useState } from "react";
import ChatBot from "./ChatBot";
import GoogleMaps from "./GoogleMaps";
import { MapsGroundingResponse } from "./backend";
import UCMBusRouteFinder from "./bus";

export default function Home() {
  const [mapData, setMapData] = useState<MapsGroundingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="flex flex-row items-center justify-center h-screen w-screen">
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
    // <UCMBusRouteFinder />
  );
}
