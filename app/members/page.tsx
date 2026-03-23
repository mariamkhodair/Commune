"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

// Placeholder — will be replaced with Supabase data
const placeholderMembers = [
  { id: 1, name: "Sara M.", itemCount: 8, joined: "Jan 2024" },
  { id: 2, name: "Karim A.", itemCount: 14, joined: "Mar 2024" },
  { id: 3, name: "Nour T.", itemCount: 5, joined: "Feb 2024" },
  { id: 4, name: "Ahmed R.", itemCount: 11, joined: "Dec 2023" },
  { id: 5, name: "Dina H.", itemCount: 7, joined: "Apr 2024" },
  { id: 6, name: "Omar S.", itemCount: 3, joined: "May 2024" },
];

export default function Members() {
  const [query, setQuery] = useState("");
  const [liked, setLiked] = useState<Set<number>>(new Set());

  function toggleLike(id: number) {
    setLiked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const filtered = placeholderMembers.filter((m) =>
    m.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 px-8 py-8 overflow-y-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-light text-[#4A3728] font-[family-name:var(--font-jost)] mb-1">Members</h1>
          <p className="text-[#8B7355]">Browse the community and see what members have to offer.</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <svg viewBox="0 0 24 24" fill="none" stroke="#A09080" strokeWidth="2" strokeLinecap="round" className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search members..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-2xl border border-[#D9CFC4] bg-white/60 pl-10 pr-4 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors"
          />
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-2xl text-[#8B7355] font-[family-name:var(--font-permanent-marker)] mb-3">No members found</p>
            <p className="text-[#A09080]">Try a different name.</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {filtered.map((member) => (
              <div key={member.id} className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center gap-3 relative">

                {/* Like button */}
                <button
                  onClick={() => toggleLike(member.id)}
                  className="absolute top-3 left-3 w-7 h-7 rounded-full bg-[#FAF7F2] flex items-center justify-center hover:bg-white transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill={liked.has(member.id) ? "#A0624A" : "none"} stroke="#A0624A" strokeWidth="2" className="w-4 h-4">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>

                <Link href={`/members/${member.id}`} className="flex flex-col items-center gap-3 w-full">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full bg-[#EDE8DF] flex items-center justify-center text-xl font-medium text-[#4A3728] font-[family-name:var(--font-permanent-marker)]">
                  {member.name.charAt(0)}
                </div>

                <div>
                  <p className="font-medium text-[#4A3728]">{member.name}</p>
                  <p className="text-xs text-[#8B7355] mt-0.5">{member.itemCount} items listed</p>
                  <p className="text-xs text-[#A09080]">Member since {member.joined}</p>
                </div>

                  <span className="text-xs px-3 py-1 rounded-full bg-[#F5F0E8] border border-[#D9CFC4] text-[#6B5040]">
                    View Their Stuff
                  </span>
                </Link>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
