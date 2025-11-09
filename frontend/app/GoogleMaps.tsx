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
  // console.log("Google Maps API Key: ", googleMapsApiKey);
  // console.log("Current route:", routeData.route);

  // UTC (University Transit Center) coordinates
  const UTC_STOP = routeData.stops.find((stop) => stop.id === "utc");

  // Create bus route from UTC to nearest stop with destination marker
  const createBusRouteMapUrl = () => {
    if (
      !mapData?.nearestBusStop ||
      !UTC_STOP ||
      !mapData.locations[0]?.coordinates
    ) {
      return null;
    }

    const nearestStop = mapData.nearestBusStop;
    const destination = mapData.locations[0].coordinates;

    // Filter to only use regular bus stops (exclude checkpoints and request stops)
    // This ensures the route only includes actual passenger stops, not waypoints
    const regularStops = routeData.stops.filter(
      (stop) => stop.type === "regular" || !stop.type
    );

    // Find stops between UTC and nearest stop along the bus route
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
      // Going forward from UTC to nearest stop
      routeStops = regularStops.slice(utcIndex, nearestStopIndex + 1);
    } else if (nearestStopIndex < utcIndex) {
      // Going backward - take the route around
      routeStops = [
        ...regularStops.slice(utcIndex),
        ...regularStops.slice(0, nearestStopIndex + 1),
      ];
    } else {
      // Same stop (unlikely but handle it)
      routeStops = [regularStops[utcIndex]];
    }

    // Build the directions URL with all intermediate stops as waypoints
    const intermediateStops = routeStops.slice(1, -1); // Exclude origin and destination
    const waypoints = intermediateStops
      .filter((stop) => stop.coordinates)
      .map((stop) => `${stop.coordinates!.lat},${stop.coordinates!.lng}`)
      .join("|");

    // Create the directions URL showing the bus route
    // Origin: UTC, Destination: Nearest stop, with intermediate stops as waypoints
    if (!UTC_STOP.coordinates || !nearestStop.coordinates) {
      return null;
    }

    let directionsUrl = `https://www.google.com/maps/embed/v1/directions?key=${googleMapsApiKey}`;
    directionsUrl += `&origin=${UTC_STOP.coordinates.lat},${UTC_STOP.coordinates.lng}`;
    directionsUrl += `&destination=${nearestStop.coordinates.lat},${nearestStop.coordinates.lng}`;

    if (waypoints) {
      directionsUrl += `&waypoints=${waypoints}`;
    }

    // Add the final destination as a marker by including it as an additional waypoint
    directionsUrl += `|${destination.lat},${destination.lng}`;
    directionsUrl += `&mode=driving`; // Use driving to approximate bus route

    return directionsUrl;
  };

  return (
    <div className="flex flex-col h-full p-4">
      <h2 className="text-2xl font-bold mb-4">Map Results</h2>

      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Loading map data...</p>
        </div>
      ) : mapData && mapData.locations.length > 0 ? (
        <div className="space-y-4 overflow-y-auto">
          {/* Nearest Bus Stop and Route Information */}
          {mapData.nearestBusStop && (
            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">Nearest Bus Stop</h3>
                {mapData.nearestBusStop.routeId && (
                  <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                    {ROUTE_DATA_MAP[mapData.nearestBusStop.routeId].route}
                  </span>
                )}
              </div>
              <p className="font-semibold">{mapData.nearestBusStop.name}</p>
              <p className="text-sm text-gray-600">
                {mapData.nearestBusStop.address}
              </p>
              <div className="mt-2 flex gap-4">
                <span className="text-sm">
                  <strong>Distance:</strong> {mapData.nearestBusStop.distance}
                </span>
                <span className="text-sm">
                  <strong>Walking Time:</strong>{" "}
                  {mapData.nearestBusStop.duration}
                </span>
              </div>
            </div>
          )}

          {/* Bus Route from UTC to Nearest Stop with Destination Marker */}
          {mapData.nearestBusStop &&
            mapData.nearestBusStop.routeId &&
            createBusRouteMapUrl() && (
              <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                <div className="p-4">
                  <p className="text-lg font-bold mb-2">
                    {ROUTE_DATA_MAP[mapData.nearestBusStop.routeId].route} Bus
                    Route to {mapData.locations[0].title}
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    Take the{" "}
                    {ROUTE_DATA_MAP[mapData.nearestBusStop.routeId].route} bus
                    from UTC to {mapData.nearestBusStop.name}, then walk to your
                    destination
                  </p>
                  <div className="bg-blue-50 p-3 rounded-lg space-y-1 text-sm">
                    <p className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white font-bold text-xs">
                        A
                      </span>
                      <span className="font-semibold">UC Merced (UTC)</span> -
                      Board the{" "}
                      {ROUTE_DATA_MAP[mapData.nearestBusStop.routeId].route} bus
                      here
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white font-bold text-xs">
                        B
                      </span>
                      <span className="font-semibold">
                        {mapData.nearestBusStop.name}
                      </span>{" "}
                      - Get off the bus here
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white font-bold text-xs">
                        C
                      </span>
                      <span className="font-semibold">
                        {mapData.locations[0].title}
                      </span>{" "}
                      - Walk {mapData.nearestBusStop.distance} to reach your
                      destination
                    </p>
                  </div>
                </div>
                <iframe
                  className="border-2 border-blue-500 rounded-lg"
                  src={createBusRouteMapUrl() || ""}
                  width="100%"
                  height="600"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}

          {/* Location Information */}
          {/* <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">All Recommended Locations:</h3>
            <div className="space-y-3">
              {mapData.locations.map((location, idx) => (
                <div key={idx} className="border-l-4 border-red-500 pl-3">
                  <p className="font-medium">{location.title}</p>
                  <a
                    href={location.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View on Google Maps →
                  </a>
                </div>
              ))}
            </div>
          </div> */}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 text-center">
            No map data yet.
            <br />
            <span className="text-sm">
              Ask a question in the chatbot to get started!
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default GoogleMaps;
