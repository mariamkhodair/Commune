import { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type Swap = { id: string; otherName: string; status: string; pointsDiff: number; createdAt: string };

const statusColors: Record<string, string> = {
  pending: "#C4842A", accepted: "#4A6640", rejected: "#A0624A",
  completed: "#2A5060", cancelled: "#A09080",
};
const statusBg: Record<string, string> = {
  pending: "#FFF3DC", accepted: "#D8E4D0", rejected: "#F5EBE8",
  completed: "#D4E0E8", cancelled: "#EDE8DF",
};

export default function MySwaps() {
  const router = useRouter();
  const { userId } = useUser();
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchSwaps();
  }, [userId]);

  async function fetchSwaps() {
    setLoading(true);
    const { data } = await supabase
      .from("swaps")
      .select("id, proposer_id, receiver_id, status, points_difference, created_at")
      .or(`proposer_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    const enriched = await Promise.all(
      (data ?? []).map(async (s: any) => {
        const otherId = s.proposer_id === userId ? s.receiver_id : s.proposer_id;
        const { data: p } = await supabase.from("profiles").select("name").eq("id", otherId).single();
        return {
          id: s.id, otherName: p?.name ?? "Unknown",
          status: s.status, pointsDiff: s.points_difference,
          createdAt: new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        };
      })
    );
    setSwaps(enriched);
    setLoading(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FAF7F2]">
      <View className="px-5 pt-4 pb-4 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#4A3728" />
        </TouchableOpacity>
        <Text className="text-2xl font-light text-[#4A3728]">My Swaps</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color="#4A3728" /></View>
      ) : swaps.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="swap-horizontal-outline" size={40} color="#C4B9AA" />
          <Text className="text-[#8B7355] text-base mt-3 mb-1">No swaps yet</Text>
          <Text className="text-[#A09080] text-sm text-center">Propose a swap from any item page.</Text>
        </View>
      ) : (
        <FlatList
          data={swaps}
          keyExtractor={(s) => s.id}
          contentContainerClassName="px-5 pb-8 gap-3"
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View className="bg-white rounded-2xl px-4 py-4 border border-[#EDE8DF]">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-sm font-semibold text-[#4A3728]">{item.otherName}</Text>
                <View style={{ backgroundColor: statusBg[item.status] ?? "#EDE8DF" }} className="px-2.5 py-1 rounded-full">
                  <Text style={{ color: statusColors[item.status] ?? "#4A3728" }} className="text-xs font-medium capitalize">{item.status}</Text>
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-[#A09080]">{item.createdAt}</Text>
                {item.pointsDiff !== 0 && (
                  <Text className="text-xs text-[#8B7355]">
                    {item.pointsDiff > 0 ? `+${item.pointsDiff}` : item.pointsDiff} pts adjustment
                  </Text>
                )}
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
