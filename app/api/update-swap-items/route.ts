import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_STATUSES = new Set(["Available", "In a Swap", "Swapped"]);

export async function POST(req: NextRequest) {
  // Auth first — before reading any user-supplied data
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Parse and validate body
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { swapId, itemStatus } = body as Record<string, unknown>;

  if (typeof swapId !== "string" || !UUID_RE.test(swapId)) {
    return NextResponse.json({ error: "Invalid swapId" }, { status: 400 });
  }
  if (typeof itemStatus !== "string" || !ALLOWED_STATUSES.has(itemStatus)) {
    return NextResponse.json({ error: "Invalid itemStatus" }, { status: 400 });
  }

  const { data: swapItems, error: swapItemsError } = await supabaseAdmin
    .from("swap_items")
    .select("item_id")
    .eq("swap_id", swapId);

  if (swapItemsError) return NextResponse.json({ error: "Failed to fetch swap items" }, { status: 500 });

  const itemIds = (swapItems ?? []).map((si: { item_id: string }) => si.item_id);

  if (itemIds.length > 0) {
    const { error: updateError } = await supabaseAdmin
      .from("items")
      .update({ status: itemStatus })
      .in("id", itemIds);

    if (updateError) return NextResponse.json({ error: "Failed to update items" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, updated: itemIds.length });
}
