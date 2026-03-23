"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type FollowedMember = {
  id: string;
  name: string;
  area: string;
  city: string;
  item_count: number;
  joined: string;
  rating: number | null;
};

export default function LikedMembers() {
  const { userId } = useUser();
  const [members, setMembers] = useState<FollowedMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchFollowed();
  }, [userId]);

  async function fetchFollowed() {
    setLoading(true);
    const { data } = await supabase
      .from("member_follows")
      .select("following_id, profiles(id, name, area, city, rating_sum, rating_count, created_at)")
      .eq("follower_id", userId)
      .order("created_at", { ascending: false });

    const enriched = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data ?? []).map(async (row: any) => {
        const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        if (!p) return null;

        const { count } = await supabase
          .from("items")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", p.id)
          .eq("status", "Available");

        return {
          id: p.id,
          name: p.name,
          area: p.area ?? "",
          city: p.city ?? "",
          item_count: count ?? 0,
          joined: new Date(p.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          rating: p.rating_count > 0 ? p.rating_sum / p.rating_count : null,
        };
      })
    );

    setMembers(enriched.filter(Boolean) as FollowedMember[]);
    setLoading(false);
  }

  async function unfollow(memberId: string) {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    await supabase.from("member_follows").delete()
      .eq("follower_id", userId).eq("following_id", memberId);
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 px-8 py-8 overflow-y-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-light text-[#4A3728] font-[family-name:var(--font-jost)] mb-1">Liked Members</h1>
          <p className="text-[#8B7355]">Members you've saved — check back to see what they've listed.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-6 h-6 border-2 border-[#4A3728] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-2xl text-[#8B7355] font-[family-name:var(--font-permanent-marker)] mb-3">No liked members yet</p>
            <p className="text-[#A09080] mb-6">Browse members and heart the ones you want to keep track of.</p>
            <Link href="/members" className="px-6 py-3 rounded-full bg-[#4A3728] text-[#F5F0E8] font-medium hover:bg-[#6B5040] transition-colors">
              Browse Members
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {members.map((member) => (
              <div key={member.id} className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center gap-3 relative">

                <button
                  onClick={() => unfollow(member.id)}
                  title="Remove from liked"
                  className="absolute top-3 left-3 w-7 h-7 rounded-full bg-[#FAF7F2] flex items-center justify-center hover:bg-white transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="#A0624A" stroke="#A0624A" strokeWidth="2" className="w-4 h-4">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>

                <Link href={`/members/${member.id}`} className="flex flex-col items-center gap-3 w-full">
                  <div className="w-14 h-14 rounded-full bg-[#EDE8DF] flex items-center justify-center text-xl font-medium text-[#4A3728] font-[family-name:var(--font-permanent-marker)]">
                    {member.name.charAt(0)}
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <p className="font-medium text-[#4A3728]">{member.name}</p>
                    {member.area && <p className="text-xs text-[#8B7355]">{member.area}, {member.city}</p>}
                    <p className="text-xs text-[#8B7355]">{member.item_count} item{member.item_count !== 1 ? "s" : ""} listed</p>
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
