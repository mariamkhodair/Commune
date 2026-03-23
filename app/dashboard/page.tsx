"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

const categories = [
  "Apparel",
  "Electronics",
  "Books",
  "Cosmetics",
  "Furniture & Home Decor",
  "Stationery & Art Supplies",
  "Miscellaneous",
];

// Placeholder — will be replaced with Supabase data
const placeholderMembers = [
  { id: 1, name: "Sara M." },
  { id: 2, name: "Karim A." },
  { id: 3, name: "Nour T." },
  { id: 4, name: "Ahmed R." },
  { id: 5, name: "Dina H." },
  { id: 6, name: "Omar S." },
];

export default function Dashboard() {
  const router = useRouter();
  const [openPanel, setOpenPanel] = useState<"categories" | "members" | "stuff" | null>(null);
  const [memberQuery, setMemberQuery] = useState("");
  const [stuffQuery, setStuffQuery] = useState("");

  const filteredMembers = placeholderMembers.filter((m) =>
    m.name.toLowerCase().includes(memberQuery.toLowerCase())
  );

  function togglePanel(panel: "categories" | "members" | "stuff") {
    setOpenPanel((prev) => (prev === panel ? null : panel));
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 px-8 py-8 overflow-y-auto">

        <h1 className="text-3xl font-light text-[#4A3728] mb-1 font-[family-name:var(--font-jost)]">Welcome back</h1>
        <p className="text-[#8B7355] mb-10">What are you looking for today?</p>

        <div className="flex flex-col gap-3 max-w-xl">

          {/* Search in Categories */}
          <div className="rounded-2xl border border-[#D9CFC4] bg-white/60 backdrop-blur-sm overflow-hidden">
            <button
              onClick={() => togglePanel("categories")}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#EDE8DF] flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-[#4A3728]">Search in Categories</span>
              </div>
              <svg
                viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2" strokeLinecap="round"
                className={`w-4 h-4 shrink-0 transition-transform ${openPanel === "categories" ? "rotate-180" : ""}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {openPanel === "categories" && (
              <div className="border-t border-[#EDE8DF] px-4 py-3 grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => router.push(`/search?category=${encodeURIComponent(cat)}`)}
                    className="text-left px-4 py-2.5 rounded-xl text-sm text-[#6B5040] bg-[#FAF7F2] hover:bg-[#4A3728] hover:text-[#F5F0E8] transition-colors"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search by Member */}
          <div className="rounded-2xl border border-[#D9CFC4] bg-white/60 backdrop-blur-sm overflow-hidden">
            <button
              onClick={() => togglePanel("members")}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#EDE8DF] flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-[#4A3728]">Search by Member</span>
              </div>
              <svg
                viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2" strokeLinecap="round"
                className={`w-4 h-4 shrink-0 transition-transform ${openPanel === "members" ? "rotate-180" : ""}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {openPanel === "members" && (
              <div className="border-t border-[#EDE8DF] px-4 py-3 flex flex-col gap-2">
                <div className="relative">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#A09080" strokeWidth="2" strokeLinecap="round" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Type a name..."
                    value={memberQuery}
                    onChange={(e) => setMemberQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && memberQuery.trim()) router.push(`/members?q=${encodeURIComponent(memberQuery)}`); }}
                    className="w-full rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] pl-9 pr-4 py-2.5 text-sm text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors"
                    autoFocus
                  />
                </div>
                {filteredMembers.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => router.push(`/members/${m.id}`)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#F5F0E8] transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#EDE8DF] flex items-center justify-center text-xs font-medium text-[#4A3728] font-[family-name:var(--font-permanent-marker)] shrink-0">
                      {m.name.charAt(0)}
                    </div>
                    <span className="text-sm text-[#4A3728]">{m.name}</span>
                  </button>
                ))}
                {memberQuery && filteredMembers.length === 0 && (
                  <p className="text-xs text-[#A09080] px-3 py-2">No members found.</p>
                )}
                <button
                  onClick={() => router.push(memberQuery ? `/members?q=${encodeURIComponent(memberQuery)}` : "/members")}
                  className="mt-1 w-full rounded-full border border-[#D9CFC4] text-[#6B5040] py-2 text-xs font-medium hover:border-[#4A3728] hover:text-[#4A3728] transition-colors"
                >
                  Browse all members →
                </button>
              </div>
            )}
          </div>

          {/* Search in Stuff */}
          <div className="rounded-2xl border border-[#D9CFC4] bg-white/60 backdrop-blur-sm overflow-hidden">
            <button
              onClick={() => togglePanel("stuff")}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#EDE8DF] flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-[#4A3728]">Search in Stuff</span>
              </div>
              <svg
                viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2" strokeLinecap="round"
                className={`w-4 h-4 shrink-0 transition-transform ${openPanel === "stuff" ? "rotate-180" : ""}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {openPanel === "stuff" && (
              <div className="border-t border-[#EDE8DF] px-4 py-3 flex flex-col gap-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#A09080" strokeWidth="2" strokeLinecap="round" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2">
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                      type="text"
                      placeholder="e.g. Vintage jacket, Canon camera..."
                      value={stuffQuery}
                      onChange={(e) => setStuffQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && stuffQuery.trim()) router.push(`/search?q=${encodeURIComponent(stuffQuery)}`); }}
                      className="w-full rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] pl-9 pr-4 py-2.5 text-sm text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors"
                      autoFocus
                    />
                  </div>
                  <button
                    disabled={!stuffQuery.trim()}
                    onClick={() => router.push(`/search?q=${encodeURIComponent(stuffQuery)}`)}
                    className="px-4 rounded-full bg-[#4A3728] text-[#F5F0E8] text-sm font-medium hover:bg-[#6B5040] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Search
                  </button>
                </div>
                <button
                  onClick={() => router.push("/search")}
                  className="w-full rounded-full border border-[#D9CFC4] text-[#6B5040] py-2 text-xs font-medium hover:border-[#4A3728] hover:text-[#4A3728] transition-colors"
                >
                  Browse all stuff →
                </button>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
