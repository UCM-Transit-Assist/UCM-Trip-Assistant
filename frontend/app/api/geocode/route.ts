import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get("place_id");

  const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  if (!GOOGLE_MAPS_API_KEY) {
    return NextResponse.json(
      { error: "Google Maps API key not configured" },
      { status: 500 }
    );
  }

  if (!placeId) {
    return NextResponse.json(
      { error: "Missing required parameter: place_id" },
      { status: 400 }
    );
  }

  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: {
          place_id: placeId,
          key: GOOGLE_MAPS_API_KEY,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error calling Geocoding API:", error);
    return NextResponse.json(
      { error: "Failed to fetch geocoding data" },
      { status: 500 }
    );
  }
}
