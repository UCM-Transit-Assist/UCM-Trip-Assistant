import React from "react";
import {
  MapsGroundingResponse,
  getGoogleMapsApiKey,
  getCurrentRouteData,
  ROUTE_DATA_MAP,
} from "./backend";

interface GoogleMapsProps {
  mapData: MapsGroundingResponse | null;
  isLoading: boolean;
}

const GoogleMaps: React.FC<GoogleMapsProps> = ({ mapData, isLoading }) => {
  const googleMapsApiKey = getGoogleMapsApiKey();
  const routeData = getCurrentRouteData();

  const UTC_STOP = routeData.stops.find((stop) => stop.id === "utc");

  const createBusRouteMapUrl = () => {
    if (!mapData?.nearestBusStop || !UTC_STOP) {
      return null;
    }

    const nearestStop = mapData.nearestBusStop;

    const regularStops = routeData.stops.filter(
      (stop) => stop.type === "regular" || !stop.type
    );

    const utcIndex = regularStops.findIndex((stop) => stop.id === "utc");
    const nearestStopIndex = regularStops.findIndex(
      (stop) => stop.id === nearestStop.id
    );

    if (utcIndex === -1 || nearestStopIndex === -1) {
      console.warn("Could not find UTC or nearest stop in regular stops");
      return null;
    }

    let routeStops: Array<{
      id: string;
      name: string;
      coordinates?: { lat: number; lng: number };
    }> = [];
    if (nearestStopIndex > utcIndex) {
      routeStops = regularStops.slice(utcIndex, nearestStopIndex + 1);
    } else if (nearestStopIndex < utcIndex) {
      routeStops = [
        ...regularStops.slice(utcIndex),
        ...regularStops.slice(0, nearestStopIndex + 1),
      ];
    } else {
      routeStops = [regularStops[utcIndex]];
    }

    const intermediateStops = routeStops.slice(1, -1);
    const waypoints = intermediateStops
      .filter((stop) => stop.coordinates)
      .map((stop) => `${stop.coordinates!.lat},${stop.coordinates!.lng}`)
      .join("|");

    if (!UTC_STOP.coordinates || !nearestStop.coordinates) {
      return null;
    }

    let directionsUrl = `https://www.google.com/maps/embed/v1/directions?key=${googleMapsApiKey}`;
    directionsUrl += `&origin=${UTC_STOP.coordinates.lat},${UTC_STOP.coordinates.lng}`;
    directionsUrl += `&destination=${nearestStop.coordinates.lat},${nearestStop.coordinates.lng}`;

    if (waypoints) {
      directionsUrl += `&waypoints=${waypoints}`;
    }

    directionsUrl += `&mode=driving`;

    return directionsUrl;
  };

  const createWalkingDirectionsUrl = () => {
    if (!mapData?.nearestBusStop || !mapData.locations[0]?.coordinates) {
      return null;
    }

    const nearestStop = mapData.nearestBusStop;
    const destination = mapData.locations[0].coordinates;

    if (!nearestStop.coordinates) {
      return null;
    }

    let directionsUrl = `https://www.google.com/maps/embed/v1/directions?key=${googleMapsApiKey}`;
    directionsUrl += `&origin=${nearestStop.coordinates.lat},${nearestStop.coordinates.lng}`;
    directionsUrl += `&destination=${destination.lat},${destination.lng}`;
    directionsUrl += `&mode=walking`;

    return directionsUrl;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Maps Header */}
      <div className="bg-blue-600 px-6 py-4 border-b border-blue-700">
        <h2 className="text-2xl font-bold text-white mb-1">Route Navigation</h2>
        <p className="text-blue-100 text-sm">
          Interactive maps showing your journey
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-full space-y-4 bg-gray-50">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-blue-600 font-semibold text-lg">
            Loading route data...
          </p>
        </div>
      ) : mapData && mapData.locations.length > 0 ? (
        <div className="space-y-4 overflow-y-auto px-6 py-4 bg-gray-50">
          {/* Nearest Bus Stop Card */}
          {mapData.nearestBusStop && (
            <div className="bg-white p-5 rounded-lg border-2 border-blue-600 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-xl text-blue-900">
                  Nearest Bus Stop
                </h3>
                {mapData.nearestBusStop.routeId && (
                  <span className="bg-yellow-500 text-white text-sm px-4 py-1.5 rounded-full font-bold">
                    {ROUTE_DATA_MAP[mapData.nearestBusStop.routeId].route}
                  </span>
                )}
              </div>
              <p className="font-bold text-lg text-gray-900 mb-1">
                {mapData.nearestBusStop.name}
              </p>
              <p className="text-sm text-gray-600 mb-3">
                {mapData.nearestBusStop.address}
              </p>
              <div className="flex gap-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-900">
                    <strong className="text-blue-600">Distance:</strong>{" "}
                    {mapData.nearestBusStop.distance}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-900">
                    <strong className="text-blue-600">Walk Time:</strong>{" "}
                    {mapData.nearestBusStop.duration}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Bus Route Map */}
          {mapData.nearestBusStop &&
            mapData.nearestBusStop.routeId &&
            createBusRouteMapUrl() && (
              <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                <div className="p-5 bg-blue-50 border-b border-gray-200">
                  <p className="text-xl font-bold text-blue-900 mb-2">
                    {ROUTE_DATA_MAP[mapData.nearestBusStop.routeId].route} Bus
                    Route
                  </p>
                  <p className="text-sm text-gray-700 mb-4">
                    Board the{" "}
                    {ROUTE_DATA_MAP[mapData.nearestBusStop.routeId].route} bus
                    at UTC and ride to {mapData.nearestBusStop.name}
                  </p>
                  <div className="bg-white p-4 rounded-lg space-y-3 text-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white font-bold">
                        A
                      </span>
                      <div>
                        <span className="font-bold text-gray-900">
                          UC Merced (UTC)
                        </span>
                        <p className="text-gray-600 text-xs">
                          Board the bus here
                        </p>
                      </div>
                    </div>
                    <div className="ml-4 border-l-2 border-blue-600 h-4"></div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white font-bold">
                        B
                      </span>
                      <div>
                        <span className="font-bold text-gray-900">
                          {mapData.nearestBusStop.name}
                        </span>
                        <p className="text-gray-600 text-xs">
                          Get off the bus here
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <iframe
                  className="w-full"
                  src={createBusRouteMapUrl() || ""}
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}

          {/* Walking Directions Map */}
          {mapData.nearestBusStop &&
            mapData.locations[0]?.coordinates &&
            createWalkingDirectionsUrl() && (
              <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                <div className="p-5 bg-green-50 border-b border-gray-200">
                  <p className="text-xl font-bold text-gray-900 mb-2">
                    Walking to {mapData.locations[0].title}
                  </p>
                  <p className="text-sm text-gray-700 mb-4">
                    Walk from {mapData.nearestBusStop.name} to your destination
                    ({mapData.nearestBusStop.distance}, ~
                    {mapData.nearestBusStop.duration})
                  </p>
                  <div className="bg-white p-4 rounded-lg space-y-3 text-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white font-bold">
                        B
                      </span>
                      <div>
                        <span className="font-bold text-gray-900">
                          {mapData.nearestBusStop.name}
                        </span>
                        <p className="text-gray-600 text-xs">
                          Start walking from here
                        </p>
                      </div>
                    </div>
                    <div className="ml-4 border-l-2 border-green-600 h-4"></div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white font-bold">
                        C
                      </span>
                      <div>
                        <span className="font-bold text-gray-900">
                          {mapData.locations[0].title}
                        </span>
                        <p className="text-gray-600 text-xs">
                          Your destination
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <iframe
                  className="w-full"
                  src={createWalkingDirectionsUrl() || ""}
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full px-6 space-y-6 bg-gray-50">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl text-blue-600 font-bold">MAP</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">
              Ready to Navigate
            </h3>
            <p className="text-gray-600 text-lg max-w-md">
              Ask the assistant about places you&apos;d like to visit, and
              I&apos;ll show you the best route to get there!
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 border-2 border-gray-200 max-w-lg shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                  1
                </div>
                <p className="text-gray-700">Ask about a place in the chat</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                  2
                </div>
                <p className="text-gray-700">
                  I&apos;ll find the nearest bus stop
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                  3
                </div>
                <p className="text-gray-700">View your complete route here</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMaps;
