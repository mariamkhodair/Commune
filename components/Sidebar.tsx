"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { useUnread } from "@/lib/unreadContext";
import { useNotifications } from "@/lib/notificationContext";
import { useLang } from "@/lib/languageContext";

type SidebarItemDef = {
  labelKey: "sidebar.notifications" | "sidebar.members" | "sidebar.search" | "sidebar.myStuff" | "sidebar.stuffIWant" | "sidebar.messages" | "sidebar.mySwaps" | "sidebar.scheduledSwaps" | "sidebar.communes" | "sidebar.getHelp" | "sidebar.about" | "sidebar.guidelines";
  href: string;
  id?: string;
  icon: React.ReactNode;
};

const SIDEBAR_ITEMS: SidebarItemDef[] = [
  {
    labelKey: "sidebar.notifications",
    href: "/notifications",
    id: "tour-notifications",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    labelKey: "sidebar.members",
    href: "/members",
    id: "tour-members",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    labelKey: "sidebar.search",
    href: "/search",
    id: "tour-search",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
  {
    labelKey: "sidebar.myStuff",
    href: "/my-stuff",
    id: "tour-my-stuff",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
  },
  {
    labelKey: "sidebar.stuffIWant",
    href: "/stuff-i-want",
    id: "tour-stuff-i-want",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" /><path d="M12 8v4l3 3" />
      </svg>
    ),
  },
  {
    labelKey: "sidebar.messages",
    href: "/messages",
    id: "tour-messages",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    labelKey: "sidebar.mySwaps",
    href: "/my-swaps",
    id: "tour-my-swaps",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M7 16V4m0 0L3 8m4-4 4 4" /><path d="M17 8v12m0 0 4-4m-4 4-4-4" />
      </svg>
    ),
  },
  {
    labelKey: "sidebar.scheduledSwaps",
    href: "/scheduled-swaps",
    id: "tour-scheduled-swaps",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
  },
  {
    labelKey: "sidebar.communes",
    href: "/communes",
    id: "tour-communes",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <polygon points="12 2 22 20 2 20"/>
      </svg>
    ),
  },
  {
    labelKey: "sidebar.getHelp",
    href: "/help",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" />
      </svg>
    ),
  },
  {
    labelKey: "sidebar.about",
    href: "/about",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    labelKey: "sidebar.guidelines",
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
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { userId, profile } = useUser();
  const { unreadMessages, clearAllMessages } = useUnread();
  const { unreadCount: unreadNotifications, markAllRead } = useNotifications();
  const { t, lang, setLang } = useLang();

  // Collapse sidebar and lock it closed on portrait mobile
  useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait) and (max-width: 1024px)");
    const handler = (e: MediaQueryList | MediaQueryListEvent) => {
      setIsMobilePortrait(e.matches);
      if (e.matches) setOpen(false);
    };
    handler(mq);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Clear badges when visiting the relevant pages
  useEffect(() => {
    if (pathname === "/messages") {
      clearAllMessages();
    }
    if (pathname === "/notifications" && userId) {
      markAllRead();
    }
  }, [pathname, userId]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className={`relative overflow-visible flex flex-col bg-white/70 backdrop-blur-sm border-r border-[#D9CFC4] transition-all duration-300 ease-in-out ${open ? "w-52" : "w-16"} shrink-0 z-30`}>

      {!isMobilePortrait && <button
        onClick={() => setOpen(!open)}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-[#4A3728] text-[#F5F0E8] flex items-center justify-center shadow-sm hover:bg-[#6B5040] transition-colors z-50"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3 h-3">
          {open ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
        </svg>
      </button>}

      <Link href="/dashboard" className="px-4 pt-6 pb-3 text-[#4A3728] font-[family-name:var(--font-permanent-marker)] whitespace-nowrap overflow-hidden" style={{ fontSize: open ? "1.5rem" : "0" }}>
        Commune
      </Link>

      {/* Profile + sign out — under logo */}
      <div className={`px-2 pb-3 border-b border-[#EDE8DF] ${open ? "" : "flex justify-center"}`}>
        {open ? (
          <div className="flex items-center justify-between px-3 py-2">
            <Link href="/profile" className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-[#EDE8DF] flex items-center justify-center text-xs font-medium text-[#4A3728] shrink-0 overflow-hidden">
                {profile?.avatar_url
                  // eslint-disable-next-line @next/next/no-img-element
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

      <nav className="flex flex-col gap-1 px-2 mt-2 flex-1 overflow-y-auto">
        {SIDEBAR_ITEMS.map((item) => {
          const active = pathname === item.href;
          const isMessages = item.labelKey === "sidebar.messages";
          const isNotifications = item.labelKey === "sidebar.notifications";
          const badgeCount = isMessages ? unreadMessages : isNotifications ? unreadNotifications : 0;
          const showBadge = badgeCount > 0;
          const badgeColor = "bg-[#A0624A]";
          return (
            <Link
              key={item.href}
              href={item.href}
              id={(item as any).id}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${active ? "bg-[#4A3728] text-[#F5F0E8]" : "text-[#6B5040] hover:bg-[#F5F0E8] hover:text-[#4A3728]"}`}
            >
              <span className="shrink-0 relative">
                {item.icon}
                {showBadge && !open && (
                  <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${badgeColor} text-white text-[9px] font-bold flex items-center justify-center`}>
                    {badgeCount}
                  </span>
                )}
              </span>
              {open && (
                <span className="flex items-center gap-2 flex-1">
                  <span className="text-sm font-medium whitespace-nowrap">{t(item.labelKey)}</span>
                  {showBadge && (
                    <span className={`ml-auto min-w-[20px] h-5 rounded-full ${badgeColor} text-white text-xs font-bold flex items-center justify-center px-1`}>
                      {badgeCount}
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
            {open && <span className="text-sm font-medium whitespace-nowrap">{t("sidebar.admin")}</span>}
          </Link>
        )}

        {/* Language toggle */}
        {open ? (
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="mt-2 mx-1 flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-[#6B5040] hover:bg-[#F5F0E8] hover:text-[#4A3728]"
          >
            <span className="shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </span>
            <span className="text-sm font-medium whitespace-nowrap">{t("sidebar.language")}</span>
          </button>
        ) : (
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            title={lang === "en" ? "العربية" : "English"}
            className="mt-2 p-3 flex items-center justify-center rounded-xl transition-colors text-[#6B5040] hover:bg-[#F5F0E8] hover:text-[#4A3728]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </button>
        )}
      </nav>


    </aside>
  );
}
