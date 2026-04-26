import { useState, useEffect, useRef } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { useUnread } from "@/lib/unreadContext";
import { useLang } from "@/lib/languageContext";

type Message = { id: string; content: string; sender_id: string; created_at: string };

export default function MessageThread() {
  const params = useLocalSearchParams<{ id: string }>();
  const convId = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const { userId } = useUser();
  const { markConversationRead } = useUnread();
  const { t, isRTL } = useLang();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherName, setOtherName] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!convId || !userId) return;
    markConversationRead(convId);
    fetchThread();

    const channel = supabase
      .channel(`messages:${convId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${convId}` },
        (payload) => {
          const incoming = payload.new as Message;
          // Only add if not already present (avoids duplication with optimistic update)
          setMessages((prev) => prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [convId, userId]);

  async function fetchThread() {
    const { data: convo } = await supabase.from("conversations").select("member1_id, member2_id").eq("id", convId).single();
    if (convo) {
      const otherId = convo.member1_id === userId ? convo.member2_id : convo.member1_id;
      const { data: p } = await supabase.from("profiles").select("name").eq("id", otherId).single();
      setOtherName(p?.name ?? "Unknown");
    }
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    setMessages(msgs ?? []);
    setLoading(false);
  }

  async function sendMessage() {
    if (!body.trim() || !userId || !convId) return;
    const text = body.trim();
    setBody("");

    // Optimistic update — show immediately without waiting for realtime
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      content: text,
      sender_id: userId,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: convId, sender_id: userId, content: text })
      .select("id, content, sender_id, created_at")
      .single();

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      Alert.alert(t("messages.failedToSend"), t("messages.failedToSendHint"));
    } else if (data) {
      // Replace temp message with real one from DB
      setMessages((prev) => prev.map((m) => m.id === tempId ? data as Message : m));
      // Keep conversation last_message in sync for the messages list
      supabase.from("conversations").update({ last_message: text, last_message_at: (data as Message).created_at }).eq("id", convId);
    }
  }

  return (
    <SafeAreaView className="flex-1">
      {/* Header */}
      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#EDE8DF" }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={18} color="#4A3728" />
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
                  <Text className={`text-sm ${mine ? "text-[#FAF7F2]" : "text-[#4A3728]"}`}>{item.content}</Text>
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
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#EDE8DF" }}>
          <TextInput
            className="flex-1 bg-white rounded-full px-4 py-3 text-[#4A3728] border border-[#EDE8DF] text-sm"
            placeholder={t("messages.placeholder")}
            placeholderTextColor="#C4B9AA"
            value={body}
            onChangeText={setBody}
            multiline
            textAlign={isRTL ? "right" : "left"}
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!body.trim()}
            className={`w-10 h-10 rounded-full items-center justify-center ${body.trim() ? "bg-[#4A3728]" : "bg-[#EDE8DF]"}`}
          >
            <Ionicons name={isRTL ? "send" : "send"} size={16} color={body.trim() ? "#FAF7F2" : "#C4B9AA"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
