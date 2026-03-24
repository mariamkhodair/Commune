"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UnreadProvider } from "@/lib/unreadContext";

function GlobalRefresh() {
  const router = useRouter();
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(interval);
  }, [router]);
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UnreadProvider>
      <GlobalRefresh />
      {children}
    </UnreadProvider>
  );
}
