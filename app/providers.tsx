"use client";

import { UnreadProvider } from "@/lib/unreadContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <UnreadProvider>{children}</UnreadProvider>;
}
