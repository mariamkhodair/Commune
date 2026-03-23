"use client";

import { useState, use } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import ProposeSwapModal from "@/components/ProposeSwapModal";

// Placeholder — will be replaced with Supabase data
const placeholderItems: Record<string, {
  name: string;
  category: string;
  condition: string;
  points: number;
  description: string;
  ownerId: string;
  ownerName: string;
  image: null;
  moreItems: { id: string; name: string; points: number; condition: string }[];
}> = {
  "3": {
    name: "Sony WH-1000XM4 Headphones",
    category: "Electronics",
    condition: "Like New",
    points: 1200,
    description: "Sony WH-1000XM4 wireless noise-cancelling headphones in like-new condition. Used for about 3 months, no scratches or damage. Comes with original carry case, charging cable, and audio jack adapter. Battery life still at 100% capacity. Perfect for commuting or working from home.",
    ownerId: "2",
    ownerName: "Karim A.",
    image: null,
    moreItems: [
      { id: "4", name: "Mechanical Keyboard (TKL)", points: 800, condition: "Good" },
      { id: "9", name: "Canon EOS 200D Camera", points: 950, condition: "Good" },
      { id: "10", name: "iPad Pro 11\" (2021)", points: 2200, condition: "Like New" },
      { id: "15", name: "Logitech MX Master 3 Mouse", points: 650, condition: "Like New" },
    ],
  },
  "4": {
    name: "Mechanical Keyboard (TKL)",
    category: "Electronics",
    condition: "Good",
    points: 800,
    description: "Tenkeyless mechanical keyboard with Cherry MX Brown switches. Great tactile feedback, ideal for typing and gaming. Some light wear on the keycaps from regular use but fully functional. No missing keys, no spills. USB-C connection.",
    ownerId: "2",
    ownerName: "Karim A.",
    image: null,
    moreItems: [
      { id: "3", name: "Sony WH-1000XM4 Headphones", points: 1200, condition: "Like New" },
      { id: "9", name: "Canon EOS 200D Camera", points: 950, condition: "Good" },
      { id: "14", name: "JBL Flip 6 Speaker", points: 750, condition: "Like New" },
    ],
  },
  "1": {
    name: "Vintage Levi's Jacket",
    category: "Apparel",
    condition: "Good",
    points: 420,
    description: "Authentic vintage Levi's denim jacket from the 90s. Size M, fits true to size. Minor fading consistent with age which adds to the character. No rips, stains, or damage. A timeless wardrobe staple.",
    ownerId: "1",
    ownerName: "Sara M.",
    image: null,
    moreItems: [
      { id: "101", name: "Ceramic Vase", points: 180, condition: "Like New" },
    ],
  },
  "2": {
    name: "Sony WH-1000XM4 Headphones",
    category: "Electronics",
    condition: "Like New",
    points: 1200,
    description: "Sony WH-1000XM4 wireless noise-cancelling headphones. Barely used — purchased as a gift but already have a pair. Comes with original packaging, carry case, and all accessories. Zero scratches.",
    ownerId: "2",
    ownerName: "Karim A.",
    image: null,
    moreItems: [
      { id: "4", name: "Mechanical Keyboard (TKL)", points: 800, condition: "Good" },
      { id: "9", name: "Canon EOS 200D Camera", points: 950, condition: "Good" },
    ],
  },
  "5": {
    name: "Maybelline Mascara Set",
    category: "Cosmetics",
    condition: "New",
    points: 200,
    description: "Brand new Maybelline mascara set — 3 mascaras still in original packaging, never opened. Includes Lash Sensational, Sky High, and Colossal. Great gift or treat for yourself.",
    ownerId: "5",
    ownerName: "Dina H.",
    image: null,
    moreItems: [],
  },
  "6": {
    name: "IKEA Desk Lamp",
    category: "Furniture & Home Decor",
    condition: "New",
    points: 150,
    description: "IKEA FORSÅ work lamp in matte black. Bought as a spare, never used, still has original sticker. Adjustable arm and head. Takes standard E14 bulb (not included).",
    ownerId: "4",
    ownerName: "Ahmed R.",
    image: null,
    moreItems: [],
  },
};

