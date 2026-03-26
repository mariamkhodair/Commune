import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function sendSms(to: string, body: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_PHONE_NUMBER!;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const encoded = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${encoded}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
  });
}

export async function GET(req: NextRequest) {
  // Verify this is called by Vercel Cron
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Tomorrow's date in YYYY-MM-DD
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  // Find all scheduled swaps happening tomorrow
  const { data: scheduled, error } = await supabaseAdmin
    .from("scheduled_swaps")
    .select(`
      id, swap_id, scheduled_date,
      swaps(proposer_id, receiver_id)
    `)
    .eq("scheduled_date", tomorrowStr);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!scheduled?.length) return NextResponse.json({ sent: 0 });

  // Collect unique user IDs
  const userIds = new Set<string>();
  for (const s of scheduled) {
    const swap = (s as any).swaps;
    if (swap?.proposer_id) userIds.add(swap.proposer_id);
    if (swap?.receiver_id) userIds.add(swap.receiver_id);
  }

  // Fetch phone numbers
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, phone")
    .in("id", Array.from(userIds));

  const phoneMap = new Map<string, string>();
  for (const p of profiles ?? []) {
    if ((p as any).phone) phoneMap.set(p.id, (p as any).phone);
  }

  // Send SMS reminders
  let sent = 0;
  for (const s of scheduled) {
    const swap = (s as any).swaps;
    const date = new Date(s.scheduled_date + "T00:00:00");
    const dateLabel = date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
    const message = `Commune reminder: Your swap is tomorrow — ${dateLabel}. Stay safe and meet in a public place!`;

    for (const uid of [swap?.proposer_id, swap?.receiver_id]) {
      if (!uid) continue;
      const phone = phoneMap.get(uid);
      if (!phone) continue;
      await sendSms(phone, message);
      sent++;
    }
  }

  return NextResponse.json({ sent });
}
