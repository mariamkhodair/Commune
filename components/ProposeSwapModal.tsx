"use client";

import { useState } from "react";
import Link from "next/link";

// Placeholder — will be replaced with the logged-in member's real listed items from Supabase
const myItems = [
  { id: 1, name: "Vintage Denim Jacket", category: "Apparel", points: 320 },
  { id: 2, name: "Canon EOS Camera", category: "Electronics", points: 850 },
  { id: 3, name: "The Alchemist", category: "Books", points: 80 },
  { id: 4, name: "Desk Lamp", category: "Furniture & Home Decor", points: 150 },
  { id: 5, name: "Watercolour Set", category: "Stationery & Art Supplies", points: 110 },
];

// Placeholder — will be replaced with the other member's real Stuff I Want list from Supabase
const theirWantedCategories = ["Electronics", "Books"];

export type SwapTargetItem = {
  id: number | string;
  name: string;
  points: number;
  owner: string;
  ownerId?: number | string;
};

// Finds the subset of items whose points total is closest to the target
function suggestBundle(target: number, items: typeof myItems): Set<number> {
  const n = items.length;
  let bestDiff = Infinity;
  let bestSubset: number[] = [];

  for (let mask = 1; mask < (1 << n); mask++) {
    const subset: number[] = [];
    let total = 0;
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        subset.push(items[i].id);
        total += items[i].points;
      }
    }
    const diff = Math.abs(total - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestSubset = subset;
    }
  }

  return new Set(bestSubset);
}

