import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function notify(userId: string, title: string, body: string, communeId: string) {
  await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    type: "commune_proposed",
    title,
    body,
    swap_id: communeId, // reuse swap_id column to store commune id
  });
}

/**
 * GET /api/communes
 * Returns all communes the current user is a member of, enriched with profiles, items, and acceptances.
 */
export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = user.id;

  const { data: communes } = await supabaseAdmin
    .from("communes")
    .select("id, status, created_at, proposed_by, member_a_id, member_b_id, member_c_id, item_a_id, item_b_id, item_c_id")
    .or(`member_a_id.eq.${userId},member_b_id.eq.${userId},member_c_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (!communes?.length) return NextResponse.json({ communes: [] });

  const communeIds = communes.map((c: { id: string }) => c.id);
  const memberIds = [...new Set(communes.flatMap((c: { member_a_id: string; member_b_id: string; member_c_id: string }) => [c.member_a_id, c.member_b_id, c.member_c_id]))];
  const itemIds = [...new Set(communes.flatMap((c: { item_a_id: string; item_b_id: string; item_c_id: string }) => [c.item_a_id, c.item_b_id, c.item_c_id]))];

  const [{ data: acceptances }, { data: profiles }, { data: items }] = await Promise.all([
    supabaseAdmin.from("commune_acceptances").select("commune_id, user_id").in("commune_id", communeIds),
    supabaseAdmin.from("profiles").select("id, name, avatar_url").in("id", memberIds),
    supabaseAdmin.from("items").select("id, name, points, photos, category").in("id", itemIds),
  ]);

  const pm = Object.fromEntries((profiles ?? []).map((p: { id: string }) => [p.id, p]));
  const im = Object.fromEntries((items ?? []).map((i: { id: string }) => [i.id, i]));
  const accMap = new Map<string, string[]>();
  for (const acc of (acceptances ?? []) as { commune_id: string; user_id: string }[]) {
    if (!accMap.has(acc.commune_id)) accMap.set(acc.commune_id, []);
    accMap.get(acc.commune_id)!.push(acc.user_id);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return NextResponse.json({
    communes: communes.map((c: any) => ({
      ...c,
      profileA: pm[c.member_a_id] ?? null,
      profileB: pm[c.member_b_id] ?? null,
      profileC: pm[c.member_c_id] ?? null,
      itemA: im[c.item_a_id] ?? null,
      itemB: im[c.item_b_id] ?? null,
      itemC: im[c.item_c_id] ?? null,
      acceptances: accMap.get(c.id) ?? [],
    }))
  });
}

/**
 * POST /api/communes
 * Body: { memberBId, memberCId, itemAId, itemBId, itemCId }
 * Creates a commune, records proposer's acceptance, marks items "In a Swap", notifies B & C.
 */
export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = user.id;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const { memberBId, memberCId, itemAId, itemBId, itemCId } = body;
  if (!memberBId || !memberCId || !itemAId || !itemBId || !itemCId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify all items are still Available
  const { data: itemCheck } = await supabaseAdmin
    .from("items")
    .select("id, status, owner_id")
    .in("id", [itemAId, itemBId, itemCId]);

  for (const item of (itemCheck ?? []) as { id: string; status: string; owner_id: string }[]) {
    if (item.status !== "Available") {
      return NextResponse.json({ error: "One or more items are no longer available" }, { status: 409 });
    }
  }

  // Create commune
  const { data: commune, error: insertError } = await supabaseAdmin
    .from("communes")
    .insert({
      proposed_by: userId,
      member_a_id: userId,
      member_b_id: memberBId,
      member_c_id: memberCId,
      item_a_id: itemAId,
      item_b_id: itemBId,
      item_c_id: itemCId,
      status: "Proposed",
    })
    .select("id")
    .single();

  if (insertError || !commune) {
    return NextResponse.json({ error: "Failed to create commune" }, { status: 500 });
  }

  const communeId = commune.id;

  // Record proposer's acceptance, mark items "In a Swap", notify B & C
  const { data: myProfile } = await supabaseAdmin.from("profiles").select("name").eq("id", userId).single();
  const proposerName = (myProfile as { name?: string } | null)?.name ?? "Someone";

  await Promise.all([
    supabaseAdmin.from("commune_acceptances").insert({ commune_id: communeId, user_id: userId }),
    supabaseAdmin.from("items").update({ status: "In a Swap" }).in("id", [itemAId, itemBId, itemCId]),
    notify(memberBId, "Commune proposed! 🔺", `${proposerName} wants to form a commune — a 3-way swap including you. Tap to review.`, communeId),
    notify(memberCId, "Commune proposed! 🔺", `${proposerName} wants to form a commune — a 3-way swap including you. Tap to review.`, communeId),
  ]);

  return NextResponse.json({ communeId });
}
