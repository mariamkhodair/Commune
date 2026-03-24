import { useState, useEffect, useRef } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type Message = { id: string; body: string; sender_id: string; created_at: string };

export default function MessageThread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { userId } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherName, setOtherName] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!id || !userId) return;
    fetchThread();

    const channel = supabase
      .channel(`messages:${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, userId]);

  async function fetchThread() {
    const { data: convo } = await supabase.from("conversations").select("participant_1, participant_2").eq("id", id).single();
    if (convo) {
      const otherId = convo.participant_1 === userId ? convo.participant_2 : convo.participant_1;
      const { data: p } = await supabase.from("profiles").select("name").eq("id", otherId).single();
      setOtherName(p?.name ?? "Unknown");
    }
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    setMessages(msgs ?? []);
    setLoading(false);
  }

  async function sendMessage() {
    if (!body.trim()) return;
    const text = body.trim();
    setBody("");
    await supabase.from("messages").insert({ conversation_id: id, sender_id: userId!, body: text });
  }

  return (
    <SafeAreaView className="flex-1">
      {/* Header */}
      <View className="flex-row items-center gap-3 px-5 py-3 border-b border-[#EDE8DF]">
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
          <Ionicons name="arrow-back" size={18} color="#4A3728" />
        </TouchableOpacity>
        <View className="w-9 h-9 rounded-full bg-[#EDE8DF] items-center justify-center">
          <Text className="text-sm font-semibold text-[#4A3728]">{otherName.charAt(0)}</Text>
        </View>
        <Text className="text-base font-semibold text-[#4A3728]">{otherName}</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color="#4A3728" /></View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerClassName="px-5 py-4 gap-2"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const mine = item.sender_id === userId;
            return (
              <View className={`max-w-[75%] ${mine ? "self-end" : "self-start"}`}>
                <View className={`px-4 py-2.5 rounded-2xl ${mine ? "bg-[#4A3728]" : "bg-white border border-[#EDE8DF]"}`}>
                  <Text className={`text-sm ${mine ? "text-[#FAF7F2]" : "text-[#4A3728]"}`}>{item.body}</Text>
                </View>
                <Text className={`text-xs text-[#A09080] mt-0.5 ${mine ? "text-right" : "text-left"}`}>
                  {new Date(item.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </Text>
              </View>
            );
          }}
        />
      )}

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View className="flex-row items-center gap-3 px-5 py-3 border-t border-[#EDE8DF]">
          <TextInput
            className="flex-1 bg-white rounded-full px-4 py-3 text-[#4A3728] border border-[#EDE8DF] text-sm"
            placeholder="Message..."
            placeholderTextColor="#C4B9AA"
            value={body}
            onChangeText={setBody}
            multiline
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!body.trim()}
            className={`w-10 h-10 rounded-full items-center justify-center ${body.trim() ? "bg-[#4A3728]" : "bg-[#EDE8DF]"}`}
          >
            <Ionicons name="send" size={16} color={body.trim() ? "#FAF7F2" : "#C4B9AA"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
