import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/swap/:swapId/location
 * Body: { lat: number, lng: number }
 *
 * Updates the current user's live location in their safety session.
 * Called periodically while the user is "departed" and en route.
 */
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

  const { error } = await supabaseAdmin
    .from("swap_safety_sessions")
    .update({
      current_lat: lat,
      current_lng: lng,
      location_updated_at: new Date().toISOString(),
    })
    .eq("swap_id", swapId)
    .eq("user_id", user.id)
    .not("departed_at", "is", null);

  if (error) return NextResponse.json({ error: "Failed to update location" }, { status: 500 });

  return NextResponse.json({ success: true });
}
