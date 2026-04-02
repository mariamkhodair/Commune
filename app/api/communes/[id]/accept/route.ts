import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/communes/:id/accept
 * Records the current user's acceptance.
 * When all three members have accepted → moves status to "In Progress" and notifies all.
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

  // Verify commune exists and user is a member
  const { data: commune } = await supabaseAdmin
    .from("communes")
    .select("id, status, member_a_id, member_b_id, member_c_id")
    .eq("id", communeId)
    .single();

  if (!commune) return NextResponse.json({ error: "Commune not found" }, { status: 404 });

  const members = [commune.member_a_id, commune.member_b_id, commune.member_c_id] as string[];
  if (!members.includes(userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (commune.status !== "Proposed") return NextResponse.json({ error: "Commune is no longer open" }, { status: 409 });

  // Record acceptance (ignore duplicate)
  await supabaseAdmin
    .from("commune_acceptances")
    .upsert({ commune_id: communeId, user_id: userId }, { onConflict: "commune_id,user_id" });

  // Check if all three have now accepted
  const { data: acceptances } = await supabaseAdmin
    .from("commune_acceptances")
    .select("user_id")
    .eq("commune_id", communeId);

  const acceptedIds = (acceptances ?? []).map((a: { user_id: string }) => a.user_id);
  const allAccepted = members.every(m => acceptedIds.includes(m));

  if (allAccepted) {
    await supabaseAdmin.from("communes").update({ status: "In Progress" }).eq("id", communeId);

    // Notify all three
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id, name").in("id", members);
    const nameMap = Object.fromEntries((profiles ?? []).map((p: { id: string; name: string }) => [p.id, p.name]));

    await Promise.all(members.map(memberId =>
      supabaseAdmin.from("notifications").insert({
        user_id: memberId,
        type: "commune_active",
        title: "Commune is on! 🔺",
        body: `All three members accepted — ${members.map(m => nameMap[m]).join(", ")}. Time to coordinate your exchange!`,
        swap_id: communeId,
      })
    ));

    return NextResponse.json({ allAccepted: true });
  }

  // Notify others that this user accepted
  const { data: myProfile } = await supabaseAdmin.from("profiles").select("name").eq("id", userId).single();
  const myName = (myProfile as { name?: string } | null)?.name ?? "A member";

  await Promise.all(
    members
      .filter(m => m !== userId)
      .map(memberId =>
        supabaseAdmin.from("notifications").insert({
          user_id: memberId,
          type: "commune_accepted",
          title: "Commune acceptance",
          body: `${myName} accepted the commune. Waiting for the remaining member.`,
          swap_id: communeId,
        })
      )
  );

  return NextResponse.json({ allAccepted: false });
}
