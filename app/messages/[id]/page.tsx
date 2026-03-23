"use client";

import { useState, use } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

// Placeholder — will be replaced with Supabase data
const placeholderChats: Record<string, { name: string; messages: { id: number; from: "me" | "them"; text: string; time: string }[] }> = {
  "1": { name: "Sara M.", messages: [
    { id: 1, from: "them", text: "Hi! I saw you wanted to swap your Canon camera — I have the Levi's jacket you liked.", time: "10:02" },
    { id: 2, from: "me", text: "Yes! I'm interested. Is it still available?", time: "10:05" },
    { id: 3, from: "them", text: "Sure, I can meet this weekend!", time: "10:08" },
  ]},
  "2": { name: "Karim A.", messages: [
    { id: 1, from: "them", text: "Is the keyboard still available?", time: "Yesterday" },
  ]},
  "3": { name: "Nour T.", messages: [
    { id: 1, from: "me", text: "Just received the book, thank you!", time: "Monday" },
    { id: 2, from: "them", text: "Thanks for the swap, enjoy the book!", time: "Monday" },
  ]},
  "4": { name: "Dina H.", messages: [
    { id: 1, from: "them", text: "Would you consider swapping for a mascara set?", time: "Tuesday" },
  ]},
};

export default function Chat({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [message, setMessage] = useState("");
  const chat = placeholderChats[id];

  if (!chat) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-[#8B7355]">Conversation not found.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Chat header */}
        <div className="flex items-center gap-4 px-8 py-5 border-b border-[#D9CFC4] bg-white/60 backdrop-blur-sm shrink-0">
          <Link href="/messages" className="text-[#8B7355] hover:text-[#4A3728] transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </Link>
          <div className="w-9 h-9 rounded-full bg-[#EDE8DF] flex items-center justify-center text-sm font-medium text-[#4A3728] font-[family-name:var(--font-permanent-marker)]">
            {chat.name.charAt(0)}
          </div>
          <p className="font-medium text-[#4A3728]">{chat.name}</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-3">
          {chat.messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-xs rounded-2xl px-4 py-2.5 ${msg.from === "me" ? "bg-[#4A3728] text-[#F5F0E8] rounded-br-sm" : "bg-white/80 text-[#4A3728] rounded-bl-sm shadow-sm"}`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.from === "me" ? "text-[#C4B9AA]" : "text-[#A09080]"}`}>{msg.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="px-8 py-5 border-t border-[#D9CFC4] bg-white/60 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && message.trim()) setMessage(""); }}
              className="flex-1 rounded-full border border-[#D9CFC4] bg-[#FAF7F2] px-5 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors"
            />
            <button
              onClick={() => setMessage("")}
              disabled={!message.trim()}
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
