"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useUser } from "./useUser";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  swap_id: string | null;
  read: boolean;
  created_at: string;
};

type NotificationContextType = {
  unreadCount: number;
  notifications: Notification[];
  markRead: (id: string) => void;
  markAllRead: () => void;
};

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  notifications: [],
  markRead: () => {},
  markAllRead: () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  async function fetchNotifications() {
    if (!userId) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifications((data ?? []) as Notification[]);
  }

  useEffect(() => {
    if (!userId) return;
    fetchNotifications();

    const channel = supabase
      .channel(`notifs-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => fetchNotifications()
      )
      .subscribe();

    // Poll every 15s as fallback in case Realtime misses an event
    const poll = setInterval(fetchNotifications, 15_000);

    // Refetch when the tab regains focus
    const onFocus = () => fetchNotifications();
    window.addEventListener("focus", onFocus);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function markRead(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  async function markAllRead() {
    if (!userId) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider value={{ unreadCount, notifications, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
