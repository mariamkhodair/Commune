import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/cron/safety-reminders
 * Called by Vercel Cron — add to vercel.json:
 *   { "crons": [{ "path": "/api/cron/safety-reminders", "schedule": "0 * * * *" }] }
 *
 * Two checks per run:
 *  1. One user confirmed "Swapped & Safe" 30+ min ago but the other hasn't →
 *     gentle reminder to the unconfirmed user.
 *  2. Neither user confirmed and it has been 3+ hours since first departure →
 *     check-in notification sent to both.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();

  // ── Fetch all active safety sessions grouped by swap ──────────────────────
  const { data: sessions, error } = await supabaseAdmin
    .from("swap_safety_sessions")
    .select("swap_id, user_id, departed_at, completed_at, expires_at")
    .not("departed_at", "is", null)
    .gt("expires_at", now.toISOString()); // ignore expired sessions

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!sessions?.length) return NextResponse.json({ reminders: 0, checkins: 0 });

  // Group sessions by swap_id
  const bySwap = new Map<string, typeof sessions>();
  for (const s of sessions) {
    if (!bySwap.has(s.swap_id)) bySwap.set(s.swap_id, []);
    bySwap.get(s.swap_id)!.push(s);
  }

  let reminders = 0;
  let checkins = 0;

  for (const [swapId, swapSessions] of bySwap) {
    const confirmed = swapSessions.filter(s => s.completed_at);
    const notConfirmed = swapSessions.filter(s => !s.completed_at);

    // ── Check 1: one person confirmed 30+ min ago, other hasn't ──────────────
    if (confirmed.length === 1 && notConfirmed.length === 1) {
      const confirmedSession = confirmed[0];
      if (confirmedSession.completed_at! < thirtyMinutesAgo) {
        await supabaseAdmin.from("notifications").insert({
          user_id: notConfirmed[0].user_id,
          type: "swap_safety_reminder",
          title: "Is everything okay?",
          body: "Your swap partner already confirmed they're safe. Don't forget to tap \"Swapped & Safe\" when you're done.",
          swap_id: swapId,
        });
        reminders++;
      }
    }

    // ── Check 2: neither confirmed and 3+ hours since first departure ─────────
    if (confirmed.length === 0 && swapSessions.length >= 1) {
      const earliest = swapSessions.reduce((a, b) =>
        a.departed_at! < b.departed_at! ? a : b
      );
      if (earliest.departed_at! < threeHoursAgo) {
        for (const s of swapSessions) {
          await supabaseAdmin.from("notifications").insert({
            user_id: s.user_id,
            type: "swap_safety_checkin",
            title: "Safety check-in",
            body: "It's been a while since you headed out for your swap. Tap \"Swapped & Safe\" once you're done to let your partner know everything is okay.",
            swap_id: swapId,
          });
        }
        checkins += swapSessions.length;
      }
    }
  }

  return NextResponse.json({ reminders, checkins });
}
