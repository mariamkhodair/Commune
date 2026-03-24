import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type SwapStatus = "Proposed" | "Accepted" | "In Progress" | "Completed" | "Declined";

type SwapItem = { name: string; points: number };

type Swap = {
  id: string;
  status: SwapStatus;
  direction: "incoming" | "outgoing";
  otherName: string;
  otherId: string;
  proposerItems: SwapItem[];
  receiverItems: SwapItem[];
  conversationId: string | null;
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

function RatingPrompt({ swapId, name }: { swapId: string; name: string }) {
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  async function submitRating() {
    await supabase.from("ratings").upsert({ swap_id: swapId, ratee_name: name, stars: rating });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <Text style={{ fontSize: 12, color: "#7A9E6E", marginTop: 12 }}>Thanks for rating {name}!</Text>
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

export default function MySwaps() {
  const router = useRouter();
  const { userId } = useUser();
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SwapStatus | "All">("All");

  useEffect(() => {
    if (!userId) return;
    fetchSwaps();
  }, [userId]);

  async function fetchSwaps() {
    setLoading(true);
    const { data } = await supabase
      .from("swaps")
      .select("id, proposer_id, receiver_id, status, swap_items(item_id, items(name, points, owner_id))")
      .or(`proposer_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    const enriched = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data ?? []).map(async (s: any) => {
        const isProposer = s.proposer_id === userId;
        const otherId = isProposer ? s.receiver_id : s.proposer_id;
        const { data: p } = await supabase.from("profiles").select("name").eq("id", otherId).single();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allItems: any[] = s.swap_items ?? [];
        const proposerItems: SwapItem[] = allItems
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((i: any) => i.items?.owner_id === s.proposer_id)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((i: any) => ({ name: i.items.name, points: i.items.points ?? 0 }));
        const receiverItems: SwapItem[] = allItems
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((i: any) => i.items?.owner_id === s.receiver_id)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((i: any) => ({ name: i.items.name, points: i.items.points ?? 0 }));

        const { data: conv } = await supabase
          .from("conversations")
          .select("id")
          .or(`and(user1_id.eq.${userId},user2_id.eq.${otherId}),and(user1_id.eq.${otherId},user2_id.eq.${userId})`)
          .maybeSingle();

        return {
          id: s.id,
          status: s.status as SwapStatus,
          direction: isProposer ? "outgoing" : "incoming",
          otherName: p?.name ?? "Unknown",
          otherId,
          proposerItems,
          receiverItems,
          conversationId: conv?.id ?? null,
        } as Swap;
      })
    );
    setSwaps(enriched.filter((s) => s.otherName !== "Unknown"));
    setLoading(false);
  }

  async function acceptSwap(swapId: string) {
    Alert.alert("Accept Swap?", "This will confirm the swap with the other member.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Accept",
        onPress: async () => {
          await supabase.from("swaps").update({ status: "Accepted" }).eq("id", swapId);
          setSwaps((prev) => prev.map((s) => s.id === swapId ? { ...s, status: "Accepted" } : s));
        },
      },
    ]);
  }

  async function declineSwap(swapId: string) {
    Alert.alert("Decline Swap?", "This will decline the swap request.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Decline",
        style: "destructive",
        onPress: async () => {
          await supabase.from("swaps").update({ status: "Declined" }).eq("id", swapId);
          setSwaps((prev) => prev.map((s) => s.id === swapId ? { ...s, status: "Declined" } : s));
        },
      },
    ]);
  }

  const filtered = activeTab === "All" ? swaps : swaps.filter((s) => s.status === activeTab);
  const countFor = (tab: SwapStatus | "All") => tab === "All" ? swaps.length : swaps.filter((s) => s.status === tab).length;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
          <Ionicons name="arrow-back" size={18} color="#4A3728" />
        </TouchableOpacity>
        <View>
          <Text style={{ fontSize: 22, fontWeight: "300", color: "#4A3728" }}>My Swaps</Text>
          <Text style={{ fontSize: 12, color: "#8B7355" }}>Track all your swap requests.</Text>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 12, alignItems: "center" }}>
        {TABS.map((tab) => {
          const count = countFor(tab);
          const active = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, alignSelf: "flex-start", borderColor: active ? "#4A3728" : "#D9CFC4", backgroundColor: active ? "#4A3728" : "white", flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Text style={{ fontSize: 12, fontWeight: "500", color: active ? "#FAF7F2" : "#6B5040" }}>{tab}</Text>
              <Text style={{ fontSize: 11, color: active ? "#C4B9AA" : "#A09080" }}>{count}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 14 }}>
          {filtered.map((swap) => {
            const colors = STATUS_COLORS[swap.status] ?? { bg: "#EDE8DF", text: "#4A3728" };
            const isActive = ["Proposed", "Accepted", "In Progress"].includes(swap.status);
            const offeredItems = swap.direction === "outgoing" ? swap.proposerItems : swap.receiverItems;
            const wantedItems = swap.direction === "outgoing" ? swap.receiverItems : swap.proposerItems;
            return (
              <View key={swap.id} style={{ backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: "#EDE8DF", padding: 16 }}>

                {/* Header row */}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <TouchableOpacity onPress={() => router.push(`/members/${swap.otherId}` as any)} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#EDE8DF", alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: "#4A3728" }}>{swap.otherName.charAt(0)}</Text>
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
                    items={offeredItems.length ? offeredItems : [{ name: "—", points: 0 }]}
                  />
                  <Ionicons name="swap-horizontal" size={18} color="#8B7355" style={{ marginTop: 22 }} />
                  <ItemList
                    label="In exchange for"
                    items={wantedItems.length ? wantedItems : [{ name: "—", points: 0 }]}
                  />
                </View>

                {/* Progress bar */}
                <ProgressBar status={swap.status} />

                {/* Accept / Decline */}
                {swap.status === "Proposed" && swap.direction === "incoming" && (
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                    <TouchableOpacity
                      onPress={() => acceptSwap(swap.id)}
                      style={{ flex: 1, backgroundColor: "#4A3728", borderRadius: 999, paddingVertical: 11, alignItems: "center" }}
                    >
                      <Text style={{ color: "#FAF7F2", fontSize: 13, fontWeight: "600" }}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => declineSwap(swap.id)}
                      style={{ flex: 1, borderWidth: 1, borderColor: "#D9CFC4", borderRadius: 999, paddingVertical: 11, alignItems: "center" }}
                    >
                      <Text style={{ color: "#A0624A", fontSize: 13, fontWeight: "600" }}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Message + Schedule */}
                {isActive && (
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
                    <TouchableOpacity
                      onPress={() => router.push("/scheduled-swaps" as any)}
                      style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderColor: "#D9CFC4", borderRadius: 999, paddingVertical: 10 }}
                    >
                      <Ionicons name="calendar-outline" size={14} color="#6B5040" />
                      <Text style={{ fontSize: 12, color: "#6B5040", fontWeight: "500" }}>Schedule</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Rating prompt */}
                {swap.status === "Completed" && (
                  <RatingPrompt swapId={swap.id} name={swap.otherName} />
                )}

              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
