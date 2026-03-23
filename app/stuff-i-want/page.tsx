"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

const categories = [
  "Apparel",
  "Electronics",
  "Books",
  "Cosmetics",
  "Furniture & Home Decor",
  "Stationery & Art Supplies",
  "Miscellaneous",
];

const conditions = ["New", "Like New", "Good", "Fair", "Any"];

type WantedItem = { id: string; name: string; category: string | null; condition: string | null; notes: string | null };

// Placeholder AI matches — will be replaced with real matching logic via Supabase
const placeholderMatches = [
  {
    id: 101,
    member: "Karim A.",
    memberId: "2",
    theirItem: { name: "Mechanical Keyboard (TKL)", category: "Electronics", points: 800, condition: "Good" },
    yourItems: [{ name: "Canon EOS Camera", points: 850 }],
    pointsDiff: 50,
  },
  {
    id: 102,
    member: "Sara M.",
    memberId: "1",
    theirItem: { name: "Vintage Levi's Jacket", category: "Apparel", points: 420, condition: "Good" },
    yourItems: [{ name: "Vintage Denim Jacket", points: 320 }, { name: "The Alchemist", points: 80 }],
    pointsDiff: 20,
  },
];

export default function StuffIWant() {
  const router = useRouter();
  const { userId } = useUser();
  const [wanted, setWanted] = useState<WantedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", condition: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [matching, setMatching] = useState(false);
  const [showMatchResults, setShowMatchResults] = useState(false);
  const [selectedMatches, setSelectedMatches] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!userId) return;
    fetchWanted();
  }, [userId]);

  async function fetchWanted() {
    setLoading(true);
    const { data } = await supabase
      .from("wanted_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setWanted(data ?? []);
    setLoading(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    const { data, error } = await supabase.from("wanted_items").insert({
      user_id: userId,
      name: form.name,
      category: form.category || null,
      notes: form.notes || null,
    }).select().single();
    setSaving(false);
    if (!error && data) {
      setWanted((prev) => [data, ...prev]);
      setShowForm(false);
      setForm({ name: "", category: "", condition: "", notes: "" });
    }
  }

  async function deleteItem(id: string) {
    setWanted((prev) => prev.filter((i) => i.id !== id));
    await supabase.from("wanted_items").delete().eq("id", id).eq("user_id", userId);
  }

  const formComplete = form.name && form.category && form.condition;

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 px-8 py-8 overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-light text-[#4A3728] font-[family-name:var(--font-jost)]">Stuff I Want</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setMatching(true);
                setTimeout(() => { setMatching(false); setShowMatchResults(true); }, 2000);
              }}
              disabled={matching}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#4A3728] text-[#4A3728] font-medium hover:bg-[#4A3728] hover:text-[#F5F0E8] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {matching ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                  </svg>
                  Matching…
                </>
              ) : (
                <><span>🤝🏽</span> Match Me</>
              )}
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#4A3728] text-[#F5F0E8] font-medium hover:bg-[#6B5040] transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Item
            </button>
          </div>
        </div>
        <p className="text-[#8B7355] mb-8">Tell us what you're looking for and we'll match you with someone who has it — and wants what you have.</p>

        {/* Add form */}
        {showForm && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-6 mb-6 border border-[#D9CFC4]">
            <h2 className="text-lg font-medium text-[#4A3728] mb-5">What are you looking for?</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              <div className="flex flex-col gap-1">
                <label className="text-sm text-[#6B5040]">Item Name</label>
                <input
                  name="name"
                  type="text"
                  placeholder="e.g. Vintage Denim Jacket"
                  value={form.name}
                  onChange={handleChange}
                  className="rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] px-4 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-[#6B5040]">Category</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] px-4 py-3 text-[#4A3728] focus:outline-none focus:border-[#4A3728] transition-colors appearance-none"
                  >
                    <option value="" disabled>Select</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-[#6B5040]">Condition</label>
                  <select
                    name="condition"
                    value={form.condition}
                    onChange={handleChange}
                    className="rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] px-4 py-3 text-[#4A3728] focus:outline-none focus:border-[#4A3728] transition-colors appearance-none"
                  >
                    <option value="" disabled>Select</option>
                    {conditions.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-[#6B5040]">Notes <span className="text-[#A09080]">(optional)</span></label>
                <textarea
                  name="notes"
                  placeholder="Any specifics — size, colour, brand, model..."
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  className="rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] px-4 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={!formComplete || saving}
                  className="flex-1 rounded-full bg-[#4A3728] text-[#F5F0E8] py-3 font-semibold hover:bg-[#6B5040] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-full border border-[#D9CFC4] text-[#6B5040] py-3 font-medium hover:border-[#4A3728] transition-colors"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        )}

        {/* Wanted items list */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-6 h-6 border-2 border-[#4A3728] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : wanted.length === 0 && !showForm ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-2xl text-[#8B7355] font-[family-name:var(--font-permanent-marker)] mb-3">Nothing on your list yet</p>
            <p className="text-[#A09080] mb-6">Add the things you're looking for and we'll find your match.</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 rounded-full bg-[#4A3728] text-[#F5F0E8] font-medium hover:bg-[#6B5040] transition-colors"
            >
              Add Item
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {wanted.map((item) => (
              <div key={item.id} className="bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-4 flex items-center justify-between shadow-sm">
                <div>
                  <p className="font-medium text-[#4A3728]">{item.name}</p>
                  <p className="text-sm text-[#8B7355]">
                    {[item.category, item.condition].filter(Boolean).join(" · ")}
                  </p>
                  {item.notes && <p className="text-sm text-[#A09080] mt-1">{item.notes}</p>}
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="text-[#C4B9AA] hover:text-[#A0624A] transition-colors ml-4 shrink-0"
                  title="Delete"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* Match results modal */}
      {showMatchResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-[#4A3728]/30 backdrop-blur-sm" onClick={() => setShowMatchResults(false)} />
          <div className="relative w-full max-w-lg bg-[#FAF7F2] rounded-3xl px-7 py-8 shadow-lg max-h-[90vh] overflow-y-auto">

            <button
              onClick={() => setShowMatchResults(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#EDE8DF] flex items-center justify-center text-[#8B7355] hover:bg-[#D9CFC4] transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🤝🏽</span>
              <h3 className="text-lg font-semibold text-[#4A3728]">Matches Found</h3>
            </div>
            <p className="text-xs text-[#8B7355] mb-6">
              We found {placeholderMatches.length} potential matches based on your want list. Select the ones you'd like to propose.
            </p>

            <div className="flex flex-col gap-4 mb-6">
              {placeholderMatches.map((match) => {
                const isSelected = selectedMatches.has(match.id);
                return (
                  <button
                    key={match.id}
                    onClick={() => setSelectedMatches((prev) => {
                      const next = new Set(prev);
                      next.has(match.id) ? next.delete(match.id) : next.add(match.id);
                      return next;
                    })}
                    className={`w-full text-left bg-white/70 rounded-2xl border-2 overflow-hidden transition-colors ${isSelected ? "border-[#4A3728]" : "border-[#D9CFC4] hover:border-[#A09080]"}`}
                  >
                    <div className="px-5 py-3 border-b border-[#EDE8DF] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#4A3728] flex items-center justify-center text-[#F5F0E8] text-xs font-[family-name:var(--font-permanent-marker)]">
                          {match.member[0]}
                        </div>
                        <Link href={`/members/${match.memberId}`} className="text-sm font-medium text-[#4A3728] hover:underline">{match.member}</Link>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${match.pointsDiff <= 50 ? "bg-[#D8E4D0] text-[#4A6640]" : "bg-[#EDE8DF] text-[#6B5040]"}`}>
                          {match.pointsDiff === 0 ? "Exact match" : `±${match.pointsDiff} pts`}
                        </span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? "border-[#4A3728] bg-[#4A3728]" : "border-[#D9CFC4]"}`}>
                          {isSelected && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" className="w-3 h-3">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="px-5 py-4 flex gap-4">
                      <div className="flex-1">
                        <p className="text-xs text-[#A09080] mb-1">They offer</p>
                        <p className="text-sm font-medium text-[#4A3728]">{match.theirItem.name}</p>
                        <p className="text-xs text-[#8B7355]">{match.theirItem.category} · {match.theirItem.condition}</p>
                        <p className="text-xs font-semibold text-[#4A3728] mt-1">{match.theirItem.points} pts</p>
                      </div>
                      <div className="flex items-center text-[#C4B9AA]">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                          <path d="M8 3L4 7l4 4M16 3l4 4-4 4M4 7h16M4 17h16M8 13l-4 4 4 4M16 13l4 4-4 4" />
                        </svg>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-xs text-[#A09080] mb-1">You offer</p>
                        {match.yourItems.map((yi, i) => (
                          <div key={i}>
                            <p className="text-sm font-medium text-[#4A3728]">{yi.name}</p>
                            <p className="text-xs font-semibold text-[#4A3728]">{yi.points} pts</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => { setShowMatchResults(false); setSelectedMatches(new Set()); router.push("/my-swaps"); }}
              disabled={selectedMatches.size === 0}
              className="w-full rounded-full bg-[#4A3728] text-[#F5F0E8] py-3 font-semibold hover:bg-[#6B5040] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {selectedMatches.size === 0
                ? "Select a match to propose"
                : selectedMatches.size === placeholderMatches.length
                ? "Send All Proposals"
                : `Send ${selectedMatches.size} Proposal${selectedMatches.size > 1 ? "s" : ""}`}
            </button>
            <button
              onClick={() => setShowMatchResults(false)}
              className="w-full mt-2 rounded-full border border-[#D9CFC4] text-[#6B5040] py-3 font-medium hover:border-[#4A3728] transition-colors"
            >
              Review Later
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
