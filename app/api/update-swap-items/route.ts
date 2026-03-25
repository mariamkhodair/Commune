import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { swapId, itemStatus } = await req.json();

  if (!swapId || !itemStatus) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Validate caller has a valid session
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all item IDs in this swap
  const { data: swapItems, error: swapItemsError } = await supabaseAdmin
    .from("swap_items")
    .select("item_id")
    .eq("swap_id", swapId);

  if (swapItemsError) {
    return NextResponse.json({ error: swapItemsError.message }, { status: 500 });
  }

  const itemIds = (swapItems ?? []).map((si: { item_id: string }) => si.item_id);

  if (itemIds.length > 0) {
    const { error: updateError } = await supabaseAdmin
      .from("items")
      .update({ status: itemStatus })
      .in("id", itemIds);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, updated: itemIds.length });
}
