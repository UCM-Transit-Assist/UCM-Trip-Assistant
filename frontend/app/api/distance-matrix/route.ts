import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const origins = searchParams.get("origins");
  const destinations = searchParams.get("destinations");
  const mode = searchParams.get("mode") || "walking";

  const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  if (!GOOGLE_MAPS_API_KEY) {
    return NextResponse.json(
      { error: "Google Maps API key not configured" },
      { status: 500 }
    );
  }

  if (!origins || !destinations) {
    return NextResponse.json(
      { error: "Missing required parameters: origins and destinations" },
      { status: 400 }
    );
  }

  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/distancematrix/json",
      {
        params: {
          origins,
          destinations,
          key: GOOGLE_MAPS_API_KEY,
          mode,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error calling Distance Matrix API:", error);
    return NextResponse.json(
      { error: "Failed to fetch distance matrix data" },
      { status: 500 }
    );
  }
}
