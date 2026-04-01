"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import SwapSafetyControls from "@/components/SwapSafetyControls";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type ScheduledSwap = {
  id: string;
  swapId: string;
  otherName: string;
  otherId: string;
  otherAvatar: string | null;
  date: string;
  time: string | null;
  yourItems: string;
  theirItems: string;
  conversationId: string | null;
  isCompleted: boolean;
};

function formatDate(dateStr: string) {
  const [year, mon, day] = dateStr.split("-").map(Number);
  const d = new Date(year, mon - 1, day);
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function isUpcoming(dateStr: string) {
  const [year, mon, day] = dateStr.split("-").map(Number);
  const swapDate = new Date(year, mon - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return swapDate >= today;
}

export default function ScheduledSwaps() {
  const router = useRouter();
  const { userId } = useUser();
  const [swaps, setSwaps] = useState<ScheduledSwap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchScheduled();
  }, [userId]);

  async function fetchScheduled() {
    setLoading(true);
    try {

    const { data: mySwaps } = await supabase
      .from("swaps")
      .select("id")
      .or(`proposer_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq("status", "In Progress");

    const swapIds = (mySwaps ?? []).map((s: { id: string }) => s.id);
    if (!swapIds.length) { setSwaps([]); setLoading(false); return; }

    const { data } = await supabase
      .from("scheduled_swaps")
      .select(`
        id, swap_id, scheduled_date,
        swaps(proposer_id, receiver_id, status,
          swap_items(side, items(name))
        )
      `)
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

        const [{ data: profile }, { data: conv }] = await Promise.all([
          supabase.from("profiles").select("name, avatar_url").eq("id", otherId).single(),
          supabase
            .from("conversations")
            .select("id")
            .or(`and(member1_id.eq.${userId},member2_id.eq.${otherId}),and(member1_id.eq.${otherId},member2_id.eq.${userId})`)
            .maybeSingle(),
        ]);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: any[] = swap?.swap_items ?? [];
        const yourItems = items.filter((i) => i.side === yourSide).map((i) => i.items?.name).filter(Boolean).join(", ");
        const theirItems = items.filter((i) => i.side === theirSide).map((i) => i.items?.name).filter(Boolean).join(", ");

        return {
          id: s.id,
          swapId: s.swap_id,
          otherName: profile?.name ?? "Unknown",
          otherId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          otherAvatar: (profile as any)?.avatar_url ?? null,
          date: s.scheduled_date,
          time: null,
          yourItems: yourItems || "Your items",
          theirItems: theirItems || "Their items",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          conversationId: (conv as any)?.id ?? null,
          isCompleted: swap?.status === "Completed",
        } as ScheduledSwap;
      })
    );

    setSwaps(enriched.filter((s) => s.otherName !== "Unknown"));
    setLoading(false);
    } catch (e) {
      console.error("fetchScheduled error:", e);
      setLoading(false);
    }
  }

  async function openChat(swap: ScheduledSwap) {
    let convId = swap.conversationId;
    if (!convId) {
      const { data: newConv } = await supabase
        .from("conversations")
        .insert({ member1_id: userId, member2_id: swap.otherId })
        .select("id")
        .single();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      convId = (newConv as any)?.id ?? null;
    }
    if (convId) router.push(`/messages/${convId}`);
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 px-8 py-8 overflow-y-auto">
        <h1 className="text-3xl font-light text-[#4A3728] mb-1 font-[family-name:var(--font-jost)]">
          Scheduled Swaps
        </h1>
        <p className="text-[#8B7355] mb-6">Your confirmed swap dates.</p>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-6 h-6 border-2 border-[#4A3728] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : swaps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="#C4B9AA" strokeWidth="1.5" strokeLinecap="round" className="w-12 h-12 mb-4">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            <p className="text-xl text-[#8B7355] font-[family-name:var(--font-permanent-marker)] mb-2">Nothing scheduled yet</p>
            <p className="text-[#A09080] max-w-xs mb-6">
              Go to My Swaps, accept a swap, then propose dates. Once the other member confirms a date it&apos;ll appear here.
            </p>
            <Link
              href="/my-swaps"
              className="px-6 py-3 rounded-full bg-[#4A3728] text-[#F5F0E8] text-sm font-semibold hover:bg-[#6B5040] transition-colors"
            >
              Go to My Swaps
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-w-2xl">
            {swaps.map((swap) => {
              const isDone = swap.isCompleted;
              const upcoming = isUpcoming(swap.date);

              return (
                <div key={swap.id} className="bg-white/60 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm border border-[#EDE8DF]">

                  {/* Date banner */}
                  <div className={`px-6 py-4 ${isDone ? "bg-[#D8E4D0]" : "bg-[#4A3728]"}`}>
                    <div className="flex items-center gap-3">
                      <svg viewBox="0 0 24 24" fill="none" stroke={isDone ? "#4A6640" : "#FAF7F2"} strokeWidth="2" strokeLinecap="round" className="w-5 h-5 shrink-0">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                      </svg>
                      <div>
                        <p className={`text-xs ${isDone ? "text-[#4A6640]" : "text-[#C4B9AA]"}`}>
                          {isDone ? "Completed" : upcoming ? "Confirmed date" : "Past date"}
                        </p>
                        <p className={`font-semibold ${isDone ? "text-[#2D5030]" : "text-[#FAF7F2]"}`}>
                          {formatDate(swap.date)}{swap.time ? ` at ${swap.time}` : ""}
                        </p>
                      </div>
                      {isDone && <span className="ml-auto text-xl">🤝🏽</span>}
                    </div>
                  </div>

                  <div className="px-6 py-4 flex flex-col gap-4">

                    {/* Member + message */}
                    <div className="flex items-center justify-between">
                      <Link href={`/members/${swap.otherId}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 rounded-full bg-[#EDE8DF] flex items-center justify-center text-sm font-medium text-[#4A3728] overflow-hidden shrink-0">
                          {swap.otherAvatar
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={swap.otherAvatar} alt="" className="w-full h-full object-cover" />
                            : swap.otherName.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-[#4A3728]">{swap.otherName}</span>
                      </Link>
                      <button
                        onClick={() => openChat(swap)}
                        className="flex items-center gap-1.5 text-xs text-[#6B5040] border border-[#D9CFC4] rounded-full px-3 py-1.5 hover:border-[#4A3728] hover:text-[#4A3728] transition-colors"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        Message
                      </button>
                    </div>

                    {/* Items */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-[#F5F0E8] rounded-xl p-3">
                        <p className="text-xs text-[#A09080] mb-1">You&apos;re giving</p>
                        <p className="text-sm font-medium text-[#4A3728]">{swap.yourItems}</p>
                      </div>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2" strokeLinecap="round" className="w-5 h-5 shrink-0">
                        <path d="M7 16V4m0 0L3 8m4-4 4 4" /><path d="M17 8v12m0 0 4-4m-4 4-4-4" />
                      </svg>
                      <div className="flex-1 bg-[#F5F0E8] rounded-xl p-3">
                        <p className="text-xs text-[#A09080] mb-1">You&apos;re getting</p>
                        <p className="text-sm font-medium text-[#4A3728]">{swap.theirItems}</p>
                      </div>
                    </div>

                    <Link href="/my-swaps" className="text-xs text-[#8B7355] underline hover:text-[#4A3728] transition-colors">
                      View in My Swaps →
                    </Link>

                    {/* Swap Safety System — Off to Swap / Swapped & Safe / map */}
                    {upcoming && userId && (
                      <SwapSafetyControls
                        swapId={swap.swapId}
                        otherName={swap.otherName}
                        otherId={swap.otherId}
                        userId={userId}
                        onComplete={fetchScheduled}
                      />
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
