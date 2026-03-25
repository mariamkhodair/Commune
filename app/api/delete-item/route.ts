import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function DELETE(req: NextRequest) {
  const { itemId } = await req.json();
  if (!itemId) return NextResponse.json({ error: "Missing itemId" }, { status: 400 });

  // Verify the caller's identity using their access token
  const authHeader = req.headers.get("authorization") ?? "";
  const accessToken = authHeader.replace("Bearer ", "");
  if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Use service role client to bypass RLS
  const admin = createClient(supabaseUrl, serviceRoleKey);

  // Verify ownership before deleting
  const { data: item } = await admin
    .from("items")
    .select("id, photos, owner_id")
    .eq("id", itemId)
    .single();

  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  if (item.owner_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Delete from DB
  const { error } = await admin.from("items").delete().eq("id", itemId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Clean up storage photos
  const photos: string[] = item.photos ?? [];
  if (photos.length) {
    const paths = photos
      .map((url) => url.match(/\/item-photos\/(.+)$/)?.[1])
      .filter(Boolean) as string[];
    if (paths.length) await admin.storage.from("item-photos").remove(paths);
  }

  return NextResponse.json({ success: true });
}
