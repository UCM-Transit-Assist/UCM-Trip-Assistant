import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import c1RouteData from "../routes/c1_route_data.json";
import c2RouteData from "../routes/c2_route_data.json";
import fc1RouteData from "../routes/fc1_route_data.json";
import fc2RouteData from "../routes/fc2_route_data.json";
import e1RouteData from "../routes/e1_route_data.json";
import e2RouteData from "../routes/e2_route_data.json";
import beRouteData from "../routes/be_route_data.json";
import gRouteData from "../routes/g_route_data.json";
import yosemiteRouteData from "../routes/yosemite_route_data.json";

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
// console.log("Google Maps API Key: ", GOOGLE_MAPS_API_KEY);

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
// console.log("Gemini Api key: ", ai); // AIzaSyDCv0oPQKwvpkwzjWM3XpEKZs8Qx2NXBB4

// Route data map for easy access
export const ROUTE_DATA_MAP = {
  c1: c1RouteData,
  c2: c2RouteData,
  fc1: fc1RouteData,
  fc2: fc2RouteData,
  e1: e1RouteData,
  e2: e2RouteData,
  be: beRouteData,
  g: gRouteData,
  yosemite: yosemiteRouteData,
};

export type RouteId = keyof typeof ROUTE_DATA_MAP;

// Default route
let currentRoute: RouteId = "fc1";

export function setCurrentRoute(routeId: RouteId) {
  currentRoute = routeId;
  console.log(`Route changed to: ${routeId}`);
}

export function getCurrentRoute(): RouteId {
  return currentRoute;
}

export function getCurrentRouteData() {
  return ROUTE_DATA_MAP[currentRoute];
}

export function getAPIKey() {
  return GEMINI_API_KEY;
}
export function getGoogleMapsApiKey() {
  return GOOGLE_MAPS_API_KEY;
}

export interface BusStop {
  id: string;
  name: string;
  address?: string;
  type?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  distance?: string;
  duration?: string;
}

export interface MapLocation {
  title: string;
  uri: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface MapsGroundingResponse {
  text: string;
  locations: MapLocation[];
  nearestBusStop?: BusStop;
}

async function convertToLongitudeLatitude(address: string) {
  console.log("address: ", address);

  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?place_id=${address}&key=${GOOGLE_MAPS_API_KEY}`
  );
  // console.log("convertToLongitudeLatitude response: ", response.data);
  const longitude = response.data.results[0].geometry.location.lng;
  const latitude = response.data.results[0].geometry.location.lat;

  // console.log("longitude: ", longitude);
  // console.log("latitude: ", latitude);

  return { longitude, latitude };
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find the nearest bus stop to a given location using distance calculation
export async function findNearestBusStop(
  destinationLat: number,
  destinationLng: number,
  routeId?: RouteId
): Promise<BusStop | null> {
  try {
    // Get all bus stops for the selected route
    const routeData = routeId ? ROUTE_DATA_MAP[routeId] : getCurrentRouteData();
    const busStops = routeData.stops;

    // Calculate distances to all stops
    let minDistance = Infinity;
    let nearestStopIndex = 0;

    busStops.forEach((stop, index) => {
      if (stop.coordinates) {
        const distanceMiles = calculateDistance(
          stop.coordinates.lat,
          stop.coordinates.lng,
          destinationLat,
          destinationLng
        );

        if (distanceMiles < minDistance) {
          minDistance = distanceMiles;
          nearestStopIndex = index;
        }
      }
    });

    const nearestStop = busStops[nearestStopIndex];
    const walkingSpeedMph = 3; // Average walking speed
    const durationMinutes = Math.round((minDistance / walkingSpeedMph) * 60);

    console.log(
      `Nearest bus stop: ${nearestStop.name}, Distance: ${minDistance.toFixed(
        2
      )} mi, Duration: ${durationMinutes} min`
    );

    return {
      ...nearestStop,
      distance: `${minDistance.toFixed(2)} mi`,
      duration: `${durationMinutes} min`,
    };
  } catch (error) {
    console.error("Error finding nearest bus stop:", error);
    return null;
  }
}
export async function generateContentWithMapsGrounding(
  user_text: string,
  latitude: number = 37.30293194200341,
  longitude: number = -120.48662202501602
): Promise<MapsGroundingResponse> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: user_text,
    config: {
      // Turn on grounding with Google Maps
      tools: [{ googleMaps: { enableWidget: true } }],
      toolConfig: {
        retrievalConfig: {
          // Optionally provide the relevant location context (this is in Merced, CA)
          latLng: {
            latitude: latitude,
            longitude: longitude,
          },
        },
      },
    },
  });

  const locations: MapLocation[] = [];
  const grounding = response.candidates?.[0]?.groundingMetadata;
  const locationCoordinates: Array<{ longitude: number; latitude: number }> =
    [];

  console.log("response.candidates: ", grounding);

  if (grounding?.groundingChunks) {
    for (const chunk of grounding.groundingChunks) {
      if (chunk.maps && chunk.maps.placeId) {
        const chunks = chunk.maps.placeId;
        const chunksArray = chunks.split("/");
        const coords = await convertToLongitudeLatitude(chunksArray[1]);
        locationCoordinates.push(coords);

        locations.push({
          title: chunk.maps.title || "Unknown Location",
          uri: chunk.maps.uri || "",
          coordinates: {
            lat: coords.latitude,
            lng: coords.longitude,
          },
        });
      }
    }
  }

  // Find nearest bus stop to the first location if available
  let nearestBusStop: BusStop | null = null;
  let enhancedText = response.text || "";

  console.log("Locations found:", locations.length);
  console.log("First location coordinates:", locations[0]?.coordinates);

  // Format the locations list with spacing
  if (locations.length > 0) {
    enhancedText += `\n\n---\n\n**📍 Recommended Locations:**\n\n`;
    locations.slice(0, 5).forEach((loc, idx) => {
      enhancedText += `${idx + 1}. **${loc.title}**\n\n`;
    });
  }

  if (locations.length > 0 && locations[0].coordinates) {
    console.log("Finding nearest bus stop for:", locations[0].title);
    nearestBusStop = await findNearestBusStop(
      locations[0].coordinates.lat,
      locations[0].coordinates.lng
    );
    console.log("Nearest bus stop found:", nearestBusStop);

    // Enhance the response with bus route information
    if (nearestBusStop) {
      const routeData = getCurrentRouteData();
      console.log("Adding transportation info to response");
      enhancedText += `\n---\n\n**🚌 How to Get to "${locations[0].title}":**\n\n`;
      enhancedText += `1. **Take Bus:** ${routeData.route} (${routeData.direction})\n\n`;
      enhancedText += `2. **Board At:** UTC (University Transit Center)\n\n`;
      enhancedText += `3. **Get Off At:** ${nearestBusStop.name}\n\n`;
      enhancedText += `4. **Walk to Destination:** ${nearestBusStop.distance} (approximately ${nearestBusStop.duration})\n\n`;
      enhancedText += `📝 **Tip:** The map on the right shows walking directions from the bus stop to your destination!`;
      console.log("Enhanced text:", enhancedText);
    } else {
      console.log("No nearest bus stop found");
    }
  } else {
    console.log("No locations or coordinates available");
  }

  return {
    text: enhancedText,
    locations: locations.slice(0, 5), // Limit to 5 locations
    nearestBusStop: nearestBusStop || undefined,
  };
}
