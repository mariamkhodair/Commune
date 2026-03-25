"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import ProposeSwapModal from "@/components/ProposeSwapModal";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

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

type SearchItem = {
  id: string;
  name: string;
  category: string;
  condition: string;
  points: number;
  owner: string;
  ownerId: string;
  photos: string[];
  match: boolean;
  status: string;
};

function SearchInner() {
  const searchParams = useSearchParams();
  const { userId } = useUser();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "All Stuff");
  const [condition, setCondition] = useState("Any");
  const [minPoints, setMinPoints] = useState("");
  const [maxPoints, setMaxPoints] = useState("");
  const [matchOnly, setMatchOnly] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [proposingItems, setProposingItems] = useState<{ id: string; name: string; points: number; owner: string; ownerId: string }[] | null>(null);

  const [items, setItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync URL params
  useEffect(() => {
    const q = searchParams.get("q");
    const cat = searchParams.get("category");
    if (q) setQuery(q);
    if (cat) setCategory(cat);
  }, [searchParams]);

  // Fetch items + liked status
  useEffect(() => {
    fetchItems();
  }, [userId]);

  async function fetchItems() {
    setLoading(true);

    // Fetch all available items with owner profile
    const { data, error } = await supabase
      .from("items")
      .select("id, name, category, condition, points, photos, status, owner_id, profiles(id, name)")
      .in("status", ["Available", "Swapped"])
      .neq("owner_id", userId ?? "00000000-0000-0000-0000-000000000000")
      .order("created_at", { ascending: false });

    if (error || !data) {
      setLoading(false);
      return;
    }

    // Fetch current user's liked items
    let likedSet = new Set<string>();
    if (userId) {
      const { data: likesData } = await supabase
        .from("item_likes")
        .select("item_id")
        .eq("user_id", userId);
      likedSet = new Set((likesData ?? []).map((l: { item_id: string }) => l.item_id));
    }
    setLiked(likedSet);

    // Fetch wanted items of the current user (for match detection)
    let myWanted: string[] = [];
    if (userId) {
      const { data: wantedData } = await supabase
        .from("wanted_items")
        .select("name, category")
        .eq("user_id", userId);
      myWanted = (wantedData ?? []).map((w: { name: string }) => w.name.toLowerCase());
    }

    const mapped: SearchItem[] = data.map((item) => {
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
        match: myWanted.some((w) => item.name.toLowerCase().includes(w) || w.includes(item.name.toLowerCase())),
        status: item.status,
      };
    });

    setItems(mapped);
    setLoading(false);
  }

  async function toggleLike(id: string) {
    if (!userId) return;
    if (liked.has(id)) {
      setLiked((prev) => { const next = new Set(prev); next.delete(id); return next; });
      await supabase.from("item_likes").delete().eq("item_id", id).eq("user_id", userId);
    } else {
      setLiked((prev) => new Set(prev).add(id));
      await supabase.from("item_likes").insert({ item_id: id, user_id: userId });
    }
  }

  const filtered = items.filter((item) => {
    if (query && !item.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (category !== "All Stuff" && item.category !== category) return false;
    if (condition !== "Any" && item.condition !== condition) return false;
    if (minPoints && item.points < parseInt(minPoints)) return false;
    if (maxPoints && item.points > parseInt(maxPoints)) return false;
    if (matchOnly && (!item.match || item.status === "Swapped")) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => (b.match ? 1 : 0) - (a.match ? 1 : 0));

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Search bar */}
        <div className="px-8 pt-8 pb-4">
          <h1 className="text-3xl font-light text-[#4A3728] mb-4 font-[family-name:var(--font-jost)]">Search</h1>
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

          <button
            onClick={() => setMatchOnly(!matchOnly)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border transition-colors ${matchOnly ? "bg-[#4A3728] text-[#F5F0E8] border-[#4A3728]" : "border-[#D9CFC4] text-[#6B5040] bg-white/60 hover:border-[#4A3728]"}`}
          >
            <svg viewBox="0 0 24 24" fill={matchOnly ? "#F5F0E8" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            Matches only
          </button>

          <span className="text-sm text-[#A09080] ml-auto">{sorted.length} result{sorted.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">
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
            <div className="grid grid-cols-4 gap-3">
              {sorted.map((item) => (
                <div key={item.id} className="bg-white/60 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">

                  {item.match && (
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-[#4A3728] text-[#F5F0E8] text-xs font-medium px-2.5 py-1 rounded-full">
                      <span>🤝🏽</span> Match
                    </div>
                  )}

                  <button
                    onClick={() => toggleLike(item.id)}
                    className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill={liked.has(item.id) ? "#A0624A" : "none"} stroke="#A0624A" strokeWidth="2" className="w-4 h-4">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>

                  <Link href={`/items/${item.id}`} className="block aspect-square bg-[#EDE8DF] flex items-center justify-center overflow-hidden">
                    {item.photos[0] ? (
                      <img src={item.photos[0]} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#C4B9AA" strokeWidth="1.5" className="w-8 h-8">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="m21 15-5-5L5 21" />
                      </svg>
                    )}
                  </Link>

                  <div className="p-3">
                    <Link href={`/items/${item.id}`} className="block">
                      <p className="font-medium text-[#4A3728] truncate text-sm hover:underline">{item.name}</p>
                    </Link>
                    <p className="text-xs text-[#8B7355]">
                      <Link href={`/members/${item.ownerId}`} onClick={(e) => e.stopPropagation()} className="hover:underline">{item.owner}</Link>
                      {" · "}{item.condition}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-semibold text-[#4A3728]">{item.points} pts</span>
                      {item.status === "Swapped" ? (
                        <span className="text-xs px-3 py-1 rounded-full bg-[#EDE8DF] text-[#A09080] border border-[#D9CFC4]">
                          Swapped
                        </span>
                      ) : (
                        <button
                          onClick={() => setProposingItems([{ id: item.id, name: item.name, points: item.points, owner: item.owner, ownerId: item.ownerId }])}
                          className="text-xs px-3 py-1 rounded-full bg-[#F5F0E8] border border-[#D9CFC4] text-[#6B5040] hover:bg-[#4A3728] hover:text-[#F5F0E8] hover:border-[#4A3728] transition-colors"
                        >
                          Propose swap
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {proposingItems && (
        <ProposeSwapModal items={proposingItems} proposerId={userId ?? ""} onClose={() => setProposingItems(null)} />
      )}

    </div>
  );
}

export default function Search() {
  return (
    <Suspense>
      <SearchInner />
    </Suspense>
  );
}
