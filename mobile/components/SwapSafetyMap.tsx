import { View, Text, StyleSheet } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

interface MapPoint { lat: number; lng: number }

interface Props {
  myLocation: MapPoint | null;
  theirLocation: MapPoint | null;
  midpoint: MapPoint | null;
  routePolyline: string | null;   // Google-encoded polyline string
  estimatedDistance: string | null;
  estimatedTravelTime: string | null;
}

/** Decode a Google-encoded polyline string into lat/lng coordinate pairs. */
function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
  const result: { latitude: number; longitude: number }[] = [];
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
    result.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return result;
}

export default function SwapSafetyMap({
  myLocation,
  theirLocation,
  midpoint,
  routePolyline,
  estimatedDistance,
  estimatedTravelTime,
}: Props) {
  // Default centre: Cairo — fallback if no location available yet
  const center = midpoint ?? myLocation ?? { lat: 30.0444, lng: 31.2357 };
  const path = routePolyline ? decodePolyline(routePolyline) : [];

  const region = {
    latitude: center.lat,
    longitude: center.lng,
    latitudeDelta: myLocation && theirLocation ? 0.08 : 0.02,
    longitudeDelta: myLocation && theirLocation ? 0.08 : 0.02,
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        showsUserLocation={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        {/* Current user — brand green */}
        {myLocation && (
          <Marker
            coordinate={{ latitude: myLocation.lat, longitude: myLocation.lng }}
            title="You"
            pinColor="#2D6A4F"
          />
        )}
        {/* Other user — grey */}
        {theirLocation && (
          <Marker
            coordinate={{ latitude: theirLocation.lat, longitude: theirLocation.lng }}
            title="Your partner"
            pinColor="#9CA3AF"
          />
        )}
        {/* Driving route */}
        {path.length > 0 && (
          <Polyline
            coordinates={path}
            strokeColor="#2D6A4F"
            strokeWidth={3}
          />
        )}
      </MapView>

      {/* Distance & ETA */}
      {(estimatedDistance || estimatedTravelTime) && (
        <View style={styles.pill}>
          {estimatedDistance && (
            <Text style={styles.pillText}>{estimatedDistance}</Text>
          )}
          {estimatedDistance && estimatedTravelTime && (
            <Text style={[styles.pillText, { color: "#C4B9AA" }]}> · </Text>
          )}
          {estimatedTravelTime && (
            <Text style={styles.pillText}>{estimatedTravelTime} away</Text>
          )}
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: "#2D6A4F" }]} />
          <Text style={styles.legendText}>You</Text>
        </View>
        {theirLocation ? (
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: "#9CA3AF" }]} />
            <Text style={styles.legendText}>Your partner</Text>
          </View>
        ) : (
          <Text style={[styles.legendText, { color: "#C4B9AA", fontStyle: "italic" }]}>
            Waiting for partner to depart…
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", gap: 8 },
  map: { width: "100%", height: 220, borderRadius: 12, overflow: "hidden" },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F0E8",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillText: { fontSize: 12, color: "#4A3728" },
  legend: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 4 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: "#8B7355" },
});
