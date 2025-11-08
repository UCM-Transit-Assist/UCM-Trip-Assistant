import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export function getAPIKey() {
  return ai;
}

export interface MapLocation {
  title: string;
  uri: string;
}

export interface MapsGroundingResponse {
  text: string;
  locations: MapLocation[];
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

  if (grounding?.groundingChunks) {
    for (const chunk of grounding.groundingChunks) {
      if (chunk.maps) {
        locations.push({
          title: chunk.maps.title || "Unknown Location",
          uri: chunk.maps.uri || "",
        });
      }
    }
  }

  return {
    text: response.text || "",
    locations: locations,
  };
}
