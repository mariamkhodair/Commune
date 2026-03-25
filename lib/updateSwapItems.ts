import { supabase } from "./supabase";

export async function updateSwapItemStatus(swapId: string, itemStatus: "Swapped" | "Available") {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await fetch("/api/update-swap-items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ swapId, itemStatus }),
    });
  } catch {
    // Non-blocking
  }
}
