"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SwapSafetyMap from "@/components/SwapSafetyMap";

type MapData = {
  user1: { lat: number; lng: number; departedAt: string } | null;
  user2: { lat: number; lng: number; departedAt: string } | null;
  midpoint: { lat: number; lng: number } | null;
  routePolyline: string | null;
  estimatedDistance: string | null;
  estimatedTravelTime: string | null;
  myCompleted: boolean;
  theirCompleted: boolean;
};

export default function SwapMapPage({ params }: { params: Promise<{ swapId: string }> }) {
  const { swapId } = use(params);
  const router = useRouter();
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [names, setNames] = useState<{ me: string; them: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function getToken() {
    const { data: { session: refreshed } } = await supabase.auth.refreshSession();
    if (refreshed?.access_token) return refreshed.access_token;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? "";
  }

  async function fetchMapData() {
    const token = await getToken();
    const res = await fetch(`/api/swap/${swapId}/map-data`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setMapData(await res.json());
      setLastUpdated(new Date());
    }
  }

  async function fetchNames() {
    const token = await getToken();
    const { data: { session } } = await supabase.auth.getSession();
    const myId = session?.user?.id;

    const { data: swap } = await supabase
      .from("swaps")
      .select("proposer_id, receiver_id")
      .eq("id", swapId)
      .single();

    if (!swap || !myId) return;

    const otherId = swap.proposer_id === myId ? swap.receiver_id : swap.proposer_id;
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", [myId, otherId]);

    if (!profiles) return;
    const me = profiles.find((p) => p.id === myId)?.name ?? "You";
    const them = profiles.find((p) => p.id === otherId)?.name ?? "Partner";
    setNames({ me, them });
  }

  useEffect(() => {
    fetchMapData();
    fetchNames();
    const interval = setInterval(fetchMapData, 30_000);
    return () => clearInterval(interval);
  }, [swapId]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[#D9CFC4] bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full bg-[#EDE8DF] flex items-center justify-center text-[#4A3728]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#4A3728]">Swap Tracking</p>
          {names && <p className="text-xs text-[#8B7355]">{names.me} & {names.them}</p>}
        </div>
        {lastUpdated && (
          <p className="text-xs text-[#A09080]">
            Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 px-4 pt-4 pb-6 flex flex-col gap-4">
        {mapData ? (
          <>
            <div className="rounded-2xl overflow-hidden shadow-sm" style={{ height: "60vh" }}>
              <SwapSafetyMap
                myLocation={mapData.user1}
                theirLocation={mapData.user2}
                midpoint={mapData.midpoint}
                routePolyline={mapData.routePolyline}
                estimatedDistance={mapData.estimatedDistance}
                estimatedTravelTime={mapData.estimatedTravelTime}
              />
            </div>

            {/* Status cards */}
            <div className="flex gap-3">
              <div className="flex-1 bg-white rounded-2xl px-4 py-3 border border-[#EDE8DF]">
                <p className="text-xs text-[#8B7355] mb-1">{names?.me ?? "You"}</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
                  <p className="text-xs font-medium text-[#4A3728]">
                    {mapData.myCompleted ? "Swapped & Safe ✓" : mapData.user1 ? "On the way" : "Not departed"}
                  </p>
                </div>
              </div>
              <div className="flex-1 bg-white rounded-2xl px-4 py-3 border border-[#EDE8DF]">
                <p className="text-xs text-[#8B7355] mb-1">{names?.them ?? "Partner"}</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#9CA3AF]" />
                  <p className="text-xs font-medium text-[#4A3728]">
                    {mapData.theirCompleted ? "Swapped & Safe ✓" : mapData.user2 ? "On the way" : "Not departed"}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-center text-[#A09080]">Refreshes every 30 seconds</p>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#4A3728] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
