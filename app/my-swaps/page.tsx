"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";

type SwapStatus = "Proposed" | "Accepted" | "In Progress" | "Completed" | "Declined";

const statusStyles: Record<SwapStatus, string> = {
  Proposed:    "bg-[#E4E0D0] text-[#6B5040]",
  Accepted:    "bg-[#D4E0E8] text-[#2A5060]",
  "In Progress": "bg-[#D8E4D0] text-[#4A6640]",
  Completed:   "bg-[#DDD8C8] text-[#4A3728]",
  Declined:    "bg-[#ECD8D4] text-[#8B3A2A]",
};

const steps: SwapStatus[] = ["Proposed", "Accepted", "In Progress", "Completed"];

// Placeholder — will be replaced with Supabase data
const placeholderSwaps = [
  {
    id: 1,
    status: "Proposed" as SwapStatus,
    direction: "incoming",
    otherUser: "Sara M.",
    theirItem: { name: "Vintage Levi's Jacket", points: 420 },
    yourItem: { name: "Canon EOS Camera", points: 850 },
  },
  {
    id: 2,
    status: "In Progress" as SwapStatus,
    direction: "outgoing",
    otherUser: "Karim A.",
    theirItem: { name: "Sony Headphones", points: 1200 },
    yourItem: { name: "Mechanical Keyboard", points: 800 },
  },
  {
    id: 3,
    status: "Completed" as SwapStatus,
    direction: "outgoing",
    otherUser: "Nour T.",
    theirItem: { name: "The Alchemist", points: 60 },
    yourItem: { name: "Linen Blazer", points: 180 },
  },
  {
    id: 4,
    status: "Declined" as SwapStatus,
    direction: "incoming",
    otherUser: "Ahmed R.",
    theirItem: { name: "IKEA Desk Lamp", points: 150 },
    yourItem: { name: "Vintage Denim Jacket", points: 320 },
  },
];

const tabs: (SwapStatus | "All")[] = ["All", "Proposed", "Accepted", "In Progress", "Completed", "Declined"];

function ProgressBar({ status }: { status: SwapStatus }) {
  if (status === "Declined") return null;
  const currentStep = steps.indexOf(status);
  return (
    <div className="flex items-center gap-1 mt-3">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-1 flex-1">
          <div className={`h-1.5 flex-1 rounded-full transition-colors ${i <= currentStep ? "bg-[#4A3728]" : "bg-[#D9CFC4]"}`} />
          {i === steps.length - 1 && null}
        </div>
      ))}
    </div>
  );
}

function RatingPrompt({ name }: { name: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) return (
    <p className="text-xs text-[#7A9E6E] mt-4">Thanks for rating {name}!</p>
  );

  return (
    <div className="mt-4 pt-4 border-t border-[#EDE8DF]">
      <p className="text-xs text-[#8B7355] mb-2">How was your swap with {name}?</p>
      <div className="flex items-center gap-1">
        {[1,2,3,4,5].map((s) => (
          <button
            key={s}
            onClick={() => setRating(s)}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill={s <= (hover || rating) ? "#C4842A" : "none"} stroke="#C4842A" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        ))}
        {rating > 0 && (
          <button
            onClick={() => setSubmitted(true)}
            className="ml-3 text-xs px-3 py-1 rounded-full bg-[#4A3728] text-[#F5F0E8] hover:bg-[#6B5040] transition-colors"
          >
            Submit
          </button>
        )}
      </div>
    </div>
  );
}

export default function MySwaps() {
  const [activeTab, setActiveTab] = useState<SwapStatus | "All">("All");

  const filtered = placeholderSwaps.filter((s) => activeTab === "All" || s.status === activeTab);

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 px-8 py-8 overflow-y-auto">

        <h1 className="text-3xl font-light text-[#4A3728] mb-1 font-[family-name:var(--font-jost)]">My Swaps</h1>
        <p className="text-[#8B7355] mb-6">Track all your swap requests and ongoing exchanges.</p>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${activeTab === tab ? "bg-[#4A3728] text-[#F5F0E8] border-[#4A3728]" : "border-[#D9CFC4] text-[#6B5040] bg-white/60 hover:border-[#4A3728]"}`}
            >
              {tab}
              <span className="ml-1.5 opacity-60">
                {tab === "All" ? placeholderSwaps.length : placeholderSwaps.filter(s => s.status === tab).length}
              </span>
            </button>
          ))}
        </div>

        {/* Swap cards */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-2xl text-[#8B7355] font-[family-name:var(--font-permanent-marker)] mb-2">No swaps here yet</p>
            <p className="text-[#A09080]">Head to Search to propose your first swap.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((swap) => (
              <div key={swap.id} className="bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-5 shadow-sm">

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#EDE8DF] flex items-center justify-center text-sm font-medium text-[#4A3728]">
                      {swap.otherUser.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#4A3728]">{swap.otherUser}</p>
                      <p className="text-xs text-[#A09080]">{swap.direction === "incoming" ? "sent you a request" : "you proposed this swap"}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusStyles[swap.status]}`}>
                    {swap.status}
                  </span>
                </div>

                {/* Items */}
                <div className="flex items-center gap-3">
                  {/* Their item */}
                  <div className="flex-1 bg-[#F5F0E8] rounded-xl p-3">
                    <p className="text-xs text-[#A09080] mb-1">Their item</p>
                    <p className="text-sm font-medium text-[#4A3728] truncate">{swap.theirItem.name}</p>
                    <p className="text-xs text-[#8B7355]">{swap.theirItem.points} pts</p>
                  </div>

                  {/* Swap icon */}
                  <svg viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2" strokeLinecap="round" className="w-5 h-5 shrink-0">
                    <path d="M7 16V4m0 0L3 8m4-4 4 4" /><path d="M17 8v12m0 0 4-4m-4 4-4-4" />
                  </svg>

                  {/* Your item */}
                  <div className="flex-1 bg-[#F5F0E8] rounded-xl p-3">
                    <p className="text-xs text-[#A09080] mb-1">Your item</p>
                    <p className="text-sm font-medium text-[#4A3728] truncate">{swap.yourItem.name}</p>
                    <p className="text-xs text-[#8B7355]">{swap.yourItem.points} pts</p>
                  </div>
                </div>

                {/* Progress bar */}
                <ProgressBar status={swap.status} />

                {/* Actions for incoming proposed swaps */}
                {swap.status === "Proposed" && swap.direction === "incoming" && (
                  <div className="flex gap-3 mt-4">
                    <button className="flex-1 rounded-full bg-[#4A3728] text-[#F5F0E8] py-2 text-sm font-medium hover:bg-[#6B5040] transition-colors">
                      Accept
                    </button>
                    <button className="flex-1 rounded-full border border-[#D9CFC4] text-[#6B5040] py-2 text-sm font-medium hover:border-[#A0624A] hover:text-[#A0624A] transition-colors">
                      Decline
                    </button>
                  </div>
                )}

                {/* Chat button for active swaps */}
                {(swap.status === "Accepted" || swap.status === "In Progress" || swap.status === "Proposed") && (
                  <a
                    href="/messages/1"
                    className="mt-3 flex items-center justify-center gap-2 w-full rounded-full border border-[#D9CFC4] text-[#6B5040] py-2 text-sm font-medium hover:border-[#4A3728] hover:text-[#4A3728] transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    Message {swap.otherUser}
                  </a>
                )}

                {/* Rating prompt for completed swaps */}
                {swap.status === "Completed" && (
                  <RatingPrompt name={swap.otherUser} />
                )}

              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
