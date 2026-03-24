"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { useUser } from "./useUser";

type UnreadCtx = {
  unreadMessages: number;
  clearAllMessages: () => void;
  markConversationRead: (convId: string) => Promise<void>;
};

const UnreadContext = createContext<UnreadCtx>({
  unreadMessages: 0,
  clearAllMessages: () => {},
  markConversationRead: async () => {},
});

export function UnreadProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useUser();
  const [unreadMessages, setUnreadMessages] = useState(0);

  const fetchUnread = useCallback(async () => {
    if (!userId) return;
    const lastSeen = localStorage.getItem("msg_last_seen") ?? new Date(0).toISOString();
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .neq("sender_id", userId)
      .gt("created_at", lastSeen);
    setUnreadMessages(count ?? 0);
  }, [userId]);

  useEffect(() => {
    fetchUnread();
  }, [fetchUnread]);

  function clearAllMessages() {
    localStorage.setItem("msg_last_seen", new Date().toISOString());
    setUnreadMessages(0);
  }

  async function markConversationRead(convId: string) {
    if (!userId) return;
    const lastSeen = localStorage.getItem("msg_last_seen") ?? new Date(0).toISOString();
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", convId)
      .neq("sender_id", userId)
      .gt("created_at", lastSeen);
    localStorage.setItem(`msg_read_${convId}`, new Date().toISOString());
    setUnreadMessages((prev) => Math.max(0, prev - (count ?? 0)));
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
