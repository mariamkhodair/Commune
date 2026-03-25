"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UnreadProvider } from "@/lib/unreadContext";
import { NotificationProvider } from "@/lib/notificationContext";

function GlobalRefresh() {
  const router = useRouter();
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 1000);
    return () => clearInterval(interval);
  }, [router]);
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UnreadProvider>
      <NotificationProvider>
        <GlobalRefresh />
        {children}
      </NotificationProvider>
    </UnreadProvider>
  );
}
