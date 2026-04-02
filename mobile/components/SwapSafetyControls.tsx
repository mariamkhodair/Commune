import { useState, useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  ActivityIndicator, Alert, Linking, StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { supabase } from "@/lib/supabase";
import { notifyUser } from "@/lib/notifySwap";
import SwapSafetyMap from "./SwapSafetyMap";

// ── Types ─────────────────────────────────────────────────────────────────────

type SafetyState = "idle" | "departed" | "waiting" | "done";

interface MapData {
  user1: { lat: number; lng: number; departedAt: string } | null;
  user2: { lat: number; lng: number; departedAt: string } | null;
  midpoint: { lat: number; lng: number } | null;
  routePolyline: string | null;
  estimatedDistance: string | null;
  estimatedTravelTime: string | null;
  myCompleted: boolean;
  theirCompleted: boolean;
}

interface Props {
  swapId: string;
  otherName: string;
  otherId: string;
  userId: string;
  /** Called when both users have confirmed — parent should refresh. */
  onComplete: () => void;
}

const API_BASE = "https://commune-neon.vercel.app";

// ── Component ─────────────────────────────────────────────────────────────────

export default function SwapSafetyControls({ swapId, otherName, otherId, userId, onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const [safetyState, setSafetyState] = useState<SafetyState>("idle");
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  // ── On mount: restore state from existing session ─────────────────────────
  useEffect(() => {
    if (!userId) return;
    async function init() {
      const [{ data: mySession }, { data: theirSession }] = await Promise.all([
        supabase.from("swap_safety_sessions").select("departed_at, completed_at").eq("swap_id", swapId).eq("user_id", userId).maybeSingle(),
        supabase.from("swap_safety_sessions").select("departed_at, completed_at").eq("swap_id", swapId).neq("user_id", userId).maybeSingle(),
      ]);
      const myDeparted = !!mySession?.departed_at;
      const myCompleted = !!mySession?.completed_at;
      const theirCompleted = !!theirSession?.completed_at;

      if (myCompleted && theirCompleted) {
        setSafetyState("done");
      } else if (myCompleted) {
        setSafetyState("waiting");
      } else if (myDeparted) {
        setSafetyState("departed");
        fetchMapData();
      }
    }
    init();
  }, [userId, swapId]);

  // ── Poll map data every 15 s while departed ───────────────────────────────
  useEffect(() => {
    if (safetyState === "departed") {
      pollRef.current = setInterval(fetchMapData, 15_000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [safetyState]);

  // ── Watch live position while departed, push updates to server ────────────
  useEffect(() => {
    if (safetyState !== "departed") {
      watchRef.current?.remove();
      watchRef.current = null;
      return;
    }

    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") return;

      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 20_000, distanceInterval: 10 },
        async (loc) => {
          const token = await getAuthToken();
          fetch(`${API_BASE}/api/swap/${swapId}/location`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ lat: loc.coords.latitude, lng: loc.coords.longitude }),
          }).catch(() => {});
        }
      );
    })();

    return () => {
      watchRef.current?.remove();
      watchRef.current = null;
    };
  }, [safetyState, swapId]);

  // ── Realtime: detect when other user completes while we're waiting ─────────
  useEffect(() => {
    if (safetyState !== "waiting") return;
    const channel = supabase
      .channel(`mobile-safety-${swapId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "swap_safety_sessions",
        filter: `swap_id=eq.${swapId}`,
      }, (payload) => {
        const row = payload.new as { user_id: string; completed_at: string | null };
        if (row.user_id !== userId && row.completed_at) {
          setSafetyState("done");
          onComplete();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [safetyState, swapId, userId, onComplete]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  async function getAuthToken(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? "";
  }

  async function fetchMapData() {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/api/swap/${swapId}/map-data`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMapData(await res.json());
    } catch { /* non-fatal */ }
  }

  /**
   * Request foreground location permission with a clear explanation before
   * the system prompt appears. Update the explanation string below if needed.
   */
  async function requestLocationPermission(): Promise<boolean> {
    // ↓ Update this Alert text to change what users see before the system prompt
    await new Promise<void>((resolve) =>
      Alert.alert(
        "Location Access",
        `Commune will use your GPS location once — just your departure point — so ${otherName} knows you're on your way. We don't track you continuously and delete the data 24 hours after your swap.`,
        [{ text: "Continue", onPress: () => resolve() }]
      )
    );
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  }

  async function getGpsCoords(): Promise<{ lat: number; lng: number } | null> {
    const { status } = await Location.getForegroundPermissionsAsync();

    if (status !== "granted") {
      const granted = await requestLocationPermission();
      if (!granted) {
        // Permission denied — show fallback with link to settings
        Alert.alert(
          "Location Access Required",
          "The Swap Safety feature needs your location to show your partner you're on the way. Please enable location access for Commune in your phone's Settings.",
          [
            { text: "Open Settings", onPress: () => Linking.openSettings() },
            { text: "Not now", style: "cancel" },
          ]
        );
        return null;
      }
    }

    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return { lat: loc.coords.latitude, lng: loc.coords.longitude };
    } catch {
      Alert.alert("GPS Unavailable", "Could not get your location. Please check that GPS is enabled and try again.");
      return null;
    }
  }

  // ── Privacy acceptance ────────────────────────────────────────────────────

  async function handleOffToSwapPress() {
    const { data: profile } = await supabase
      .from("profiles")
      .select("location_privacy_accepted")
      .eq("id", userId)
      .single();

    if (profile?.location_privacy_accepted) {
      confirmAndDepart();
    } else {
      setShowPrivacyModal(true);
    }
  }

  async function acceptPrivacyAndContinue() {
    await supabase.from("profiles").update({ location_privacy_accepted: true }).eq("id", userId);
    setShowPrivacyModal(false);
    confirmAndDepart();
  }

  // ── Departure ─────────────────────────────────────────────────────────────

  function confirmAndDepart() {
    Alert.alert(
      "Off to Swap!",
      `This will share your departure location with ${otherName} and let them know you're on your way.\n\nAlways meet in a public place. Ready?`,
      [
        { text: "Not yet", style: "cancel" },
        { text: "Yes, heading out!", onPress: doDepart },
      ]
    );
  }

  async function doDepart() {
    setLoading(true);
    try {
      const coords = await getGpsCoords();
      if (!coords) return; // permission denied — already alerted

      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/api/swap/${swapId}/depart`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(coords),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        Alert.alert("Error", (err as { error?: string }).error ?? "Failed to record departure. Please try again.");
        return;
      }

      setSafetyState("departed");
      setMapVisible(true); // open map modal immediately after departing

      // Notify partner
      const { data: me } = await supabase.from("profiles").select("name").eq("id", userId).single();
      notifyUser({
        userId: otherId,
        type: "swap_incoming",
        title: "Someone's on their way!",
        body: `${me?.name ?? "Your swap partner"} is heading out to meet you.`,
        swapId,
      });
      await fetchMapData();
    } finally {
      setLoading(false);
    }
  }

  // ── Completion ────────────────────────────────────────────────────────────

  function handleSwappedAndSafePress() {
    Alert.alert(
      "Swapped & Safe?",
      `Confirm the swap is done and you're safely on your way home. ${otherName} will be notified.`,
      [
        { text: "Not yet", style: "cancel" },
        { text: "Yes, all done!", onPress: doComplete },
      ]
    );
  }

  async function doComplete() {
    setLoading(true);
    try {
      const coords = await getGpsCoords();
      if (!coords) return;

      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/api/swap/${swapId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(coords),
      });

      if (!res.ok) {
        Alert.alert("Error", "Failed to confirm completion. Please try again.");
        return;
      }

      const data: { bothConfirmed: boolean } = await res.json();
      if (data.bothConfirmed) {
        setSafetyState("done");
        onComplete();
      } else {
        setSafetyState("waiting");
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <View style={styles.container}>

        {/* ── IDLE: Off to Swap button ── */}
        {safetyState === "idle" && (
          <TouchableOpacity
            onPress={handleOffToSwapPress}
            disabled={loading}
            style={[styles.btnGreen, loading && styles.btnDisabled]}
          >
            {loading
              ? <ActivityIndicator color="white" size="small" />
              : <Text style={styles.btnText}>Off to Swap</Text>}
          </TouchableOpacity>
        )}

        {/* ── DEPARTED: map button + Swapped & Safe ── */}
        {safetyState === "departed" && (
          <View style={{ gap: 8 }}>
            <View style={styles.statusRow}>
              <View style={styles.pulseDot} />
              <Text style={styles.statusText}>{otherName} knows you&apos;re on your way</Text>
            </View>
            <TouchableOpacity onPress={() => setMapVisible(true)} style={styles.btnOutline}>
              <Text style={styles.btnOutlineText}>View Map</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSwappedAndSafePress}
              disabled={loading}
              style={[styles.btnGreen, loading && styles.btnDisabled]}
            >
              {loading
                ? <ActivityIndicator color="white" size="small" />
                : <Text style={styles.btnText}>Swapped &amp; Safe</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* ── WAITING: spinner + message ── */}
        {safetyState === "waiting" && (
          <View style={styles.waitingBox}>
            <ActivityIndicator color="#2D6A4F" size="small" />
            <Text style={styles.waitingText}>Waiting for {otherName} to confirm…</Text>
            <Text style={styles.waitingSubText}>We&apos;ve sent them a reminder. You&apos;ll be notified when they confirm.</Text>
          </View>
        )}

        {/* ── DONE: celebration ── */}
        {safetyState === "done" && (
          <View style={styles.doneBox}>
            <Text style={{ fontSize: 24 }}>🤝🏽</Text>
            <Text style={styles.doneTitle}>Swap complete — you&apos;re both safe!</Text>
            <Text style={styles.doneCharity}>Your swap just helped fund 57357 Hospital ❤️</Text>
          </View>
        )}

      </View>

      {/* ── Privacy notice modal (shown once, ever) ── */}
      <Modal visible={showPrivacyModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Location &amp; Privacy</Text>
            <Text style={styles.modalBody}>
              To help you and {otherName} feel safe meeting up, we&apos;ll share your approximate departure location — and theirs with you.
            </Text>
            {/* ↓ Update this list if you want to change the privacy explanation */}
            {[
              ["What we collect", "your live GPS location while you're on the way"],
              ["Who sees it", `only ${otherName}`],
              ["When it's deleted", "24 hours after your swap is marked complete"],
              ["Tracking stops", "as soon as you tap \"Swapped & Safe\""],
            ] as [string, string][]).map(([label, detail]) => (
              <Text key={label} style={styles.privacyRow}>
                ✓ <Text style={{ fontWeight: "600" }}>{label}:</Text> {detail}
              </Text>
            ))}
            <Text style={styles.privacyCancelNote}>You can cancel the swap instead of sharing your location if you prefer.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setShowPrivacyModal(false)} style={styles.btnCancel}>
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={acceptPrivacyAndContinue} style={styles.btnGreenSmall}>
                <Text style={styles.btnText}>I understand</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Map modal ── */}
      <Modal visible={mapVisible} animationType="slide">
        <View style={{ flex: 1, backgroundColor: "#FAF7F2", paddingTop: insets.top }}>
          <View style={styles.mapModalHeader}>
            <Text style={styles.mapModalTitle}>Your Swap Route</Text>
            <TouchableOpacity onPress={() => setMapVisible(false)} style={styles.mapCloseBtn}>
              <Text style={styles.mapCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            <SwapSafetyMap
              myLocation={mapData?.user1 ?? null}
              theirLocation={mapData?.user2 ?? null}
              midpoint={mapData?.midpoint ?? null}
              routePolyline={mapData?.routePolyline ?? null}
              estimatedDistance={mapData?.estimatedDistance ?? null}
              estimatedTravelTime={mapData?.estimatedTravelTime ?? null}
            />
            <Text style={styles.mapRefreshNote}>Map updates every 15 seconds</Text>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  btnGreen: {
    backgroundColor: "#2D6A4F",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "white", fontWeight: "600", fontSize: 15 },
  btnOutline: {
    borderWidth: 1,
    borderColor: "#2D6A4F",
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
  },
  btnOutlineText: { color: "#2D6A4F", fontWeight: "600", fontSize: 14 },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 4 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#2D6A4F" },
  statusText: { fontSize: 12, color: "#2D6A4F", fontWeight: "500" },
  waitingBox: { alignItems: "center", gap: 6, paddingVertical: 12 },
  waitingText: { fontSize: 14, color: "#4A3728", fontWeight: "500", textAlign: "center" },
  waitingSubText: { fontSize: 12, color: "#A09080", textAlign: "center", lineHeight: 18 },
  doneBox: { backgroundColor: "#D8E4D0", borderRadius: 12, padding: 16, alignItems: "center", gap: 6 },
  doneTitle: { fontSize: 14, fontWeight: "600", color: "#2D5030", textAlign: "center" },
  doneCharity: { fontSize: 12, color: "#4A6640", textAlign: "center" },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(74,55,40,0.4)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#FAF7F2", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, gap: 10 },
  modalTitle: { fontSize: 17, fontWeight: "700", color: "#4A3728" },
  modalBody: { fontSize: 13, color: "#8B7355", lineHeight: 20 },
  privacyRow: { fontSize: 12, color: "#6B5040", lineHeight: 19 },
  privacyCancelNote: { fontSize: 12, color: "#A09080", marginTop: 4 },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 8 },
  btnCancel: { flex: 1, borderWidth: 1, borderColor: "#D9CFC4", borderRadius: 999, paddingVertical: 12, alignItems: "center" },
  btnCancelText: { color: "#6B5040", fontSize: 14 },
  btnGreenSmall: { flex: 1, backgroundColor: "#2D6A4F", borderRadius: 999, paddingVertical: 12, alignItems: "center" },
  // Map modal
  mapModalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#EDE8DF" },
  mapModalTitle: { fontSize: 17, fontWeight: "600", color: "#4A3728" },
  mapCloseBtn: { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: "#EDE8DF", borderRadius: 999 },
  mapCloseBtnText: { fontSize: 14, color: "#4A3728", fontWeight: "500" },
  mapRefreshNote: { fontSize: 11, color: "#C4B9AA", textAlign: "center" },
});
