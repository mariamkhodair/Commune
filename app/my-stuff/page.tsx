"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

const statusStyles: Record<string, string> = {
  Available: "bg-[#D8E4D0] text-[#4A6640]",
  "In a Swap": "bg-[#D4E0E8] text-[#2A5060]",
  Swapped: "bg-[#DDD8C8] text-[#6B5040]",
};

// Placeholder — will be replaced with real data from Supabase
const myRating = { score: 4.7, count: 10 };

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} viewBox="0 0 24 24" className="w-3.5 h-3.5" fill={s <= Math.round(rating) ? "#C4842A" : "none"} stroke="#C4842A" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span className="text-xs text-[#8B7355] ml-0.5">{rating.toFixed(1)}</span>
      <span className="text-xs text-[#A09080]">({myRating.count} ratings)</span>
    </div>
  );
}

// Placeholder items — will be replaced with real data from Supabase
const placeholderItems = [
  { id: 1, name: "Vintage Denim Jacket", category: "Apparel", points: 320, status: "Available", image: null,
    likedBy: [{ id: 2, name: "Karim A." }, { id: 5, name: "Dina H." }] },
  { id: 2, name: "Canon EOS Camera", category: "Electronics", points: 850, status: "In a Swap", image: null,
    likedBy: [{ id: 1, name: "Sara M." }] },
  { id: 3, name: "The Alchemist", category: "Books", points: 80, status: "Swapped", image: null,
    likedBy: [] },
];

export default function MyStuff() {
  const [likersModal, setLikersModal] = useState<{ itemName: string; likedBy: { id: number; name: string }[] } | null>(null);

  return (
    <div className="min-h-screen flex">

      <Sidebar />

      {/* ── Main content ── */}
      <main className="flex-1 px-8 py-8 overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-light text-[#4A3728] font-[family-name:var(--font-jost)]">My Stuff</h1>
            <p className="text-[#8B7355] mt-1 mb-1">{placeholderItems.length} items listed</p>
            <Stars rating={myRating.score} />
          </div>
          <Link
            href="/my-stuff/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#4A3728] text-[#F5F0E8] font-medium hover:bg-[#6B5040] transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4">
              <path d="M12 5v14M5 12h14" />
            </svg>
            List an Item
          </Link>
        </div>

        {/* Items grid */}
        {placeholderItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-2xl text-[#8B7355] font-[family-name:var(--font-permanent-marker)] mb-3">Nothing here yet</p>
            <p className="text-[#A09080] mb-6">List your first item and start swapping.</p>
            <Link
              href="/my-stuff/new"
              className="px-6 py-3 rounded-full bg-[#4A3728] text-[#F5F0E8] font-medium hover:bg-[#6B5040] transition-colors"
            >
              List an Item
            </Link>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-4 gap-3">
              {placeholderItems.map((item) => (
                <div key={item.id} className="bg-white/60 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Image area */}
                  <div className="aspect-square bg-[#EDE8DF] flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#C4B9AA" strokeWidth="1.5" className="w-8 h-8">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="m21 15-5-5L5 21" />
                    </svg>
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <p className="font-medium text-[#4A3728] truncate text-sm">{item.name}</p>
                    <p className="text-xs text-[#8B7355] mb-2">{item.category}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#4A3728]">{item.points} pts</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyles[item.status]}`}>
                        {item.status}
                      </span>
                    </div>
                    <button
                      onClick={() => setLikersModal({ itemName: item.name, likedBy: item.likedBy })}
                      className="flex items-center gap-1 mt-2 text-xs text-[#A09080] hover:text-[#A0624A] transition-colors"
                    >
                      <svg viewBox="0 0 24 24" fill={item.likedBy.length > 0 ? "#A0624A" : "none"} stroke="#A0624A" strokeWidth="2" className="w-3.5 h-3.5">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      {item.likedBy.length === 0 ? "No likes yet" : `${item.likedBy.length} ${item.likedBy.length === 1 ? "like" : "likes"}`}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Likers modal */}
      {likersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-[#4A3728]/30 backdrop-blur-sm" onClick={() => setLikersModal(null)} />
          <div className="relative w-full max-w-sm bg-[#FAF7F2] rounded-3xl px-7 py-8 shadow-lg">
            <button
              onClick={() => setLikersModal(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#EDE8DF] flex items-center justify-center text-[#8B7355] hover:bg-[#D9CFC4] transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center gap-2 mb-1">
              <svg viewBox="0 0 24 24" fill="#A0624A" stroke="#A0624A" strokeWidth="2" className="w-4 h-4">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <h3 className="text-base font-semibold text-[#4A3728]">Liked by</h3>
            </div>
            <p className="text-xs text-[#8B7355] mb-5 truncate">{likersModal.itemName}</p>

            {likersModal.likedBy.length === 0 ? (
              <p className="text-sm text-[#A09080] text-center py-4">No one has liked this item yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {likersModal.likedBy.map((member) => (
                  <Link
                    key={member.id}
                    href={`/members/${member.id}`}
                    onClick={() => setLikersModal(null)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/70 border border-[#EDE8DF] hover:border-[#4A3728] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#EDE8DF] flex items-center justify-center text-sm font-medium text-[#4A3728] font-[family-name:var(--font-permanent-marker)] shrink-0">
                      {member.name.charAt(0)}
                    </div>
                    <p className="text-sm font-medium text-[#4A3728]">{member.name}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
