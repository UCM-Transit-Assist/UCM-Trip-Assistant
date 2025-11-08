import React, { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, Clock, Info, Bus, Footprints } from "lucide-react";

const UCMBusRouteFinder = () => {
  const [nearestStop, setNearestStop] = useState(null);
  const [allDistances, setAllDistances] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [walkingRoute, setWalkingRoute] = useState(null);
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef([]);
  const routePolylineRef = useRef(null);
  const walkingPolylineRef = useRef(null);

  // Chipotle destination
  const destination = {
    name: "Chipotle",
    lat: 37.31970104781838,
    lng: -120.48617522530186,
  };

  // UCM Bus stops in route order
  const stops = [
    {
      id: "granville_apartments",
      name: "Granville Apartments",
      address: "1440 G Street, Merced, CA 95341",
      coordinates: { lat: 37.31518565692025, lng: -120.50288827002001 },
      routeOrder: 1,
    },
    {
      id: "g_st_alexander_76",
      name: "G St. & W. Alexander Ave. (76 Gas Station)",
      address: "G Street & W Alexander Avenue, Merced, CA 95348",
      coordinates: { lat: 37.314767803653766, lng: -120.46953955345066 },
      routeOrder: 2,
    },
    {
      id: "rite_aid_walgreens",
      name: "Rite Aid / Walgreens",
      address: "1570 G Street, Merced, CA 95341",
      coordinates: { lat: 37.31970607555082, lng: -120.46913797409276 },
      routeOrder: 3,
    },
    {
      id: "el_portal_north",
      name: "El Portal Plaza & G St. (Northbound)",
      address: "El Portal Plaza, G Street, Merced, CA 95348",
      coordinates: { lat: 37.3065, lng: -120.4855 },
      routeOrder: 4,
    },
    {
      id: "mercy_hospital_north",
      name: "Mercy Hospital / Tri-College (Northbound)",
      address: "333 Mercy Avenue, Merced, CA 95340",
      coordinates: { lat: 37.3075, lng: -120.4865 },
      routeOrder: 5,
    },
    {
      id: "bellevue_ranch",
      name: "M St. & Bellevue Rd. (Bellevue Ranch)",
      address: "M Street & Bellevue Road, Merced, CA 95348",
      coordinates: { lat: 37.3585, lng: -120.4425 },
      routeOrder: 6,
    },
    {
      id: "utc",
      name: "University Transit Center (UTC)",
      address: "5200 North Lake Road, Merced, CA 95343",
      coordinates: { lat: 37.361474228296544, lng: -120.4281067381593 },
      routeOrder: 7,
    },
    {
      id: "mercy_hospital_south",
      name: "Mercy Hospital / Tri-College (Southbound)",
      address: "333 Mercy Avenue, Merced, CA 95340",
      coordinates: { lat: 37.33919117445795, lng: -120.46879489131155 },
      routeOrder: 8,
    },
    {
      id: "el_portal_south",
      name: "El Portal Plaza & G St. (Southbound)",
      address: "El Portal Plaza, G Street, Merced, CA 95348",
      coordinates: { lat: 37.33591501029209, lng: -120.46921720713728 },
      routeOrder: 9,
    },
    {
      id: "g_st_alexander_pauls",
      name: "G St. & W. Alexander Ave. (Paul's Place)",
      address: "G Street & W Alexander Avenue, Merced, CA 95348",
      coordinates: { lat: 37.32489688914247, lng: -120.46935387234957 },
      routeOrder: 10,
    },
  ];

  // Calculate distance using Haversine formula (in meters)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Load Google Maps API
  useEffect(() => {
    if (window.google && window.google.maps) {
      console.log("Google Maps already loaded");
      setMapLoaded(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com"]'
    );
    if (existingScript) {
      console.log("Google Maps script already exists");
      const checkGoogle = setInterval(() => {
        if (window.google && window.google.maps) {
          console.log("Google Maps loaded from existing script");
          clearInterval(checkGoogle);
          setMapLoaded(true);
        }
      }, 100);
      return () => clearInterval(checkGoogle);
    }

    console.log("Loading Google Maps API...");
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAhTFJDR_9SzRGqVWedunevvLnqu3NjC4g&libraries=geometry,places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log("Google Maps API loaded successfully");
      setMapLoaded(true);
    };
    script.onerror = (error) => {
      console.error("Google Maps API failed to load:", error);
      setMapLoaded(false);
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialize map and calculate distances
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) {
      console.log("Map not ready:", { mapLoaded, hasMapRef: !!mapRef.current });
      return;
    }

    console.log("Initializing map...");

    try {
      // Calculate distances
      const distances = stops.map((stop) => {
        const distance = calculateDistance(
          stop.coordinates.lat,
          stop.coordinates.lng,
          destination.lat,
          destination.lng
        );
        return {
          ...stop,
          distance: distance,
          distanceKm: (distance / 1000).toFixed(2),
          distanceMiles: (distance / 1609.34).toFixed(2),
          walkingTime: Math.round((distance / 1000 / 5) * 60),
        };
      });

      distances.sort((a, b) => a.distance - b.distance);
      setAllDistances(distances);
      setNearestStop(distances[0]);

      // Initialize Google Map
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: destination.lat, lng: destination.lng },
        zoom: 12,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });

      console.log("Map created successfully");
      googleMapRef.current = map;

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];

      // Add destination marker (Chipotle)
      const destMarker = new google.maps.Marker({
        position: { lat: destination.lat, lng: destination.lng },
        map: map,
        title: destination.name,
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
          scaledSize: new google.maps.Size(40, 40),
        },
        animation: google.maps.Animation.DROP,
      });

      const destInfoWindow = new google.maps.InfoWindow({
        content: `<div style="padding: 8px;">
        <h3 style="margin: 0 0 5px 0; font-weight: bold;">${destination.name}</h3>
        <p style="margin: 0; color: #666;">Your Destination</p>
      </div>`,
      });

      destMarker.addListener("click", () => {
        destInfoWindow.open(map, destMarker);
      });

      markersRef.current.push(destMarker);

      // Add bus stop markers
      distances.forEach((stop, index) => {
        const marker = new google.maps.Marker({
          position: { lat: stop.coordinates.lat, lng: stop.coordinates.lng },
          map: map,
          title: stop.name,
          label: {
            text: (index + 1).toString(),
            color: "white",
            fontWeight: "bold",
          },
          icon: {
            url:
              index === 0
                ? "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
                : "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            scaledSize: new google.maps.Size(35, 35),
          },
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `<div style="padding: 8px; max-width: 250px;">
          <h3 style="margin: 0 0 5px 0; font-weight: bold; color: ${
            index === 0 ? "#16a34a" : "#2563eb"
          };">
            ${index === 0 ? "🏆 " : ""}${stop.name}
          </h3>
          <p style="margin: 5px 0; font-size: 12px; color: #666;">${
            stop.address
          }</p>
          <hr style="margin: 8px 0; border: none; border-top: 1px solid #ddd;">
          <p style="margin: 3px 0;"><strong>Distance:</strong> ${
            stop.distanceMiles
          } mi (${stop.distanceKm} km)</p>
          <p style="margin: 3px 0;"><strong>Walking time:</strong> ~${
            stop.walkingTime
          } min</p>
          ${
            index === 0
              ? '<p style="margin: 5px 0 0 0; color: #16a34a; font-weight: bold;">✓ Nearest stop</p>'
              : ""
          }
        </div>`,
        });

        marker.addListener("click", () => {
          infoWindow.open(map, marker);
        });

        markersRef.current.push(marker);
      });

      // Draw bus route polyline connecting all stops in order
      const sortedStops = [...stops].sort(
        (a, b) => a.routeOrder - b.routeOrder
      );
      const routePath = sortedStops.map((stop) => ({
        lat: stop.coordinates.lat,
        lng: stop.coordinates.lng,
      }));

      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
      }

      routePolylineRef.current = new google.maps.Polyline({
        path: routePath,
        geodesic: true,
        strokeColor: "#2563eb",
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: map,
      });

      // Draw walking route from nearest stop to destination
      if (walkingPolylineRef.current) {
        walkingPolylineRef.current.setMap(null);
      }

      const walkPath = [
        {
          lat: distances[0].coordinates.lat,
          lng: distances[0].coordinates.lng,
        },
        { lat: destination.lat, lng: destination.lng },
      ];

      walkingPolylineRef.current = new google.maps.Polyline({
        path: walkPath,
        geodesic: true,
        strokeColor: "#16a34a",
        strokeOpacity: 0.6,
        strokeWeight: 3,
        strokeStyle: "dashed",
        map: map,
        icons: [
          {
            icon: {
              path: "M 0,-1 0,1",
              strokeOpacity: 1,
              scale: 3,
            },
            offset: "0",
            repeat: "15px",
          },
        ],
      });

      // Get walking directions using Directions API
      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: {
            lat: distances[0].coordinates.lat,
            lng: distances[0].coordinates.lng,
          },
          destination: { lat: destination.lat, lng: destination.lng },
          travelMode: google.maps.TravelMode.WALKING,
        },
        (result, status) => {
          console.log("Directions API response:", status);
          if (status === "OK" && result.routes[0]) {
            const route = result.routes[0].legs[0];
            setWalkingRoute({
              distance: route.distance.text,
              duration: route.duration.text,
              steps: route.steps,
            });
            console.log("Walking route set successfully");
          } else {
            console.error("Directions request failed:", status);
          }
        }
      );

      // Fit map to show all markers
      const bounds = new google.maps.LatLngBounds();
      markersRef.current.forEach((marker) => {
        bounds.extend(marker.getPosition());
      });
      map.fitBounds(bounds);

      console.log("Map initialization complete");
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }, [mapLoaded]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Navigation className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">
              UCM Bus Route Finder
            </h1>
          </div>
          <p className="text-gray-600">
            Find the best bus stop to reach Chipotle with interactive map
          </p>
        </div>

        {/* Map Container */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-gray-800">
              Interactive Route Map
            </h2>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                <span className="text-gray-600">Bus Route</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-1 bg-green-600"
                  style={{ borderTop: "3px dashed #16a34a" }}
                ></div>
                <span className="text-gray-600">Walking Path</span>
              </div>
            </div>
          </div>
          <div
            ref={mapRef}
            className="w-full h-96 md:h-[500px] rounded-lg border-2 border-gray-200"
            style={{ minHeight: "400px" }}
          />
          {!mapLoaded && (
            <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
              <p className="text-gray-500">Loading map...</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Recommended Stop */}
          {nearestStop && (
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-xl p-6 text-white">
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-white rounded-full p-2">
                  <Bus className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-1">Recommended Stop</h2>
                  <p className="text-green-100">Get off here for Chipotle</p>
                </div>
              </div>

              <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-2">
                  {nearestStop.name}
                </h3>
                <p className="text-green-50 mb-3">{nearestStop.address}</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white bg-opacity-20 rounded p-3">
                    <p className="text-sm text-green-100 mb-1">Distance</p>
                    <p className="text-2xl font-bold">
                      {nearestStop.distanceMiles} mi
                    </p>
                    <p className="text-xs text-green-100">
                      {nearestStop.distanceKm} km
                    </p>
                  </div>

                  <div className="bg-white bg-opacity-20 rounded p-3">
                    <p className="text-sm text-green-100 mb-1">Walking Time</p>
                    <p className="text-2xl font-bold">
                      {nearestStop.walkingTime} min
                    </p>
                    <p className="text-xs text-green-100">Estimated</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Walking Directions */}
          {walkingRoute && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Footprints className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-800">
                  Walking Directions
                </h2>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 font-medium">
                    Total Distance:
                  </span>
                  <span className="text-blue-600 font-bold text-lg">
                    {walkingRoute.distance}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">
                    Walking Time:
                  </span>
                  <span className="text-blue-600 font-bold text-lg">
                    {walkingRoute.duration}
                  </span>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {walkingRoute.steps.map((step, index) => (
                  <div
                    key={index}
                    className="flex gap-3 p-2 hover:bg-gray-50 rounded"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div
                        className="text-sm text-gray-700"
                        dangerouslySetInnerHTML={{ __html: step.instructions }}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {step.distance.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* All Stops Ranked */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Info className="w-6 h-6 text-blue-600" />
            All Bus Stops (Ranked by Distance)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allDistances.map((stop, index) => (
              <div
                key={stop.id}
                className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                  index === 0
                    ? "bg-green-50 border-green-300"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                    ${
                      index === 0
                        ? "bg-green-600 text-white"
                        : "bg-gray-300 text-gray-700"
                    }
                  `}
                  >
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-800 mb-1">
                      {stop.name}
                    </h3>
                    <p className="text-xs text-gray-600 mb-2">{stop.address}</p>
                    <div className="flex gap-3 text-xs">
                      <span className="font-medium text-gray-700">
                        {stop.distanceMiles} mi
                      </span>
                      <span className="text-gray-500">
                        ~{stop.walkingTime} min
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-2">Map Legend:</p>
              <ul className="space-y-1">
                <li>🔴 Red marker = Chipotle (your destination)</li>
                <li>🟢 Green marker = Nearest bus stop (recommended)</li>
                <li>
                  🔵 Blue markers = Other bus stops (numbered by proximity)
                </li>
                <li>Blue line = UCM bus route path</li>
                <li>
                  Green dashed line = Walking path from nearest stop to Chipotle
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UCMBusRouteFinder;
