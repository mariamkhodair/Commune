import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** Call Google Directions API server-side to protect the API key. */
async function getDirections(lat1: number, lng1: number, lat2: number, lng2: number) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return { estimatedDistance: null, estimatedTravelTime: null, routePolyline: null };
  try {
    const url =
      `https://maps.googleapis.com/maps/api/directions/json` +
      `?origin=${lat1},${lng1}&destination=${lat2},${lng2}&mode=driving&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return { estimatedDistance: null, estimatedTravelTime: null, routePolyline: null };
    const data = await res.json();
    if (data.status !== "OK" || !data.routes?.length) {
      return { estimatedDistance: null, estimatedTravelTime: null, routePolyline: null };
    }
    const leg = data.routes[0].legs[0];
    return {
      estimatedDistance: leg.distance?.text ?? null,
      estimatedTravelTime: leg.duration?.text ?? null,
      routePolyline: data.routes[0].overview_polyline?.points ?? null,
    };
  } catch {
    return { estimatedDistance: null, estimatedTravelTime: null, routePolyline: null };
  }
}

/**
 * POST /api/swap/:swapId/depart
 * Body: { lat: number, lng: number }
 *
 * Records the current user's departure coordinates.
 * If the other swap participant has already departed, returns their location
 * plus a Google Directions route between the two departure points.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ swapId: string }> }
) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── Body ──────────────────────────────────────────────────────────────────
  let body: { lat: number; lng: number };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const { lat, lng } = body;
  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ error: "lat and lng must be numbers" }, { status: 400 });
  }

  const { swapId } = await params;

  // ── Verify swap & participant ─────────────────────────────────────────────
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
    return NextResponse.json({ error: "Swap already completed" }, { status: 409 });
  }

  // ── Upsert this user's departure session ──────────────────────────────────
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { error: upsertError } = await supabaseAdmin
    .from("swap_safety_sessions")
    .upsert(
      {
        swap_id: swapId,
        user_id: user.id,
        departure_lat: lat,
        departure_lng: lng,
        departed_at: new Date().toISOString(),
        expires_at: expiresAt,
      },
      { onConflict: "swap_id,user_id" }
    );

  if (upsertError) {
    return NextResponse.json({ error: "Failed to record departure" }, { status: 500 });
  }

  // ── Check if other participant has departed ───────────────────────────────
  const otherId = swap.proposer_id === user.id ? swap.receiver_id : swap.proposer_id;
  const { data: otherSession } = await supabaseAdmin
    .from("swap_safety_sessions")
    .select("departure_lat, departure_lng")
    .eq("swap_id", swapId)
    .eq("user_id", otherId)
    .not("departed_at", "is", null)
    .maybeSingle();

  if (!otherSession?.departure_lat) {
    return NextResponse.json({ success: true, otherUserDepartureLocation: null });
  }

  // ── Both departed — fetch route ───────────────────────────────────────────
  const directions = await getDirections(
    lat, lng,
    otherSession.departure_lat,
    otherSession.departure_lng
  );

  return NextResponse.json({
    success: true,
    otherUserDepartureLocation: {
      lat: otherSession.departure_lat,
      lng: otherSession.departure_lng,
    },
    ...directions,
  });
}
