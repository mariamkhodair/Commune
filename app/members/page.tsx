"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { useLang } from "@/lib/languageContext";

type MemberRow = {
  id: string;
  name: string;
  area: string;
  city: string;
  rating_sum: number;
  rating_count: number;
  item_count: number;
  joined: string;
  avatar_url: string | null;
};

function proximityScore(member: MemberRow, myArea: string, myCity: string) {
  if (member.area === myArea && member.city === myCity) return 0;
  if (member.city === myCity) return 1;
  return 2;
}

function proximityLabel(member: MemberRow, myArea: string, myCity: string) {
  if (member.area === myArea && member.city === myCity)
    return { text: "Same area", color: "bg-[#D8E4D0] text-[#4A6640]" };
  if (member.city === myCity)
    return { text: member.area, color: "bg-[#EDE8DF] text-[#6B5040]" };
  return { text: `${member.area}, ${member.city}`, color: "bg-[#F5F0E8] text-[#A09080]" };
}

function Stars({ rating }: { rating: number | null }) {
  if (rating === null) return <p className="text-xs text-[#C4B9AA]">No ratings yet</p>;
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} viewBox="0 0 24 24" className="w-3 h-3" fill={s <= Math.round(rating) ? "#C4842A" : "none"} stroke="#C4842A" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span className="text-xs text-[#8B7355] ml-0.5">{rating.toFixed(1)}</span>
    </div>
  );
}

