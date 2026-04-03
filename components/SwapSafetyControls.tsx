"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { notifyUser } from "@/lib/notifySwap";
import SwapSafetyMap from "./SwapSafetyMap";

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
  /** Called when both users have confirmed — parent should refresh swap list. */
  onComplete: () => void;
}

export default function SwapSafetyControls({ swapId, otherName, otherId, userId, onComplete }: Props) {
  const [safetyState, setSafetyState] = useState<SafetyState>("idle");
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showOffConfirm, setShowOffConfirm] = useState(false);
  const [showDoneConfirm, setShowDoneConfirm] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchIdRef = useRef<number | null>(null);

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

  useEffect(() => {
    if (safetyState === "departed") {
      pollRef.current = setInterval(fetchMapData, 15_000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [safetyState]);

  useEffect(() => {
    if (safetyState !== "departed" || !navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const token = await getAuthToken();
        fetch(`/api/swap/${swapId}/location`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        }).catch(() => {});
      },
      () => {}, // non-fatal — map just shows last known position
      { maximumAge: 0, timeout: 10_000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [safetyState, swapId]);

  // Realtime: flip to "done" as soon as the other user confirms on their end
  useEffect(() => {
    if (safetyState !== "waiting") return;
    const channel = supabase
      .channel(`safety-${swapId}`)
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

  async function getAuthToken(): Promise<string> {
    const { data: { session: refreshed } } = await supabase.auth.refreshSession();
    if (refreshed?.access_token) return refreshed.access_token;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? "";
  }

  async function fetchMapData() {
    try {
      const token = await getAuthToken();
      const res = await fetch(`/api/swap/${swapId}/map-data`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMapData(await res.json());
    } catch { /* non-fatal — map just won't update */ }
  }

  async function getGpsPosition(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("GPS is not available in this browser"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            reject(new Error("Location access was denied. Please enable it in your browser settings."));
          } else {
            reject(new Error("Could not get your location. Please try again."));
          }
        },
        { timeout: 15_000, maximumAge: 30_000 }
      );
    });
  }

  async function handleOffToSwapClick() {
    const { data: profile } = await supabase
      .from("profiles")
      .select("location_privacy_accepted")
      .eq("id", userId)
      .single();

    if (profile?.location_privacy_accepted) {
      setShowOffConfirm(true);
    } else {
      setShowPrivacyModal(true);
    }
  }

  async function acceptPrivacyAndContinue() {
    await supabase.from("profiles").update({ location_privacy_accepted: true }).eq("id", userId);
    setShowPrivacyModal(false);
    setShowOffConfirm(true);
  }

  async function doDepart() {
    setShowOffConfirm(false);
    setLoading(true);
    setError(null);
    try {
      const [coords, token] = await Promise.all([getGpsPosition(), getAuthToken()]);
      const res = await fetch(`/api/swap/${swapId}/depart`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(coords),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to record departure");
      }
      setSafetyState("departed");
      const { data: me } = await supabase.from("profiles").select("name").eq("id", userId).single();
      notifyUser({
        userId: otherId,
        type: "swap_incoming",
        title: "Someone's on their way!",
        body: `${me?.name ?? "Your swap partner"} is heading out to meet you.`,
        swapId,
      });
      await fetchMapData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function doComplete() {
    setShowDoneConfirm(false);
    setLoading(true);
    setError(null);
    try {
      const [coords, token] = await Promise.all([getGpsPosition(), getAuthToken()]);
      const res = await fetch(`/api/swap/${swapId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(coords),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed to confirm completion (${res.status})`);
      }
      const data: { bothConfirmed: boolean } = await res.json();
      if (data.bothConfirmed) {
        setSafetyState("done");
        onComplete();
      } else {
        setSafetyState("waiting");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3">

        {safetyState === "departed" && (
          <Link href={`/swap/${swapId}/map`} className="block relative group">
            <SwapSafetyMap
              myLocation={mapData?.user1 ?? null}
              theirLocation={mapData?.user2 ?? null}
              midpoint={mapData?.midpoint ?? null}
              routePolyline={mapData?.routePolyline ?? null}
              estimatedDistance={mapData?.estimatedDistance ?? null}
              estimatedTravelTime={mapData?.estimatedTravelTime ?? null}
            />
            <div className="absolute bottom-10 right-2 bg-[#4A3728]/80 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1 pointer-events-none">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3 h-3">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
              Expand
            </div>
          </Link>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {safetyState === "idle" && (
          <button
            onClick={handleOffToSwapClick}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-[#2D6A4F] text-white py-3 text-sm font-semibold hover:bg-[#245a42] transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
                </svg>
                Off to Swap
              </>
            )}
          </button>
        )}

        {safetyState === "departed" && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-center gap-2 py-1">
              <span className="w-2 h-2 rounded-full bg-[#2D6A4F] animate-pulse" />
              <p className="text-xs text-[#2D6A4F] font-medium">{otherName} knows you&apos;re on your way</p>
            </div>
            <button
              onClick={() => setShowDoneConfirm(true)}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-[#2D6A4F] text-white py-3 text-sm font-semibold hover:bg-[#245a42] transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Swapped &amp; Safe
                </>
              )}
            </button>
          </div>
        )}

        {safetyState === "waiting" && (
          <div className="flex flex-col items-center gap-2 py-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-[#4A3728] font-medium">Waiting for {otherName} to confirm…</p>
            </div>
            <p className="text-xs text-[#A09080] text-center">We&apos;ve sent them a reminder. You&apos;ll be notified once they confirm.</p>
          </div>
        )}

        {safetyState === "done" && (
          <div className="flex flex-col items-center gap-2 bg-[#D8E4D0] rounded-xl p-4 text-center">
            <span className="text-2xl">🤝🏽</span>
            <p className="text-sm font-semibold text-[#2D5030]">Swap complete — you&apos;re both safe!</p>
            <p className="text-xs text-[#4A6640]">Your swap just helped fund 57357 Hospital ❤️</p>
          </div>
        )}

      </div>

      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-[#4A3728]/30 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-[#FAF7F2] rounded-3xl px-7 py-8 shadow-lg">
            <p className="text-base font-semibold text-[#4A3728] mb-1">Location & Privacy</p>
            <p className="text-xs text-[#8B7355] mb-4 leading-relaxed">
              To help you and {otherName} feel safe meeting up, we&apos;ll share your approximate departure location with them — and theirs with you.
            </p>
            <ul className="text-xs text-[#6B5040] space-y-2 mb-5">
              <li>✓ <strong>What</strong> we collect: your live GPS location while you&apos;re on the way</li>
              <li>✓ <strong>Who</strong> sees it: only the person you&apos;re swapping with</li>
              <li>✓ <strong>When</strong> it&apos;s deleted: 24 hours after your swap is marked complete</li>
              <li>✓ Tracking <strong>stops</strong> once you tap &quot;Swapped &amp; Safe&quot;</li>
            </ul>
            <p className="text-xs text-[#A09080] mb-5">You can cancel the swap instead of sharing your location if you prefer.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="flex-1 py-2.5 rounded-full border border-[#D9CFC4] text-[#6B5040] text-sm hover:bg-[#EDE8DF] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={acceptPrivacyAndContinue}
                className="flex-1 py-2.5 rounded-full bg-[#2D6A4F] text-white text-sm font-semibold hover:bg-[#245a42] transition-colors"
              >
                I understand
              </button>
            </div>
          </div>
        </div>
      )}

      {showOffConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-[#4A3728]/30 backdrop-blur-sm" onClick={() => setShowOffConfirm(false)} />
          <div className="relative w-full max-w-sm bg-[#FAF7F2] rounded-3xl px-7 py-8 shadow-lg text-center">
            <p className="text-base font-semibold text-[#4A3728] mb-2">Off to Swap!</p>
            <p className="text-sm text-[#8B7355] mb-6">
              This will share your departure location with {otherName} and let them know you&apos;re on your way. Always meet in a public place.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowOffConfirm(false)} className="flex-1 py-2.5 rounded-full border border-[#D9CFC4] text-[#6B5040] text-sm hover:bg-[#EDE8DF] transition-colors">
                Not yet
              </button>
              <button onClick={doDepart} className="flex-1 py-2.5 rounded-full bg-[#2D6A4F] text-white text-sm font-semibold hover:bg-[#245a42] transition-colors">
                Yes, heading out!
              </button>
            </div>
          </div>
        </div>
      )}

      {showDoneConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-[#4A3728]/30 backdrop-blur-sm" onClick={() => setShowDoneConfirm(false)} />
          <div className="relative w-full max-w-sm bg-[#FAF7F2] rounded-3xl px-7 py-8 shadow-lg text-center">
            <p className="text-base font-semibold text-[#4A3728] mb-2">Swapped &amp; Safe?</p>
            <p className="text-sm text-[#8B7355] mb-6">
              Confirm the swap is done and you&apos;re safely on your way home. {otherName} will be notified.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDoneConfirm(false)} className="flex-1 py-2.5 rounded-full border border-[#D9CFC4] text-[#6B5040] text-sm hover:bg-[#EDE8DF] transition-colors">
                Not yet
              </button>
              <button onClick={doComplete} className="flex-1 py-2.5 rounded-full bg-[#2D6A4F] text-white text-sm font-semibold hover:bg-[#245a42] transition-colors">
                Yes, all done!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
