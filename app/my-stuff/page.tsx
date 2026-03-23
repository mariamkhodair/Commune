"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";

const sidebarItems = [
  {
    label: "Search",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
    ),
    href: "/search",
  },
  {
    label: "My Stuff",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
    href: "/my-stuff",
  },
  {
    label: "My Swaps",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M7 16V4m0 0L3 8m4-4 4 4" /><path d="M17 8v12m0 0 4-4m-4 4-4-4" />
      </svg>
    ),
    href: "/my-swaps",
  },
  {
    label: "Liked Stuff",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    href: "/liked",
  },
  {
    label: "Get Help",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" />
      </svg>
    ),
    href: "/help",
  },
];

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [zoom, setZoom] = useState(1);
  const gridRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((prev) => Math.min(2, Math.max(0.5, prev - e.deltaY * 0.001)));
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex">

      {/* ── Sidebar ── */}
      <aside className={`relative flex flex-col bg-white/70 backdrop-blur-sm border-r border-[#D9CFC4] transition-all duration-300 ease-in-out ${sidebarOpen ? "w-52" : "w-16"} shrink-0`}>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-[#4A3728] text-[#F5F0E8] flex items-center justify-center shadow-sm hover:bg-[#6B5040] transition-colors z-10"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3 h-3">
            {sidebarOpen ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
          </svg>
        </button>

        <Link href="/" className="px-4 py-6 text-[#4A3728] font-[family-name:var(--font-permanent-marker)] whitespace-nowrap overflow-hidden" style={{ fontSize: sidebarOpen ? "1.5rem" : "0" }}>
          Commune
        </Link>

        <nav className="flex flex-col gap-1 px-2 mt-2">
          {sidebarItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${item.label === "My Stuff" ? "bg-[#4A3728] text-[#F5F0E8]" : "text-[#6B5040] hover:bg-[#F5F0E8] hover:text-[#4A3728]"}`}
            >
              <span className="shrink-0">{item.icon}</span>
              {sidebarOpen && (
                <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
              )}
            </Link>
          ))}
        </nav>
      </aside>

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
