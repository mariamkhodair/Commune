"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

// Placeholder — will be replaced with Supabase data
const placeholderMembers: Record<string, { name: string; joined: string; items: { id: number; name: string; category: string; points: number; condition: string }[] }> = {
  "1": { name: "Sara M.", joined: "Jan 2024", items: [
    { id: 1, name: "Vintage Levi's Jacket", category: "Apparel", points: 420, condition: "Good" },
    { id: 2, name: "Ceramic Vase", category: "Furniture & Home Decor", points: 180, condition: "Like New" },
  ]},
  "2": { name: "Karim A.", joined: "Mar 2024", items: [
    { id: 3, name: "Sony WH-1000XM4 Headphones", category: "Electronics", points: 1200, condition: "Like New" },
    { id: 4, name: "Mechanical Keyboard", category: "Electronics", points: 800, condition: "Good" },
  ]},
  "3": { name: "Nour T.", joined: "Feb 2024", items: [
    { id: 5, name: "The Alchemist (Arabic)", category: "Books", points: 60, condition: "Good" },
  ]},
  "4": { name: "Ahmed R.", joined: "Dec 2023", items: [
    { id: 6, name: "IKEA Desk Lamp", category: "Furniture & Home Decor", points: 150, condition: "New" },
  ]},
  "5": { name: "Dina H.", joined: "Apr 2024", items: [
    { id: 7, name: "Maybelline Mascara Set", category: "Cosmetics", points: 200, condition: "New" },
  ]},
  "6": { name: "Omar S.", joined: "May 2024", items: [
    { id: 8, name: "Wireless Mouse", category: "Electronics", points: 250, condition: "Like New" },
  ]},
};

export default function MemberProfile({ params }: { params: { id: string } }) {
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const member = placeholderMembers[params.id];

  function toggleLike(id: number) {
    setLiked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (!member) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 px-8 py-8 flex items-center justify-center">
          <p className="text-[#8B7355]">Member not found.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 px-8 py-8 overflow-y-auto">

        {/* Back */}
        <Link href="/members" className="inline-flex items-center gap-2 text-[#8B7355] hover:text-[#4A3728] transition-colors mb-6 text-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          All Members
        </Link>

        {/* Member header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-[#EDE8DF] flex items-center justify-center text-2xl font-medium text-[#4A3728] font-[family-name:var(--font-permanent-marker)]">
            {member.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-light text-[#4A3728] font-[family-name:var(--font-jost)]">{member.name}</h1>
            <p className="text-sm text-[#8B7355]">Member since {member.joined}</p>
          </div>
        </div>

        {/* Their Stuff */}
        <h2 className="text-lg font-medium text-[#4A3728] mb-4">Their Stuff</h2>

        {member.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-2xl text-[#8B7355] font-[family-name:var(--font-permanent-marker)] mb-3">Nothing listed yet</p>
            <p className="text-[#A09080]">This member hasn't listed any items yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {member.items.map((item) => (
              <div key={item.id} className="bg-white/60 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">

                {/* Like button */}
                <button
                  onClick={() => toggleLike(item.id)}
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill={liked.has(item.id) ? "#A0624A" : "none"} stroke="#A0624A" strokeWidth="2" className="w-4 h-4">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>

                {/* Image */}
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
                  <p className="text-xs text-[#8B7355] mb-2">{item.category} · {item.condition}</p>
                  <div className="flex items-center justify-between">
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
