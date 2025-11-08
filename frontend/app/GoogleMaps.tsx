import React from "react";
import { MapsGroundingResponse, getAPIKey, getGoogleMapsApiKey } from "./backend";

interface GoogleMapsProps {
  mapData: MapsGroundingResponse | null;
  isLoading: boolean;
}

const GoogleMaps: React.FC<GoogleMapsProps> = ({ mapData, isLoading }) => {
  const googleMapsApiKey = getGoogleMapsApiKey();
  console.log("Google Maps API Key: ", googleMapsApiKey);

  return (
    <div className="flex flex-col h-full p-4">
      <h2 className="text-2xl font-bold mb-4">Map Results</h2>

      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Loading map data...</p>
        </div>
      ) : mapData && mapData.locations.length > 0 ? (
        <div className="space-y-4 overflow-y-auto">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Response:</h3>
            <p className="whitespace-pre-wrap">{mapData.text}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">
              Locations ({mapData.locations.length}):
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

          {/* Optional: Embed the first location in an iframe */}
          {mapData.locations[0] && (
            <div className="bg-white rounded-lg overflow-hidden shadow-lg">
              <p className="text-lg font-bold">{mapData.locations[0].title}</p>
              <iframe
                src={`https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${encodeURIComponent(
                  mapData.locations[0].title
                )}`}
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
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
