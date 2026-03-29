import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

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

export function NotificationProvider({ children, userId }: { children: React.ReactNode; userId: string | null }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  async function fetchNotifications(uid: string) {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifications((data ?? []) as Notification[]);
  }

  useEffect(() => {
    if (!userId) return;
    fetchNotifications(userId);

    const channel = supabase
      .channel(`mobile-notifs-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => fetchNotifications(userId)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  async function markRead(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  async function markAllRead() {
    if (!userId) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
    if (error) fetchNotifications(userId);
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
