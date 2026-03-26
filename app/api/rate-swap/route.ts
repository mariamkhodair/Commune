import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { swapId, ratedId, score } = await req.json();
  if (!swapId || !ratedId || !score) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const raterId = user.id;

  // Check if this user already rated this swap
  const { data: existing } = await supabaseAdmin
    .from("ratings")
    .select("score")
    .eq("swap_id", swapId)
    .eq("rater_id", raterId)
    .maybeSingle();

  // Upsert the rating record
  const { error: ratingError } = await supabaseAdmin
    .from("ratings")
    .upsert({ swap_id: swapId, rater_id: raterId, rated_id: ratedId, score }, { onConflict: "swap_id,rater_id" });

  if (ratingError) return NextResponse.json({ error: ratingError.message }, { status: 500 });

  // Update the rated user's profile aggregates
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("rating_sum, rating_count")
    .eq("id", ratedId)
    .single();

  if (profile) {
    const newSum = existing
      ? profile.rating_sum - existing.score + score
      : profile.rating_sum + score;
    const newCount = existing ? profile.rating_count : profile.rating_count + 1;

    await supabaseAdmin
      .from("profiles")
      .update({ rating_sum: newSum, rating_count: newCount })
      .eq("id", ratedId);
  }

  return NextResponse.json({ ok: true });
}
