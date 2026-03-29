"use client";

import { useJsApiLoader, GoogleMap, Marker, Polyline } from "@react-google-maps/api";

interface MapPoint { lat: number; lng: number }

interface Props {
  myLocation: MapPoint | null;
  theirLocation: MapPoint | null;
  midpoint: MapPoint | null;
  routePolyline: string | null;   // Google-encoded polyline string
  estimatedDistance: string | null;
  estimatedTravelTime: string | null;
}

/** Decode a Google-encoded polyline string into an array of lat/lng coordinates. */
function decodePolyline(encoded: string): MapPoint[] {
  const result: MapPoint[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let val = 0;
    do { b = encoded.charCodeAt(index++) - 63; val |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += val & 1 ? ~(val >> 1) : val >> 1;
    shift = 0; val = 0;
    do { b = encoded.charCodeAt(index++) - 63; val |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += val & 1 ? ~(val >> 1) : val >> 1;
    result.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return result;
}

// Solid circle SVG icons for the two markers
const myMarkerIcon = {
  path: "M-8,0a8,8 0 1,0 16,0a8,8 0 1,0 -16,0",
  fillColor: "#2D6A4F",
  fillOpacity: 1,
  strokeColor: "#ffffff",
  strokeWeight: 2,
  scale: 1,
};
const theirMarkerIcon = {
  ...myMarkerIcon,
  fillColor: "#9CA3AF",
};

export default function SwapSafetyMap({
  myLocation,
  theirLocation,
  midpoint,
  routePolyline,
  estimatedDistance,
  estimatedTravelTime,
}: Props) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  });

  if (loadError) {
    return (
      <div className="w-full h-48 rounded-xl bg-[#EDE8DF] flex items-center justify-center">
        <p className="text-sm text-[#8B7355]">Map unavailable</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-48 rounded-xl bg-[#EDE8DF] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#4A3728] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Default centre: Cairo — used only if neither user has departed yet
  const center = midpoint ?? myLocation ?? { lat: 30.0444, lng: 31.2357 };
  const path = routePolyline ? decodePolyline(routePolyline) : [];

  return (
    <div className="flex flex-col gap-2">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "220px", borderRadius: "12px" }}
        center={center}
        zoom={myLocation && theirLocation ? 12 : 14}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
        }}
      >
        {/* Current user — brand green */}
        {myLocation && (
          <Marker position={myLocation} icon={myMarkerIcon as google.maps.Symbol} title="You" />
        )}
        {/* Other user — grey */}
        {theirLocation && (
          <Marker position={theirLocation} icon={theirMarkerIcon as google.maps.Symbol} title="Your partner" />
        )}
        {/* Driving route between departure points */}
        {path.length > 0 && (
          <Polyline
            path={path}
            options={{ strokeColor: "#2D6A4F", strokeWeight: 3, strokeOpacity: 0.8 }}
          />
        )}
      </GoogleMap>

      {/* Distance & ETA pill */}
      {(estimatedDistance || estimatedTravelTime) && (
        <div className="flex items-center gap-3 bg-[#F5F0E8] rounded-xl px-4 py-2 text-xs text-[#4A3728]">
          {estimatedDistance && (
            <span className="flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
              {estimatedDistance}
            </span>
          )}
          {estimatedDistance && estimatedTravelTime && <span className="text-[#C4B9AA]">·</span>}
          {estimatedTravelTime && (
            <span className="flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
              {estimatedTravelTime} away
            </span>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-[#8B7355] px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#2D6A4F] inline-block" /> You
        </span>
        {theirLocation && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#9CA3AF] inline-block" /> Your partner
          </span>
        )}
        {!theirLocation && (
          <span className="text-[#C4B9AA] italic">Waiting for partner to depart…</span>
        )}
      </div>
    </div>
  );
}
