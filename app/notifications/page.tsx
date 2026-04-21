"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useNotifications } from "@/lib/notificationContext";
import { useLang } from "@/lib/languageContext";

const TYPE_ICONS: Record<string, string> = {
  proposal: "🤝🏽",
  accepted: "✅",
  declined: "❌",
  dates_proposed: "📅",
  date_confirmed: "🗓️",
  swap_check: "❓",
  swap_incoming: "🚶",
  swap_complete: "🤝🏽",
  commune_proposed: "🔺",
  commune_accepted: "🔺",
  commune_declined: "🔺",
  commune_active: "🔺",
};

const SCHEDULED_SWAP_TYPES = new Set(["swap_incoming", "date_confirmed", "swap_check", "swap_complete"]);
const COMMUNE_TYPES = new Set(["commune_proposed", "commune_accepted", "commune_declined", "commune_active"]);

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, markRead, markAllRead } = useNotifications();
  const { t } = useLang();

  // Mark all read when page mounts
  useEffect(() => {
    markAllRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 px-8 py-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-light text-[#4A3728] mb-1 font-[family-name:var(--font-jost)]">
              {t("notif.header")}
            </h1>
            <p className="text-[#8B7355]">{t("notif.subheader")}</p>
          </div>
          {notifications.some((n) => !n.read) && (
            <button
              onClick={markAllRead}
              className="text-sm text-[#8B7355] hover:text-[#4A3728] underline transition-colors"
            >
              {t("notif.markAllRead")}
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-5xl mb-4">🔔</p>
            <p className="text-xl text-[#8B7355] font-[family-name:var(--font-permanent-marker)] mb-2">
              {t("notif.emptyTitle")}
            </p>
            <p className="text-[#A09080]">{t("notif.emptyHint")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-w-2xl">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  markRead(n.id);
                  if (n.swap_id) {
                    if (COMMUNE_TYPES.has(n.type)) {
                      router.push("/communes");
                    } else if (SCHEDULED_SWAP_TYPES.has(n.type)) {
                      router.push("/scheduled-swaps");
                    } else {
                      router.push("/my-swaps");
                    }
                  }
                }}
                className={`text-left w-full rounded-2xl px-5 py-4 flex items-start gap-4 transition-colors border ${
                  n.read
                    ? "bg-white/40 border-[#EDE8DF] hover:bg-white/60"
                    : "bg-white border-[#D9CFC4] hover:bg-white/80"
                }`}
              >
                <span className="text-2xl shrink-0 mt-0.5">{TYPE_ICONS[n.type] ?? "🔔"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className={`text-sm font-semibold ${n.read ? "text-[#8B7355]" : "text-[#4A3728]"}`}>
                      {n.title}
                    </p>
                    <span className="text-xs text-[#A09080] shrink-0">{timeAgo(n.created_at)}</span>
                  </div>
                  <p className="text-sm text-[#6B5040] leading-relaxed">{n.body}</p>
                </div>
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-[#A0624A] shrink-0 mt-2" />
                )}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
