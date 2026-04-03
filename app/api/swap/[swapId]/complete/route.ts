import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function notify(userId: string, title: string, body: string, swapId: string) {
  await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    type: "swap_complete",
    title,
    body,
    swap_id: swapId,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ swapId: string }> }
) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { lat: number; lng: number };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const { lat, lng } = body;
  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ error: "lat and lng must be numbers" }, { status: 400 });
  }

  const { swapId } = await params;

  const { data: swap } = await supabaseAdmin
    .from("swaps")
    .select("id, proposer_id, receiver_id, status")
    .eq("id", swapId)
    .single();

  if (!swap) return NextResponse.json({ error: "Swap not found" }, { status: 404 });
  if (swap.proposer_id !== user.id && swap.receiver_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (swap.status === "Completed") {
    return NextResponse.json({ success: true, bothConfirmed: true });
  }

  const { error: updateError } = await supabaseAdmin
    .from("swap_safety_sessions")
    .upsert(
      {
        swap_id: swapId,
        user_id: user.id,
        completion_lat: lat,
        completion_lng: lng,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "swap_id,user_id" }
    );

  if (updateError) {
    return NextResponse.json({ error: "Failed to record completion" }, { status: 500 });
  }

  const otherId = swap.proposer_id === user.id ? swap.receiver_id : swap.proposer_id;
  const { data: otherSession } = await supabaseAdmin
    .from("swap_safety_sessions")
    .select("completed_at")
    .eq("swap_id", swapId)
    .eq("user_id", otherId)
    .not("completed_at", "is", null)
    .maybeSingle();

  const bothConfirmed = !!otherSession?.completed_at;

  if (bothConfirmed) {
    await supabaseAdmin.from("swaps").update({ status: "Completed" }).eq("id", swapId);

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, name")
      .in("id", [user.id, otherId]);
    const nameMap = Object.fromEntries((profiles ?? []).map((p: { id: string; name: string }) => [p.id, p.name]));

    await Promise.all([
      notify(user.id, "Swap complete! 🤝🏽", `You and ${nameMap[otherId] ?? "your partner"} both confirmed. Don't forget to leave a rating!`, swapId),
      notify(otherId, "Swap complete! 🤝🏽", `You and ${nameMap[user.id] ?? "your partner"} both confirmed. Don't forget to leave a rating!`, swapId),
    ]);
  } else {
    const { data: myProfile } = await supabaseAdmin
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single();
    await notify(
      otherId,
      "Your swap partner is safe!",
      `${myProfile?.name ?? "Your partner"} marked the swap as done. Tap "Swapped & Safe" to complete your side whenever you're ready.`,
      swapId
    );
  }

  return NextResponse.json({ success: true, bothConfirmed });
}
