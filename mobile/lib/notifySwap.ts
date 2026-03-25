import { supabase } from "./supabase";

const API_BASE = "https://commune-neon.vercel.app";

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

    await fetch(`${API_BASE}/api/notify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(params),
    });
  } catch {
    // Fire and forget
  }
}
