import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function PATCH(req: NextRequest) {
  if (!serviceRoleKey) {
    return NextResponse.json({ error: "Server misconfigured: missing service role key" }, { status: 500 });
  }

  const { itemId, name, category, brand, condition, description, points, photos } = await req.json();
  if (!itemId) return NextResponse.json({ error: "Missing itemId" }, { status: 400 });

  const authHeader = req.headers.get("authorization") ?? "";
  const accessToken = authHeader.replace("Bearer ", "").trim();
  if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: { user }, error: authError } = await admin.auth.getUser(accessToken);
  if (authError || !user) {
    return NextResponse.json({ error: `Unauthorized: ${authError?.message ?? "no user"}` }, { status: 401 });
  }

  const { data: item, error: fetchError } = await admin
    .from("items")
    .select("id, owner_id, photos, status")
    .eq("id", itemId)
    .single();

  if (fetchError || !item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  if (item.owner_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (item.status !== "Available") {
    return NextResponse.json({ error: "Only available items can be edited" }, { status: 409 });
  }

  const { error: updateError } = await admin
    .from("items")
    .update({ name, category, brand: brand || null, condition, description, points, photos })
    .eq("id", itemId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Delete photos that were removed
  const oldPhotos: string[] = item.photos ?? [];
  const newPhotos: string[] = photos ?? [];
  const removedPhotos = oldPhotos.filter((url: string) => !newPhotos.includes(url));
  if (removedPhotos.length) {
    const paths = removedPhotos
      .map((url: string) => url.match(/\/item-photos\/(.+)$/)?.[1])
      .filter(Boolean) as string[];
    if (paths.length) await admin.storage.from("item-photos").remove(paths);
  }

  return NextResponse.json({ success: true });
}
