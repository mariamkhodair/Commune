import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BALANCE_THRESHOLD = 100;

type Item = { id: string; owner_id: string; name: string; category: string | null; points: number; photos: string[] | null };
type Want = { id: string; user_id: string; name: string; category: string | null };

function push<K, V>(map: Map<K, V[]>, key: K, val: V) {
  if (!map.has(key)) map.set(key, []);
  map.get(key)!.push(val);
}

function matches(item: Item, want: Want): boolean {
  if (want.category && item.category && want.category !== item.category) return false;
  const kws = want.name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  return kws.length > 0 && kws.some(k => item.name.toLowerCase().includes(k));
}

/**
 * POST /api/communes/find
 * Finds three-way swap triangles where the current user is one of the members.
 * Returns up to 10 commune matches.
 */
export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = user.id;

  const [{ data: rawItems }, { data: rawWants }] = await Promise.all([
    supabaseAdmin.from("items").select("id, owner_id, name, category, points, photos").eq("status", "Available").limit(300),
    supabaseAdmin.from("wanted_items").select("id, user_id, name, category"),
  ]);

  const items = (rawItems ?? []) as Item[];
  const wants = (rawWants ?? []) as Want[];

  if (!items.length || !wants.length) return NextResponse.json({ matches: [] });

  // Build lookup maps
  const byOwner = new Map<string, Item[]>();
  const byUser = new Map<string, Want[]>();
  for (const item of items) push(byOwner, item.owner_id, item);
  for (const want of wants) push(byUser, want.user_id, want);

  const myItems = byOwner.get(userId) ?? [];
  const myWants = byUser.get(userId) ?? [];
  if (!myItems.length || !myWants.length) return NextResponse.json({ matches: [] });

  // Pre-compute satisfiers: for each want, which available items satisfy it?
  const satisfiers = new Map<string, Item[]>();
  for (const want of wants) {
    satisfiers.set(
      want.id,
      items.filter(item => item.owner_id !== want.user_id && matches(item, want))
    );
  }

  type Match = { memberAId: string; memberBId: string; memberCId: string; itemA: Item; itemB: Item; itemC: Item };
  const results: Match[] = [];
  const seen = new Set<string>();

  // A = current user
  // A wants itemB (from B), B wants itemC (from C), C wants itemA (from A)
  outer: for (const wantA of myWants) {
    for (const itemB of satisfiers.get(wantA.id) ?? []) {
      const bId = itemB.owner_id;
      for (const wantB of byUser.get(bId) ?? []) {
        for (const itemC of satisfiers.get(wantB.id) ?? []) {
          const cId = itemC.owner_id;
          if (cId === userId || cId === bId) continue;
          for (const wantC of byUser.get(cId) ?? []) {
            for (const itemA of satisfiers.get(wantC.id) ?? []) {
              if (itemA.owner_id !== userId) continue;
              // Balance: each person gives and receives within BALANCE_THRESHOLD
              const pts = [itemA.points, itemB.points, itemC.points];
              if (Math.max(...pts) - Math.min(...pts) > BALANCE_THRESHOLD) continue;
              const key = [itemA.id, itemB.id, itemC.id].sort().join(",");
              if (seen.has(key)) continue;
              seen.add(key);
              results.push({ memberAId: userId, memberBId: bId, memberCId: cId, itemA, itemB, itemC });
              if (results.length >= 10) break outer;
            }
          }
        }
      }
    }
  }

  if (!results.length) return NextResponse.json({ matches: [] });

  // Enrich with profiles
  const memberIds = [...new Set(results.flatMap(r => [r.memberAId, r.memberBId, r.memberCId]))];
  const { data: profiles } = await supabaseAdmin.from("profiles").select("id, name, avatar_url").in("id", memberIds);
  const pm = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

  return NextResponse.json({
    matches: results.map(r => ({
      ...r,
      profileA: pm[r.memberAId] ?? null,
      profileB: pm[r.memberBId] ?? null,
      profileC: pm[r.memberCId] ?? null,
    }))
  });
}
