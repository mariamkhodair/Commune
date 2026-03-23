"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

// Placeholder — will be replaced with Supabase data
const placeholderScheduled = [
  {
    id: 1,
    swapId: 2,
    member: "Karim A.",
    memberId: 2,
    date: new Date(2026, 3, 5), // 5 April 2026
    yourItem: "Vintage Denim Jacket",
    theirItem: "Sony WH-1000XM4 Headphones",
  },
];

export default function ScheduledSwaps() {
  const [tracking, setTracking] = useState<Record<number, boolean>>({});
  const [done, setDone] = useState<Record<number, boolean>>({});

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 px-8 py-8 overflow-y-auto">

        <h1 className="text-3xl font-light text-[#4A3728] font-[family-name:var(--font-jost)] mb-1">Scheduled Swaps</h1>
        <p className="text-[#8B7355] mb-8">Your confirmed swap dates. Use the buttons below when you're on your way.</p>

        {placeholderScheduled.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-2xl text-[#8B7355] font-[family-name:var(--font-permanent-marker)] mb-3">Nothing scheduled yet</p>
            <p className="text-[#A09080] mb-6">Once you and another member agree on a date in chat, it'll appear here.</p>
            <Link href="/messages" className="px-6 py-3 rounded-full bg-[#4A3728] text-[#F5F0E8] font-medium hover:bg-[#6B5040] transition-colors">
              Go to Messages
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-5 max-w-xl">
            {placeholderScheduled.map((swap) => {
              const isTracking = tracking[swap.id];
              const isDone = done[swap.id];
              return (
                <div key={swap.id} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-[#D9CFC4] overflow-hidden shadow-sm">

                  {/* Date banner */}
                  <div className="bg-[#4A3728] px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#F5F0E8" strokeWidth="2" strokeLinecap="round" className="w-5 h-5 shrink-0">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                      </svg>
                      <div>
                        <p className="text-xs text-[#C4B9AA]">Confirmed date</p>
                        <p className="text-base font-semibold text-[#F5F0E8]">
                          {swap.date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    {isDone && (
                      <span className="text-xs bg-[#D8E4D0] text-[#4A6640] px-3 py-1 rounded-full font-semibold">Completed</span>
                    )}
                  </div>

                  <div className="px-6 py-5 flex flex-col gap-4">
                    {/* Members and items */}
                    <div className="flex items-center gap-3">
                      <Link href={`/members/${swap.memberId}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 rounded-full bg-[#EDE8DF] flex items-center justify-center text-sm font-medium text-[#4A3728] font-[family-name:var(--font-permanent-marker)]">
                          {swap.member.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-[#4A3728] hover:underline">{swap.member}</span>
                      </Link>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-[#F5F0E8] rounded-xl px-3 py-2">
                        <p className="text-xs text-[#A09080]">You're giving</p>
                        <p className="text-sm font-medium text-[#4A3728] truncate">{swap.yourItem}</p>
                      </div>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2" strokeLinecap="round" className="w-4 h-4 shrink-0">
                        <path d="M7 16V4m0 0L3 8m4-4 4 4"/><path d="M17 8v12m0 0 4-4m-4 4-4-4"/>
                      </svg>
                      <div className="flex-1 bg-[#F5F0E8] rounded-xl px-3 py-2">
                        <p className="text-xs text-[#A09080]">You're getting</p>
                        <p className="text-sm font-medium text-[#4A3728] truncate">{swap.theirItem}</p>
                      </div>
                    </div>

                    <Link
                      href={`/my-swaps`}
                      className="text-xs text-[#8B7355] hover:underline"
                    >
                      View in My Swaps →
                    </Link>

                    {/* Safety info */}
                    {!isDone && (
                      <div className="bg-[#F5F0E8] rounded-xl px-4 py-3">
                        <p className="text-xs font-medium text-[#6B5040] mb-1">Before you go</p>
                        <p className="text-xs text-[#A09080] leading-relaxed">
                          Meet in a public place. When you leave for the swap, press <span className="font-semibold text-[#4A3728]">Off to Swap</span> — your location will be shared with {swap.member} for the duration of the exchange. Once you're done and safe, press <span className="font-semibold text-[#4A3728]">Swapped and Safe</span> to stop tracking.
                        </p>
                      </div>
                    )}

                    {/* Action buttons */}
                    {!isDone && (
                      <div className="flex flex-col gap-2">
                        {!isTracking ? (
                          <button
                            onClick={() => setTracking((prev) => ({ ...prev, [swap.id]: true }))}
                            className="w-full rounded-full bg-[#4A3728] text-[#F5F0E8] py-3 font-semibold hover:bg-[#6B5040] transition-colors flex items-center justify-center gap-2"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                              <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
                            </svg>
                            Off to Swap
                          </button>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 justify-center py-2">
                              <span className="w-2 h-2 rounded-full bg-[#A0624A] animate-pulse" />
                              <p className="text-xs text-[#A0624A] font-medium">Location sharing active — {swap.member} can see you're on your way</p>
                            </div>
                            <button
                              onClick={() => { setTracking((prev) => ({ ...prev, [swap.id]: false })); setDone((prev) => ({ ...prev, [swap.id]: true })); }}
                              className="w-full rounded-full bg-[#7A9E6E] text-white py-3 font-semibold hover:bg-[#5A7E4E] transition-colors flex items-center justify-center gap-2"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4">
                                <path d="M20 6L9 17l-5-5"/>
                              </svg>
                              Swapped and Safe
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {isDone && (
                      <p className="text-sm text-center text-[#4A6640] font-medium">🤝🏽 Swap complete — don't forget to leave a rating!</p>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}
