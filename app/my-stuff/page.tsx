"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import type { Item, Profile } from "@/lib/database.types";

const statusStyles: Record<string, string> = {
  Available: "bg-[#D8E4D0] text-[#4A6640]",
  "In a Swap": "bg-[#D4E0E8] text-[#2A5060]",
  Swapped: "bg-[#DDD8C8] text-[#6B5040]",
};

type ItemWithLikes = Item & { likedBy: { id: string; name: string }[] };

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} viewBox="0 0 24 24" className="w-3.5 h-3.5" fill={s <= Math.round(rating) ? "#C4842A" : "none"} stroke="#C4842A" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span className="text-xs text-[#8B7355] ml-0.5">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function MyStuff() {
  const router = useRouter();
  const { userId, profile, loading: userLoading } = useUser();
  const [items, setItems] = useState<ItemWithLikes[]>([]);
  const [loading, setLoading] = useState(true);
  const [likersModal, setLikersModal] = useState<{ itemName: string; likedBy: { id: string; name: string }[] } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetchItems();

    const channel = supabase
      .channel("my-stuff-items")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items", filter: `owner_id=eq.${userId}` },
        () => fetchItems()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "item_likes" },
        () => fetchItems()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  async function fetchItems() {
    setLoading(true);

    // Fetch items owned by current user
    const { data: itemsData, error } = await supabase
      .from("items")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (error || !itemsData) {
      setLoading(false);
      return;
    }

    // Fetch all likes for all items in one query
    const { data: allLikes } = await supabase
      .from("item_likes")
      .select("item_id, user_id, profiles(id, name)")
      .in("item_id", itemsData.map((item) => item.id));

    const likesMap = new Map<string, { id: string; name: string }[]>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const l of allLikes ?? [] as any[]) {
      const entry = {
        id: l.user_id as string,
        name: (Array.isArray(l.profiles) ? l.profiles[0]?.name : l.profiles?.name) ?? "Unknown",
      };
      if (!likesMap.has(l.item_id)) likesMap.set(l.item_id, []);
      likesMap.get(l.item_id)!.push(entry);
    }

    const itemsWithLikes: ItemWithLikes[] = itemsData.map((item) => ({
      ...item,
      likedBy: likesMap.get(item.id) ?? [],
    }));

    setItems(itemsWithLikes);
    setLoading(false);
  }

  async function deleteItem(id: string) {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) { alert("Not logged in."); return; }

    const res = await fetch("/api/delete-item", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itemId: id }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(`Failed to delete item: ${body.error ?? res.status}`);
      setConfirmDelete(null);
      return;
    }

    setItems((prev) => prev.filter((i) => i.id !== id));
    setConfirmDelete(null);
  }

  const rating = profile && profile.rating_count > 0
    ? { score: profile.rating_sum / profile.rating_count, count: profile.rating_count }
    : null;

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 px-8 py-8 overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-light text-[#4A3728] font-[family-name:var(--font-jost)]">My Stuff</h1>
            <p className="text-[#8B7355] mt-1 mb-1">{items.length} item{items.length !== 1 ? "s" : ""} listed</p>
            {rating && <Stars rating={rating.score} />}
            {rating && <span className="text-xs text-[#A09080] ml-1">({rating.count} rating{rating.count !== 1 ? "s" : ""})</span>}
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

        {/* Loading */}
        {(loading || userLoading) && (
          <div className="flex items-center justify-center py-32">
            <div className="w-6 h-6 border-2 border-[#4A3728] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Items grid */}
        {!loading && !userLoading && items.length === 0 && (
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
        )}

        {!loading && !userLoading && items.length > 0 && (
          <div className="grid grid-cols-4 gap-3 portrait-grid-2">
            {items.map((item) => (
              <div key={item.id} className="bg-white/60 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">
                <button
                  onClick={() => router.push(`/my-stuff/${item.id}/edit`)}
                  title="Edit item"
                  className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center text-[#C4B9AA] hover:text-[#4A3728] hover:bg-white transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  onClick={() => setConfirmDelete(item.id)}
                  title="Delete item"
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center text-[#C4B9AA] hover:text-[#A0624A] hover:bg-white transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                  </svg>
                </button>
                {/* Image area */}
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
                {/* Info */}
                <div className="p-3">
                  <p className="font-medium text-[#4A3728] truncate text-sm">{item.name}</p>
                  <p className="text-xs text-[#8B7355] mb-2">{item.category}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#4A3728]">{item.points} pts</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyles[item.status] ?? ""}`}>
                      {item.status}
                    </span>
                  </div>
                  <button
                    onClick={() => setLikersModal({ itemName: item.name, likedBy: item.likedBy })}
                    className="flex items-center gap-1 mt-2 text-xs text-[#A09080] hover:text-[#A0624A] transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill={item.likedBy.length > 0 ? "#A0624A" : "none"} stroke="#A0624A" strokeWidth="2" className="w-3.5 h-3.5">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    {item.likedBy.length === 0 ? "No likes yet" : `${item.likedBy.length} ${item.likedBy.length === 1 ? "like" : "likes"}`}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-[#4A3728]/30 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative w-full max-w-xs bg-[#FAF7F2] rounded-3xl px-7 py-8 shadow-lg text-center">
            <p className="text-base font-semibold text-[#4A3728] mb-2">Delete this item?</p>
            <p className="text-sm text-[#8B7355] mb-6">This can't be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-full border border-[#D9CFC4] text-[#6B5040] text-sm hover:bg-[#EDE8DF] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteItem(confirmDelete)}
                className="flex-1 py-2.5 rounded-full bg-[#A0624A] text-white text-sm hover:bg-[#8B4D38] transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Likers modal */}
      {likersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-[#4A3728]/30 backdrop-blur-sm" onClick={() => setLikersModal(null)} />
          <div className="relative w-full max-w-sm bg-[#FAF7F2] rounded-3xl px-7 py-8 shadow-lg">
            <button
              onClick={() => setLikersModal(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#EDE8DF] flex items-center justify-center text-[#8B7355] hover:bg-[#D9CFC4] transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center gap-2 mb-1">
              <svg viewBox="0 0 24 24" fill="#A0624A" stroke="#A0624A" strokeWidth="2" className="w-4 h-4">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <h3 className="text-base font-semibold text-[#4A3728]">Liked by</h3>
            </div>
            <p className="text-xs text-[#8B7355] mb-5 truncate">{likersModal.itemName}</p>

            {likersModal.likedBy.length === 0 ? (
              <p className="text-sm text-[#A09080] text-center py-4">No one has liked this item yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {likersModal.likedBy.map((member) => (
                  <Link
                    key={member.id}
                    href={`/members/${member.id}`}
                    onClick={() => setLikersModal(null)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/70 border border-[#EDE8DF] hover:border-[#4A3728] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#EDE8DF] flex items-center justify-center text-sm font-medium text-[#4A3728] font-[family-name:var(--font-permanent-marker)] shrink-0">
                      {member.name.charAt(0)}
                    </div>
                    <p className="text-sm font-medium text-[#4A3728]">{member.name}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
