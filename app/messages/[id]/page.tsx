"use client";

import { useState, use, useRef } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

// Placeholder — will be replaced with Supabase data
const placeholderChats: Record<string, { name: string; memberId: number; messages: { id: number; from: "me" | "them"; text: string; time: string }[] }> = {
  "1": { name: "Sara M.", memberId: 1, messages: [
    { id: 1, from: "them", text: "Hi! I saw you wanted to swap your Canon camera — I have the Levi's jacket you liked.", time: "10:02" },
    { id: 2, from: "me", text: "Yes! I'm interested. Is it still available?", time: "10:05" },
    { id: 3, from: "them", text: "Sure, I can meet this weekend!", time: "10:08" },
  ]},
  "2": { name: "Karim A.", memberId: 2, messages: [
    { id: 1, from: "them", text: "Is the keyboard still available?", time: "Yesterday" },
  ]},
  "3": { name: "Nour T.", memberId: 3, messages: [
    { id: 1, from: "me", text: "Just received the book, thank you!", time: "Monday" },
    { id: 2, from: "them", text: "Thanks for the swap, enjoy the book!", time: "Monday" },
  ]},
  "4": { name: "Dina H.", memberId: 5, messages: [
    { id: 1, from: "them", text: "Would you consider swapping for a mascara set?", time: "Tuesday" },
  ]},
};

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function Calendar({ onSelect }: { onSelect: (date: Date) => void }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<Date | null>(null);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }
  function isPast(day: number) {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0,0,0,0);
    const t = new Date(); t.setHours(0,0,0,0);
    return d < t;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="w-7 h-7 rounded-full hover:bg-[#EDE8DF] flex items-center justify-center text-[#6B5040] transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <p className="text-sm font-semibold text-[#4A3728]">{MONTHS[viewMonth]} {viewYear}</p>
        <button onClick={nextMonth} className="w-7 h-7 rounded-full hover:bg-[#EDE8DF] flex items-center justify-center text-[#6B5040] transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map(d => <p key={d} className="text-center text-xs font-medium text-[#A09080] py-1">{d}</p>)}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const past = isPast(day);
          const sel = selected && selected.getFullYear() === viewYear && selected.getMonth() === viewMonth && selected.getDate() === day;
          return (
            <button
              key={day}
              disabled={past}
              onClick={() => setSelected(new Date(viewYear, viewMonth, day))}
              className={`aspect-square rounded-full text-xs font-medium transition-colors ${sel ? "bg-[#4A3728] text-[#F5F0E8]" : past ? "text-[#D9CFC4] cursor-not-allowed" : "text-[#4A3728] hover:bg-[#EDE8DF]"}`}
            >
              {day}
            </button>
          );
        })}
      </div>
      <button
        disabled={!selected}
        onClick={() => selected && onSelect(selected)}
        className="w-full rounded-full bg-[#4A3728] text-[#F5F0E8] py-2.5 text-sm font-semibold hover:bg-[#6B5040] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {selected ? `Suggest ${selected.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}` : "Select a date"}
      </button>
    </div>
  );
}

