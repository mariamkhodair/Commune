"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import ProposeSwapModal from "@/components/ProposeSwapModal";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type LikedItem = {
  id: string;
  name: string;
  category: string;
  condition: string;
  points: number;
  photos: string[];
  owner: string;
  ownerId: string;
};

export default function LikedStuff() {
  const { userId } = useUser();
  const [items, setItems] = useState<LikedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [proposingItems, setProposingItems] = useState<{ id: string; name: string; points: number; owner: string; ownerId: string }[] | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetchLiked();
  }, [userId]);

  async function fetchLiked() {
    setLoading(true);
    const { data } = await supabase
      .from("item_likes")
      .select("item_id, items(id, name, category, condition, points, photos, owner_id, profiles(id, name))")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped: LikedItem[] = (data ?? []).map((row: any) => {
      const item = row.items;
      const profile = Array.isArray(item?.profiles) ? item.profiles[0] : item?.profiles;
      return {
        id: item?.id,
        name: item?.name,
        category: item?.category,
        condition: item?.condition,
        points: item?.points,
        photos: item?.photos ?? [],
        owner: profile?.name ?? "Unknown",
        ownerId: item?.owner_id,
      };
    }).filter((i: LikedItem) => i.id);

    setItems(mapped);
    setLoading(false);
  }

  async function unlike(itemId: string) {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    await supabase.from("item_likes").delete().eq("item_id", itemId).eq("user_id", userId);
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 px-8 py-8 overflow-y-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-light text-[#4A3728] font-[family-name:var(--font-jost)]">Liked Stuff</h1>
          <p className="text-[#8B7355] mt-1">Items you've saved — propose a swap when you're ready.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-6 h-6 border-2 border-[#4A3728] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-2xl text-[#8B7355] font-[family-name:var(--font-permanent-marker)] mb-3">Nothing liked yet</p>
            <p className="text-[#A09080]">Browse the search page and heart items you're interested in.</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {items.map((item) => (
              <div key={item.id} className="bg-white/60 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">

                <button
                  onClick={() => unlike(item.id)}
                  title="Remove from liked"
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center text-[#A0624A] hover:bg-white transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>

                <Link href={`/items/${item.id}`} className="block aspect-square bg-[#EDE8DF] flex items-center justify-center overflow-hidden">
                  {item.photos[0] ? (
                    <img src={item.photos[0]} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="#C4B9AA" strokeWidth="1.5" className="w-8 h-8">
                      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
                    </svg>
                  )}
                </Link>

                <div className="p-3">
                  <Link href={`/items/${item.id}`} className="block">
                    <p className="font-medium text-[#4A3728] truncate text-sm hover:underline">{item.name}</p>
                  </Link>
                  <p className="text-xs text-[#8B7355]">
                    <Link href={`/members/${item.ownerId}`} className="hover:underline">{item.owner}</Link>
                    {" · "}{item.condition}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-semibold text-[#4A3728]">{item.points} pts</span>
                    <button
                      onClick={() => setProposingItems([{ id: item.id, name: item.name, points: item.points, owner: item.owner, ownerId: item.ownerId }])}
                      className="text-xs px-3 py-1 rounded-full bg-[#F5F0E8] border border-[#D9CFC4] text-[#6B5040] hover:bg-[#4A3728] hover:text-[#F5F0E8] hover:border-[#4A3728] transition-colors"
                    >
                      Propose swap
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </main>

      {proposingItems && (
        <ProposeSwapModal items={proposingItems} proposerId={userId ?? ""} onClose={() => setProposingItems(null)} />
      )}
    </div>
  );
}
