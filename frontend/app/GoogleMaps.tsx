import React from "react";
import {
  MapsGroundingResponse,
  getAPIKey,
  getGoogleMapsApiKey,
} from "./backend";
import c1RouteData from "../routes/c1_route_data.json";

interface GoogleMapsProps {
  mapData: MapsGroundingResponse | null;
  isLoading: boolean;
}

const GoogleMaps: React.FC<GoogleMapsProps> = ({ mapData, isLoading }) => {
  const googleMapsApiKey = getGoogleMapsApiKey();
  console.log("Google Maps API Key: ", googleMapsApiKey);

  // UTC (University Transit Center) coordinates
  const UTC_STOP = c1RouteData.stops.find(stop => stop.id === "utc");

  // Create URL for route from UTC to nearest bus stop with destination marker
  const createRouteToNearestStop = () => {
    if (!mapData?.nearestBusStop || !UTC_STOP || !mapData.locations[0]?.coordinates) {
      return null;
    }

    const nearestStop = mapData.nearestBusStop;
    const destination = mapData.locations[0].coordinates;

    // Find stops between UTC and nearest stop
    const utcIndex = c1RouteData.stops.findIndex(stop => stop.id === "utc");
    const nearestStopIndex = c1RouteData.stops.findIndex(
      stop => stop.id === nearestStop.id
    );

    let waypointsStops: typeof c1RouteData.stops = [];
    if (nearestStopIndex > utcIndex) {
      // Going forward from UTC
      waypointsStops = c1RouteData.stops.slice(utcIndex + 1, nearestStopIndex);
    } else if (nearestStopIndex < utcIndex) {
      // Going backward from UTC (would need to go around)
      waypointsStops = c1RouteData.stops.slice(nearestStopIndex + 1, utcIndex);
    }

    const waypoints = waypointsStops
      .map(stop => `${stop.coordinates.lat},${stop.coordinates.lng}`)
      .join('|');

    // Add the destination as a final waypoint for marker
    const waypointsParam = waypoints
      ? `${waypoints}|${nearestStop.coordinates.lat},${nearestStop.coordinates.lng}`
      : `${nearestStop.coordinates.lat},${nearestStop.coordinates.lng}`;

    return `https://www.google.com/maps/embed/v1/directions?key=${googleMapsApiKey}&origin=${UTC_STOP.coordinates.lat},${UTC_STOP.coordinates.lng}&destination=${destination.lat},${destination.lng}&waypoints=${waypointsParam}&mode=transit`;
  };

  // Create URL-encoded path from C1 route coordinates (for testing)
  const createFullRouteUrl = () => {
    const waypoints = c1RouteData.stops
      .map(stop => `${stop.coordinates.lat},${stop.coordinates.lng}`)
      .join('|');

    return `https://www.google.com/maps/embed/v1/directions?key=${googleMapsApiKey}&origin=${c1RouteData.stops[0].coordinates.lat},${c1RouteData.stops[0].coordinates.lng}&destination=${c1RouteData.stops[c1RouteData.stops.length - 1].coordinates.lat},${c1RouteData.stops[c1RouteData.stops.length - 1].coordinates.lng}&waypoints=${waypoints}&mode=driving`;
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
              <h3 className="font-bold text-lg mb-2">Nearest Bus Stop</h3>
              <p className="font-semibold">{mapData.nearestBusStop.name}</p>
              <p className="text-sm text-gray-600">{mapData.nearestBusStop.address}</p>
              <div className="mt-2 flex gap-4">
                <span className="text-sm">
                  <strong>Distance:</strong> {mapData.nearestBusStop.distance}
                </span>
                <span className="text-sm">
                  <strong>Walking Time:</strong> {mapData.nearestBusStop.duration}
                </span>
              </div>
            </div>
          )}

          {/* Combined Route Map: UTC to Nearest Stop to Destination */}
          {mapData.nearestBusStop && createRouteToNearestStop() && (
            <div className="bg-white rounded-lg overflow-hidden shadow-lg">
              <div className="p-4">
                <p className="text-lg font-bold mb-2">
                  Route from UC Merced to {mapData.locations[0].title}
                </p>
                <p className="text-sm text-gray-600">
                  Via C1 Bus to {mapData.nearestBusStop.name}
                </p>
              </div>
              <iframe
                className="border-2 border-blue-500 rounded-lg"
                src={createRouteToNearestStop() || ''}
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
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">
              Destination Details:
            </h3>
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
          </div>

          {/* Full C1 Bus Route (for testing) */}
          <div className="bg-white rounded-lg overflow-hidden shadow-lg">
            <p className="text-lg font-bold p-4">Full C1 Bus Route - {c1RouteData.direction}</p>
            <iframe
              className="border-2 border-purple-500 rounded-lg"
              src={createFullRouteUrl()}
              width="100%"
              height="600"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
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