export default function ProposeSwapModal({
  items,
  onClose,
}: {
  items: SwapTargetItem[];
  onClose: () => void;
}) {
  const theirTotalForSuggestion = items.reduce((sum, i) => sum + i.points, 0);
  const [selected, setSelected] = useState<Set<number>>(() => suggestBundle(theirTotalForSuggestion, myItems));
  const [submitted, setSubmitted] = useState(false);

  function toggleItem(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const ownerName = items[0]?.owner ?? "";
  const ownerId = items[0]?.ownerId;
  const theirTotal = items.reduce((sum, i) => sum + i.points, 0);
  const selectedItems = myItems.filter((i) => selected.has(i.id));
  const myTotal = selectedItems.reduce((sum, i) => sum + i.points, 0);
  const diff = myTotal - theirTotal;
  const balanced = Math.abs(diff) <= 50;
  const satisfiesTheirWant = selectedItems.some((i) => theirWantedCategories.includes(i.category));
  const isMatch = balanced && satisfiesTheirWant;

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-[#4A3728]/30 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-sm bg-[#FAF7F2] rounded-3xl px-7 py-10 shadow-lg text-center">
          <p className="text-3xl mb-4">🤝🏽</p>
          <p className="text-lg font-semibold text-[#4A3728] mb-2">Proposal sent!</p>
          <p className="text-sm text-[#6B5040] leading-relaxed mb-6">
            {ownerName} will be notified and can accept or decline your offer.
          </p>
          <button onClick={onClose} className="w-full rounded-full bg-[#4A3728] text-[#F5F0E8] py-3 font-semibold hover:bg-[#6B5040] transition-colors">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[#4A3728]/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#FAF7F2] rounded-3xl px-7 py-8 shadow-lg max-h-[90vh] overflow-y-auto">

        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#EDE8DF] flex items-center justify-center text-[#8B7355] hover:bg-[#D9CFC4] transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <h3 className="text-lg font-semibold text-[#4A3728] mb-1">Propose a Swap</h3>
        <p className="text-xs text-[#8B7355] mb-5">
          For a swap to go through, your offer must satisfy something on {ownerName}'s Stuff I Want list — and their items must satisfy something on yours.
        </p>

        {/* They want */}
        <div className="bg-[#EDE8DF] rounded-2xl px-4 py-4 mb-5">
          <p className="text-xs text-[#A09080] mb-2">You want{items.length > 1 ? ` (${items.length} items)` : ""}</p>
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-[#D9CFC4] last:border-0 last:pb-0 first:pt-0">
              <p className="text-sm font-medium text-[#4A3728]">{item.name}</p>
              <span className="text-xs font-semibold text-[#4A3728] ml-3 shrink-0">{item.points} pts</span>
            </div>
          ))}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#C4B9AA]">
            <p className="text-xs text-[#8B7355]">Listed by {ownerId ? <Link href={`/members/${ownerId}`} className="hover:underline font-medium text-[#4A3728]">{ownerName}</Link> : ownerName}</p>
            <p className="text-xs font-bold text-[#4A3728]">{theirTotal} pts total</p>
          </div>
        </div>

        {/* What they want */}
        <div className="flex items-start gap-2 bg-[#F5F0E8] rounded-xl px-4 py-3 mb-5">
          <svg viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2" strokeLinecap="round" className="w-4 h-4 shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
          </svg>
          <p className="text-xs text-[#6B5040] leading-relaxed">
            <span className="font-medium">{ownerName}</span> is looking for:{" "}
            <span className="font-medium text-[#4A3728]">{theirWantedCategories.join(", ")}</span>. Items marked 🤝🏽 match what they want.
          </p>
        </div>

        {/* AI suggestion banner */}
        <div className="flex items-start gap-2 bg-[#D8E4D0] rounded-xl px-4 py-3 mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="#4A6640" strokeWidth="2" strokeLinecap="round" className="w-4 h-4 shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
          </svg>
          <div className="flex-1">
            <p className="text-xs font-semibold text-[#4A6640] mb-0.5">AI suggested bundle</p>
            <p className="text-xs text-[#4A6640] leading-relaxed">
              We've pre-selected the combination of your items closest in value to {ownerName}'s listing. You can adjust the selection below.
            </p>
          </div>
          <button
            onClick={() => setSelected(suggestBundle(theirTotal, myItems))}
            className="text-xs text-[#4A6640] font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity shrink-0 mt-0.5"
          >
            Reset
          </button>
        </div>

        {/* Your items */}
        <p className="text-sm font-medium text-[#4A3728] mb-3">Offer from your listings</p>
        <div className="flex flex-col gap-2 mb-5">
          {myItems.map((myItem) => {
            const isSelected = selected.has(myItem.id);
            const wantedByThem = theirWantedCategories.includes(myItem.category);
            return (
              <button
                key={myItem.id}
                onClick={() => toggleItem(myItem.id)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors ${
                  isSelected ? "border-[#4A3728] bg-[#4A3728]/5"
                  : wantedByThem ? "border-[#7A9E6E] bg-[#D8E4D0]/40 hover:border-[#4A3728]"
                  : "border-[#D9CFC4] bg-white/60 hover:border-[#4A3728]"
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-[#4A3728]">{myItem.name}</p>
                    {wantedByThem && <span className="text-xs">🤝🏽</span>}
                  </div>
                  <p className="text-xs text-[#8B7355]">{myItem.category}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-[#4A3728]">{myItem.points} pts</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? "border-[#4A3728] bg-[#4A3728]" : "border-[#D9CFC4]"}`}>
                    {isSelected && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" className="w-3 h-3">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Status indicators */}
        {selected.size > 0 && (
          <div className="flex flex-col gap-2 mb-5">
            <div className={`rounded-xl px-4 py-3 flex items-center justify-between ${balanced ? "bg-[#D8E4D0]" : "bg-[#ECD8D4]"}`}>
              <div>
                <p className={`text-xs font-medium ${balanced ? "text-[#4A6640]" : "text-[#8B3A2A]"}`}>
                  {balanced ? "Points balanced" : diff > 0 ? `You're offering ${diff} pts more` : `You're ${Math.abs(diff)} pts short`}
                </p>
                <p className={`text-xs mt-0.5 ${balanced ? "text-[#4A6640]" : "text-[#8B3A2A]"}`}>
                  Your offer: <span className="font-semibold">{myTotal} pts</span> · Their items: <span className="font-semibold">{theirTotal} pts</span>
                </p>
              </div>
              <span className="text-base">{balanced ? "✓" : "⚠️"}</span>
            </div>

            <div className={`rounded-xl px-4 py-3 flex items-center justify-between ${satisfiesTheirWant ? "bg-[#D8E4D0]" : "bg-[#E4E0D0]"}`}>
              <p className={`text-xs font-medium ${satisfiesTheirWant ? "text-[#4A6640]" : "text-[#6B5040]"}`}>
                {satisfiesTheirWant
                  ? `Your offer includes something ${ownerName} is looking for`
                  : `None of your selected items match ${ownerName}'s want list`}
              </p>
              <span className="text-base ml-3 shrink-0">{satisfiesTheirWant ? "✓" : "⚠️"}</span>
            </div>

            {isMatch && (
              <div className="rounded-xl px-4 py-3 bg-[#4A3728] flex items-center gap-2">
                <span>🤝🏽</span>
                <p className="text-xs text-[#F5F0E8] font-medium">This is a mutual match — both of you get something you want!</p>
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => setSubmitted(true)}
          disabled={selected.size === 0}
          className="w-full rounded-full bg-[#4A3728] text-[#F5F0E8] py-3 font-semibold hover:bg-[#6B5040] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Send Proposal
        </button>

      </div>
    </div>
  );
}
