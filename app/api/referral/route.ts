import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { awardCredits } from "@/lib/credits";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/referral — apply a referral code for the signed-in user
export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { code: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const code = body.code?.trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "code is required" }, { status: 400 });

  const { data: newUserProfile } = await supabaseAdmin
    .from("profiles")
    .select("id, referred_by")
    .eq("id", user.id)
    .single();

  if (!newUserProfile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  if (newUserProfile.referred_by) return NextResponse.json({ error: "Referral code already applied" }, { status: 409 });

  const { data: referrer } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("referral_code", code)
    .neq("id", user.id)
    .single();

  if (!referrer) return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });

  await supabaseAdmin.from("profiles").update({ referred_by: referrer.id }).eq("id", user.id);

  // Count how many users this referrer has referred
  const { count: referralCount } = await supabaseAdmin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("referred_by", referrer.id);

  // Award 50 credits at every 5th referral
  if (referralCount && referralCount % 5 === 0) {
    await awardCredits(referrer.id, 50, `referral_milestone_${referralCount}`);
  }

  return NextResponse.json({ success: true });
}
