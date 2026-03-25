import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function DELETE(req: NextRequest) {
  if (!serviceRoleKey) {
    return NextResponse.json({ error: "Server misconfigured: missing service role key" }, { status: 500 });
  }

  const { itemId } = await req.json();
  if (!itemId) return NextResponse.json({ error: "Missing itemId" }, { status: 400 });

  const authHeader = req.headers.get("authorization") ?? "";
  const accessToken = authHeader.replace("Bearer ", "").trim();
  if (!accessToken) return NextResponse.json({ error: "Unauthorized: no token" }, { status: 401 });

  // Use service role client to validate token + perform delete
  const admin = createClient(supabaseUrl, serviceRoleKey);

  // Verify the caller's identity
  const { data: { user }, error: authError } = await admin.auth.getUser(accessToken);
  if (authError || !user) {
    return NextResponse.json({ error: `Unauthorized: ${authError?.message ?? "no user"}` }, { status: 401 });
  }

  // Verify ownership
  const { data: item, error: fetchError } = await admin
    .from("items")
    .select("id, photos, owner_id")
    .eq("id", itemId)
    .single();

  if (fetchError || !item) {
    return NextResponse.json({ error: `Item not found: ${fetchError?.message}` }, { status: 404 });
  }
  if (item.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete from DB
  const { error: deleteError } = await admin.from("items").delete().eq("id", itemId);
  if (deleteError) {
    return NextResponse.json({ error: `Delete failed: ${deleteError.message}` }, { status: 500 });
  }

  // Clean up storage photos
  const photos: string[] = item.photos ?? [];
  if (photos.length) {
    const paths = photos
      .map((url: string) => url.match(/\/item-photos\/(.+)$/)?.[1])
      .filter(Boolean) as string[];
    if (paths.length) await admin.storage.from("item-photos").remove(paths);
  }

  return NextResponse.json({ success: true });
}
