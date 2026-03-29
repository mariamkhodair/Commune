"use client";

import { UnreadProvider } from "@/lib/unreadContext";
import { NotificationProvider } from "@/lib/notificationContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UnreadProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </UnreadProvider>
  );
}
