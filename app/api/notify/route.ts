import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ALLOWED_TYPES = new Set([
  "proposal", "accepted", "declined", "dates_proposed", "date_confirmed",
  "swap_check", "swap_incoming", "swap_complete", "swap_safety_reminder",
  "swap_safety_checkin", "commune_proposed", "commune_accepted",
  "commune_declined", "commune_active",
]);

export async function POST(req: NextRequest) {
  // Auth first
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Parse body
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { userId, type, title, body: msgBody, swapId } = body as Record<string, unknown>;

  // Type and length validation
  if (typeof userId !== "string" || !UUID_RE.test(userId)) {
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
  }
  if (typeof type !== "string" || !ALLOWED_TYPES.has(type)) {
    return NextResponse.json({ error: "Invalid notification type" }, { status: 400 });
  }
  if (typeof title !== "string" || title.length === 0 || title.length > 200) {
    return NextResponse.json({ error: "Invalid title" }, { status: 400 });
  }
  if (typeof msgBody !== "string" || msgBody.length === 0 || msgBody.length > 500) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (swapId !== undefined && swapId !== null && (typeof swapId !== "string" || !UUID_RE.test(swapId))) {
    return NextResponse.json({ error: "Invalid swapId" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    type,
    title,
    body: msgBody,
    swap_id: swapId ?? null,
  });

  if (error) return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
