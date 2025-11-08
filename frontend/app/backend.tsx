import { GoogleGenAI } from "@google/genai";
import axios from "axios";

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

export interface MapLocation {
  title: string;
  uri: string;
}

export interface MapsGroundingResponse {
  text: string;
  locations: MapLocation[];
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
  const longitudeLatitude = [];

  console.log("response.candidates: ", grounding);

  if (grounding?.groundingChunks) {
    for (const chunk of grounding.groundingChunks) {
      if (chunk.maps) {
        locations.push({
          title: chunk.maps.title || "Unknown Location",
          uri: chunk.maps.uri || "",
        });

        let chunks = chunk.maps.placeId;
        let chunksArray = chunks.split("/");
        longitudeLatitude.push(convertToLongitudeLatitude(chunksArray[1]));
      }
    }
  }

  return {
    text: response.text || "",
    locations: locations.slice(0, 5), // Limit to 5 locations
  };
}
