"use client";

import Link from "next/link";
import Sidebar from "@/components/Sidebar";

// Placeholder — will be replaced with Supabase data
const placeholderLikedMembers = [
  { id: 2, name: "Karim A.", itemCount: 14, joined: "Mar 2024" },
  { id: 5, name: "Dina H.", itemCount: 7, joined: "Apr 2024" },
];

export default function LikedMembers() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 px-8 py-8 overflow-y-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-light text-[#4A3728] font-[family-name:var(--font-jost)] mb-1">Liked Members</h1>
          <p className="text-[#8B7355]">Members you've saved — check back to see what they've listed.</p>
        </div>

        {placeholderLikedMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-2xl text-[#8B7355] font-[family-name:var(--font-permanent-marker)] mb-3">No liked members yet</p>
            <p className="text-[#A09080] mb-6">Browse members and heart the ones you want to keep track of.</p>
            <Link href="/members" className="px-6 py-3 rounded-full bg-[#4A3728] text-[#F5F0E8] font-medium hover:bg-[#6B5040] transition-colors">
              Browse Members
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {placeholderLikedMembers.map((member) => (
              <div key={member.id} className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center gap-3 relative">

                {/* Unlike button */}
                <button className="absolute top-3 left-3 w-7 h-7 rounded-full bg-[#FAF7F2] flex items-center justify-center hover:bg-white transition-colors">
                  <svg viewBox="0 0 24 24" fill="#A0624A" stroke="#A0624A" strokeWidth="2" className="w-4 h-4">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>

                <Link href={`/members/${member.id}`} className="flex flex-col items-center gap-3 w-full">
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
