"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ProposeSwapModal from "@/components/ProposeSwapModal";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type ItemData = {
  id: string;
  name: string;
  category: string;
  condition: string;
  points: number;
  description: string;
  photos: string[];
  owner_id: string;
  ownerName: string;
  status: string;
  moreItems: { id: string; name: string; points: number; condition: string; photos: string[] }[];
};

export default function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { userId } = useUser();
  const [item, setItem] = useState<ItemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [proposing, setProposing] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(0);

  useEffect(() => {
    fetchItem();
  }, [id]);

  async function fetchItem() {
    setLoading(true);

    const { data, error } = await supabase
      .from("items")
      .select("id, name, category, condition, points, description, photos, status, owner_id, profiles(id, name)")
      .eq("id", id)
      .single();

    if (error || !data) {
      setLoading(false);
      return;
    }

    const profile = data.profiles as unknown as { id: string; name: string } | null;

    // Fetch more items from same owner
    const { data: moreData } = await supabase
      .from("items")
      .select("id, name, points, condition, photos")
      .eq("owner_id", data.owner_id)
      .eq("status", "Available")
      .neq("id", id)
      .limit(4);

    setItem({
      id: data.id,
      name: data.name,
      category: data.category,
      condition: data.condition,
      points: data.points,
      description: data.description,
      photos: data.photos ?? [],
      status: data.status ?? "Available",
      owner_id: data.owner_id,
      ownerName: profile?.name ?? "Unknown",
      moreItems: (moreData ?? []).map((m) => ({
        id: m.id,
        name: m.name,
        points: m.points,
        condition: m.condition,
        photos: m.photos ?? [],
      })),
    });
    setCurrentPhoto(0);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#4A3728] border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

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

        <div className="flex items-center gap-4 px-8 py-5 border-b border-[#D9CFC4] bg-white/60 backdrop-blur-sm sticky top-0 z-10">
          <button onClick={() => window.history.back()} className="text-[#8B7355] hover:text-[#4A3728] transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <h1 className="text-xl font-light text-[#4A3728] font-[family-name:var(--font-jost)] truncate">{item.name}</h1>
        </div>

        <div className="max-w-xl mx-auto px-6 py-8 flex flex-col gap-6">

          {/* Photos */}
          <div className="flex flex-col gap-2">
            <div className="w-full aspect-square rounded-2xl bg-[#EDE8DF] flex items-center justify-center overflow-hidden">
              {item.photos[currentPhoto] ? (
                <img src={item.photos[currentPhoto]} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="#C4B9AA" strokeWidth="1.5" className="w-16 h-16">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
                </svg>
              )}
            </div>
            {item.photos.length > 1 && (
              <div className="flex gap-2">
                {item.photos.map((photo, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPhoto(i)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-colors ${currentPhoto === i ? "border-[#4A3728]" : "border-transparent"}`}
                  >
                    <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
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
                <Link href={`/members/${item.owner_id}`} className="text-sm font-semibold text-[#4A3728] hover:underline">
                  {item.ownerName}
                </Link>
                <p className="text-xs text-[#A09080]">View their full listings</p>
              </div>
            </div>
            <Link
              href={`/messages/${item.owner_id}`}
              className="w-10 h-10 rounded-full border border-[#D9CFC4] flex items-center justify-center text-[#6B5040] hover:border-[#4A3728] hover:text-[#4A3728] transition-colors"
              title="Message"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </Link>
          </div>

          {/* Owner actions */}
          {userId && item.owner_id === userId && (
            <button
              onClick={() => router.push(`/my-stuff/${item.id}/edit`)}
              className="w-full rounded-full border border-[#4A3728] text-[#4A3728] py-3.5 font-semibold hover:bg-[#4A3728] hover:text-[#F5F0E8] transition-colors flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Item
            </button>
          )}

          {/* Propose Swap CTA */}
          {userId && item.owner_id !== userId && (
            item.status === "Swapped" ? (
              <div className="w-full rounded-full bg-[#EDE8DF] text-[#A09080] py-3.5 font-semibold flex items-center justify-center gap-2 text-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M7 16V4m0 0L3 8m4-4 4 4" /><path d="M17 8v12m0 0 4-4m-4 4-4-4" />
                </svg>
                Already Swapped
              </div>
            ) : (
              <button
                onClick={() => setProposing(true)}
                className="w-full rounded-full bg-[#4A3728] text-[#F5F0E8] py-3.5 font-semibold hover:bg-[#6B5040] transition-colors flex items-center justify-center gap-2"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M7 16V4m0 0L3 8m4-4 4 4" /><path d="M17 8v12m0 0 4-4m-4 4-4-4" />
                </svg>
                Propose Swap
              </button>
            )
          )}

          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-[#4A3728] mb-2">Description</h3>
            <p className="text-sm text-[#6B5040] leading-relaxed">{item.description}</p>
          </div>

          {/* More from this member */}
          {item.moreItems.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-[#4A3728]">
                  More from <Link href={`/members/${item.owner_id}`} className="hover:underline">{item.ownerName}</Link>
                </h3>
                <Link href={`/members/${item.owner_id}`} className="text-xs text-[#8B7355] hover:underline">See all</Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {item.moreItems.map((m) => (
                  <Link
                    key={m.id}
                    href={`/items/${m.id}`}
                    className="bg-white/60 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-square bg-[#EDE8DF] flex items-center justify-center overflow-hidden">
                      {m.photos[0] ? (
                        <img src={m.photos[0]} alt={m.name} className="w-full h-full object-cover" />
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#C4B9AA" strokeWidth="1.5" className="w-7 h-7">
                          <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
                        </svg>
                      )}
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

      {proposing && userId && (
        <ProposeSwapModal
          items={[{ id, name: item.name, points: item.points, owner: item.ownerName, ownerId: item.owner_id }]}
          proposerId={userId}
          onClose={() => setProposing(false)}
        />
      )}
    </div>
  );
}
