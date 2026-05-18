import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function awardCredits(userId: string, amount: number, reason: string) {
  await supabaseAdmin.rpc("increment_credits", { uid: userId, delta: amount });
  await supabaseAdmin.from("credit_transactions").insert({ user_id: userId, amount, reason });
}

export async function spendCredits(userId: string, amount: number, reason: string): Promise<boolean> {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();
  if (!profile || profile.credits < amount) return false;
  await supabaseAdmin.rpc("increment_credits", { uid: userId, delta: -amount });
  await supabaseAdmin.from("credit_transactions").insert({ user_id: userId, amount: -amount, reason });
  return true;
}
