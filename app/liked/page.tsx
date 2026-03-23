"use client";

import Link from "next/link";
import Sidebar from "@/components/Sidebar";

// Placeholder — will be replaced with Supabase data
const placeholderLiked = [
  { id: 1, name: "Vintage Levi's Jacket", category: "Apparel", condition: "Good", points: 420, owner: "Sara M.", image: null },
  { id: 2, name: "Sony WH-1000XM4 Headphones", category: "Electronics", condition: "Like New", points: 1200, owner: "Karim A.", image: null },
  { id: 3, name: "Maybelline Mascara Set", category: "Cosmetics", condition: "New", points: 200, owner: "Dina H.", image: null },
  { id: 4, name: "IKEA Desk Lamp", category: "Furniture & Home Decor", condition: "New", points: 150, owner: "Ahmed R.", image: null },
];

export default function LikedStuff() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 px-8 py-8 overflow-y-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-[#4A3728] font-[family-name:var(--font-jost)]">Liked Stuff</h1>
          <p className="text-[#8B7355] mt-1">Items you've saved — propose a swap when you're ready.</p>
        </div>

        {/* Grid */}
        {placeholderLiked.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-2xl text-[#8B7355] font-[family-name:var(--font-permanent-marker)] mb-3">Nothing liked yet</p>
            <p className="text-[#A09080]">Browse the search page and heart items you're interested in.</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {placeholderLiked.map((item) => (
              <div key={item.id} className="bg-white/60 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">

                {/* Unlike button */}
                <button
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center text-[#A0624A] hover:bg-white transition-colors"
                  title="Remove from liked"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>

                {/* Image — clickable */}
                <Link href={`/items/${item.id}`} className="block aspect-square bg-[#EDE8DF] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#C4B9AA" strokeWidth="1.5" className="w-8 h-8">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                </Link>

                {/* Info */}
                <div className="p-3">
                  <Link href={`/items/${item.id}`} className="block">
                    <p className="font-medium text-[#4A3728] truncate text-sm hover:underline">{item.name}</p>
                  </Link>
                  <p className="text-xs text-[#8B7355]">{item.owner} · {item.condition}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-semibold text-[#4A3728]">{item.points} pts</span>
                    <button className="text-xs px-3 py-1 rounded-full bg-[#F5F0E8] border border-[#D9CFC4] text-[#6B5040] hover:bg-[#4A3728] hover:text-[#F5F0E8] hover:border-[#4A3728] transition-colors">
                      Propose swap
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
