import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/communes/:id/decline
 * Cancels the commune for all three members, frees the items, and notifies everyone.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: communeId } = await params;
  const userId = user.id;

  const { data: commune } = await supabaseAdmin
    .from("communes")
    .select("id, status, member_a_id, member_b_id, member_c_id, item_a_id, item_b_id, item_c_id")
    .eq("id", communeId)
    .single();

  if (!commune) return NextResponse.json({ error: "Commune not found" }, { status: 404 });

  const members = [commune.member_a_id, commune.member_b_id, commune.member_c_id] as string[];
  if (!members.includes(userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!["Proposed", "In Progress"].includes(commune.status)) {
    return NextResponse.json({ error: "Commune cannot be declined" }, { status: 409 });
  }

  const { data: myProfile } = await supabaseAdmin.from("profiles").select("name").eq("id", userId).single();
  const myName = (myProfile as { name?: string } | null)?.name ?? "A member";

  await Promise.all([
    // Cancel commune
    supabaseAdmin.from("communes").update({ status: "Declined" }).eq("id", communeId),
    // Free items back to Available
    supabaseAdmin.from("items").update({ status: "Available" }).in("id", [commune.item_a_id, commune.item_b_id, commune.item_c_id]),
    // Notify all three members
    ...members.map(memberId =>
      supabaseAdmin.from("notifications").insert({
        user_id: memberId,
        type: "commune_declined",
        title: "Commune declined",
        body: memberId === userId
          ? "You declined the commune. The items have been freed up."
          : `${myName} declined the commune. The three-way swap has been cancelled.`,
        swap_id: communeId,
      })
    ),
  ]);

  return NextResponse.json({ success: true });
}
