import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest, { params }: { params: Promise<{ swapId: string }> }) {
  const { swapId } = await params;

  // Validate session
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch the swap being accepted
  const { data: swap, error: swapErr } = await supabaseAdmin
    .from("swaps")
    .select("id, proposer_id, receiver_id, status")
    .eq("id", swapId)
    .single();

  if (swapErr || !swap) return NextResponse.json({ error: "Swap not found" }, { status: 404 });
  if (swap.receiver_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (swap.status !== "Proposed") return NextResponse.json({ error: "Swap is not in Proposed state" }, { status: 400 });

  // 1. Accept the swap
  await supabaseAdmin.from("swaps").update({ status: "Accepted" }).eq("id", swapId);

  // 2. Get item IDs in this swap
  const { data: swapItems } = await supabaseAdmin
    .from("swap_items")
    .select("item_id")
    .eq("swap_id", swapId);

  const itemIds = (swapItems ?? []).map((si: { item_id: string }) => si.item_id);

  if (itemIds.length > 0) {
    // Mark accepted swap's items as Swapped
    await supabaseAdmin.from("items").update({ status: "Swapped" }).in("id", itemIds);

    // 3. Find other Proposed swaps that share any of these items
    const { data: conflictingSwapItems } = await supabaseAdmin
      .from("swap_items")
      .select("swap_id")
      .in("item_id", itemIds)
      .neq("swap_id", swapId);

    const conflictingSwapIds = [...new Set(
      (conflictingSwapItems ?? []).map((si: { swap_id: string }) => si.swap_id)
    )];

    if (conflictingSwapIds.length > 0) {
      // Only decline swaps that are still Proposed
      const { data: conflictingSwaps } = await supabaseAdmin
        .from("swaps")
        .select("id, proposer_id, receiver_id")
        .in("id", conflictingSwapIds)
        .eq("status", "Proposed");

      if (conflictingSwaps && conflictingSwaps.length > 0) {
        const conflictIds = conflictingSwaps.map((s: { id: string }) => s.id);

        // Decline them all
        await supabaseAdmin.from("swaps").update({ status: "Declined" }).in("id", conflictIds);

        // Get items in each conflicting swap and mark them Available
        const { data: conflictItems } = await supabaseAdmin
          .from("swap_items")
          .select("item_id")
          .in("swap_id", conflictIds);

        const conflictItemIds = [...new Set(
          (conflictItems ?? []).map((si: { item_id: string }) => si.item_id)
        )].filter((id) => !itemIds.includes(id)); // don't revert items that are in the accepted swap

        if (conflictItemIds.length > 0) {
          await supabaseAdmin.from("items").update({ status: "Available" }).in("id", conflictItemIds);
        }

        // Notify proposers of conflicting swaps
        const { data: acceptorProfile } = await supabaseAdmin
          .from("profiles")
          .select("name")
          .eq("id", user.id)
          .single();
        const acceptorName = (acceptorProfile as any)?.name ?? "Someone";

        const notifications = conflictingSwaps.map((s: { id: string; proposer_id: string; receiver_id: string }) => {
          // Notify whoever proposed the conflicting swap
          const notifyId = s.proposer_id === user.id ? s.receiver_id : s.proposer_id;
          return {
            user_id: notifyId,
            type: "declined",
            title: "Swap declined",
            body: `${acceptorName} accepted another swap, so your proposal was automatically declined.`,
            swap_id: s.id,
          };
        });

        await supabaseAdmin.from("notifications").insert(notifications);
      }
    }
  }

  // 4. Notify the proposer of the accepted swap
  const { data: acceptorProfile } = await supabaseAdmin
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  await supabaseAdmin.from("notifications").insert({
    user_id: swap.proposer_id,
    type: "accepted",
    title: "Swap accepted!",
    body: `${(acceptorProfile as any)?.name ?? "Someone"} accepted your swap proposal.`,
    swap_id: swapId,
  });

  // 5. Create conversation if needed
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
