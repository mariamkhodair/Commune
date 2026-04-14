"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type ItemSnap = { id: string; name: string; points: number; photos: string[] | null; category: string | null };
type ProfileSnap = { id: string; name: string; avatar_url: string | null };

type CommuneMatch = {
  memberAId: string; memberBId: string; memberCId: string;
  itemA: ItemSnap; itemB: ItemSnap; itemC: ItemSnap;
  profileA: ProfileSnap; profileB: ProfileSnap; profileC: ProfileSnap;
};

type Commune = {
  id: string; status: string; created_at: string; proposed_by: string;
  member_a_id: string; member_b_id: string; member_c_id: string;
  item_a_id: string; item_b_id: string; item_c_id: string;
  itemA: ItemSnap; itemB: ItemSnap; itemC: ItemSnap;
  profileA: ProfileSnap; profileB: ProfileSnap; profileC: ProfileSnap;
  acceptances: string[];
};

async function getToken() {
  const { data: { session: refreshed } } = await supabase.auth.refreshSession();
  if (refreshed?.access_token) return refreshed.access_token;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? "";
}

function Avatar({ profile, size = 28 }: { profile: ProfileSnap | null; size?: number }) {
  if (!profile) return null;
  return (
    <div style={{ width: size, height: size }} className="rounded-full bg-[#EDE8DF] flex items-center justify-center overflow-hidden shrink-0 text-xs font-semibold text-[#4A3728]">
      {profile.avatar_url
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
        : profile.name.charAt(0)}
    </div>
  );
}

function ItemThumb({ item }: { item: ItemSnap | null }) {
  if (!item) return null;
  const photo = item.photos?.[0];
  return (
    <div className="w-10 h-10 rounded-lg bg-[#EDE8DF] overflow-hidden shrink-0 flex items-center justify-center">
      {photo
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={photo} alt="" className="w-full h-full object-cover" />
        : <span className="text-[10px] text-[#8B7355] text-center px-1 leading-tight">{item.name}</span>}
    </div>
  );
}

function ptsLabel(a: number, b: number, c: number) {
  const diff = Math.max(a, b, c) - Math.min(a, b, c);
  return diff === 0 ? "Perfectly balanced" : `±${diff} pts spread`;
}

