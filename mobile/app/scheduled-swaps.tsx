import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
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
  const router = useRouter();
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
    const { data } = await supabase
      .from("scheduled_swaps")
      .select("id, swap_id, scheduled_date, swaps(proposer_id, receiver_id, swap_items(item_id, items(name)))")
      .or(`swaps.proposer_id.eq.${userId},swaps.receiver_id.eq.${userId}`)
      .order("scheduled_date", { ascending: true });

    const enriched = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data ?? []).map(async (s: any) => {
        const swap = s.swaps;
        const otherId = swap?.proposer_id === userId ? swap?.receiver_id : swap?.proposer_id;
        const { data: p } = await supabase.from("profiles").select("name").eq("id", otherId).single();
        const items = swap?.swap_items ?? [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const yourItems = items.filter((i: any) => i.items?.owner_id === userId).map((i: any) => i.items?.name).join(", ");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const theirItems = items.filter((i: any) => i.items?.owner_id !== userId).map((i: any) => i.items?.name).join(", ");
        return {
          id: s.id, swapId: s.swap_id,
          otherName: p?.name ?? "Unknown", otherId,
          date: s.scheduled_date,
          yourItem: yourItems || "Your item",
          theirItem: theirItems || "Their item",
        };
      })
    );
    setSwaps(enriched);
    setLoading(false);
  }

  function handleOffToSwap(id: string, otherName: string) {
    Alert.alert(
      "Off to Swap",
      `This will let ${otherName} know you're on your way. Always meet in a public place.\n\nReady to go?`,
      [
        { text: "Not yet", style: "cancel" },
        { text: "Yes, I'm heading out", onPress: () => setTracking((prev) => ({ ...prev, [id]: true })) },
      ]
    );
  }

  function handleSwappedAndSafe(id: string) {
    Alert.alert(
      "Swapped and Safe?",
      "Confirm the swap is done and you're safely on your way home.",
      [
        { text: "Not yet", style: "cancel" },
        {
          text: "Yes, all done!",
          onPress: () => {
            setTracking((prev) => ({ ...prev, [id]: false }));
            setDone((prev) => ({ ...prev, [id]: true }));
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <View className="px-5 pt-4 pb-4 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#4A3728" />
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-light text-[#4A3728]">Scheduled Swaps</Text>
          <Text className="text-[#8B7355] text-xs">Your confirmed swap dates.</Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#4A3728" />
        </View>
      ) : swaps.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="calendar-outline" size={40} color="#C4B9AA" />
          <Text className="text-[#8B7355] text-base mt-3 mb-1">Nothing scheduled yet</Text>
          <Text className="text-[#A09080] text-sm text-center mb-6">
            Once you and another member agree on a date in chat, it'll appear here.
          </Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/messages")} className="bg-[#4A3728] px-6 py-3 rounded-full">
            <Text className="text-[#FAF7F2] font-medium">Go to Messages</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 16 }}>
          {swaps.map((swap) => {
            const isTracking = tracking[swap.id];
            const isDone = done[swap.id];
            const dateObj = new Date(swap.date);
            return (
              <View key={swap.id} className="bg-white rounded-2xl overflow-hidden border border-[#EDE8DF]">
                {/* Date banner */}
                <View style={{ backgroundColor: "#4A3728", padding: 16 }}>
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="calendar" size={18} color="#FAF7F2" />
                    <View>
                      <Text style={{ color: "#C4B9AA", fontSize: 11 }}>Confirmed date</Text>
                      <Text style={{ color: "#FAF7F2", fontWeight: "600", fontSize: 15 }}>
                        {dateObj.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      </Text>
                    </View>
                  </View>
                  {isDone && (
                    <View style={{ marginTop: 8, backgroundColor: "#D8E4D0", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" }}>
                      <Text style={{ color: "#4A6640", fontSize: 12, fontWeight: "600" }}>Completed</Text>
                    </View>
                  )}
                </View>

                <View style={{ padding: 16, gap: 12 }}>
                  {/* Other member */}
                  <TouchableOpacity onPress={() => router.push(`/members/${swap.otherId}`)} className="flex-row items-center gap-2">
                    <View className="w-8 h-8 rounded-full bg-[#EDE8DF] items-center justify-center">
                      <Text className="text-sm font-semibold text-[#4A3728]">{swap.otherName.charAt(0)}</Text>
                    </View>
                    <Text className="text-sm font-medium text-[#4A3728]">{swap.otherName}</Text>
                  </TouchableOpacity>

                  {/* Items */}
                  <View className="flex-row items-center gap-2">
                    <View style={{ flex: 1, backgroundColor: "#F5F0E8", borderRadius: 12, padding: 10 }}>
                      <Text style={{ fontSize: 10, color: "#A09080" }}>You're giving</Text>
                      <Text style={{ fontSize: 12, fontWeight: "500", color: "#4A3728" }} numberOfLines={2}>{swap.yourItem}</Text>
                    </View>
                    <Ionicons name="swap-horizontal" size={18} color="#8B7355" />
                    <View style={{ flex: 1, backgroundColor: "#F5F0E8", borderRadius: 12, padding: 10 }}>
                      <Text style={{ fontSize: 10, color: "#A09080" }}>You're getting</Text>
                      <Text style={{ fontSize: 12, fontWeight: "500", color: "#4A3728" }} numberOfLines={2}>{swap.theirItem}</Text>
                    </View>
                  </View>

                  {/* Safety info */}
                  {!isDone && (
                    <View style={{ backgroundColor: "#F5F0E8", borderRadius: 12, padding: 12 }}>
                      <Text style={{ fontSize: 12, fontWeight: "600", color: "#6B5040", marginBottom: 4 }}>Before you go</Text>
                      <Text style={{ fontSize: 11, color: "#A09080", lineHeight: 16 }}>
                        Meet in a public place. Press <Text style={{ fontWeight: "600", color: "#4A3728" }}>Off to Swap</Text> when you leave — {swap.otherName} will know you're on your way. Once done and safe, press <Text style={{ fontWeight: "600", color: "#4A3728" }}>Swapped and Safe</Text>.
                      </Text>
                    </View>
                  )}

                  {/* Action buttons */}
                  {!isDone && (
                    <>
                      {isTracking ? (
                        <View style={{ gap: 8 }}>
                          <View className="flex-row items-center justify-center gap-2 py-2">
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#A0624A" }} />
                            <Text style={{ fontSize: 11, color: "#A0624A", fontWeight: "500" }}>
                              Location sharing active — {swap.otherName} knows you're on your way
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => handleSwappedAndSafe(swap.id)}
                            style={{ backgroundColor: "#7A9E6E", borderRadius: 999, paddingVertical: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
                          >
                            <Ionicons name="checkmark" size={18} color="white" />
                            <Text style={{ color: "white", fontWeight: "600" }}>Swapped and Safe</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={() => handleOffToSwap(swap.id, swap.otherName)}
                          style={{ backgroundColor: "#4A3728", borderRadius: 999, paddingVertical: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
                        >
                          <Ionicons name="navigate" size={18} color="#FAF7F2" />
                          <Text style={{ color: "#FAF7F2", fontWeight: "600" }}>Off to Swap</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}

                  {isDone && (
                    <Text style={{ textAlign: "center", color: "#4A6640", fontWeight: "500", fontSize: 13 }}>
                      🤝🏽 Swap complete — don't forget to leave a rating!
                    </Text>
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
