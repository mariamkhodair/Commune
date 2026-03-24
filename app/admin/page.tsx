"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type AdminProfile = {
  id: string;
  name: string;
  area: string;
  city: string;
  created_at: string;
  rating_sum: number;
  rating_count: number;
  is_test: boolean;
  is_admin: boolean;
  item_count: number;
};

export default function AdminPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useUser();
  const [members, setMembers] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "test" | "real">("all");
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!profile?.is_admin) { router.replace("/dashboard"); return; }
    fetchMembers();
  }, [profile, authLoading]);

  async function fetchMembers() {
    setLoading(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, area, city, created_at, rating_sum, rating_count, is_test, is_admin")
      .order("created_at", { ascending: false });

    if (!profiles) { setLoading(false); return; }

    // Get item counts per user
    const { data: itemCounts } = await supabase
      .from("items")
      .select("owner_id");

    const countMap: Record<string, number> = {};
    (itemCounts ?? []).forEach((i: { owner_id: string }) => {
      countMap[i.owner_id] = (countMap[i.owner_id] ?? 0) + 1;
    });

    setMembers(profiles.map((p) => ({ ...p, item_count: countMap[p.id] ?? 0 })));
    setLoading(false);
  }

  async function toggleTest(memberId: string, current: boolean) {
    setToggling(memberId);
    await supabase.from("profiles").update({ is_test: !current }).eq("id", memberId);
    setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, is_test: !current } : m));
    setToggling(null);
  }

  const testCount = members.filter((m) => m.is_test).length;
  const realCount = members.filter((m) => !m.is_test).length;

  const filtered = members.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || (filter === "test" ? m.is_test : !m.is_test);
    return matchesSearch && matchesFilter;
  });

  if (authLoading) return null;
  if (!profile?.is_admin) return null;

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 px-8 py-8 overflow-y-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-light text-[#4A3728] mb-1">Admin</h1>
          <p className="text-[#8B7355] text-sm">Manage members and flag test accounts.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-5 border border-[#D9CFC4]">
            <p className="text-xs text-[#A09080] mb-1">Total members</p>
            <p className="text-2xl font-semibold text-[#4A3728]">{members.length}</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-5 border border-[#D9CFC4]">
            <p className="text-xs text-[#A09080] mb-1">Real members</p>
            <p className="text-2xl font-semibold text-[#4A6640]">{realCount}</p>
          </div>
          <div className="bg-[#ECD8D4]/60 backdrop-blur-sm rounded-2xl px-6 py-5 border border-[#D9BFB9]">
            <p className="text-xs text-[#A09080] mb-1">Test accounts</p>
            <p className="text-2xl font-semibold text-[#A0624A]">{testCount}</p>
          </div>
        </div>

        {/* Safe delete reminder */}
        {testCount > 0 && (
          <div className="bg-[#FFF3DC] border border-[#F0D090] rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="#C4842A" strokeWidth="2" strokeLinecap="round" className="w-4 h-4 shrink-0 mt-0.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>
            </svg>
            <div>
              <p className="text-sm font-medium text-[#8B6020] mb-1">
                {testCount} test account{testCount !== 1 ? "s" : ""} flagged
              </p>
              <p className="text-xs text-[#8B6020] leading-relaxed">
                To delete them: go to Supabase → Authentication → Users, find the test accounts by name and delete them one by one. Only delete accounts marked TEST below.
              </p>
              <details className="mt-2">
                <summary className="text-xs text-[#8B6020] font-medium cursor-pointer hover:opacity-70">Show safe-delete SQL</summary>
                <pre className="mt-2 text-xs bg-[#FAF7F2] rounded-lg p-3 text-[#6B5040] overflow-x-auto border border-[#E0D5C0]">{`DELETE FROM profiles\nWHERE is_test = true;`}</pre>
              </details>
            </div>
          </div>
        )}

        {/* Search + filter */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <svg viewBox="0 0 24 24" fill="none" stroke="#A09080" strokeWidth="2" strokeLinecap="round" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#D9CFC4] bg-white text-sm text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728]"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "real", "test"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-xs font-medium border transition-colors capitalize ${filter === f ? "bg-[#4A3728] text-[#F5F0E8] border-[#4A3728]" : "bg-white border-[#D9CFC4] text-[#6B5040] hover:border-[#4A3728]"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Members table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[#4A3728] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-[#A09080] text-sm py-12 text-center">No members found.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((member) => {
              const rating = member.rating_count > 0
                ? (member.rating_sum / member.rating_count).toFixed(1)
                : null;
              const joined = new Date(member.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

              return (
                <div
                  key={member.id}
                  className={`flex items-center justify-between bg-white/60 backdrop-blur-sm rounded-2xl px-5 py-4 border transition-colors ${member.is_test ? "border-[#D9BFB9] bg-[#FDF5F3]/60" : "border-[#EDE8DF]"}`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${member.is_test ? "bg-[#ECD8D4] text-[#A0624A]" : "bg-[#EDE8DF] text-[#4A3728]"}`}>
                      {member.name.charAt(0)}
                    </div>

                    {/* Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link href={`/members/${member.id}`} className="text-sm font-medium text-[#4A3728] hover:underline truncate">
                          {member.name}
                        </Link>
                        {member.is_test && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#A0624A] text-white shrink-0">TEST</span>
                        )}
                        {member.is_admin && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#4A3728] text-[#FAF7F2] shrink-0">ADMIN</span>
                        )}
                      </div>
                      <p className="text-xs text-[#A09080]">
                        {member.area ? `${member.area}, ${member.city} · ` : ""}{joined}
                        {rating ? ` · ★ ${rating}` : ""}
                        {` · ${member.item_count} item${member.item_count !== 1 ? "s" : ""}`}
                      </p>
                    </div>
                  </div>

                  {/* Toggle test button */}
                  {!member.is_admin && (
                    <button
                      onClick={() => toggleTest(member.id, member.is_test)}
                      disabled={toggling === member.id}
                      className={`ml-4 shrink-0 text-xs px-4 py-1.5 rounded-full border font-medium transition-colors disabled:opacity-50 ${
                        member.is_test
                          ? "bg-[#A0624A] text-white border-[#A0624A] hover:bg-[#8B4A3A]"
                          : "bg-white text-[#A0624A] border-[#D9CFC4] hover:border-[#A0624A]"
                      }`}
                    >
                      {toggling === member.id ? "…" : member.is_test ? "Unmark test" : "Mark as test"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}
