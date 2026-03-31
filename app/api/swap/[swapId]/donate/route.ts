import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest, { params }: { params: Promise<{ swapId: string }> }) {
  const { swapId } = await params;

  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: swap } = await supabaseAdmin
    .from("swaps")
    .select("id, proposer_id, receiver_id, status")
    .eq("id", swapId)
    .single();

  if (!swap) return NextResponse.json({ error: "Swap not found" }, { status: 404 });
  if (swap.receiver_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (swap.status !== "Proposed") return NextResponse.json({ error: "Swap is not in Proposed state" }, { status: 400 });

  // Mark swap as Accepted + is_donation
  await supabaseAdmin
    .from("swaps")
    .update({ status: "Accepted", is_donation: true })
    .eq("id", swapId);

  // Get items split by side
  const { data: swapItems } = await supabaseAdmin
    .from("swap_items")
    .select("item_id, side")
    .eq("swap_id", swapId);

  const proposerItemIds = (swapItems ?? [])
    .filter((si: { side: string }) => si.side === "proposer")
    .map((si: { item_id: string }) => si.item_id);
  const receiverItemIds = (swapItems ?? [])
    .filter((si: { side: string }) => si.side === "receiver")
    .map((si: { item_id: string }) => si.item_id);

  await Promise.all([
    // Receiver's items are being donated — mark as Swapped
    receiverItemIds.length > 0
      ? supabaseAdmin.from("items").update({ status: "Swapped" }).in("id", receiverItemIds)
      : Promise.resolve(),
    // Proposer keeps their items — return to Available
    proposerItemIds.length > 0
      ? supabaseAdmin.from("items").update({ status: "Available" }).in("id", proposerItemIds)
      : Promise.resolve(),
  ]);

  // Notify the proposer
  const { data: donorProfile } = await supabaseAdmin
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();
  const donorName = (donorProfile as any)?.name ?? "Someone";

  await supabaseAdmin.from("notifications").insert({
    user_id: swap.proposer_id,
    type: "accepted",
    title: "Item donated to you! 🎁",
    body: `${donorName} is donating their item to you — no exchange needed. Coordinate pickup in your chat.`,
    swap_id: swapId,
  });

  // Create conversation if needed
  let conversationId: string | null = null;
  const { data: existingConv } = await supabaseAdmin
    .from("conversations")
    .select("id")
    .or(`and(member1_id.eq.${user.id},member2_id.eq.${swap.proposer_id}),and(member1_id.eq.${swap.proposer_id},member2_id.eq.${user.id})`)
    .maybeSingle();

  if (existingConv) {
    conversationId = (existingConv as any).id;
  } else {
    const { data: newConv } = await supabaseAdmin
      .from("conversations")
      .insert({ member1_id: user.id, member2_id: swap.proposer_id })
      .select("id")
      .single();
    conversationId = (newConv as any)?.id ?? null;
  }

  return NextResponse.json({ ok: true, conversationId });
}
