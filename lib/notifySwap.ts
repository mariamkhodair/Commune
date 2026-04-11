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
    if (!session) {
      console.warn("notifyUser: no session, skipping notification for", params.type);
      return;
    }

    const res = await fetch("/api/notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      console.error("notifyUser: server responded", res.status, await res.text());
    }
  } catch (err) {
    console.error("notifyUser: fetch failed", err);
  }
}
