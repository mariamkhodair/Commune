import { supabase } from "./supabase";

export async function notifyUser(params: {
  userId: string;
  type: string;
  title: string;
  body: string;
  swapId?: string;
}) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await fetch("/api/notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(params),
    });
  } catch {
    // Fire and forget — never block the main action
  }
}
