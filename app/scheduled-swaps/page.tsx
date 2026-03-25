"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type ScheduledSwap = {
  id: string;
  swapId: string;
  otherName: string;
  otherId: string;
  date: string;
  yourItem: string;
  theirItem: string;
};

export default function ScheduledSwaps() {
  const { userId } = useUser();
  const [swaps, setSwaps] = useState<ScheduledSwap[]>([]);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!userId) return;
    fetchScheduled();
  }, [userId]);

  async function fetchScheduled() {
    setLoading(true);

    // Get swap IDs where user is a party with status "In Progress"
    const { data: mySwaps } = await supabase
      .from("swaps")
      .select("id")
      .or(`proposer_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq("status", "In Progress");

    const swapIds = (mySwaps ?? []).map((s: { id: string }) => s.id);
    if (!swapIds.length) { setSwaps([]); setLoading(false); return; }

    const { data } = await supabase
      .from("scheduled_swaps")
      .select("id, swap_id, scheduled_date, swaps(proposer_id, receiver_id, swap_items(side, items(name, owner_id)))")
      .in("swap_id", swapIds)
      .order("scheduled_date", { ascending: true });

    const enriched = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data ?? []).map(async (s: any) => {
        const swap = s.swaps;
        const isProposer = swap?.proposer_id === userId;
        const otherId = isProposer ? swap?.receiver_id : swap?.proposer_id;
        const yourSide = isProposer ? "proposer" : "receiver";
        const theirSide = isProposer ? "receiver" : "proposer";
        const { data: p } = await supabase.from("profiles").select("name").eq("id", otherId).single();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: any[] = swap?.swap_items ?? [];
        const yourItem = items.filter((i) => i.side === yourSide).map((i) => i.items?.name).filter(Boolean).join(", ");
        const theirItem = items.filter((i) => i.side === theirSide).map((i) => i.items?.name).filter(Boolean).join(", ");
        return {
          id: s.id,
          swapId: s.swap_id,
          otherName: p?.name ?? "Unknown",
          otherId,
          date: s.scheduled_date,
          yourItem: yourItem || "Your items",
          theirItem: theirItem || "Their items",
        };
      })
    );
    setSwaps(enriched.filter((s) => s.otherName !== "Unknown"));
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 px-8 py-8 overflow-y-auto">

        <h1 className="text-3xl font-light text-[#4A3728] font-[family-name:var(--font-jost)] mb-1">Scheduled Swaps</h1>
        <p className="text-[#8B7355] mb-8">Your confirmed swap dates. Use the buttons below when you're on your way.</p>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-6 h-6 border-2 border-[#4A3728] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : swaps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-2xl text-[#8B7355] font-[family-name:var(--font-permanent-marker)] mb-3">Nothing scheduled yet</p>
            <p className="text-[#A09080] mb-6">Once you and another member agree on a date in chat, it'll appear here.</p>
            <Link href="/messages" className="px-6 py-3 rounded-full bg-[#4A3728] text-[#F5F0E8] font-medium hover:bg-[#6B5040] transition-colors">
              Go to Messages
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-5 max-w-xl">
            {swaps.map((swap) => {
              const isTracking = tracking[swap.id];
              const isDone = done[swap.id];
              const dateObj = new Date(swap.date);
              return (
                <div key={swap.id} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-[#D9CFC4] overflow-hidden shadow-sm">

                  {/* Date banner */}
                  <div className="bg-[#4A3728] px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#F5F0E8" strokeWidth="2" strokeLinecap="round" className="w-5 h-5 shrink-0">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                      </svg>
                      <div>
                        <p className="text-xs text-[#C4B9AA]">Confirmed date</p>
                        <p className="text-base font-semibold text-[#F5F0E8]">
                          {dateObj.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    {isDone && (
                      <span className="text-xs bg-[#D8E4D0] text-[#4A6640] px-2.5 py-1 rounded-full font-semibold">Completed</span>
                    )}
                  </div>

                  <div className="px-6 py-5 flex flex-col gap-4">
                    {/* Other member */}
                    <Link href={`/members/${swap.otherId}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity w-fit">
                      <div className="w-8 h-8 rounded-full bg-[#EDE8DF] flex items-center justify-center text-sm font-medium text-[#4A3728]">
                        {swap.otherName.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-[#4A3728] hover:underline">{swap.otherName}</span>
                    </Link>

                    {/* Items */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-[#F5F0E8] rounded-xl px-3 py-2">
                        <p className="text-xs text-[#A09080]">You're giving</p>
                        <p className="text-sm font-medium text-[#4A3728] truncate">{swap.yourItem}</p>
                      </div>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2" strokeLinecap="round" className="w-4 h-4 shrink-0">
                        <path d="M7 16V4m0 0L3 8m4-4 4 4"/><path d="M17 8v12m0 0 4-4m-4 4-4-4"/>
                      </svg>
                      <div className="flex-1 bg-[#F5F0E8] rounded-xl px-3 py-2">
                        <p className="text-xs text-[#A09080]">You're getting</p>
                        <p className="text-sm font-medium text-[#4A3728] truncate">{swap.theirItem}</p>
                      </div>
                    </div>

                    <Link href="/my-swaps" className="text-xs text-[#8B7355] hover:underline">
                      View in My Swaps →
                    </Link>

                    {/* Safety info */}
                    {!isDone && (
                      <div className="bg-[#F5F0E8] rounded-xl px-4 py-3">
                        <p className="text-xs font-medium text-[#6B5040] mb-1">Before you go</p>
                        <p className="text-xs text-[#A09080] leading-relaxed">
                          Meet in a public place. When you leave for the swap, press <span className="font-semibold text-[#4A3728]">Off to Swap</span> — {swap.otherName} will know you're on your way. Once done and safe, press <span className="font-semibold text-[#4A3728]">Swapped and Safe</span>.
                        </p>
                      </div>
                    )}

                    {/* Action buttons */}
                    {!isDone && (
                      <div className="flex flex-col gap-2">
                        {!isTracking ? (
                          <button
                            onClick={() => setTracking((prev) => ({ ...prev, [swap.id]: true }))}
                            className="w-full rounded-full bg-[#4A3728] text-[#F5F0E8] py-3 font-semibold hover:bg-[#6B5040] transition-colors flex items-center justify-center gap-2"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                              <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                            </svg>
                            Off to Swap
                          </button>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 justify-center py-2">
                              <span className="w-2 h-2 rounded-full bg-[#A0624A] animate-pulse" />
                              <p className="text-xs text-[#A0624A] font-medium">Location sharing active — {swap.otherName} knows you're on your way</p>
                            </div>
                            <button
                              onClick={async () => {
                                await supabase.from("swaps").update({ status: "Completed" }).eq("id", swap.swapId);
                                setTracking((prev) => ({ ...prev, [swap.id]: false }));
                                setDone((prev) => ({ ...prev, [swap.id]: true }));
                              }}
                              className="w-full rounded-full bg-[#7A9E6E] text-white py-3 font-semibold hover:bg-[#5A7E4E] transition-colors flex items-center justify-center gap-2"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4">
                                <path d="M20 6L9 17l-5-5"/>
                              </svg>
                              Swapped and Safe
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {isDone && (
                      <p className="text-sm text-center text-[#4A6640] font-medium">🤝🏽 Swap complete — don't forget to leave a rating!</p>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}