export default function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const item = placeholderItems[id];
  const [proposing, setProposing] = useState(false);

  if (!item) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-[#8B7355]">Item not found.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">

        {/* Top bar */}
        <div className="flex items-center gap-4 px-8 py-5 border-b border-[#D9CFC4] bg-white/60 backdrop-blur-sm sticky top-0 z-10">
          <button onClick={() => window.history.back()} className="text-[#8B7355] hover:text-[#4A3728] transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <h1 className="text-xl font-light text-[#4A3728] font-[family-name:var(--font-jost)] truncate">{item.name}</h1>
        </div>

        <div className="max-w-xl mx-auto px-6 py-8 flex flex-col gap-6">

          {/* Photo */}
          <div className="w-full aspect-square rounded-2xl bg-[#EDE8DF] flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 24 24" fill="none" stroke="#C4B9AA" strokeWidth="1.5" className="w-16 h-16">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>

          {/* Item info */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-1">
              <h2 className="text-2xl font-light text-[#4A3728] font-[family-name:var(--font-jost)]">{item.name}</h2>
              <span className="text-lg font-bold text-[#4A3728] shrink-0">{item.points} <span className="text-sm font-normal text-[#8B7355]">pts</span></span>
            </div>
            <p className="text-sm text-[#8B7355]">{item.category} · {item.condition}</p>
          </div>

          {/* Owner */}
          <div className="flex items-center justify-between bg-white/60 backdrop-blur-sm rounded-2xl px-5 py-4 border border-[#D9CFC4]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EDE8DF] flex items-center justify-center text-base font-medium text-[#4A3728] font-[family-name:var(--font-permanent-marker)]">
                {item.ownerName.charAt(0)}
              </div>
              <div>
                <Link
                  href={`/members/${item.ownerId}`}
                  className="text-sm font-semibold text-[#4A3728] hover:underline"
                >
                  {item.ownerName}
                </Link>
                <p className="text-xs text-[#A09080]">View their full listings</p>
              </div>
            </div>

            {/* Action icons */}
            <div className="flex items-center gap-2">
              {/* Message */}
              <Link
                href={`/messages/${item.ownerId}`}
                className="w-10 h-10 rounded-full border border-[#D9CFC4] flex items-center justify-center text-[#6B5040] hover:border-[#4A3728] hover:text-[#4A3728] transition-colors"
                title="Message"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </Link>

              {/* Propose swap */}
              <button
                onClick={() => setProposing(true)}
                className="w-10 h-10 rounded-full bg-[#4A3728] flex items-center justify-center text-[#F5F0E8] hover:bg-[#6B5040] transition-colors"
                title="Propose swap"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M7 16V4m0 0L3 8m4-4 4 4" /><path d="M17 8v12m0 0 4-4m-4 4-4-4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-[#4A3728] mb-2">Description</h3>
            <p className="text-sm text-[#6B5040] leading-relaxed">{item.description}</p>
          </div>

          {/* More from this member */}
          {item.moreItems.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-[#4A3728]">More from {item.ownerName}</h3>
                <Link href={`/members/${item.ownerId}`} className="text-xs text-[#8B7355] hover:underline">
                  See all
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {item.moreItems.map((m) => (
                  <Link
                    key={m.id}
                    href={`/items/${m.id}`}
                    className="bg-white/60 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-square bg-[#EDE8DF] flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#C4B9AA" strokeWidth="1.5" className="w-7 h-7">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="m21 15-5-5L5 21" />
                      </svg>
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-medium text-[#4A3728] truncate">{m.name}</p>
                      <p className="text-xs text-[#8B7355]">{m.condition}</p>
                      <p className="text-xs font-semibold text-[#4A3728] mt-1">{m.points} pts</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {proposing && (
        <ProposeSwapModal
          item={{ name: item.name, points: item.points, owner: item.ownerName }}
          onClose={() => setProposing(false)}
        />
      )}
    </div>
  );
}
