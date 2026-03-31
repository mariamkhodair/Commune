import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Image, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { notifyUser } from "@/lib/notifySwap";
import { updateSwapItemStatus } from "@/lib/updateSwapItems";

type SwapStatus = "Proposed" | "Accepted" | "In Progress" | "Completed" | "Declined";

type SwapItem = { name: string; points: number };

type ProposedDate = { id: string; date: string; time: string | null; proposedBy: string };

type Swap = {
  id: string;
  status: SwapStatus;
  direction: "incoming" | "outgoing";
  otherName: string;
  otherId: string;
  otherAvatar: string | null;
  proposerItems: SwapItem[];
  receiverItems: SwapItem[];
  conversationId: string | null;
  proposedDates: ProposedDate[];
  isDonation: boolean;
};

const STATUS_COLORS: Record<SwapStatus, { bg: string; text: string }> = {
  Proposed:       { bg: "#E4E0D0", text: "#6B5040" },
  Accepted:       { bg: "#D4E0E8", text: "#2A5060" },
  "In Progress":  { bg: "#D8E4D0", text: "#4A6640" },
  Completed:      { bg: "#DDD8C8", text: "#4A3728" },
  Declined:       { bg: "#ECD8D4", text: "#8B3A2A" },
};

const STEPS: SwapStatus[] = ["Proposed", "Accepted", "In Progress", "Completed"];
const TABS: (SwapStatus | "All")[] = ["All", "Proposed", "Accepted", "In Progress", "Completed", "Declined"];

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

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
  const prevMonthStart = new Date(year, mon - 1, 1);
  const canGoPrev = prevMonthStart >= new Date(today.getFullYear(), today.getMonth(), 1);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <View style={{ backgroundColor: "#FAF7F2", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#D9CFC4", marginTop: 10 }}>
      {/* Month nav */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <TouchableOpacity
          onPress={() => canGoPrev && onChangeMonth(new Date(year, mon - 1, 1))}
          disabled={!canGoPrev}
          style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: 14 }}
        >
          <Ionicons name="chevron-back" size={16} color={canGoPrev ? "#4A3728" : "#D9CFC4"} />
        </TouchableOpacity>
        <Text style={{ fontSize: 13, fontWeight: "600", color: "#4A3728" }}>
          {MONTH_NAMES[mon]} {year}
        </Text>
        <TouchableOpacity
          onPress={() => onChangeMonth(new Date(year, mon + 1, 1))}
          style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: 14 }}
        >
          <Ionicons name="chevron-forward" size={16} color="#4A3728" />
        </TouchableOpacity>
      </View>

      {/* Day headers */}
      <View style={{ flexDirection: "row", marginBottom: 4 }}>
        {DAY_NAMES.map((d) => (
          <View key={d} style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 10, color: "#A09080" }}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Day cells */}
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {cells.map((day, idx) => {
          if (day === null) {
            return <View key={`empty-${idx}`} style={{ width: "14.28%", height: 34 }} />;
          }
          const dateStr = `${year}-${String(mon + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const cellDate = new Date(year, mon, day);
          const isPast = cellDate < today;
          const isSelected = selected.has(dateStr);

          return (
            <TouchableOpacity
              key={dateStr}
              onPress={() => !isPast && onToggle(dateStr)}
              disabled={isPast}
              style={{
                width: "14.28%",
                height: 34,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isSelected ? "#4A3728" : "transparent",
              }}>
                <Text style={{
                  fontSize: 13,
                  color: isPast ? "#D9CFC4" : isSelected ? "#FAF7F2" : "#4A3728",
                  fontWeight: isSelected ? "600" : "400",
                }}>
                  {day}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function ProgressBar({ status }: { status: SwapStatus }) {
  if (status === "Declined") return null;
  const current = STEPS.indexOf(status);
  return (
    <View style={{ flexDirection: "row", gap: 4, marginTop: 12 }}>
      {STEPS.map((_, i) => (
        <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= current ? "#4A3728" : "#D9CFC4" }} />
      ))}
    </View>
  );
}

function ItemList({ label, items }: { label: string; items: SwapItem[] }) {
  const total = items.reduce((s, i) => s + i.points, 0);
  return (
    <View style={{ flex: 1, backgroundColor: "#F5F0E8", borderRadius: 10, padding: 10 }}>
      <Text style={{ fontSize: 10, color: "#A09080", marginBottom: 6 }}>{label}</Text>
      {items.map((item, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 4, marginBottom: i < items.length - 1 ? 4 : 0 }}>
          <Text style={{ fontSize: 12, fontWeight: "500", color: "#4A3728", flex: 1, lineHeight: 16 }} numberOfLines={2}>{item.name}</Text>
          {item.points > 0 && <Text style={{ fontSize: 11, color: "#8B7355", flexShrink: 0 }}>{item.points} pts</Text>}
        </View>
      ))}
      {items.length > 1 && total > 0 && (
        <View style={{ borderTopWidth: 1, borderTopColor: "#D9CFC4", marginTop: 6, paddingTop: 6 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: "#4A3728" }}>{total} pts total</Text>
        </View>
      )}
    </View>
  );
}

function RatingPrompt({ swapId, name, otherId }: { swapId: string; name: string; otherId: string }) {
  const { userId } = useUser();
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("ratings")
      .select("score")
      .eq("swap_id", swapId)
      .eq("rater_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) { setSubmitted(true); setRating(data.score); }
      });
  }, [swapId, userId]);

  async function submitRating() {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;
    await fetch("https://commune-neon.vercel.app/api/rate-swap", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ swapId, ratedId: otherId, score: rating }),
    });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <Text style={{ fontSize: 12, color: "#7A9E6E", marginTop: 12 }}>Thank you for rating {name}!</Text>
    );
  }

  return (
    <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#EDE8DF" }}>
      <Text style={{ fontSize: 12, color: "#8B7355", marginBottom: 8 }}>How was your swap with {name}?</Text>
      <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <TouchableOpacity key={s} onPress={() => setRating(s)}>
            <Ionicons name={s <= rating ? "star" : "star-outline"} size={22} color="#C4842A" />
          </TouchableOpacity>
        ))}
        {rating > 0 && (
          <TouchableOpacity
            onPress={submitRating}
            style={{ marginLeft: 8, backgroundColor: "#4A3728", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 }}
          >
            <Text style={{ color: "#FAF7F2", fontSize: 12, fontWeight: "600" }}>Submit</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function formatDate(dateStr: string) {
  const [year, mon, day] = dateStr.split("-").map(Number);
  return `${MONTH_NAMES[mon - 1]} ${day}, ${year}`;
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
  const [proposedTime, setProposedTime] = useState<string>("");
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  useEffect(() => {
    if (!userId) return;
    fetchSwaps(true);

    const channel = supabase
      .channel("mobile-swaps-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "swaps" }, () => fetchSwaps())
      .on("postgres_changes", { event: "*", schema: "public", table: "scheduled_swaps" }, () => fetchSwaps())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function fetchSwaps(showSpinner = false) {
    if (showSpinner) setLoading(true);
    try {
    const { data } = await supabase
      .from("swaps")
      .select("id, proposer_id, receiver_id, status, is_donation, swap_items(item_id, side)")
      .or(`proposer_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    const enriched = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data ?? []).map(async (s: any) => {
        const isProposer = s.proposer_id === userId;
        const otherId = isProposer ? s.receiver_id : s.proposer_id;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const swapItems: any[] = s.swap_items ?? [];
        const proposerIds: string[] = swapItems.filter((si) => si.side === "proposer").map((si) => si.item_id).filter(Boolean);
        const receiverIds: string[] = swapItems.filter((si) => si.side === "receiver").map((si) => si.item_id).filter(Boolean);
        const allItemIds = [...proposerIds, ...receiverIds];

        const [{ data: p }, { data: itemsData }, { data: conv }] = await Promise.all([
          supabase.from("profiles").select("name, avatar_url").eq("id", otherId).single(),
          allItemIds.length > 0
            ? supabase.from("items").select("id, name, points").in("id", allItemIds)
            : Promise.resolve({ data: [] }),
          supabase
            .from("conversations")
            .select("id")
            .or(`and(member1_id.eq.${userId},member2_id.eq.${otherId}),and(member1_id.eq.${otherId},member2_id.eq.${userId})`)
            .maybeSingle(),
        ]);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const itemMap: Record<string, any> = Object.fromEntries((itemsData ?? []).map((item) => [item.id, item]));
        const proposerItems: SwapItem[] = proposerIds.map((id) => ({ name: itemMap[id]?.name ?? "Unknown", points: itemMap[id]?.points ?? 0 }));
        const receiverItems: SwapItem[] = receiverIds.map((id) => ({ name: itemMap[id]?.name ?? "Unknown", points: itemMap[id]?.points ?? 0 }));

        return {
          id: s.id,
          status: s.status as SwapStatus,
          direction: isProposer ? "outgoing" : "incoming",
          otherName: p?.name ?? "Unknown",
          otherId,
          otherAvatar: (p as any)?.avatar_url ?? null,
          proposerItems,
          receiverItems,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          conversationId: (conv as any)?.id ?? null,
          proposedDates: [] as ProposedDate[],
          isDonation: s.is_donation ?? false,
        } as Swap;
      })
    );

    const filtered = enriched.filter((s) => s.otherName !== "Unknown");

    // Batch-fetch scheduled_swaps for all swap IDs
    const swapIds = filtered.map((s) => s.id);
    if (swapIds.length > 0) {
      const { data: scheduledData } = await supabase
        .from("scheduled_swaps")
        .select("id, swap_id, scheduled_date, scheduled_time, proposed_by")
        .in("swap_id", swapIds);

      const scheduledMap: Record<string, ProposedDate[]> = {};
      for (const row of scheduledData ?? []) {
        if (!scheduledMap[row.swap_id]) scheduledMap[row.swap_id] = [];
        scheduledMap[row.swap_id].push({ id: row.id, date: row.scheduled_date, time: row.scheduled_time ?? null, proposedBy: row.proposed_by ?? "" });
      }
      for (const swap of filtered) {
        swap.proposedDates = scheduledMap[swap.id] ?? [];
      }
    }

    setSwaps(filtered);
    } catch {
      // swaps remain at previous state; spinner clears
    } finally {
      setLoading(false);
    }
  }

  async function donateSwap(swapId: string) {
    const swap = swaps.find((s) => s.id === swapId);
    if (!swap) return;
    Alert.alert("Donate item?", "You'll give your item to them for free — no exchange needed.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Donate",
        onPress: async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          try {
            const res = await fetch("https://commune-neon.vercel.app/api/swap/" + swapId + "/donate", {
              method: "POST",
              headers: { "Authorization": `Bearer ${session.access_token}` },
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const json = await res.json() as any;
            if (!res.ok) { Alert.alert("Error", json?.error ?? "Could not process donation."); return; }
            const convId = json.conversationId ?? swap.conversationId;
            await fetchSwaps();
            setSwaps((prev) =>
              prev.map((s) =>
                s.id === swapId ? { ...s, status: "Accepted", isDonation: true, conversationId: convId } : s
              )
            );
          } catch {
            Alert.alert("Error", "Could not process donation. Check your connection.");
          }
        },
      },
    ]);
  }

  async function confirmSwapHappened(swapId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch("https://commune-neon.vercel.app/api/swap/" + swapId + "/confirm-manual", {
      method: "POST",
      headers: { "Authorization": `Bearer ${session.access_token}` },
    });
    await fetchSwaps();
  }

  async function acceptSwap(swapId: string) {
    const swap = swaps.find((s) => s.id === swapId);
    if (!swap) return;

    Alert.alert("Accept Swap?", "This will confirm the swap with the other member.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Accept",
        onPress: async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;

          try {
            const res = await fetch("https://commune-neon.vercel.app/api/swap/" + swapId + "/accept", {
              method: "POST",
              headers: { "Authorization": `Bearer ${session.access_token}` },
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const json = await res.json() as any;
            if (!res.ok) {
              Alert.alert("Error", json?.error ?? "Could not accept swap. Please try again.");
              return;
            }

            const convId = json.conversationId ?? swap.conversationId;

            // Refresh the full list so auto-declined swaps update too
            await fetchSwaps();
            setSwaps((prev) =>
              prev.map((s) =>
                s.id === swapId ? { ...s, status: "Accepted", conversationId: convId } : s
              )
            );
          } catch {
            Alert.alert("Error", "Could not accept swap. Check your connection and try again.");
          }
        },
      },
    ]);
  }

  async function declineSwap(swapId: string) {
    const swap = swaps.find((s) => s.id === swapId);
    Alert.alert("Decline Swap?", "This will decline the swap request.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Decline",
        style: "destructive",
        onPress: async () => {
          await supabase.from("swaps").update({ status: "Declined" }).eq("id", swapId);

          // Revert item statuses to Available (via server-side to bypass RLS)
          updateSwapItemStatus(swapId, "Available");

          setSwaps((prev) => prev.map((s) => s.id === swapId ? { ...s, status: "Declined" } : s));
          if (swap) {
            const { data: myProfile } = await supabase.from("profiles").select("name").eq("id", userId).single();
            notifyUser({
              userId: swap.otherId,
              type: "declined",
              title: "Swap declined",
              body: `${myProfile?.name ?? "Someone"} declined your swap proposal.`,
              swapId,
            });
          }
        },
      },
    ]);
  }

  async function cancelSwap(swapId: string) {
    const swap = swaps.find((s) => s.id === swapId);
    Alert.alert(
      "Cancel Swap?",
      "When canceling a swap, make sure to communicate with your fellow member in your chat :)",
      [
        { text: "Go back", style: "cancel" },
        {
          text: "Cancel swap",
          style: "destructive",
          onPress: async () => {
            await supabase.from("swaps").update({ status: "Declined" }).eq("id", swapId);

            // Revert item statuses to Available (via server-side to bypass RLS)
            updateSwapItemStatus(swapId, "Available");

            setSwaps((prev) => prev.map((s) => s.id === swapId ? { ...s, status: "Declined" } : s));

            if (swap) {
              const { data: myProfile } = await supabase.from("profiles").select("name").eq("id", userId).single();
              notifyUser({
                userId: swap.otherId,
                type: "declined",
                title: "Swap cancelled",
                body: `${myProfile?.name ?? "Someone"} cancelled the swap.`,
                swapId,
              });
            }
          },
        },
      ]
    );
  }

  async function proposeDates(swapId: string, dates: string[]) {
    const swap = swaps.find((s) => s.id === swapId);
    const timeToSave = proposedTime.trim() || null;
    const { error: insertError } = await supabase
      .from("scheduled_swaps")
      .insert(dates.map((d) => ({ swap_id: swapId, scheduled_date: d, scheduled_time: timeToSave, proposed_by: userId })));

    if (insertError) {
      console.error("Failed to propose dates:", insertError);
      return;
    }

    // Optimistically update UI immediately
    setSwaps((prev) =>
      prev.map((s) => {
        if (s.id !== swapId) return s;
        const newDates = dates.map((d) => ({ id: d, date: d, time: timeToSave, proposedBy: userId ?? "" }));
        return { ...s, proposedDates: [...s.proposedDates, ...newDates] };
      })
    );

    setCalendarOpenFor(null);
    setSelectedDates(new Set());
    setProposedTime("");
    await fetchSwaps();

    if (swap) {
      const { data: myProfile } = await supabase.from("profiles").select("name").eq("id", userId).single();
      notifyUser({
        userId: swap.otherId,
        type: "dates_proposed",
        title: "Swap dates proposed",
        body: `${myProfile?.name ?? "Someone"} proposed ${dates.length === 1 ? "a date" : `${dates.length} dates`} for your swap.`,
        swapId,
      });
    }
  }

  async function acceptDate(dateId: string, swapId: string) {
    const swap = swaps.find((s) => s.id === swapId);
    await supabase.from("scheduled_swaps").delete().eq("swap_id", swapId).neq("id", dateId);
    await supabase.from("swaps").update({ status: "In Progress" }).eq("id", swapId);
    fetchSwaps();
    if (swap) {
      const { data: myProfile } = await supabase.from("profiles").select("name").eq("id", userId).single();
      const date = swap.proposedDates.find((d) => d.id === dateId);
      notifyUser({
        userId: swap.otherId,
        type: "date_confirmed",
        title: "Swap date confirmed!",
        body: `${myProfile?.name ?? "Someone"} confirmed${date ? ` ${date.date}` : " a date"} for your swap. It's happening!`,
        swapId,
      });
    }
  }

  function openCalendar(swapId: string) {
    setSelectedDates(new Set());
    setProposedTime("");
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    setCalendarMonth(d);
    setCalendarOpenFor(swapId);
  }

  function toggleDate(dateStr: string) {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
  }

  const filtered = (activeTab === "All" ? swaps : swaps.filter((s) => s.status === activeTab))
    .slice()
    .sort((a, b) => {
      const aDeclined = a.status === "Declined" ? 1 : 0;
      const bDeclined = b.status === "Declined" ? 1 : 0;
      return aDeclined - bDeclined;
    });
  const countFor = (tab: SwapStatus | "All") => tab === "All" ? swaps.length : swaps.filter((s) => s.status === tab).length;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
          <Ionicons name="arrow-back" size={18} color="#4A3728" />
        </TouchableOpacity>
        <View>
          <Text style={{ fontSize: 22, fontWeight: "300", color: "#4A3728" }}>My Swaps</Text>
          <Text style={{ fontSize: 12, color: "#8B7355" }}>Track all your swap requests.</Text>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10, gap: 8, alignItems: "center" }}>
        {TABS.map((tab) => {
          const count = countFor(tab);
          const active = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: active ? "#4A3728" : "#D9CFC4", backgroundColor: active ? "#4A3728" : "white", flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Text style={{ fontSize: 13, fontWeight: "500", color: active ? "#FAF7F2" : "#6B5040" }}>{tab}</Text>
              <Text style={{ fontSize: 11, color: active ? "#C4B9AA" : "#A09080" }}>{count}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      </View>

      <View style={{ flex: 1 }}>
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#4A3728" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <Ionicons name="swap-horizontal-outline" size={40} color="#C4B9AA" />
          <Text style={{ color: "#8B7355", fontSize: 16, marginTop: 12, marginBottom: 4 }}>No swaps here</Text>
          <Text style={{ color: "#A09080", fontSize: 13, textAlign: "center" }}>
            {activeTab === "All" ? "Head to Search to propose your first swap." : `No ${activeTab.toLowerCase()} swaps.`}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 14 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={() => fetchSwaps()} tintColor="#4A3728" />}
        >
          {filtered.map((swap) => {
            const colors = STATUS_COLORS[swap.status] ?? { bg: "#EDE8DF", text: "#4A3728" };
            const isCalendarOpen = calendarOpenFor === swap.id;

            return (
              <View key={swap.id} style={{ backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: "#EDE8DF", padding: 16 }}>

                {/* Header row */}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <TouchableOpacity onPress={() => router.push(`/members/${swap.otherId}` as any)} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#EDE8DF", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {swap.otherAvatar
                        ? <Image source={{ uri: swap.otherAvatar }} style={{ width: 32, height: 32 }} />
                        : <Text style={{ fontSize: 13, fontWeight: "600", color: "#4A3728" }}>{swap.otherName.charAt(0)}</Text>}
                    </View>
                    <View>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: "#4A3728" }}>{swap.otherName}</Text>
                      <Text style={{ fontSize: 11, color: "#A09080" }}>
                        {swap.direction === "incoming" ? "sent you a request" : "you proposed this swap"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <View style={{ backgroundColor: colors.bg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" }}>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: colors.text }}>{swap.status}</Text>
                  </View>
                </View>

                {/* Items */}
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                  <ItemList
                    label="They offer"
                    items={swap.proposerItems.length ? swap.proposerItems : [{ name: "—", points: 0 }]}
                  />
                  <Ionicons name="swap-horizontal" size={18} color="#8B7355" style={{ marginTop: 22 }} />
                  <ItemList
                    label="In exchange for"
                    items={swap.receiverItems.length ? swap.receiverItems : [{ name: "—", points: 0 }]}
                  />
                </View>

                {/* Progress bar */}
                <ProgressBar status={swap.status} />

                {/* Proposed dates */}
                {swap.status === "Accepted" && swap.proposedDates.length > 0 && (
                  <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#EDE8DF" }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: "#4A3728", marginBottom: 8 }}>Proposed dates</Text>
                    {swap.proposedDates.map((pd) => (
                      <View key={pd.id} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F5F0E8", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 6 }}>
                        <Text style={{ fontSize: 13, color: "#4A3728" }}>{formatDate(pd.date)}{pd.time ? ` at ${pd.time}` : ""}</Text>
                        {pd.proposedBy !== userId && (
                          <TouchableOpacity
                            onPress={() => acceptDate(pd.id, swap.id)}
                            style={{ backgroundColor: "#7A9E6E", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 }}
                          >
                            <Text style={{ color: "white", fontSize: 11, fontWeight: "600" }}>Confirm</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Confirmed date for In Progress */}
                {swap.status === "In Progress" && swap.proposedDates.length === 1 && (
                  <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#EDE8DF" }}>
                    <Text style={{ fontSize: 12, color: "#7A9E6E", fontWeight: "600" }}>
                      Confirmed: {formatDate(swap.proposedDates[0].date)}{swap.proposedDates[0].time ? ` at ${swap.proposedDates[0].time}` : ""}
                    </Text>
                  </View>
                )}

                {/* Missed swap check */}
                {swap.status === "In Progress" && swap.proposedDates.length > 0 && (() => {
                  const [y, m, d] = swap.proposedDates[0].date.split("-").map(Number);
                  const swapDate = new Date(y, m - 1, d);
                  const today = new Date(); today.setHours(0, 0, 0, 0);
                  return swapDate < today;
                })() && (
                  <View style={{ marginTop: 12, backgroundColor: "#FFF8F0", borderWidth: 1, borderColor: "#E8D5BC", borderRadius: 14, padding: 14 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#4A3728", marginBottom: 4 }}>Did your swap happen?</Text>
                    <Text style={{ fontSize: 12, color: "#8B7355", marginBottom: 12 }}>
                      The scheduled date has passed. Let us know so we can keep your items up to date.
                    </Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => confirmSwapHappened(swap.id)}
                        style={{ flex: 1, backgroundColor: "#4A3728", borderRadius: 999, paddingVertical: 10, alignItems: "center" }}
                      >
                        <Text style={{ color: "#FAF7F2", fontSize: 12, fontWeight: "600" }}>Yes, we swapped!</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => cancelSwap(swap.id)}
                        style={{ flex: 1, borderWidth: 1, borderColor: "#D9CFC4", borderRadius: 999, paddingVertical: 10, alignItems: "center" }}
                      >
                        <Text style={{ color: "#A0624A", fontSize: 12, fontWeight: "500" }}>No, it didn't happen</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Accept / Donate / Decline for incoming proposals */}
                {swap.status === "Proposed" && swap.direction === "incoming" && (
                  <View style={{ gap: 8, marginTop: 14 }}>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => acceptSwap(swap.id)}
                        style={{ flex: 1, backgroundColor: "#4A3728", borderRadius: 999, paddingVertical: 11, alignItems: "center" }}
                      >
                        <Text style={{ color: "#FAF7F2", fontSize: 13, fontWeight: "600" }}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => donateSwap(swap.id)}
                        style={{ flex: 1, backgroundColor: "#7A9E6E", borderRadius: 999, paddingVertical: 11, alignItems: "center" }}
                      >
                        <Text style={{ color: "white", fontSize: 13, fontWeight: "600" }}>Donate 🎁</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      onPress={() => declineSwap(swap.id)}
                      style={{ borderWidth: 1, borderColor: "#D9CFC4", borderRadius: 999, paddingVertical: 10, alignItems: "center" }}
                    >
                      <Text style={{ color: "#A0624A", fontSize: 13, fontWeight: "600" }}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Donation badge */}
                {swap.isDonation && (
                  <Text style={{ fontSize: 12, color: "#7A9E6E", fontWeight: "600", textAlign: "center", marginTop: 8 }}>
                    🎁 This is a donation — no exchange needed
                  </Text>
                )}

                {/* Message + Schedule for Accepted/In Progress */}
                {(["Accepted", "In Progress"] as SwapStatus[]).includes(swap.status) && (
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                    {swap.conversationId && (
                      <TouchableOpacity
                        onPress={() => router.push(`/messages/${swap.conversationId}` as any)}
                        style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderColor: "#D9CFC4", borderRadius: 999, paddingVertical: 10 }}
                      >
                        <Ionicons name="chatbubble-outline" size={14} color="#6B5040" />
                        <Text style={{ fontSize: 12, color: "#6B5040", fontWeight: "500" }}>Message</Text>
                      </TouchableOpacity>
                    )}
                    {swap.status === "Accepted" && (
                      <TouchableOpacity
                        onPress={() => isCalendarOpen ? setCalendarOpenFor(null) : openCalendar(swap.id)}
                        style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderColor: "#D9CFC4", borderRadius: 999, paddingVertical: 10 }}
                      >
                        <Ionicons name="calendar-outline" size={14} color="#6B5040" />
                        <Text style={{ fontSize: 12, color: "#6B5040", fontWeight: "500" }}>Schedule</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Inline calendar picker */}
                {isCalendarOpen && (
                  <View style={{ marginTop: 8 }}>
                    <CalendarPicker
                      selected={selectedDates}
                      onToggle={toggleDate}
                      month={calendarMonth}
                      onChangeMonth={setCalendarMonth}
                    />
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 }}>
                      <Text style={{ fontSize: 12, color: "#8B7355", flexShrink: 0 }}>Time (optional)</Text>
                      <TextInput
                        value={proposedTime}
                        onChangeText={setProposedTime}
                        placeholder="e.g. 14:30"
                        placeholderTextColor="#C4B9AA"
                        keyboardType="numbers-and-punctuation"
                        maxLength={5}
                        style={{ flex: 1, fontSize: 13, color: "#4A3728", backgroundColor: "#F5F0E8", borderWidth: 1, borderColor: "#D9CFC4", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 }}
                      />
                    </View>
                    <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                      <TouchableOpacity
                        onPress={() => { setCalendarOpenFor(null); setSelectedDates(new Set()); setProposedTime(""); }}
                        style={{ flex: 1, borderWidth: 1, borderColor: "#D9CFC4", borderRadius: 999, paddingVertical: 10, alignItems: "center" }}
                      >
                        <Text style={{ fontSize: 12, color: "#6B5040", fontWeight: "500" }}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => proposeDates(swap.id, Array.from(selectedDates))}
                        disabled={selectedDates.size === 0}
                        style={{ flex: 1, borderRadius: 999, paddingVertical: 10, alignItems: "center", backgroundColor: selectedDates.size === 0 ? "#D9CFC4" : "#4A3728" }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: "600", color: selectedDates.size === 0 ? "#A09080" : "#FAF7F2" }}>
                          Propose {selectedDates.size > 0 ? `${selectedDates.size} ` : ""}{selectedDates.size === 1 ? "date" : "dates"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Rating prompt */}
                {swap.status === "Completed" && (
                  <RatingPrompt swapId={swap.id} name={swap.otherName} otherId={swap.otherId} />
                )}

                {/* Cancel swap */}
                {!["Completed", "Declined"].includes(swap.status) && (
                  <TouchableOpacity
                    onPress={() => cancelSwap(swap.id)}
                    style={{ marginTop: 12, alignItems: "center" }}
                  >
                    <Text style={{ fontSize: 12, color: "#A09080", textDecorationLine: "underline" }}>Cancel swap</Text>
                  </TouchableOpacity>
                )}

              </View>
            );
          })}
        </ScrollView>
      )}
      </View>
    </SafeAreaView>
  );
}
