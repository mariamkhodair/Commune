"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type SwapStatus = "Proposed" | "Accepted" | "In Progress" | "Completed" | "Declined";

type SwapItem = { name: string; points: number };

type ProposedDate = { id: string; date: string };

type Swap = {
  id: string;
  status: SwapStatus;
  direction: "incoming" | "outgoing";
  otherName: string;
  otherId: string;
  proposerItems: SwapItem[];
  receiverItems: SwapItem[];
  conversationId: string | null;
  proposedDates: ProposedDate[];
};

const statusStyles: Record<SwapStatus, string> = {
  Proposed:      "bg-[#E4E0D0] text-[#6B5040]",
  Accepted:      "bg-[#D4E0E8] text-[#2A5060]",
  "In Progress": "bg-[#D8E4D0] text-[#4A6640]",
  Completed:     "bg-[#DDD8C8] text-[#4A3728]",
  Declined:      "bg-[#ECD8D4] text-[#8B3A2A]",
};

const STEPS: SwapStatus[] = ["Proposed", "Accepted", "In Progress", "Completed"];
const TABS: (SwapStatus | "All")[] = ["All", "Proposed", "Accepted", "In Progress", "Completed", "Declined"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function CalendarPicker({
  selected,
  onToggle,
  month,
  onChangeMonth,
}: {
  selected: Set<string>;
  onToggle: (date: string) => void;
  month: Date;
  onChangeMonth: (d: Date) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const year = month.getFullYear();
  const mon = month.getMonth();
  const firstDay = new Date(year, mon, 1).getDay();
  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  const canGoPrev = new Date(year, mon - 1, 1) >= new Date(today.getFullYear(), today.getMonth(), 1);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="bg-[#FAF7F2] rounded-xl border border-[#D9CFC4] p-4 mt-3">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => canGoPrev && onChangeMonth(new Date(year, mon - 1, 1))}
          disabled={!canGoPrev}
          className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${canGoPrev ? "hover:bg-[#EDE8DF] text-[#4A3728]" : "text-[#D9CFC4] cursor-not-allowed"}`}
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-[#4A3728]">{MONTH_NAMES[mon]} {year}</span>
        <button
          onClick={() => onChangeMonth(new Date(year, mon + 1, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#EDE8DF] text-[#4A3728] transition-colors"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-xs text-[#A09080] py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e-${idx}`} />;
          const dateStr = `${year}-${String(mon + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isPast = new Date(year, mon, day) < today;
          const isSelected = selected.has(dateStr);
          return (
            <button
              key={dateStr}
              onClick={() => !isPast && onToggle(dateStr)}
              disabled={isPast}
              className={`aspect-square flex items-center justify-center rounded-full text-sm transition-colors mx-auto w-8 h-8
                ${isPast ? "text-[#D9CFC4] cursor-not-allowed" : isSelected ? "bg-[#4A3728] text-[#FAF7F2] font-semibold" : "text-[#4A3728] hover:bg-[#EDE8DF]"}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProgressBar({ status }: { status: SwapStatus }) {
  if (status === "Declined") return null;
  const current = STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-1 mt-3">
      {STEPS.map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            i <= current ? "bg-[#4A3728]" : "bg-[#D9CFC4]"
          }`}
        />
      ))}
    </div>
  );
}

function ItemList({ label, items }: { label: string; items: SwapItem[] }) {
  const total = items.reduce((s, i) => s + i.points, 0);
  return (
    <div className="flex-1 bg-[#F5F0E8] rounded-xl p-3">
      <p className="text-xs text-[#A09080] mb-2">{label}</p>
      <div className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-[#4A3728] leading-tight">{item.name}</p>
            {item.points > 0 && (
              <p className="text-xs text-[#8B7355] shrink-0">{item.points} pts</p>
            )}
          </div>
        ))}
      </div>
      {items.length > 1 && total > 0 && (
        <p className="text-xs font-semibold text-[#4A3728] mt-2 pt-2 border-t border-[#D9CFC4]">
          {total} pts total
        </p>
      )}
    </div>
  );
}

function RatingPrompt({ swapId, name }: { swapId: string; name: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  async function submitRating() {
    await supabase.from("ratings").upsert({ swap_id: swapId, ratee_name: name, stars: rating });
    setSubmitted(true);
  }

  if (submitted)
    return <p className="text-xs text-[#7A9E6E] mt-4">Thanks for rating {name}!</p>;

  return (
    <div className="mt-4 pt-4 border-t border-[#EDE8DF]">
      <p className="text-xs text-[#8B7355] mb-2">How was your swap with {name}?</p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            onClick={() => setRating(s)}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5"
              fill={s <= (hover || rating) ? "#C4842A" : "none"}
              stroke="#C4842A"
              strokeWidth="2"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        ))}
        {rating > 0 && (
          <button
            onClick={submitRating}
            className="ml-3 text-xs px-3 py-1 rounded-full bg-[#4A3728] text-[#F5F0E8] hover:bg-[#6B5040] transition-colors"
          >
            Submit
          </button>
        )}
      </div>
    </div>
  );
}

export default function MySwaps() {
  const router = useRouter();
  const { userId } = useUser();
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SwapStatus | "All">("All");

  // Calendar state
  const [calendarOpenFor, setCalendarOpenFor] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d;
  });


  useEffect(() => {
    if (!userId) return;
    fetchSwaps();
    const interval = setInterval(fetchSwaps, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function fetchSwaps() {
    setLoading(true);
    const { data, error } = await supabase
      .from("swaps")
      .select("id, proposer_id, receiver_id, status, swap_items(item_id, side)")
      .or(`proposer_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    console.log("fetchSwaps userId:", userId, "data:", data, "error:", error);

    const enriched = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data ?? []).map(async (s: any) => {
        const isProposer = s.proposer_id === userId;
        const otherId = isProposer ? s.receiver_id : s.proposer_id;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const swapItems: any[] = s.swap_items ?? [];
        const proposerIds: string[] = swapItems
          .filter((si) => si.side === "proposer")
          .map((si) => si.item_id)
          .filter(Boolean);
        const receiverIds: string[] = swapItems
          .filter((si) => si.side === "receiver")
          .map((si) => si.item_id)
          .filter(Boolean);
        const allItemIds = [...proposerIds, ...receiverIds];

        const [{ data: p }, { data: itemsData }, { data: conv }] = await Promise.all([
          supabase.from("profiles").select("name").eq("id", otherId).single(),
          allItemIds.length > 0
            ? supabase.from("items").select("id, name, points").in("id", allItemIds)
            : Promise.resolve({ data: [] }),
          supabase
            .from("conversations")
            .select("id")
            .or(
              `and(member1_id.eq.${userId},member2_id.eq.${otherId}),and(member1_id.eq.${otherId},member2_id.eq.${userId})`
            )
            .maybeSingle(),
        ]);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const itemMap: Record<string, any> = Object.fromEntries(
          (itemsData ?? []).map((item) => [item.id, item])
        );
        const proposerItems: SwapItem[] = proposerIds.map((id) => ({
          name: itemMap[id]?.name ?? "Unknown",
          points: itemMap[id]?.points ?? 0,
        }));
        const receiverItems: SwapItem[] = receiverIds.map((id) => ({
          name: itemMap[id]?.name ?? "Unknown",
          points: itemMap[id]?.points ?? 0,
        }));

        return {
          id: s.id,
          status: s.status as SwapStatus,
          direction: isProposer ? "outgoing" : "incoming",
          otherName: p?.name ?? "Unknown",
          otherId,
          proposerItems,
          receiverItems,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          conversationId: (conv as any)?.id ?? null,
          proposedDates: [] as ProposedDate[],
        } as Swap;
      })
    );

    const filtered = enriched.filter((s) => s.otherName !== "Unknown");

    // Batch-fetch scheduled_swaps for all swap IDs
    const swapIds = filtered.map((s) => s.id);
    if (swapIds.length > 0) {
      const { data: scheduledData } = await supabase
        .from("scheduled_swaps")
        .select("id, swap_id, scheduled_date")
        .in("swap_id", swapIds);

      const scheduledMap: Record<string, ProposedDate[]> = {};
      for (const row of scheduledData ?? []) {
        if (!scheduledMap[row.swap_id]) scheduledMap[row.swap_id] = [];
        scheduledMap[row.swap_id].push({ id: row.id, date: row.scheduled_date });
      }
      for (const swap of filtered) {
        swap.proposedDates = scheduledMap[swap.id] ?? [];
      }
    }

    setSwaps(filtered);
    setLoading(false);
  }

  async function acceptSwap(swapId: string) {
    const swap = swaps.find((s) => s.id === swapId);
    if (!swap) return;
    await supabase.from("swaps").update({ status: "Accepted" }).eq("id", swapId);

    let convId = swap.conversationId;
    if (!convId) {
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .or(
          `and(member1_id.eq.${userId},member2_id.eq.${swap.otherId}),and(member1_id.eq.${swap.otherId},member2_id.eq.${userId})`
        )
        .maybeSingle();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      convId = (existing as any)?.id ?? null;
      if (!convId) {
        const { data: newConv } = await supabase
          .from("conversations")
          .insert({ member1_id: userId, member2_id: swap.otherId })
          .select("id")
          .single();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        convId = (newConv as any)?.id ?? null;
      }
    }

    setSwaps((prev) =>
      prev.map((s) =>
        s.id === swapId ? { ...s, status: "Accepted", conversationId: convId } : s
      )
    );
  }

  async function declineSwap(swapId: string) {
    await supabase.from("swaps").update({ status: "Declined" }).eq("id", swapId);
    setSwaps((prev) =>
      prev.map((s) => (s.id === swapId ? { ...s, status: "Declined" } : s))
    );
  }

  async function acceptDate(dateId: string, swapId: string) {
    await supabase.from("scheduled_swaps").delete().eq("swap_id", swapId).neq("id", dateId);
    await supabase.from("swaps").update({ status: "In Progress" }).eq("id", swapId);
    fetchSwaps();
  }

  function openCalendar(swapId: string) {
    setSelectedDates(new Set());
    const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0);
    setCalendarMonth(d);
    setCalendarOpenFor(swapId);
  }

  function toggleDate(dateStr: string) {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      next.has(dateStr) ? next.delete(dateStr) : next.add(dateStr);
      return next;
    });
  }

  async function proposeDates(swapId: string, dates: string[]) {
    await supabase.from("scheduled_swaps").insert(dates.map((d) => ({ swap_id: swapId, scheduled_date: d })));
    setCalendarOpenFor(null);
    setSelectedDates(new Set());
    fetchSwaps();
  }

  async function openChat(swap: Swap) {
    let convId = swap.conversationId;
    if (!convId) {
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .or(
          `and(member1_id.eq.${userId},member2_id.eq.${swap.otherId}),and(member1_id.eq.${swap.otherId},member2_id.eq.${userId})`
        )
        .maybeSingle();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      convId = (existing as any)?.id ?? null;
      if (!convId) {
        const { data: newConv } = await supabase
          .from("conversations")
          .insert({ member1_id: userId, member2_id: swap.otherId })
          .select("id")
          .single();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        convId = (newConv as any)?.id ?? null;
      }
    }
    if (convId) router.push(`/messages/${convId}`);
  }

  function formatDate(dateStr: string) {
    const [year, mon, day] = dateStr.split("-").map(Number);
    return `${MONTH_NAMES[mon - 1]} ${day}, ${year}`;
  }

  const filteredSwaps = activeTab === "All" ? swaps : swaps.filter((s) => s.status === activeTab);
  const countFor = (tab: SwapStatus | "All") =>
    tab === "All" ? swaps.length : swaps.filter((s) => s.status === tab).length;

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 px-8 py-8 overflow-y-auto">
        <h1 className="text-3xl font-light text-[#4A3728] mb-1 font-[family-name:var(--font-jost)]">
          My Swaps
        </h1>
        <p className="text-[#8B7355] mb-6">Track all your swap requests and ongoing exchanges.</p>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                activeTab === tab
                  ? "bg-[#4A3728] text-[#F5F0E8] border-[#4A3728]"
                  : "border-[#D9CFC4] text-[#6B5040] bg-white/60 hover:border-[#4A3728]"
              }`}
            >
              {tab}
              <span className="ml-1.5 opacity-60">{countFor(tab)}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-6 h-6 border-2 border-[#4A3728] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredSwaps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-2xl text-[#8B7355] font-[family-name:var(--font-permanent-marker)] mb-2">
              No swaps here yet
            </p>
            <p className="text-[#A09080]">Head to Search to propose your first swap.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredSwaps.map((swap) => {
              return (
                <div
                  key={swap.id}
                  className="bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-5 shadow-sm"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#EDE8DF] flex items-center justify-center text-sm font-medium text-[#4A3728]">
                        {swap.otherName.charAt(0)}
                      </div>
                      <div>
                        <Link
                          href={`/members/${swap.otherId}`}
                          className="text-sm font-medium text-[#4A3728] hover:underline"
                        >
                          {swap.otherName}
                        </Link>
                        <p className="text-xs text-[#A09080]">
                          {swap.direction === "incoming"
                            ? "sent you a request"
                            : "you proposed this swap"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyles[swap.status]}`}
                    >
                      {swap.status}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="flex items-start gap-3">
                    <ItemList
                      label="They offer"
                      items={
                        swap.proposerItems.length
                          ? swap.proposerItems
                          : [{ name: "—", points: 0 }]
                      }
                    />
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#8B7355"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="w-5 h-5 shrink-0 mt-6"
                    >
                      <path d="M7 16V4m0 0L3 8m4-4 4 4" />
                      <path d="M17 8v12m0 0 4-4m-4 4-4-4" />
                    </svg>
                    <ItemList
                      label="In exchange for"
                      items={
                        swap.receiverItems.length
                          ? swap.receiverItems
                          : [{ name: "—", points: 0 }]
                      }
                    />
                  </div>

                  {/* Progress bar */}
                  <ProgressBar status={swap.status} />

                  {/* Proposed dates section */}
                  {swap.status === "Accepted" && swap.proposedDates.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#EDE8DF]">
                      <p className="text-xs font-semibold text-[#4A3728] mb-2">Proposed dates</p>
                      <div className="flex flex-col gap-2">
                        {swap.proposedDates.map((pd) => (
                          <div
                            key={pd.id}
                            className="flex items-center justify-between bg-[#F5F0E8] rounded-xl px-3 py-2"
                          >
                            <p className="text-sm text-[#4A3728]">{formatDate(pd.date)}</p>
                            {swap.direction === "incoming" && (
                              <button
                                onClick={() => acceptDate(pd.id, swap.id)}
                                className="text-xs px-3 py-1 rounded-full bg-[#7A9E6E] text-white font-medium hover:bg-[#6A8E5E] transition-colors"
                              >
                                Accept
                              </button>
                            )}
                            {swap.direction === "outgoing" && (
                              <span className="text-xs text-[#A09080]">Awaiting their response</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Confirmed date section for In Progress */}
                  {swap.status === "In Progress" && swap.proposedDates.length === 1 && (
                    <div className="mt-4 pt-4 border-t border-[#EDE8DF]">
                      <p className="text-xs text-[#7A9E6E] font-semibold">
                        Confirmed: {formatDate(swap.proposedDates[0].date)}
                      </p>
                    </div>
                  )}

                  {/* Accept / Decline for incoming proposals */}
                  {swap.status === "Proposed" && swap.direction === "incoming" && (
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => acceptSwap(swap.id)}
                        className="flex-1 rounded-full bg-[#4A3728] text-[#F5F0E8] py-2 text-sm font-medium hover:bg-[#6B5040] transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => declineSwap(swap.id)}
                        className="flex-1 rounded-full border border-[#D9CFC4] text-[#A0624A] py-2 text-sm font-medium hover:border-[#A0624A] transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  )}

                  {/* Message + Schedule buttons */}
                  {(["Accepted", "In Progress"] as SwapStatus[]).includes(swap.status) && (
                    <div className="flex gap-2 mt-3">
                      {swap.conversationId && (
                        <Link
                          href={`/messages/${swap.conversationId}`}
                          className="flex-1 flex items-center justify-center gap-2 rounded-full border border-[#D9CFC4] text-[#6B5040] py-2 text-sm font-medium hover:border-[#4A3728] hover:text-[#4A3728] transition-colors"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                          Message
                        </Link>
                      )}
                      {swap.status === "Accepted" && swap.proposedDates.length === 0 && swap.direction === "outgoing" && (
                        <button
                          onClick={() => calendarOpenFor === swap.id ? setCalendarOpenFor(null) : openCalendar(swap.id)}
                          className="flex-1 flex items-center justify-center gap-2 rounded-full border border-[#D9CFC4] text-[#6B5040] py-2 text-sm font-medium hover:border-[#4A3728] hover:text-[#4A3728] transition-colors"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                            <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                          </svg>
                          Schedule
                        </button>
                      )}
                    </div>
                  )}

                  {/* Inline calendar */}
                  {calendarOpenFor === swap.id && (
                    <div className="mt-2">
                      <CalendarPicker
                        selected={selectedDates}
                        onToggle={toggleDate}
                        month={calendarMonth}
                        onChangeMonth={setCalendarMonth}
                      />
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => { setCalendarOpenFor(null); setSelectedDates(new Set()); }}
                          className="flex-1 rounded-full border border-[#D9CFC4] text-[#6B5040] py-2 text-sm font-medium hover:border-[#4A3728] transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => proposeDates(swap.id, Array.from(selectedDates))}
                          disabled={selectedDates.size === 0}
                          className="flex-1 rounded-full bg-[#4A3728] text-[#F5F0E8] py-2 text-sm font-semibold hover:bg-[#6B5040] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Propose {selectedDates.size > 0 ? `${selectedDates.size} ` : ""}{selectedDates.size === 1 ? "date" : "dates"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Rating prompt for completed swaps */}
                  {swap.status === "Completed" && (
                    <RatingPrompt swapId={swap.id} name={swap.otherName} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
