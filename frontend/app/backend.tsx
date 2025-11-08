import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import c1RouteData from "../routes/c1_route_data.json";

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
// console.log("Google Maps API Key: ", GOOGLE_MAPS_API_KEY);

const chipotle_coordinates = [37.31970104781838, -120.48617522530186];

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
// console.log("Gemini Api key: ", ai); // AIzaSyDCv0oPQKwvpkwzjWM3XpEKZs8Qx2NXBB4

export function getAPIKey() {
  return ai.apiKey;
}
export function getGoogleMapsApiKey() {
  return GOOGLE_MAPS_API_KEY;
}

export interface BusStop {
  id: string;
  name: string;
  address: string;
  coordinates: {
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

// Find the nearest bus stop to a given location using Distance Matrix API
export async function findNearestBusStop(
  destinationLat: number,
  destinationLng: number
): Promise<BusStop | null> {
  try {
    // Get all C1 bus stops
    const busStops = c1RouteData.stops;

    // Create origins string (all bus stops)
    const origins = busStops
      .map(stop => `${stop.coordinates.lat},${stop.coordinates.lng}`)
      .join('|');

    // Destination is the user's desired location
    const destination = `${destinationLat},${destinationLng}`;

    // Call Distance Matrix API
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/distancematrix/json`,
      {
        params: {
          origins: origins,
          destinations: destination,
          key: GOOGLE_MAPS_API_KEY,
          mode: 'walking', // Use walking distance for better accuracy
        },
      }
    );

    console.log("Distance Matrix response: ", response.data);

    // Find the closest stop
    let minDistance = Infinity;
    let nearestStopIndex = 0;

    response.data.rows.forEach((row: { elements: Array<{ status: string; distance: { value: number } }> }, index: number) => {
      const element = row.elements[0];
      if (element.status === 'OK' && element.distance.value < minDistance) {
        minDistance = element.distance.value;
        nearestStopIndex = index;
      }
    });

    const nearestStop = busStops[nearestStopIndex];
    const distanceInfo = response.data.rows[nearestStopIndex].elements[0];

    return {
      ...nearestStop,
      distance: distanceInfo.distance.text,
      duration: distanceInfo.duration.text,
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
  const locationCoordinates: Array<{ longitude: number; latitude: number }> = [];

  console.log("response.candidates: ", grounding);

  if (grounding?.groundingChunks) {
    for (const chunk of grounding.groundingChunks) {
      if (chunk.maps) {
        let chunks = chunk.maps.placeId;
        let chunksArray = chunks.split("/");
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
  if (locations.length > 0 && locations[0].coordinates) {
    nearestBusStop = await findNearestBusStop(
      locations[0].coordinates.lat,
      locations[0].coordinates.lng
    );
    console.log("Nearest bus stop: ", nearestBusStop);
  }

  return {
    text: response.text || "",
    locations: locations.slice(0, 5), // Limit to 5 locations
    nearestBusStop: nearestBusStop || undefined,
  };
}
