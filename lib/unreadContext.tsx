"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { useUser } from "./useUser";

type UnreadCtx = {
  unreadMessages: number;
  clearAllMessages: () => void;
  markConversationRead: (convId: string) => void;
};

const UnreadContext = createContext<UnreadCtx>({
  unreadMessages: 0,
  clearAllMessages: () => {},
  markConversationRead: () => {},
});

export function UnreadProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useUser();
  const [unreadMessages, setUnreadMessages] = useState(0);

  const fetchUnread = useCallback(async () => {
    if (!userId) return;

    // Global cutoff: last time the user visited the messages list
    const globalLastSeen = localStorage.getItem("msg_last_seen") ?? new Date(0).toISOString();

    // Fetch messages from others since global cutoff (RLS limits to user's conversations)
    const { data: msgs } = await supabase
      .from("messages")
      .select("conversation_id, created_at")
      .neq("sender_id", userId)
      .gt("created_at", globalLastSeen);

    // Count distinct conversations that still have unread messages
    // (exclude conversations the user has individually opened since receiving the message)
    const unreadConvs = new Set<string>();
    for (const msg of msgs ?? []) {
      const convRead = localStorage.getItem(`msg_read_${msg.conversation_id}`);
      if (!convRead || msg.created_at > convRead) {
        unreadConvs.add(msg.conversation_id);
      }
    }

    setUnreadMessages(unreadConvs.size);
  }, [userId]);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
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

  // Called when user visits the messages LIST (/messages) — clears everything
  function clearAllMessages() {
    localStorage.setItem("msg_last_seen", new Date().toISOString());
    setUnreadMessages(0);
  }

  // Called when user opens a specific conversation — decrements by 1
  function markConversationRead(convId: string) {
    localStorage.setItem(`msg_read_${convId}`, new Date().toISOString());
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
