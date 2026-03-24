import { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import { useUser } from "./useUser";

type UnreadCtx = {
  unreadMessages: number;
  clearAllMessages: () => Promise<void>;
  markConversationRead: (convId: string) => void;
};

const UnreadContext = createContext<UnreadCtx>({
  unreadMessages: 0,
  clearAllMessages: async () => {},
  markConversationRead: () => {},
});

export function UnreadProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useUser();
  const [unreadMessages, setUnreadMessages] = useState(0);

  const fetchUnread = useCallback(async () => {
    if (!userId) return;

    const globalLastSeen = (await AsyncStorage.getItem("msg_last_seen")) ?? new Date(0).toISOString();

    const { data: msgs } = await supabase
      .from("messages")
      .select("conversation_id, created_at")
      .neq("sender_id", userId)
      .gt("created_at", globalLastSeen);

    const unreadConvs = new Set<string>();
    for (const msg of msgs ?? []) {
      const convRead = await AsyncStorage.getItem(`msg_read_${msg.conversation_id}`);
      if (!convRead || msg.created_at > convRead) {
        unreadConvs.add(msg.conversation_id);
      }
    }

    setUnreadMessages(unreadConvs.size);
  }, [userId]);

  useEffect(() => {
    fetchUnread();
  }, [fetchUnread]);

  // Listen for new incoming messages in real time
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("unread-watcher")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          if (payload.new.sender_id !== userId) {
            fetchUnread();
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchUnread]);

  // Called when user visits the messages list tab — clears everything
  async function clearAllMessages() {
    await AsyncStorage.setItem("msg_last_seen", new Date().toISOString());
    setUnreadMessages(0);
  }

  // Called when user opens a specific conversation — decrements by 1
  function markConversationRead(convId: string) {
    AsyncStorage.setItem(`msg_read_${convId}`, new Date().toISOString());
    setUnreadMessages((prev) => Math.max(0, prev - 1));
  }

  return (
    <UnreadContext.Provider value={{ unreadMessages, clearAllMessages, markConversationRead }}>
      {children}
    </UnreadContext.Provider>
  );
}

export function useUnread() {
  return useContext(UnreadContext);
}
