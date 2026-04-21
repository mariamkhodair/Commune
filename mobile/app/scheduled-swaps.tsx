import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Image } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { useLang } from "@/lib/languageContext";
import SwapSafetyControls from "@/components/SwapSafetyControls";

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

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

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
  const { t } = useLang();
  const [swaps, setSwaps] = useState<ScheduledSwap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchScheduled();
  }, [userId]);

  // Permanently clear the scheduled badge whenever this page is visited
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem("sched_last_seen", new Date().toISOString());
    }, [])
  );

  async function fetchScheduled() {
    setLoading(true);

    // Step 1: get all swap IDs the user is involved in with status "In Progress"
    const { data: mySwaps } = await supabase
      .from("swaps")
      .select("id")
      .or(`proposer_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq("status", "In Progress");

    const swapIds = (mySwaps ?? []).map((s: { id: string }) => s.id);

    if (!swapIds.length) {
      setSwaps([]);
      setLoading(false);
      return;
    }

    // Step 2: get scheduled_swaps for those swaps
    const { data } = await supabase
      .from("scheduled_swaps")
      .select(`
        id, swap_id, scheduled_date, scheduled_time,
        swaps(proposer_id, receiver_id, status,
          swap_items(side, items(name, owner_id))
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
        const yourItems = items
          .filter((i) => i.side === yourSide)
          .map((i) => i.items?.name)
          .filter(Boolean)
          .join(", ");
        const theirItems = items
          .filter((i) => i.side === theirSide)
          .map((i) => i.items?.name)
          .filter(Boolean)
          .join(", ");

        return {
          id: s.id,
          swapId: s.swap_id,
          otherName: profile?.name ?? "Unknown",
          otherId,
          otherAvatar: (profile as any)?.avatar_url ?? null,
          date: s.scheduled_date,
          time: s.scheduled_time ?? null,
          yourItems: yourItems || "Your items",
          theirItems: theirItems || "Their items",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          conversationId: (conv as any)?.id ?? null,
          isCompleted: swap?.status === "Completed",
        };
      })
    );

    setSwaps(enriched.filter((s) => s.otherName !== "Unknown"));
    setLoading(false);
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
    if (convId) router.push(`/messages/${convId}` as any);
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
          <Ionicons name="arrow-back" size={18} color="#4A3728" />
        </TouchableOpacity>
        <View>
          <Text style={{ fontSize: 22, fontWeight: "300", color: "#4A3728" }}>{t("scheduled.header")}</Text>
          <Text style={{ fontSize: 12, color: "#8B7355" }}>{t("scheduled.subheader")}</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#4A3728" />
        </View>
      ) : swaps.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <Ionicons name="calendar-outline" size={48} color="#C4B9AA" />
          <Text style={{ color: "#8B7355", fontSize: 16, marginTop: 12, marginBottom: 6 }}>{t("scheduled.emptyTitle")}</Text>
          <Text style={{ color: "#A09080", fontSize: 13, textAlign: "center", marginBottom: 24, lineHeight: 20 }}>
            Go to My Swaps, accept a swap, then propose dates. Once the other member accepts a date it'll appear here.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/my-swaps" as any)}
            style={{ backgroundColor: "#4A3728", borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12 }}
          >
            <Text style={{ color: "#FAF7F2", fontWeight: "600" }}>{t("scheduled.goToMySwaps")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, gap: 16 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={fetchScheduled} tintColor="#4A3728" />}
        >
          {swaps.map((swap) => {
            const isDone = swap.isCompleted;
            const upcoming = isUpcoming(swap.date);

            return (
              <View key={swap.id} style={{ backgroundColor: "white", borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: "#EDE8DF" }}>

                {/* Date banner */}
                <View style={{ backgroundColor: isDone ? "#D8E4D0" : "#4A3728", padding: 16 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                      <Ionicons name="calendar" size={18} color={isDone ? "#4A6640" : "#FAF7F2"} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: isDone ? "#4A6640" : "#C4B9AA", fontSize: 11 }}>
                          {isDone ? "Completed" : upcoming ? "Confirmed date" : "Past date"}
                        </Text>
                        <Text style={{ color: isDone ? "#2D5030" : "#FAF7F2", fontWeight: "600", fontSize: 15 }}>
                          {formatDate(swap.date)}{swap.time ? ` at ${swap.time}` : ""}
                        </Text>
                      </View>
                    </View>
                    {isDone && (
                      <Text style={{ fontSize: 20 }}>🤝🏽</Text>
                    )}
                  </View>
                </View>

                <View style={{ padding: 16, gap: 12 }}>

                  {/* Other member + message button */}
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <TouchableOpacity
                      onPress={() => router.push(`/members/${swap.otherId}` as any)}
                      style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                    >
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#EDE8DF", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        {swap.otherAvatar
                          ? <Image source={{ uri: swap.otherAvatar }} style={{ width: 32, height: 32 }} />
                          : <Text style={{ fontSize: 13, fontWeight: "600", color: "#4A3728" }}>{swap.otherName.charAt(0)}</Text>}
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: "500", color: "#4A3728" }}>{swap.otherName}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => openChat(swap)}
                      style={{ flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: "#D9CFC4", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}
                    >
                      <Ionicons name="chatbubble-outline" size={13} color="#6B5040" />
                      <Text style={{ fontSize: 12, color: "#6B5040" }}>Message</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Items */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ flex: 1, backgroundColor: "#F5F0E8", borderRadius: 12, padding: 10 }}>
                      <Text style={{ fontSize: 10, color: "#A09080", marginBottom: 2 }}>{t("scheduled.youGiving")}</Text>
                      <Text style={{ fontSize: 12, fontWeight: "500", color: "#4A3728" }} numberOfLines={2}>{swap.yourItems}</Text>
                    </View>
                    <Ionicons name="swap-horizontal" size={18} color="#8B7355" />
                    <View style={{ flex: 1, backgroundColor: "#F5F0E8", borderRadius: 12, padding: 10 }}>
                      <Text style={{ fontSize: 10, color: "#A09080", marginBottom: 2 }}>{t("scheduled.youGetting")}</Text>
                      <Text style={{ fontSize: 12, fontWeight: "500", color: "#4A3728" }} numberOfLines={2}>{swap.theirItems}</Text>
                    </View>
                  </View>

                  {/* View in My Swaps */}
                  <TouchableOpacity onPress={() => router.push("/my-swaps" as any)}>
                    <Text style={{ fontSize: 12, color: "#8B7355", textDecorationLine: "underline" }}>{t("scheduled.viewInMySwaps")}</Text>
                  </TouchableOpacity>

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
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
