"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import ProposeSwapModal from "@/components/ProposeSwapModal";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type MemberItem = {
  id: string;
  name: string;
  category: string;
  condition: string;
  points: number;
  photos: string[];
};

type MemberData = {
  id: string;
  name: string;
  area: string;
  city: string;
  rating_sum: number;
  rating_count: number;
  created_at: string;
};

const reportReasons = [
  "Misrepresented item condition",
  "Inappropriate behaviour",
  "No-show / didn't complete swap",
  "Fake listing",
  "Harassment",
  "Other",
];

function Stars({ rating }: { rating: number | null }) {
  if (rating === null) return <p className="text-xs text-[#C4B9AA]">No ratings yet</p>;
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

export default function MemberProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { userId } = useUser();

  const [member, setMember] = useState<MemberData | null>(null);
  const [items, setItems] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [proposingItems, setProposingItems] = useState<{ id: string; name: string; points: number; owner: string; ownerId: string }[] | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedForSwap, setSelectedForSwap] = useState<Set<string>>(new Set());
  const [showReport, setShowReport] = useState(false);
  const [reportForm, setReportForm] = useState({ reason: "", details: "" });
  const [reportSubmitted, setReportSubmitted] = useState(false);

  useEffect(() => {
    fetchMember();
  }, [id, userId]);

  async function fetchMember() {
    setLoading(true);

    const [profileRes, itemsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).single(),
      supabase.from("items").select("id, name, category, condition, points, photos")
        .eq("owner_id", id).eq("status", "Available").order("created_at", { ascending: false }),
    ]);

    setMember(profileRes.data ?? null);
    setItems(itemsRes.data ?? []);

    // Fetch liked items
    if (userId) {
      const { data: likesData } = await supabase
        .from("item_likes").select("item_id").eq("user_id", userId);
      setLiked(new Set((likesData ?? []).map((l: { item_id: string }) => l.item_id)));
    }

    setLoading(false);
  }

  async function toggleLike(itemId: string) {
    if (!userId) return;
    if (liked.has(itemId)) {
      setLiked((prev) => { const next = new Set(prev); next.delete(itemId); return next; });
      await supabase.from("item_likes").delete().eq("item_id", itemId).eq("user_id", userId);
    } else {
      setLiked((prev) => new Set(prev).add(itemId));
      await supabase.from("item_likes").insert({ item_id: itemId, user_id: userId });
    }
  }

  function toggleSelectForSwap(itemId: string) {
    setSelectedForSwap((prev) => {
      const next = new Set(prev);
      next.has(itemId) ? next.delete(itemId) : next.add(itemId);
      return next;
    });
  }

  function openBundleSwap() {
    if (!member) return;
    const chosen = items
      .filter((i) => selectedForSwap.has(i.id))
      .map((i) => ({ id: i.id, name: i.name, points: i.points, owner: member.name, ownerId: id }));
    setProposingItems(chosen);
  }

  function handleReportSubmit(e: React.FormEvent) {
    e.preventDefault();
    setReportSubmitted(true);
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

  if (!member) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 px-8 py-8 flex items-center justify-center">
          <p className="text-[#8B7355]">Member not found.</p>
        </main>
      </div>
    );
  }

  const rating = member.rating_count > 0 ? member.rating_sum / member.rating_count : null;
  const joined = new Date(member.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" });

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 px-8 py-8 overflow-y-auto">

        <Link href="/members" className="inline-flex items-center gap-2 text-[#8B7355] hover:text-[#4A3728] transition-colors mb-6 text-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          All Members
        </Link>

        {/* Member header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#EDE8DF] flex items-center justify-center text-2xl font-medium text-[#4A3728] font-[family-name:var(--font-permanent-marker)]">
              {member.name.charAt(0)}
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-light text-[#4A3728] font-[family-name:var(--font-jost)]">{member.name}</h1>
              <Stars rating={rating} />
              <p className="text-xs text-[#A09080]">Member since {joined} · {member.rating_count} rating{member.rating_count !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/messages/${id}`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#4A3728] text-[#F5F0E8] text-sm font-medium hover:bg-[#6B5040] transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Message
            </a>
            <button
              onClick={() => { setShowReport(true); setReportSubmitted(false); setReportForm({ reason: "", details: "" }); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#D9CFC4] text-[#A09080] text-sm font-medium hover:border-[#A0624A] hover:text-[#A0624A] transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
              </svg>
              Report
            </button>
          </div>
        </div>

        {/* Their Stuff */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-[#4A3728]">Their Stuff</h2>
          <button
            onClick={() => { setSelectMode(!selectMode); setSelectedForSwap(new Set()); }}
            className={`text-xs px-4 py-1.5 rounded-full border font-medium transition-colors ${selectMode ? "bg-[#4A3728] text-[#F5F0E8] border-[#4A3728]" : "border-[#D9CFC4] text-[#6B5040] hover:border-[#4A3728]"}`}
          >
            {selectMode ? "Cancel selection" : "Select items"}
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-2xl text-[#8B7355] font-[family-name:var(--font-permanent-marker)] mb-3">Nothing listed yet</p>
            <p className="text-[#A09080]">This member hasn't listed any items yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={selectMode ? () => toggleSelectForSwap(item.id) : undefined}
                className={`bg-white/60 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm transition-shadow relative ${selectMode ? "cursor-pointer hover:shadow-md" : ""} ${selectMode && selectedForSwap.has(item.id) ? "ring-2 ring-[#4A3728]" : ""}`}
              >
                {!selectMode && (
                  <button
                    onClick={() => toggleLike(item.id)}
                    className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill={liked.has(item.id) ? "#A0624A" : "none"} stroke="#A0624A" strokeWidth="2" className="w-4 h-4">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                )}

                {selectMode && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedForSwap.has(item.id) ? "bg-[#4A3728] border-[#4A3728]" : "bg-white/80 border-[#D9CFC4]"}`}>
                      {selectedForSwap.has(item.id) && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" className="w-3 h-3">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </div>
                  </div>
                )}

                {selectMode ? (
                  <div className="aspect-square bg-[#EDE8DF] flex items-center justify-center overflow-hidden">
                    {item.photos[0] ? (
                      <img src={item.photos[0]} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#C4B9AA" strokeWidth="1.5" className="w-8 h-8">
                        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
                      </svg>
                    )}
                  </div>
                ) : (
                  <Link href={`/items/${item.id}`} className="block aspect-square bg-[#EDE8DF] flex items-center justify-center overflow-hidden">
                    {item.photos[0] ? (
                      <img src={item.photos[0]} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#C4B9AA" strokeWidth="1.5" className="w-8 h-8">
                        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
                      </svg>
                    )}
                  </Link>
                )}

                <div className="p-3">
                  {selectMode ? (
                    <p className="font-medium text-[#4A3728] truncate text-sm">{item.name}</p>
                  ) : (
                    <Link href={`/items/${item.id}`} className="block">
                      <p className="font-medium text-[#4A3728] truncate text-sm hover:underline">{item.name}</p>
                    </Link>
                  )}
                  <p className="text-xs text-[#8B7355] mb-2">{item.category} · {item.condition}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#4A3728]">{item.points} pts</span>
                    {!selectMode && (
                      <button
                        onClick={() => setProposingItems([{ id: item.id, name: item.name, points: item.points, owner: member.name, ownerId: id }])}
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

      </main>

      {selectMode && selectedForSwap.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 bg-[#4A3728] text-[#F5F0E8] px-6 py-3.5 rounded-full shadow-lg">
          <p className="text-sm font-medium">
            {selectedForSwap.size} item{selectedForSwap.size !== 1 ? "s" : ""} selected ·{" "}
            {items.filter((i) => selectedForSwap.has(i.id)).reduce((s, i) => s + i.points, 0)} pts
          </p>
          <button
            onClick={openBundleSwap}
            className="text-sm font-semibold bg-[#F5F0E8] text-[#4A3728] px-4 py-1.5 rounded-full hover:bg-white transition-colors"
          >
            Propose Bundle Swap
          </button>
        </div>
      )}

      {proposingItems && userId && (
        <ProposeSwapModal items={proposingItems} proposerId={userId} onClose={() => setProposingItems(null)} />
      )}

      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-[#4A3728]/30 backdrop-blur-sm" onClick={() => setShowReport(false)} />
          <div className="relative w-full max-w-sm bg-[#FAF7F2] rounded-3xl px-7 py-8 shadow-lg">
            <button onClick={() => setShowReport(false)} className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#EDE8DF] flex items-center justify-center text-[#8B7355] hover:bg-[#D9CFC4] transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>

            {reportSubmitted ? (
              <div className="text-center py-4">
                <p className="text-lg font-medium text-[#4A3728] mb-2">Report submitted</p>
                <p className="text-sm text-[#6B5040] leading-relaxed">Thank you. Our team will review this and follow up if needed. Reports are kept confidential.</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-[#4A3728] mb-1">Report {member.name}</h3>
                <p className="text-xs text-[#8B7355] mb-5">Your report will be sent to our team and reviewed confidentially.</p>
                <form onSubmit={handleReportSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-[#6B5040]">Reason</label>
                    <select
                      value={reportForm.reason}
                      onChange={(e) => setReportForm({ ...reportForm, reason: e.target.value })}
                      required
                      className="rounded-xl border border-[#D9CFC4] bg-white px-4 py-3 text-[#4A3728] focus:outline-none focus:border-[#4A3728] transition-colors appearance-none"
                    >
                      <option value="" disabled>Select a reason</option>
                      {reportReasons.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-[#6B5040]">Details <span className="text-[#A09080]">(optional)</span></label>
                    <textarea
                      value={reportForm.details}
                      onChange={(e) => setReportForm({ ...reportForm, details: e.target.value })}
                      placeholder="Describe what happened..."
                      rows={4}
                      className="rounded-xl border border-[#D9CFC4] bg-white px-4 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!reportForm.reason}
                    className="w-full rounded-full bg-[#A0624A] text-white py-3 font-semibold hover:bg-[#8B4A3A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Submit Report
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
