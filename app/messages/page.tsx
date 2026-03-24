"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type Convo = {
  id: string;
  otherId: string;
  otherName: string;
  lastMessage: string;
  lastAt: string;
};

export default function Messages() {
  const router = useRouter();
  const { userId } = useUser();
  const [convos, setConvos] = useState<Convo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchConvos();
  }, [userId]);

  // Re-fetch when the page is focused (e.g. after navigating back from a chat)
  useEffect(() => {
    if (!userId) return;
    const handleFocus = () => fetchConvos();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function fetchConvos() {
    setLoading(true);
    const { data } = await supabase
      .from("conversations")
      .select("id, member1_id, member2_id, last_message, last_message_at")
      .or(`member1_id.eq.${userId},member2_id.eq.${userId}`)
      .order("last_message_at", { ascending: false });

    const enriched = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data ?? []).map(async (c: any) => {
        const otherId = c.member1_id === userId ? c.member2_id : c.member1_id;
        const { data: p } = await supabase.from("profiles").select("name").eq("id", otherId).single();
        return {
          id: c.id,
          otherId,
          otherName: p?.name ?? "Unknown",
          lastMessage: c.last_message ?? "No messages yet",
          lastAt: c.last_message_at
            ? new Date(c.last_message_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : "",
        };
      })
    );

    setConvos(enriched);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 px-8 py-8 overflow-y-auto">

        <h1 className="text-3xl font-light text-[#4A3728] mb-1 font-[family-name:var(--font-jost)]">Messages</h1>
        <p className="text-[#8B7355] mb-6">Chat with members about swaps.</p>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-6 h-6 border-2 border-[#4A3728] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : convos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-2xl text-[#8B7355] font-[family-name:var(--font-permanent-marker)] mb-3">No messages yet</p>
            <p className="text-[#A09080]">When you propose or get matched for a swap, you can chat here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-w-2xl">
            {convos.map((convo) => (
              <div
                key={convo.id}
                onClick={() => router.push(`/messages/${convo.id}`)}
                className="bg-white/60 backdrop-blur-sm rounded-2xl px-5 py-4 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="w-11 h-11 rounded-full bg-[#EDE8DF] flex items-center justify-center text-lg font-medium text-[#4A3728] font-[family-name:var(--font-permanent-marker)] shrink-0">
                  {convo.otherName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <Link
                      href={`/members/${convo.otherId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm font-medium text-[#4A3728] hover:underline"
                    >
                      {convo.otherName}
                    </Link>
                    <p className="text-xs text-[#A09080] shrink-0 ml-2">{convo.lastAt}</p>
                  </div>
                  <p className="text-sm text-[#A09080] truncate">{convo.lastMessage}</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
