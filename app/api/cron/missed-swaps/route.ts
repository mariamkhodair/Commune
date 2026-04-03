import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  // Phase 1: auto-revert swaps where the reminder was sent 24h+ ago with no response
  const { data: overdueSwaps } = await supabaseAdmin
    .from("swaps")
    .select("id, proposer_id, receiver_id")
    .eq("status", "In Progress")
    .not("missed_reminder_sent_at", "is", null)
    .lt("missed_reminder_sent_at", cutoff24h);

  let reverted = 0;
  for (const swap of overdueSwaps ?? []) {
    const { data: swapItems } = await supabaseAdmin
      .from("swap_items")
      .select("item_id")
      .eq("swap_id", swap.id);

    const itemIds = (swapItems ?? []).map((si: { item_id: string }) => si.item_id);
    if (itemIds.length > 0) {
      await supabaseAdmin.from("items").update({ status: "Available" }).in("id", itemIds);
    }

    await supabaseAdmin.from("swaps").update({ status: "Declined" }).eq("id", swap.id);

    await supabaseAdmin.from("notifications").insert([
      {
        user_id: swap.proposer_id,
        type: "declined",
        title: "Swap expired",
        body: "Your scheduled swap wasn't confirmed, so the items have been made available again.",
        swap_id: swap.id,
      },
      {
        user_id: swap.receiver_id,
        type: "declined",
        title: "Swap expired",
        body: "Your scheduled swap wasn't confirmed, so the items have been made available again.",
        swap_id: swap.id,
      },
    ]);

    reverted++;
  }

  // Phase 2: send "did your swap happen?" for in-progress swaps whose scheduled date has passed
  const { data: missedScheduled } = await supabaseAdmin
    .from("scheduled_swaps")
    .select("swap_id, scheduled_date, swaps!inner(id, proposer_id, receiver_id, status, missed_reminder_sent_at)")
    .eq("swaps.status", "In Progress")
    .is("swaps.missed_reminder_sent_at", null)
    .lt("scheduled_date", todayStr);

  const candidateSwapIds = [...new Set(
    (missedScheduled ?? []).map((row: any) => row.swap_id)
  )];

  let reminded = 0;
  if (candidateSwapIds.length > 0) {
    // Don't remind swaps where someone already tapped "Off to Swap"
    const { data: activeSessions } = await supabaseAdmin
      .from("swap_safety_sessions")
      .select("swap_id")
      .in("swap_id", candidateSwapIds)
      .not("departed_at", "is", null);

    const activeSwapIds = new Set((activeSessions ?? []).map((s: { swap_id: string }) => s.swap_id));

    for (const row of missedScheduled ?? []) {
      const swap = (row as any).swaps;
      if (!swap || activeSwapIds.has(row.swap_id)) continue;

      const dateLabel = new Date(row.scheduled_date + "T00:00:00").toLocaleDateString("en-GB", {
        weekday: "long", day: "numeric", month: "long",
      });

      await supabaseAdmin.from("notifications").insert([
        {
          user_id: swap.proposer_id,
          type: "swap_check",
          title: "Did your swap happen?",
          body: `Your swap was scheduled for ${dateLabel}. Open the app to confirm whether it took place.`,
          swap_id: swap.id,
        },
        {
          user_id: swap.receiver_id,
          type: "swap_check",
          title: "Did your swap happen?",
          body: `Your swap was scheduled for ${dateLabel}. Open the app to confirm whether it took place.`,
          swap_id: swap.id,
        },
      ]);

      await supabaseAdmin
        .from("swaps")
        .update({ missed_reminder_sent_at: now.toISOString() })
        .eq("id", swap.id);

      reminded++;
    }
  }

  return NextResponse.json({ reverted, reminded });
}
