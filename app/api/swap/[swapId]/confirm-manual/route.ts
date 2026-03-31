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
    .select("id, proposer_id, receiver_id, status, is_donation")
    .eq("id", swapId)
    .single();

  if (!swap) return NextResponse.json({ error: "Swap not found" }, { status: 404 });

  const isParticipant = swap.proposer_id === user.id || swap.receiver_id === user.id;
  if (!isParticipant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (swap.status !== "In Progress") return NextResponse.json({ error: "Swap is not In Progress" }, { status: 400 });

  // Mark swap as Completed
  await supabaseAdmin.from("swaps").update({ status: "Completed" }).eq("id", swapId);

  // Ensure items are in correct final state
  const { data: swapItems } = await supabaseAdmin
    .from("swap_items")
    .select("item_id, side")
    .eq("swap_id", swapId);

  const receiverItemIds = (swapItems ?? [])
    .filter((si: { side: string }) => si.side === "receiver")
    .map((si: { item_id: string }) => si.item_id);
  const proposerItemIds = (swapItems ?? [])
    .filter((si: { side: string }) => si.side === "proposer")
    .map((si: { item_id: string }) => si.item_id);

  if ((swap as any).is_donation) {
    // Donation: only receiver's items are given away; proposer keeps theirs
    if (receiverItemIds.length > 0)
      await supabaseAdmin.from("items").update({ status: "Swapped" }).in("id", receiverItemIds);
  } else {
    const allIds = [...receiverItemIds, ...proposerItemIds];
    if (allIds.length > 0)
      await supabaseAdmin.from("items").update({ status: "Swapped" }).in("id", allIds);
  }

  // Notify both members
  const otherId = swap.proposer_id === user.id ? swap.receiver_id : swap.proposer_id;
  const { data: confirmerProfile } = await supabaseAdmin
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();
  const confirmerName = (confirmerProfile as any)?.name ?? "Your swap partner";

  await supabaseAdmin.from("notifications").insert([
    {
      user_id: otherId,
      type: "accepted",
      title: "Swap confirmed!",
      body: `${confirmerName} confirmed the swap took place. It's marked as completed.`,
      swap_id: swapId,
    },
    {
      user_id: user.id,
      type: "accepted",
      title: "Swap confirmed!",
      body: "You've confirmed the swap took place. It's marked as completed.",
      swap_id: swapId,
    },
  ]);

  return NextResponse.json({ ok: true });
}