export default function Chat({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [suggestedDate, setSuggestedDate] = useState<Date | null>(null);
  const [dateConfirmed, setDateConfirmed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chat = placeholderChats[id];

  function handleImage(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleSuggestDate(date: Date) {
    setSuggestedDate(date);
    setShowCalendar(false);
  }

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
          <Link href={`/members/${chat.memberId}`} className="font-medium text-[#4A3728] hover:underline">{chat.name}</Link>
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

          {/* Suggested date bubble */}
          {suggestedDate && !dateConfirmed && (
            <div className="flex justify-end">
              <div className="max-w-xs bg-[#4A3728] text-[#F5F0E8] rounded-2xl rounded-br-sm px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5 shrink-0">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                  <p className="text-xs font-semibold">Swap date suggested</p>
                </div>
                <p className="text-sm font-medium">{suggestedDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
                <p className="text-xs text-[#C4B9AA] mt-1">Waiting for {chat.name} to confirm…</p>
              </div>
            </div>
          )}

          {/* Confirmed date bubble — simulated as if other person accepted */}
          {dateConfirmed && suggestedDate && (
            <div className="flex justify-center">
              <div className="bg-[#D8E4D0] rounded-2xl px-5 py-3 text-center">
                <p className="text-xs font-semibold text-[#4A6640] mb-0.5">🤝🏽 Swap date confirmed!</p>
                <p className="text-sm font-medium text-[#4A3728]">{suggestedDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
                <Link href="/scheduled-swaps" className="text-xs text-[#4A6640] underline underline-offset-2 mt-1 inline-block">View in Scheduled Swaps →</Link>
              </div>
            </div>
          )}

          {/* Simulate the other person accepting (demo only) */}
          {suggestedDate && !dateConfirmed && (
            <div className="flex justify-start">
              <div className="max-w-xs bg-white/80 text-[#4A3728] rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <p className="text-xs text-[#A09080] mb-2">{chat.name} received your date suggestion</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDateConfirmed(true)}
                    className="flex-1 rounded-full bg-[#4A3728] text-[#F5F0E8] py-1.5 text-xs font-semibold hover:bg-[#6B5040] transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => setSuggestedDate(null)}
                    className="flex-1 rounded-full border border-[#D9CFC4] text-[#6B5040] py-1.5 text-xs font-medium hover:border-[#A0624A] hover:text-[#A0624A] transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-8 py-5 border-t border-[#D9CFC4] bg-white/60 backdrop-blur-sm shrink-0">

          {/* Image preview */}
          {imagePreview && (
            <div className="relative inline-block mb-3">
              <img src={imagePreview} alt="Upload preview" className="h-20 rounded-xl object-cover border border-[#D9CFC4]" />
              <button
                onClick={() => setImagePreview(null)}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#4A3728] text-white flex items-center justify-center"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-2.5 h-2.5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="flex items-center gap-3">
            {/* Photo button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-11 h-11 rounded-full border border-[#D9CFC4] bg-white/60 flex items-center justify-center text-[#8B7355] hover:border-[#4A3728] hover:text-[#4A3728] transition-colors shrink-0"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleImage(e.target.files[0]); }} />

            {/* Schedule a Swap button */}
            <button
              type="button"
              onClick={() => setShowCalendar(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-[#D9CFC4] bg-white/60 text-xs font-medium text-[#6B5040] hover:border-[#4A3728] hover:text-[#4A3728] transition-colors shrink-0"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              Schedule a Swap
            </button>

            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (message.trim() || imagePreview)) { setMessage(""); setImagePreview(null); } }}
              className="flex-1 rounded-full border border-[#D9CFC4] bg-[#FAF7F2] px-5 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors"
            />
            <button
              onClick={() => { setMessage(""); setImagePreview(null); }}
              disabled={!message.trim() && !imagePreview}
              className="w-11 h-11 rounded-full bg-[#4A3728] text-[#F5F0E8] flex items-center justify-center hover:bg-[#6B5040] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                <path d="M22 2L11 13" /><path d="M22 2L15 22l-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>

      </main>

      {/* Calendar modal */}
      {showCalendar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-[#4A3728]/30 backdrop-blur-sm" onClick={() => setShowCalendar(false)} />
          <div className="relative w-full max-w-sm bg-[#FAF7F2] rounded-3xl px-7 py-8 shadow-lg">
            <button
              onClick={() => setShowCalendar(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#EDE8DF] flex items-center justify-center text-[#8B7355] hover:bg-[#D9CFC4] transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-base font-semibold text-[#4A3728] mb-1">Schedule a Swap</h3>
            <p className="text-xs text-[#8B7355] mb-5">Pick a date to suggest to {chat.name}. They'll need to confirm before it's locked in.</p>
            <Calendar onSelect={handleSuggestDate} />
          </div>
        </div>
      )}

    </div>
  );
}
