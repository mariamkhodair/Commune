"use client";

import { useState, use } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

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

// Placeholder — will be replaced with Supabase data
const placeholderMembers: Record<string, { name: string; joined: string; rating: number | null; ratingCount: number; items: { id: number; name: string; category: string; points: number; condition: string }[] }> = {
  "1": { name: "Sara M.", joined: "Jan 2024", rating: 4.8, ratingCount: 12, items: [
    { id: 1, name: "Vintage Levi's Jacket", category: "Apparel", points: 420, condition: "Good" },
    { id: 2, name: "Ceramic Vase", category: "Furniture & Home Decor", points: 180, condition: "Like New" },
  ]},
  "2": { name: "Karim A.", joined: "Mar 2024", rating: 4.5, ratingCount: 9, items: [
    { id: 3, name: "Sony WH-1000XM4 Headphones", category: "Electronics", points: 1200, condition: "Like New" },
    { id: 4, name: "Mechanical Keyboard (TKL)", category: "Electronics", points: 800, condition: "Good" },
    { id: 9, name: "Canon EOS 200D Camera", category: "Electronics", points: 950, condition: "Good" },
    { id: 10, name: "iPad Pro 11\" (2021)", category: "Electronics", points: 2200, condition: "Like New" },
    { id: 11, name: "Nike Air Max 90", category: "Apparel", points: 480, condition: "Good" },
    { id: 12, name: "Levi's 501 Jeans", category: "Apparel", points: 320, condition: "Like New" },
    { id: 13, name: "Atomic Habits", category: "Books", points: 90, condition: "Like New" },
    { id: 14, name: "IKEA KALLAX Shelf", category: "Furniture & Home Decor", points: 550, condition: "Good" },
    { id: 15, name: "Logitech MX Master 3 Mouse", category: "Electronics", points: 650, condition: "Like New" },
    { id: 16, name: "Vintage Denim Jacket", category: "Apparel", points: 370, condition: "Good" },
    { id: 17, name: "Moleskine Notebook Set", category: "Stationery & Art Supplies", points: 120, condition: "New" },
    { id: 18, name: "Nespresso Vertuo Coffee Machine", category: "Furniture & Home Decor", points: 1800, condition: "Like New" },
    { id: 19, name: "Harry Potter Box Set (Arabic)", category: "Books", points: 280, condition: "Good" },
    { id: 20, name: "JBL Flip 6 Speaker", category: "Electronics", points: 750, condition: "Like New" },
  ]},
  "3": { name: "Nour T.", joined: "Feb 2024", rating: 5.0, ratingCount: 4, items: [
    { id: 5, name: "The Alchemist (Arabic)", category: "Books", points: 60, condition: "Good" },
  ]},
  "4": { name: "Ahmed R.", joined: "Dec 2023", rating: 4.2, ratingCount: 17, items: [
    { id: 6, name: "IKEA Desk Lamp", category: "Furniture & Home Decor", points: 150, condition: "New" },
  ]},
  "5": { name: "Dina H.", joined: "Apr 2024", rating: 4.9, ratingCount: 7, items: [
    { id: 7, name: "Maybelline Mascara Set", category: "Cosmetics", points: 200, condition: "New" },
  ]},
  "6": { name: "Omar S.", joined: "May 2024", rating: null, ratingCount: 0, items: [
    { id: 8, name: "Wireless Mouse", category: "Electronics", points: 250, condition: "Like New" },
  ]},
};

const reportReasons = [
  "Misrepresented item condition",
  "Inappropriate behaviour",
  "No-show / didn't complete swap",
  "Fake listing",
  "Harassment",
  "Other",
];

export default function MemberProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [showReport, setShowReport] = useState(false);
  const [reportForm, setReportForm] = useState({ reason: "", details: "" });
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const member = placeholderMembers[id];

  function handleReportSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: send report to commune.eg@gmail.com via backend
    setReportSubmitted(true);
  }

  function toggleLike(id: number) {
    setLiked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
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

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 px-8 py-8 overflow-y-auto">

        {/* Back */}
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
              <Stars rating={member.rating} />
              <p className="text-xs text-[#A09080]">Member since {member.joined} · {member.ratingCount} rating{member.ratingCount !== 1 ? "s" : ""}</p>
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
        <h2 className="text-lg font-medium text-[#4A3728] mb-4">Their Stuff</h2>

        {member.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-2xl text-[#8B7355] font-[family-name:var(--font-permanent-marker)] mb-3">Nothing listed yet</p>
            <p className="text-[#A09080]">This member hasn't listed any items yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {member.items.map((item) => (
              <div key={item.id} className="bg-white/60 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">

                {/* Like button */}
                <button
                  onClick={() => toggleLike(item.id)}
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill={liked.has(item.id) ? "#A0624A" : "none"} stroke="#A0624A" strokeWidth="2" className="w-4 h-4">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>

                {/* Image */}
                <div className="aspect-square bg-[#EDE8DF] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#C4B9AA" strokeWidth="1.5" className="w-8 h-8">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="font-medium text-[#4A3728] truncate text-sm">{item.name}</p>
                  <p className="text-xs text-[#8B7355] mb-2">{item.category} · {item.condition}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#4A3728]">{item.points} pts</span>
                    <button className="text-xs px-3 py-1 rounded-full bg-[#F5F0E8] border border-[#D9CFC4] text-[#6B5040] hover:bg-[#4A3728] hover:text-[#F5F0E8] hover:border-[#4A3728] transition-colors">
                      Propose swap
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </main>

      {/* Report modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-[#4A3728]/30 backdrop-blur-sm" onClick={() => setShowReport(false)} />
          <div className="relative w-full max-w-sm bg-[#FAF7F2] rounded-3xl px-7 py-8 shadow-lg">

            <button
              onClick={() => setShowReport(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#EDE8DF] flex items-center justify-center text-[#8B7355] hover:bg-[#D9CFC4] transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>

            {reportSubmitted ? (
              <div className="text-center py-4">
                <p className="text-lg font-medium text-[#4A3728] mb-2">Report submitted</p>
                <p className="text-sm text-[#6B5040] leading-relaxed">Thank you. Our team will review this and follow up if needed. Reports are kept confidential.</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-[#4A3728] mb-1">Report {member.name}</h3>
                <p className="text-xs text-[#8B7355] mb-5">Your report will be sent to our team at commune.eg@gmail.com and reviewed confidentially.</p>

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
