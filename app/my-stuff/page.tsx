"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

const statusStyles: Record<string, string> = {
  Available: "bg-[#D8E4D0] text-[#4A6640]",
  "In a Swap": "bg-[#D4E0E8] text-[#2A5060]",
  Swapped: "bg-[#DDD8C8] text-[#6B5040]",
};

// Placeholder items — will be replaced with real data from Supabase
const placeholderItems = [
  { id: 1, name: "Vintage Denim Jacket", category: "Apparel", points: 320, status: "Available", image: null },
  { id: 2, name: "Canon EOS Camera", category: "Electronics", points: 850, status: "In a Swap", image: null },
  { id: 3, name: "The Alchemist", category: "Books", points: 80, status: "Swapped", image: null },
];

export default function MyStuff() {
  const [zoom, setZoom] = useState(1);
  const gridRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((prev) => Math.min(2, Math.max(0.5, prev - e.deltaY * 0.001)));
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex">

      <Sidebar />

      {/* ── Main content ── */}
      <main className="flex-1 px-8 py-8 overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-light text-[#4A3728] font-[family-name:var(--font-jost)]">My Stuff</h1>
            <p className="text-[#8B7355] mt-1">{placeholderItems.length} items listed</p>
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
          <div
            ref={gridRef}
            onWheel={handleWheel}
            style={{ cursor: "zoom-in" }}
          >
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: `repeat(auto-fill, minmax(${Math.round(160 * zoom)}px, 1fr))`,
              }}
            >
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

    </div>
  );
}
