"use client";

import { UnreadProvider } from "@/lib/unreadContext";
import { NotificationProvider } from "@/lib/notificationContext";
import { LanguageProvider } from "@/lib/languageContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <UnreadProvider>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </UnreadProvider>
    </LanguageProvider>
  );
}
