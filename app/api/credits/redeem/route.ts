import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { spendCredits } from "@/lib/credits";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const REDEMPTION_COSTS: Record<string, number> = {
  bosta: 100,
  subscription_discount: 2500,
};

// POST /api/credits/redeem — spend credits on a reward
export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { type: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const { type } = body;
  const cost = REDEMPTION_COSTS[type];
  if (!cost) return NextResponse.json({ error: "Invalid redemption type" }, { status: 400 });

  const success = await spendCredits(user.id, cost, `redeem_${type}`);
  if (!success) return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });

  await supabaseAdmin.from("credit_redemptions").insert({
    user_id: user.id,
    type,
    credits: cost,
  });

  return NextResponse.json({ success: true });
}