function MembersInner() {
  const searchParams = useSearchParams();
  const { userId, profile } = useUser();
  const { t } = useLang();
  const [tab, setTab] = useState<"all" | "liked">("all");
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [likedMembers, setLikedMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedLoading, setLikedLoading] = useState(true);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setQuery(q);
  }, [searchParams]);

  useEffect(() => {
    if (!userId) return;
    fetchMembers();
    fetchLikedMembers();
  }, [userId]);

  async function fetchMembers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, area, city, rating_sum, rating_count, created_at, avatar_url")
      .neq("id", userId ?? "00000000-0000-0000-0000-000000000000")
      .order("name");

    if (error || !data) { setLoading(false); return; }

    const { data: itemRows } = await supabase
      .from("items")
      .select("owner_id")
      .in("owner_id", data.map((p) => p.id))
      .eq("status", "Available");

    const countMap = new Map<string, number>();
    for (const row of itemRows ?? []) {
      countMap.set(row.owner_id, (countMap.get(row.owner_id) ?? 0) + 1);
    }

    const enriched: MemberRow[] = data.map((p) => ({
      id: p.id, name: p.name, area: p.area ?? "", city: p.city ?? "",
      rating_sum: p.rating_sum ?? 0, rating_count: p.rating_count ?? 0,
      item_count: countMap.get(p.id) ?? 0,
      joined: new Date(p.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      avatar_url: p.avatar_url ?? null,
    }));

    if (userId) {
      const { data: followData } = await supabase
        .from("member_follows").select("following_id").eq("follower_id", userId);
      setLiked(new Set((followData ?? []).map((f: { following_id: string }) => f.following_id)));
    }

    setMembers(enriched);
    setLoading(false);
  }

  async function fetchLikedMembers() {
    setLikedLoading(true);
    const { data: follows } = await supabase
      .from("member_follows").select("following_id").eq("follower_id", userId)
      .order("created_at", { ascending: false });

    const ids = (follows ?? []).map((f) => f.following_id).filter(Boolean);
    if (!ids.length) { setLikedMembers([]); setLikedLoading(false); return; }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, area, city, rating_sum, rating_count, created_at, avatar_url")
      .in("id", ids);

    const { data: likedItemRows } = await supabase
      .from("items")
      .select("owner_id")
      .in("owner_id", ids)
      .eq("status", "Available");

    const likedCountMap = new Map<string, number>();
    for (const row of likedItemRows ?? []) {
      likedCountMap.set(row.owner_id, (likedCountMap.get(row.owner_id) ?? 0) + 1);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enriched: MemberRow[] = (profiles ?? []).map((p: any) => ({
      id: p.id, name: p.name, area: p.area ?? "", city: p.city ?? "",
      rating_sum: p.rating_sum ?? 0, rating_count: p.rating_count ?? 0,
      item_count: likedCountMap.get(p.id) ?? 0,
      joined: new Date(p.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      avatar_url: p.avatar_url ?? null,
    }));

    setLikedMembers(enriched);
    setLikedLoading(false);
  }

  async function toggleLike(memberId: string) {
    if (!userId) return;
    if (liked.has(memberId)) {
      setLiked((prev) => { const next = new Set(prev); next.delete(memberId); return next; });
      setLikedMembers((prev) => prev.filter((m) => m.id !== memberId));
      await supabase.from("member_follows").delete()
        .eq("follower_id", userId).eq("following_id", memberId);
    } else {
      setLiked((prev) => new Set(prev).add(memberId));
      const member = members.find((m) => m.id === memberId);
      if (member) setLikedMembers((prev) => [member, ...prev]);
      await supabase.from("member_follows").insert({ follower_id: userId, following_id: memberId });
    }
  }

  const myArea = profile?.area ?? "";
  const myCity = profile?.city ?? "";

  const filtered = members
    .filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => proximityScore(a, myArea, myCity) - proximityScore(b, myArea, myCity));

  function MemberCard({ member, isLiked }: { member: MemberRow; isLiked: boolean }) {
    const rating = member.rating_count > 0 ? member.rating_sum / member.rating_count : null;
    const label = proximityLabel(member, myArea, myCity);
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center gap-3 relative">
        <button
          onClick={() => toggleLike(member.id)}
          className="absolute top-3 left-3 w-7 h-7 rounded-full bg-[#FAF7F2] flex items-center justify-center hover:bg-white transition-colors"
        >
          <svg viewBox="0 0 24 24" fill={isLiked ? "#A0624A" : "none"} stroke="#A0624A" strokeWidth="2" className="w-4 h-4">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
        <Link href={`/members/${member.id}`} className="flex flex-col items-center gap-3 w-full">
          <div className="w-14 h-14 rounded-full bg-[#EDE8DF] flex items-center justify-center text-xl font-medium text-[#4A3728] font-[family-name:var(--font-permanent-marker)] overflow-hidden shrink-0">
            {member.avatar_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
              : member.name.charAt(0)}
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="font-medium text-[#4A3728]">{member.name}</p>
            <Stars rating={rating} />
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${label.color}`}>{label.text}</span>
            <p className="text-xs text-[#8B7355]">{t("members.itemsListed", { n: member.item_count, s: member.item_count !== 1 ? "s" : "" })}</p>
            <p className="text-xs text-[#A09080]">{t("members.memberSince", { date: member.joined })}</p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-[#F5F0E8] border border-[#D9CFC4] text-[#6B5040]">
            View Their Stuff
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 px-8 py-8 overflow-y-auto">

        <div className="mb-6">
          <h1 className="text-3xl font-light text-[#4A3728] font-[family-name:var(--font-jost)] mb-1">{t("members.header")}</h1>
          <p className="text-[#8B7355]">{t("likedMembers.emptyHint")}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["all", "liked"] as const).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`px-5 py-2 rounded-full text-sm font-medium border transition-colors ${
                tab === tabKey
                  ? "bg-[#4A3728] text-[#FAF7F2] border-[#4A3728]"
                  : "bg-white text-[#6B5040] border-[#D9CFC4] hover:border-[#4A3728]"
              }`}
            >
              {tabKey === "all" ? t("members.allMembers") : `${t("members.likedMembers")}${liked.size > 0 ? ` (${liked.size})` : ""}`}
            </button>
          ))}
        </div>

        {tab === "all" && (
          <>
            <div className="relative mb-6">
              <svg viewBox="0 0 24 24" fill="none" stroke="#A09080" strokeWidth="2" strokeLinecap="round" className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder={t("members.searchPlaceholder")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-2xl border border-[#D9CFC4] bg-white/60 pl-10 pr-4 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-32">
                <div className="w-6 h-6 border-2 border-[#4A3728] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <p className="text-2xl text-[#8B7355] font-[family-name:var(--font-permanent-marker)] mb-3">{t("common.noResults")}</p>
                <p className="text-[#A09080]">{t("search.noResultsHint")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3 portrait-grid-2">
                {filtered.map((member) => (
                  <MemberCard key={member.id} member={member} isLiked={liked.has(member.id)} />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "liked" && (
          <>
            {likedLoading ? (
              <div className="flex items-center justify-center py-32">
                <div className="w-6 h-6 border-2 border-[#4A3728] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : likedMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <p className="text-2xl text-[#8B7355] font-[family-name:var(--font-permanent-marker)] mb-3">{t("likedMembers.emptyTitle")}</p>
                <p className="text-[#A09080] mb-6">{t("likedMembers.emptyHint")}</p>
                <button
                  onClick={() => setTab("all")}
                  className="px-6 py-3 rounded-full bg-[#4A3728] text-[#F5F0E8] font-medium hover:bg-[#6B5040] transition-colors"
                >
                  Browse Members
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3 portrait-grid-2">
                {likedMembers.map((member) => (
                  <MemberCard key={member.id} member={member} isLiked={true} />
                ))}
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}

export default function Members() {
  return (
    <Suspense>
      <MembersInner />
    </Suspense>
  );
}
