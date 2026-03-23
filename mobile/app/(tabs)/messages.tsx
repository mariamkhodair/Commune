import { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type Convo = { id: string; otherId: string; otherName: string; lastMessage: string; lastAt: string };

export default function Messages() {
  const router = useRouter();
  const { userId } = useUser();
  const [convos, setConvos] = useState<Convo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchConvos();
  }, [userId]);

  async function fetchConvos() {
    setLoading(true);
    const { data } = await supabase
      .from("conversations")
      .select("id, participant_1, participant_2, messages(body, created_at)")
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
      .order("created_at", { ascending: false });

    const enriched = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data ?? []).map(async (c: any) => {
        const otherId = c.participant_1 === userId ? c.participant_2 : c.participant_1;
        const { data: p } = await supabase.from("profiles").select("name").eq("id", otherId).single();
        const msgs = Array.isArray(c.messages) ? c.messages : [];
        const last = msgs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        return {
          id: c.id,
          otherId,
          otherName: p?.name ?? "Unknown",
          lastMessage: last?.body ?? "No messages yet",
          lastAt: last ? new Date(last.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
        };
      })
    );
    setConvos(enriched);
    setLoading(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FAF7F2]">
      <View className="px-5 pt-4 pb-4">
        <Text className="text-2xl font-light text-[#4A3728]">Messages</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#4A3728" />
        </View>
      ) : convos.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="chatbubble-outline" size={40} color="#C4B9AA" />
          <Text className="text-[#8B7355] text-base mt-3 mb-1">No messages yet</Text>
          <Text className="text-[#A09080] text-sm text-center">Start a conversation by proposing a swap.</Text>
        </View>
      ) : (
        <FlatList
          data={convos}
          keyExtractor={(c) => c.id}
          showsVerticalScrollIndicator={false}
          contentContainerClassName="px-5 pb-8"
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/messages/${item.id}`)}
              className="flex-row items-center gap-3 py-4 border-b border-[#EDE8DF]"
            >
              <View className="w-11 h-11 rounded-full bg-[#EDE8DF] items-center justify-center">
                <Text className="text-base font-semibold text-[#4A3728]">{item.otherName.charAt(0)}</Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-[#4A3728]">{item.otherName}</Text>
                  <Text className="text-xs text-[#A09080]">{item.lastAt}</Text>
                </View>
                <Text className="text-xs text-[#8B7355] mt-0.5" numberOfLines={1}>{item.lastMessage}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
