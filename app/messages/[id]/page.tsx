"use client";

import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type Message = { id: string; content: string; sender_id: string; created_at: string };

export default function Chat({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { userId } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherName, setOtherName] = useState("");
  const [otherId, setOtherId] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || !userId) return;
    fetchThread();

    const channel = supabase
      .channel(`messages:${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((prev) => prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [loading]);

  async function fetchThread() {
    const { data: convo, error: convErr } = await supabase
      .from("conversations")
      .select("member1_id, member2_id")
      .eq("id", id)
      .maybeSingle();

    console.log("fetchThread id:", id, "userId:", userId, "convo:", convo, "error:", convErr);

    if (convo) {
      const other = convo.member1_id === userId ? convo.member2_id : convo.member1_id;
      setOtherId(other);
      const { data: p } = await supabase.from("profiles").select("name").eq("id", other).single();
      setOtherName(p?.name ?? "Unknown");
    }

    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    setMessages(msgs ?? []);
    setLoading(false);
  }

  async function sendMessage() {
    const text = body.trim();
    if (!text || !userId) return;
    setBody("");

    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = { id: tempId, content: text, sender_id: userId, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, optimistic]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: id, sender_id: userId, content: text })
      .select("id, content, sender_id, created_at")
      .single();

    if (error) {
      console.error("sendMessage error:", error);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } else if (data) {
      setMessages((prev) => prev.map((m) => m.id === tempId ? data as Message : m));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#4A3728] border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-4 px-8 py-5 border-b border-[#D9CFC4] bg-white/60 backdrop-blur-sm shrink-0">
          <Link href="/messages" className="text-[#8B7355] hover:text-[#4A3728] transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </Link>
          <div className="w-9 h-9 rounded-full bg-[#EDE8DF] flex items-center justify-center text-sm font-medium text-[#4A3728] font-[family-name:var(--font-permanent-marker)]">
            {otherName.charAt(0)}
          </div>
          {otherId ? (
            <Link href={`/members/${otherId}`} className="font-medium text-[#4A3728] hover:underline">
              {otherName}
            </Link>
          ) : (
            <span className="font-medium text-[#4A3728]">{otherName}</span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-3">
          {messages.length === 0 && (
            <p className="text-center text-sm text-[#A09080] mt-8">No messages yet. Say hi!</p>
          )}
          {messages.map((msg) => {
            const mine = msg.sender_id === userId;
            return (
              <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs rounded-2xl px-4 py-2.5 ${mine ? "bg-[#4A3728] text-[#F5F0E8] rounded-br-sm" : "bg-white/80 text-[#4A3728] rounded-bl-sm shadow-sm"}`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p className={`text-xs mt-1 ${mine ? "text-[#C4B9AA]" : "text-[#A09080]"}`}>
                    {new Date(msg.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-8 py-5 border-t border-[#D9CFC4] bg-white/60 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Type a message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && body.trim()) sendMessage(); }}
              className="flex-1 rounded-full border border-[#D9CFC4] bg-[#FAF7F2] px-5 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={!body.trim()}
              className="w-11 h-11 rounded-full bg-[#4A3728] text-[#F5F0E8] flex items-center justify-center hover:bg-[#6B5040] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                <path d="M22 2L11 13" /><path d="M22 2L15 22l-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
