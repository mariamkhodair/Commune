"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { notifyUser } from "@/lib/notifySwap";

type ScheduledSwap = {
  id: string;
  swapId: string;
  otherName: string;
  otherId: string;
  otherAvatar: string | null;
  date: string;
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
  const [offToSwap, setOffToSwap] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [confirmOff, setConfirmOff] = useState<ScheduledSwap | null>(null);
  const [confirmDone, setConfirmDone] = useState<ScheduledSwap | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetchScheduled();
  }, [userId]);

  async function fetchScheduled() {
    setLoading(true);

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
  }

  async function handleOffToSwap(swap: ScheduledSwap) {
    setConfirmOff(null);
    setOffToSwap((prev) => ({ ...prev, [swap.id]: true }));
    const { data: myProfile } = await supabase.from("profiles").select("name").eq("id", userId).single();
    notifyUser({
      userId: swap.otherId,
      type: "swap_incoming",
      title: "Someone's on their way!",
      body: `${myProfile?.name ?? "Your swap partner"} is heading out for your swap on ${formatDate(swap.date)}.`,
      swapId: swap.swapId,
    });
  }

  async function handleSwappedAndSafe(swap: ScheduledSwap) {
    setConfirmDone(null);
    await supabase.from("swaps").update({ status: "Completed" }).eq("id", swap.swapId);
    setOffToSwap((prev) => ({ ...prev, [swap.id]: false }));
    setCompleted((prev) => ({ ...prev, [swap.id]: true }));
    const { data: myProfile } = await supabase.from("profiles").select("name").eq("id", userId).single();
    notifyUser({
      userId: swap.otherId,
      type: "swap_complete",
      title: "Swap completed!",
      body: `${myProfile?.name ?? "Your swap partner"} confirmed the swap is done. Don't forget to leave a rating!`,
      swapId: swap.swapId,
    });
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
              const isOff = offToSwap[swap.id];
              const isDone = completed[swap.id] || swap.isCompleted;
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
                          {formatDate(swap.date)}
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

                    {/* Safety tip + action buttons */}
                    {upcoming && !isDone && (
                      <div className="flex flex-col gap-3">
                        <div className="bg-[#F5F0E8] rounded-xl p-4">
                          <p className="text-xs font-semibold text-[#6B5040] mb-1">Before you go</p>
                          <p className="text-xs text-[#A09080] leading-relaxed">
                            Meet in a public place. Press <span className="font-semibold text-[#4A3728]">Off to Swap</span> when you leave —{" "}
                            {swap.otherName} will know you&apos;re on your way. Once done and safe, press{" "}
                            <span className="font-semibold text-[#4A3728]">Swapped and Safe</span>.
                          </p>
                        </div>

                        {isOff ? (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-center gap-2 py-1">
                              <div className="w-2 h-2 rounded-full bg-[#A0624A]" />
                              <p className="text-xs text-[#A0624A] font-medium">{swap.otherName} knows you&apos;re on your way</p>
                            </div>
                            <button
                              onClick={() => setConfirmDone(swap)}
                              className="w-full flex items-center justify-center gap-2 rounded-full bg-[#7A9E6E] text-white py-3 text-sm font-semibold hover:bg-[#6A8E5E] transition-colors"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                              Swapped and Safe
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmOff(swap)}
                            className="w-full flex items-center justify-center gap-2 rounded-full bg-[#4A3728] text-[#F5F0E8] py-3 text-sm font-semibold hover:bg-[#6B5040] transition-colors"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                              <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" /><path d="M12 8v4l3 3" />
                            </svg>
                            Off to Swap
                          </button>
                        )}
                      </div>
                    )}

                    {isDone && (
                      <p className="text-center text-sm text-[#4A6640] font-medium">
                        Swap complete — don&apos;t forget to leave a rating in My Swaps!
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Off to Swap confirmation modal */}
      {confirmOff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-[#4A3728]/30 backdrop-blur-sm" onClick={() => setConfirmOff(null)} />
          <div className="relative w-full max-w-sm bg-[#FAF7F2] rounded-3xl px-7 py-8 shadow-lg text-center">
            <p className="text-base font-semibold text-[#4A3728] mb-2">Off to Swap!</p>
            <p className="text-sm text-[#8B7355] mb-6">
              This will let {confirmOff.otherName} know you&apos;re on your way. Always meet in a public place. Ready to head out?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOff(null)}
                className="flex-1 py-2.5 rounded-full border border-[#D9CFC4] text-[#6B5040] text-sm hover:bg-[#EDE8DF] transition-colors"
              >
                Not yet
              </button>
              <button
                onClick={() => handleOffToSwap(confirmOff)}
                className="flex-1 py-2.5 rounded-full bg-[#4A3728] text-white text-sm font-semibold hover:bg-[#6B5040] transition-colors"
              >
                Yes, heading out!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Swapped and Safe confirmation modal */}
      {confirmDone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-[#4A3728]/30 backdrop-blur-sm" onClick={() => setConfirmDone(null)} />
          <div className="relative w-full max-w-sm bg-[#FAF7F2] rounded-3xl px-7 py-8 shadow-lg text-center">
            <p className="text-base font-semibold text-[#4A3728] mb-2">Swapped and Safe?</p>
            <p className="text-sm text-[#8B7355] mb-6">
              Confirm the swap is done and you&apos;re safely on your way home.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDone(null)}
                className="flex-1 py-2.5 rounded-full border border-[#D9CFC4] text-[#6B5040] text-sm hover:bg-[#EDE8DF] transition-colors"
              >
                Not yet
              </button>
              <button
                onClick={() => handleSwappedAndSafe(confirmDone)}
                className="flex-1 py-2.5 rounded-full bg-[#7A9E6E] text-white text-sm font-semibold hover:bg-[#6A8E5E] transition-colors"
              >
                Yes, all done!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