function MatchCard({ match, userId, onPropose }: { match: CommuneMatch; userId: string; onPropose: (m: CommuneMatch) => void }) {
  const isA = match.memberAId === userId;
  // A gives itemA to C, B gives itemB to A, C gives itemC to B
  const rows = [
    { giver: match.profileA, item: match.itemA, receiver: match.profileC, isMe: isA },
    { giver: match.profileB, item: match.itemB, receiver: match.profileA, isMe: match.memberBId === userId },
    { giver: match.profileC, item: match.itemC, receiver: match.profileB, isMe: match.memberCId === userId },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#EDE8DF] overflow-hidden shadow-sm">
      <div className="bg-[#4A3728] px-5 py-3 flex items-center gap-2">
        <span className="text-[#FAF7F2] text-sm font-semibold">Commune Match</span>
        <span className="ml-auto text-xs text-[#C4B9AA]">{ptsLabel(match.itemA.points, match.itemB.points, match.itemC.points)}</span>
      </div>
      <div className="px-5 py-4 flex flex-col gap-3">
        {rows.map(({ giver, item, receiver, isMe }, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-[#4A3728]">
            <Avatar profile={giver} size={24} />
            <span className={isMe ? "font-semibold" : ""}>{isMe ? "You" : giver?.name}</span>
            <span className="text-[#A09080]">give</span>
            <ItemThumb item={item} />
            <span className="font-medium truncate max-w-[80px]">{item.name}</span>
            <span className="text-[#A09080] shrink-0">({item.points} pts) →</span>
            <Avatar profile={receiver} size={24} />
            <span className={receiver?.id === userId ? "font-semibold" : ""}>{receiver?.id === userId ? "You" : receiver?.name}</span>
          </div>
        ))}
        <button
          onClick={() => onPropose(match)}
          className="mt-1 w-full py-2.5 rounded-full bg-[#4A3728] text-[#FAF7F2] text-sm font-semibold hover:bg-[#6B5040] transition-colors"
        >
          Propose Commune
        </button>
      </div>
    </div>
  );
}

function CommuneCard({ commune, userId, onAction }: { commune: Commune; userId: string; onAction: () => void }) {
  const [acting, setActing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const members = [commune.member_a_id, commune.member_b_id, commune.member_c_id];
  const profiles = { [commune.member_a_id]: commune.profileA, [commune.member_b_id]: commune.profileB, [commune.member_c_id]: commune.profileC };
  const items = { [commune.member_a_id]: commune.itemA, [commune.member_b_id]: commune.itemB, [commune.member_c_id]: commune.itemC };
  // receiver: A→C, B→A, C→B
  const receivers = { [commune.member_a_id]: commune.member_c_id, [commune.member_b_id]: commune.member_a_id, [commune.member_c_id]: commune.member_b_id };

  const myAccepted = commune.acceptances.includes(userId);
  const isPending = commune.status === "Proposed" && !myAccepted;

  async function act(action: "accept" | "decline") {
    setActing(true); setErr(null);
    try {
      const token = await getToken();
      const res = await fetch(`/api/communes/${commune.id}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `Failed to ${action}`);
      }
      onAction();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setActing(false);
    }
  }

  const statusColors: Record<string, string> = {
    "Proposed": "bg-amber-50 text-amber-700 border-amber-200",
    "In Progress": "bg-[#D8E4D0] text-[#2D5030] border-[#B8D4A8]",
    "Declined": "bg-red-50 text-red-600 border-red-200",
  };

  return (
    <div className="bg-white rounded-2xl border border-[#EDE8DF] overflow-hidden shadow-sm">
      <div className="px-5 py-3 border-b border-[#EDE8DF] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#4A3728]">Commune</span>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColors[commune.status] ?? "bg-[#F5F0E8] text-[#8B7355] border-[#EDE8DF]"}`}>
          {commune.status === "Proposed"
            ? `${commune.acceptances.length}/3 accepted`
            : commune.status}
        </span>
      </div>

      <div className="px-5 py-4 flex flex-col gap-2.5">
        {members.map(memberId => {
          const profile = profiles[memberId];
          const item = items[memberId];
          const receiverId = receivers[memberId];
          const receiver = profiles[receiverId];
          const isMe = memberId === userId;
          return (
            <div key={memberId} className="flex items-center gap-2 text-xs text-[#4A3728]">
              <Avatar profile={profile} size={24} />
              <Link href={`/members/${memberId}`} className={`hover:underline shrink-0 ${isMe ? "font-semibold" : ""}`}>
                {isMe ? "You" : profile?.name}
              </Link>
              <span className="text-[#A09080]">give</span>
              <ItemThumb item={item} />
              <span className="font-medium truncate max-w-[80px]">{item?.name}</span>
              <span className="text-[#A09080] shrink-0">→</span>
              <Avatar profile={receiver} size={24} />
              <span className={receiver?.id === userId ? "font-semibold shrink-0" : "shrink-0"}>{receiver?.id === userId ? "You" : receiver?.name}</span>
            </div>
          );
        })}

        {err && <p className="text-xs text-red-500 mt-1">{err}</p>}

        {isPending && (
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => act("decline")}
              disabled={acting}
              className="flex-1 py-2 rounded-full border border-[#D9CFC4] text-[#6B5040] text-sm hover:bg-[#EDE8DF] transition-colors disabled:opacity-50"
            >
              Decline
            </button>
            <button
              onClick={() => act("accept")}
              disabled={acting}
              className="flex-1 py-2 rounded-full bg-[#4A3728] text-[#FAF7F2] text-sm font-semibold hover:bg-[#6B5040] transition-colors disabled:opacity-50"
            >
              {acting ? "..." : "Accept"}
            </button>
          </div>
        )}

        {commune.status === "Proposed" && myAccepted && (
          <div className="flex items-center gap-1.5 text-xs text-[#2D6A4F] mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] animate-pulse" />
            You accepted — waiting for the others
          </div>
        )}

        {commune.status === "In Progress" && (
          <div className="flex flex-col gap-1 mt-1">
            <p className="text-xs font-medium text-[#2D5030]">Commune is active — coordinate your exchange with the other members.</p>
            <button
              onClick={() => act("decline")}
              disabled={acting}
              className="self-start text-xs text-[#A09080] hover:text-[#8B3A2A] underline transition-colors"
            >
              Cancel commune
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommunesPage() {
  const { userId } = useUser();
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [loading, setLoading] = useState(true);
  const [findLoading, setFindLoading] = useState(false);
  const [findResults, setFindResults] = useState<CommuneMatch[] | null>(null);
  const [proposing, setProposing] = useState<string | null>(null); // commune match key being proposed

  const fetchCommunes = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/communes", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCommunes((await res.json()).communes ?? []);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchCommunes(); }, [fetchCommunes]);

  async function findCommune() {
    setFindLoading(true);
    setFindResults(null);
    try {
      const token = await getToken();
      const res = await fetch("/api/communes/find", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setFindResults((await res.json()).matches ?? []);
    } finally {
      setFindLoading(false);
    }
  }

  async function propose(match: CommuneMatch) {
    const key = [match.itemA.id, match.itemB.id, match.itemC.id].join(",");
    setProposing(key);
    try {
      const token = await getToken();
      const res = await fetch("/api/communes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          memberBId: match.memberBId,
          memberCId: match.memberCId,
          itemAId: match.itemA.id,
          itemBId: match.itemB.id,
          itemCId: match.itemC.id,
        }),
      });
      if (res.ok) {
        setFindResults(null);
        fetchCommunes();
      }
    } finally {
      setProposing(null);
    }
  }

  const proposed = communes.filter(c => c.status === "Proposed");
  const active = communes.filter(c => c.status === "In Progress");
  const past = communes.filter(c => c.status === "Declined" || c.status === "Completed");

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 px-8 py-8 overflow-y-auto">

        <div className="flex items-start justify-between mb-6 max-w-2xl">
          <div>
            <h1 className="text-3xl font-light text-[#4A3728] mb-1 font-[family-name:var(--font-jost)]">Communes</h1>
            <p className="text-[#8B7355]">Three-way swaps.</p>
          </div>
          <button
            onClick={findCommune}
            disabled={findLoading}
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#4A3728] text-[#FAF7F2] text-sm font-semibold hover:bg-[#6B5040] transition-colors disabled:opacity-60"
          >
            {findLoading
              ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Finding…</>
              : <>Find Commune</>}
          </button>
        </div>

        {/* Find results */}
        {findResults !== null && (
          <div className="mb-8 max-w-2xl">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-[#4A3728]">
                {findResults.length === 0 ? "No communes found right now" : `${findResults.length} commune match${findResults.length !== 1 ? "es" : ""} found`}
              </p>
              <button onClick={() => setFindResults(null)} className="text-xs text-[#A09080] hover:text-[#4A3728] underline">
                Close
              </button>
            </div>
            {findResults.length === 0 ? (
              <div className="bg-[#F5F0E8] rounded-2xl px-6 py-8 text-center">
                <p className="text-[#8B7355] text-sm">No triangle matches found yet. Try adding more items to your &quot;Stuff I Want&quot; list or listing more items.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {findResults.map(match => {
                  const key = [match.itemA.id, match.itemB.id, match.itemC.id].join(",");
                  return (
                    <div key={key} className={proposing === key ? "opacity-50 pointer-events-none" : ""}>
                      <MatchCard match={match} userId={userId ?? ""} onPropose={propose} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[#4A3728] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : communes.length === 0 && findResults === null ? (
          <div className="flex flex-col items-center justify-center py-28 text-center max-w-sm mx-auto">
            <p className="text-xl text-[#8B7355] font-[family-name:var(--font-permanent-marker)] mb-2">No communes yet</p>
            <p className="text-[#A09080] text-sm leading-relaxed mb-6">
              A commune is a three-way swap — three members each giving one item to form a perfect circle. Tap &quot;Find Commune&quot; to discover matches.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8 max-w-2xl">
            {proposed.length > 0 && (
              <section>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#A09080] mb-3">Pending Acceptance</p>
                <div className="flex flex-col gap-3">
                  {proposed.map(c => <CommuneCard key={c.id} commune={c} userId={userId ?? ""} onAction={fetchCommunes} />)}
                </div>
              </section>
            )}
            {active.length > 0 && (
              <section>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#A09080] mb-3">In Progress</p>
                <div className="flex flex-col gap-3">
                  {active.map(c => <CommuneCard key={c.id} commune={c} userId={userId ?? ""} onAction={fetchCommunes} />)}
                </div>
              </section>
            )}
            {past.length > 0 && (
              <section>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#A09080] mb-3">Past</p>
                <div className="flex flex-col gap-3">
                  {past.map(c => <CommuneCard key={c.id} commune={c} userId={userId ?? ""} onAction={fetchCommunes} />)}
                </div>
              </section>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
