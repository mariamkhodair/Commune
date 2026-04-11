"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const categories = [
  "All Stuff",
  "Apparel",
  "Electronics",
  "Books",
  "Cosmetics",
  "Furniture & Home Decor",
  "Stationery & Art Supplies",
  "Miscellaneous",
];

const conditions = ["Any", "New", "Like New", "Good", "Fair"];

type BrowseItem = {
  id: string;
  name: string;
  category: string;
  condition: string;
  points: number;
  owner: string;
  ownerId: string;
  photos: string[];
  status: string;
};

function BrowseInner() {
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "All Stuff");
  const [condition, setCondition] = useState("Any");
  const [minPoints, setMinPoints] = useState("");
  const [maxPoints, setMaxPoints] = useState("");
  const [items, setItems] = useState<BrowseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);

    const { data, error } = await supabase
      .from("items")
      .select("id, name, category, condition, points, photos, status, owner_id, profiles(id, name)")
      .in("status", ["Available", "Swapped"])
      .order("created_at", { ascending: false });

    if (error || !data) {
      setLoading(false);
      return;
    }

    const mapped: BrowseItem[] = data.map((item) => {
      const profile = item.profiles as unknown as { id: string; name: string } | null;
      return {
        id: item.id,
        name: item.name,
        category: item.category,
        condition: item.condition,
        points: item.points,
        photos: item.photos ?? [],
        owner: profile?.name ?? "Unknown",
        ownerId: item.owner_id,
        status: item.status,
      };
    });

    setItems(mapped);
    setLoading(false);
  }

  const filtered = items.filter((item) => {
    if (query && !item.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (category !== "All Stuff" && item.category !== category) return false;
    if (condition !== "Any" && item.condition !== condition) return false;
    if (minPoints && item.points < parseInt(minPoints)) return false;
    if (maxPoints && item.points > parseInt(maxPoints)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const aAvail = a.status === "Available" ? 1 : 0;
    const bAvail = b.status === "Available" ? 1 : 0;
    return bAvail - aAvail;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">

      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-[#FAF7F2]/90 backdrop-blur-sm border-b border-[#EDE8DF] px-8 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-[family-name:var(--font-permanent-marker)] text-[#4A3728]">
          Commune
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-5 py-2 rounded-full border-2 border-[#4A3728] text-[#4A3728] font-medium hover:bg-[#4A3728] hover:text-[#F5F0E8] transition-colors text-sm"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2 rounded-full bg-[#4A3728] text-[#F5F0E8] font-medium hover:bg-[#6B5040] transition-colors text-sm"
          >
            Sign Up
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col">

        {/* Search bar */}
        <div className="px-8 pt-8 pb-4">
          <h1 className="text-3xl font-light text-[#4A3728] mb-4 font-[family-name:var(--font-jost)]">Browse</h1>
          <div className="relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="#A09080" strokeWidth="2" strokeLinecap="round" className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search for anything..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-2xl border border-[#D9CFC4] bg-white/60 pl-12 pr-4 py-3.5 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors text-lg"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="px-8 pb-4 flex flex-wrap gap-3 items-center">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-full border border-[#D9CFC4] bg-white/60 px-4 py-2 text-sm text-[#6B5040] focus:outline-none focus:border-[#4A3728] transition-colors appearance-none"
          >
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="rounded-full border border-[#D9CFC4] bg-white/60 px-4 py-2 text-sm text-[#6B5040] focus:outline-none focus:border-[#4A3728] transition-colors appearance-none"
          >
            {conditions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min pts"
              value={minPoints}
              onChange={(e) => setMinPoints(e.target.value)}
              className="w-24 rounded-full border border-[#D9CFC4] bg-white/60 px-4 py-2 text-sm text-[#6B5040] focus:outline-none focus:border-[#4A3728] transition-colors"
            />
            <span className="text-[#A09080] text-sm">–</span>
            <input
              type="number"
              placeholder="Max pts"
              value={maxPoints}
              onChange={(e) => setMaxPoints(e.target.value)}
              className="w-24 rounded-full border border-[#D9CFC4] bg-white/60 px-4 py-2 text-sm text-[#6B5040] focus:outline-none focus:border-[#4A3728] transition-colors"
            />
          </div>

          <span className="text-sm text-[#A09080] ml-auto">{sorted.length} result{sorted.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Results */}
        <div className="flex-1 px-8 pb-8">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="w-6 h-6 border-2 border-[#4A3728] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <p className="text-2xl text-[#8B7355] font-[family-name:var(--font-permanent-marker)] mb-2">No results found</p>
              <p className="text-[#A09080]">Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 portrait-grid-2">
              {sorted.map((item) => (
                <div key={item.id} className="bg-white/60 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">

                  <div className="aspect-square bg-[#EDE8DF] flex items-center justify-center overflow-hidden">
                    {item.photos[0] ? (
                      <img src={item.photos[0]} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#C4B9AA" strokeWidth="1.5" className="w-8 h-8">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="m21 15-5-5L5 21" />
                      </svg>
                    )}
                  </div>

                  <div className="p-3">
                    <p className="font-medium text-[#4A3728] truncate text-sm">{item.name}</p>
                    <p className="text-xs text-[#8B7355]">
                      {item.owner}{" · "}{item.condition}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-semibold text-[#4A3728]">{item.points} pts</span>
                      {item.status === "Swapped" ? (
                        <span className="text-xs px-3 py-1 rounded-full bg-[#EDE8DF] text-[#A09080] border border-[#D9CFC4]">
                          Swapped
                        </span>
                      ) : (
                        <Link
                          href="/signup"
                          className="text-xs px-3 py-1 rounded-full bg-[#F5F0E8] border border-[#D9CFC4] text-[#6B5040] hover:bg-[#4A3728] hover:text-[#F5F0E8] hover:border-[#4A3728] transition-colors"
                        >
                          Sign up to swap
                        </Link>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </main>

    </div>
  );
}

export default function Browse() {
  return (
    <Suspense>
      <BrowseInner />
    </Suspense>
  );
}
