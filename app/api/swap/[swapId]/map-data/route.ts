import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getDirections(lat1: number, lng1: number, lat2: number, lng2: number) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return { routePolyline: null, estimatedDistance: null, estimatedTravelTime: null };
  try {
    const url =
      `https://maps.googleapis.com/maps/api/directions/json` +
      `?origin=${lat1},${lng1}&destination=${lat2},${lng2}&mode=driving&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return { routePolyline: null, estimatedDistance: null, estimatedTravelTime: null };
    const data = await res.json();
    if (data.status !== "OK" || !data.routes?.length) {
      return { routePolyline: null, estimatedDistance: null, estimatedTravelTime: null };
    }
    const leg = data.routes[0].legs[0];
    return {
      routePolyline: data.routes[0].overview_polyline?.points ?? null,
      estimatedDistance: leg.distance?.text ?? null,
      estimatedTravelTime: leg.duration?.text ?? null,
    };
  } catch {
    return { routePolyline: null, estimatedDistance: null, estimatedTravelTime: null };
  }
}

/**
 * GET /api/swap/:swapId/map-data
 *
 * Returns the current safety-session state for both swap participants:
 * departure coordinates, midpoint, a Google Directions route polyline,
 * and estimated distance / travel time.
 *
 * Called by <SwapSafetyMap /> every 60 s while the swap is active.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ swapId: string }> }
) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { swapId } = await params;

  // ── Verify participant ────────────────────────────────────────────────────
  const { data: swap } = await supabaseAdmin
    .from("swaps")
    .select("id, proposer_id, receiver_id")
    .eq("id", swapId)
    .single();

  if (!swap) return NextResponse.json({ error: "Swap not found" }, { status: 404 });
  if (swap.proposer_id !== user.id && swap.receiver_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Fetch both sessions ───────────────────────────────────────────────────
  const { data: sessions } = await supabaseAdmin
    .from("swap_safety_sessions")
    .select("user_id, departure_lat, departure_lng, departed_at, completed_at")
    .eq("swap_id", swapId);

  const mySession = (sessions ?? []).find((s: { user_id: string }) => s.user_id === user.id) ?? null;
  const otherId = swap.proposer_id === user.id ? swap.receiver_id : swap.proposer_id;
  const theirSession = (sessions ?? []).find((s: { user_id: string }) => s.user_id === otherId) ?? null;

  // ── Build response ────────────────────────────────────────────────────────
  const user1 = mySession?.departure_lat != null
    ? { lat: mySession.departure_lat, lng: mySession.departure_lng, departedAt: mySession.departed_at }
    : null;

  const user2 = theirSession?.departure_lat != null
    ? { lat: theirSession.departure_lat, lng: theirSession.departure_lng, departedAt: theirSession.departed_at }
    : null;

  // Midpoint between the two departure points
  const midpoint = user1 && user2
    ? { lat: (user1.lat + user2.lat) / 2, lng: (user1.lng + user2.lng) / 2 }
    : null;

  // Route only when both have departed
  let routeData = { routePolyline: null as string | null, estimatedDistance: null as string | null, estimatedTravelTime: null as string | null };
  if (user1 && user2) {
    routeData = await getDirections(user1.lat, user1.lng, user2.lat, user2.lng);
  }

  return NextResponse.json({
    user1,
    user2,
    midpoint,
    myCompleted: !!mySession?.completed_at,
    theirCompleted: !!theirSession?.completed_at,
    ...routeData,
  });
}
