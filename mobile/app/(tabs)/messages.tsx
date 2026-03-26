import { useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { useUnread } from "@/lib/unreadContext";

type Convo = { id: string; otherId: string; otherName: string; otherAvatar: string | null; lastMessage: string; lastAt: string };

export default function Messages() {
  const router = useRouter();
  const { userId } = useUser();
  const { clearAllMessages } = useUnread();
  const [convos, setConvos] = useState<Convo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Re-fetch on focus + realtime subscription + 5s fallback poll
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      clearAllMessages();
      fetchConvos();

      const channel = supabase
        .channel("mobile-conversations-list")
        .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => fetchConvos())
        .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => fetchConvos())
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, [userId])
  );

  async function fetchConvos() {
    setLoading(true);
    const { data } = await supabase
      .from("conversations")
      .select("id, member1_id, member2_id, last_message, last_message_at")
      .or(`member1_id.eq.${userId},member2_id.eq.${userId}`)
      .order("last_message_at", { ascending: false });

    const enriched = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data ?? []).map(async (c: any) => {
        const otherId = c.member1_id === userId ? c.member2_id : c.member1_id;
        const { data: p } = await supabase.from("profiles").select("name, avatar_url").eq("id", otherId).single();

        // Use last_message from conversations if set, else fetch from messages table
        let lastMessage = c.last_message as string | null;
        let lastAt = c.last_message_at as string | null;
        if (!lastMessage) {
          const { data: msg } = await supabase
            .from("messages")
            .select("content, created_at")
            .eq("conversation_id", c.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (msg) { lastMessage = msg.content; lastAt = msg.created_at; }
        }

        return {
          id: c.id,
          otherId,
          otherName: p?.name ?? "Unknown",
          otherAvatar: (p as any)?.avatar_url ?? null,
          lastMessage: lastMessage ?? "No messages yet",
          lastAt: lastAt ? new Date(lastAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
        };
      })
    );
    setConvos(enriched);
    setLoading(false);
  }

  return (
    <SafeAreaView className="flex-1">
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
          refreshing={refreshing}
          onRefresh={async () => { setRefreshing(true); await fetchConvos(); setRefreshing(false); }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/messages/${item.id}`)}
              className="flex-row items-center gap-3 py-4 border-b border-[#EDE8DF]"
            >
              <View className="w-11 h-11 rounded-full bg-[#EDE8DF] items-center justify-center overflow-hidden">
                {item.otherAvatar
                  ? <Image source={{ uri: item.otherAvatar }} style={{ width: 44, height: 44 }} />
                  : <Text className="text-base font-semibold text-[#4A3728]">{item.otherName.charAt(0)}</Text>}
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
