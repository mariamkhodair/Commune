"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

const sidebarItems = [
  {
    label: "Members",
    href: "/members",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Search",
    href: "/search",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
  {
    label: "My Stuff",
    href: "/my-stuff",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
  },
  {
    label: "Stuff I Want",
    href: "/stuff-i-want",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" /><path d="M12 8v4l3 3" />
      </svg>
    ),
  },
  {
    label: "Messages",
    href: "/messages",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: "Scheduled Swaps",
    href: "/scheduled-swaps",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
  },
  {
    label: "My Swaps",
    href: "/my-swaps",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M7 16V4m0 0L3 8m4-4 4 4" /><path d="M17 8v12m0 0 4-4m-4 4-4-4" />
      </svg>
    ),
  },
  {
    label: "Liked Stuff",
    href: "/liked",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    label: "Liked Members",
    href: "/liked-members",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 13.5a3 3 0 0 0-4.24-4.24L18 10l-.76-.74a3 3 0 0 0-4.24 4.24L18 19l4.76-4.76" />
      </svg>
    ),
  },
  {
    label: "Get Help",
    href: "/help",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" />
      </svg>
    ),
  },
  {
    label: "About Commune",
    href: "/about",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Terms & Conditions",
    href: "/terms",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8M16 17H8M10 9H8" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const [proposedCount, setProposedCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const { userId, profile } = useUser();

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("swaps")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", userId)
      .eq("status", "Proposed")
      .then(({ count }) => setProposedCount(count ?? 0));
  }, [userId]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className={`relative overflow-visible flex flex-col bg-white/70 backdrop-blur-sm border-r border-[#D9CFC4] transition-all duration-300 ease-in-out ${open ? "w-52" : "w-16"} shrink-0 z-30`}>

      <button
        onClick={() => setOpen(!open)}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-[#4A3728] text-[#F5F0E8] flex items-center justify-center shadow-sm hover:bg-[#6B5040] transition-colors z-50"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3 h-3">
          {open ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
        </svg>
      </button>

      <Link href="/dashboard" className="px-4 py-6 text-[#4A3728] font-[family-name:var(--font-permanent-marker)] whitespace-nowrap overflow-hidden" style={{ fontSize: open ? "1.5rem" : "0" }}>
        Commune
      </Link>

      <nav className="flex flex-col gap-1 px-2 mt-2 flex-1 overflow-y-auto">
        {sidebarItems.map((item) => {
          const active = pathname === item.href;
          const isMySwaps = item.label === "My Swaps";
          const showBadge = isMySwaps && proposedCount > 0;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${active ? "bg-[#4A3728] text-[#F5F0E8]" : "text-[#6B5040] hover:bg-[#F5F0E8] hover:text-[#4A3728]"}`}
            >
              <span className="shrink-0 relative">
                {item.icon}
                {showBadge && !open && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#A0624A] text-white text-[9px] font-bold flex items-center justify-center">
                    {proposedCount}
                  </span>
                )}
              </span>
              {open && (
                <span className="flex items-center gap-2 flex-1">
                  <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                  {showBadge && (
                    <span className="ml-auto min-w-[20px] h-5 rounded-full bg-[#A0624A] text-white text-xs font-bold flex items-center justify-center px-1">
                      {proposedCount}
                    </span>
                  )}
                </span>
              )}
            </Link>
          );
        })}

        {/* Admin link — only visible to admins */}
        {profile?.is_admin && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${pathname === "/admin" ? "bg-[#4A3728] text-[#F5F0E8]" : "text-[#6B5040] hover:bg-[#F5F0E8] hover:text-[#4A3728]"}`}
          >
            <span className="shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </span>
            {open && <span className="text-sm font-medium whitespace-nowrap">Admin</span>}
          </Link>
        )}
      </nav>

      {/* User info + sign out */}
      <div className={`px-2 py-3 border-t border-[#EDE8DF] ${open ? "" : "flex justify-center"}`}>
        {open ? (
          <div className="flex items-center justify-between px-3 py-2">
            <Link href="/profile" className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 rounded-full bg-[#EDE8DF] flex items-center justify-center text-xs font-medium text-[#4A3728] font-[family-name:var(--font-permanent-marker)] shrink-0 overflow-hidden">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  : profile?.name?.charAt(0) ?? "?"}
              </div>
              <span className="text-xs text-[#4A3728] font-medium truncate">{profile?.name ?? ""}</span>
            </Link>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="shrink-0 text-[#A09080] hover:text-[#A0624A] transition-colors ml-1"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="p-2 text-[#A09080] hover:text-[#A0624A] transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        )}
      </div>

    </aside>
  );
}
