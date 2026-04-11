import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ALLOWED_TYPES = new Set([
  "proposal", "accepted", "declined", "dates_proposed", "date_confirmed",
  "swap_check", "swap_incoming", "swap_complete", "swap_safety_reminder",
  "swap_safety_checkin", "commune_proposed", "commune_accepted",
  "commune_declined", "commune_active",
]);

export async function POST(req: NextRequest) {
  // Auth first
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Parse body
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { userId, type, title, body: msgBody, swapId } = body as Record<string, unknown>;

  // Type and length validation
  if (typeof userId !== "string" || !UUID_RE.test(userId)) {
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
  }
  if (typeof type !== "string" || !ALLOWED_TYPES.has(type)) {
    return NextResponse.json({ error: "Invalid notification type" }, { status: 400 });
  }
  if (typeof title !== "string" || title.length === 0 || title.length > 200) {
    return NextResponse.json({ error: "Invalid title" }, { status: 400 });
  }
  if (typeof msgBody !== "string" || msgBody.length === 0 || msgBody.length > 500) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (typeof swapId !== "string" || !UUID_RE.test(swapId)) {
    return NextResponse.json({ error: "swapId is required" }, { status: 400 });
  }

  // Verify caller is a party to this swap (or commune)
  const { data: swap } = await supabaseAdmin
    .from("swaps")
    .select("proposer_id, receiver_id")
    .eq("id", swapId)
    .maybeSingle();

  if (swap) {
    const parties = [swap.proposer_id, swap.receiver_id];
    if (!parties.includes(user.id) || !parties.includes(userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else {
    // swapId may be a communeId (commune notifications reuse the column)
    const { data: commune } = await supabaseAdmin
      .from("communes")
      .select("member_a_id, member_b_id, member_c_id")
      .eq("id", swapId)
      .maybeSingle();

    if (!commune) return NextResponse.json({ error: "Swap not found" }, { status: 404 });

    const members = [commune.member_a_id, commune.member_b_id, commune.member_c_id];
    if (!members.includes(user.id) || !members.includes(userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { error } = await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    type,
    title,
    body: msgBody,
    swap_id: swapId ?? null,
  });

  if (error) return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });

  await sendNotificationEmail(userId, title, msgBody).catch((err) =>
    console.error("Notification email failed:", err)
  );

  return NextResponse.json({ ok: true });
}

async function sendNotificationEmail(userId: string, title: string, body: string) {
  // Fetch the user's signup email directly from Supabase Auth REST API
  const authRes = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${userId}`,
    {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
    }
  );
  if (!authRes.ok) {
    console.error("notify: failed to fetch user from auth, status", authRes.status);
    return;
  }
  const authUser = await authRes.json();
  const email: string | undefined = authUser?.email;
  if (!email) {
    console.error("notify: no email found for userId", userId);
    return;
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("name")
    .eq("id", userId)
    .single();
  const name = profile?.name ?? "there";

  const resend = new Resend(process.env.RESEND_API_KEY);
  const safeName = name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const safeTitle = title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const safeBody = body.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const { error: resendError } = await resend.emails.send({
    from: "Commune <hello@commune-eg.com>",
    replyTo: "commune.eg@gmail.com",
    to: email,
    subject: title,
    html: notificationEmail(safeName, safeTitle, safeBody),
    text: `Hi ${name},\n\n${title}\n\n${body}\n\nOpen Commune: https://commune-eg.com\n\n---\nTo stop receiving these emails, reply with "unsubscribe".\n© 2026 Commune. Cairo, Egypt.`,
    headers: {
      "List-Unsubscribe": "<mailto:commune.eg@gmail.com?subject=unsubscribe>",
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });

  if (resendError) {
    console.error("notify: resend error:", resendError);
  }
}

function notificationEmail(name: string, title: string, body: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#FAF7F2;font-family:Georgia,serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF7F2;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-size:36px;font-weight:bold;color:#4A3728;letter-spacing:-1px;">Commune</span>
            </td>
          </tr>

          <tr>
            <td style="background-color:#4A3728;border-radius:20px;padding:36px 40px;">
              <p style="margin:0 0 8px 0;font-size:13px;color:#C4B9AA;letter-spacing:0.5px;text-transform:uppercase;">Hi ${name}</p>
              <h1 style="margin:0 0 16px 0;font-size:24px;font-weight:300;color:#FAF7F2;line-height:1.3;">${title}</h1>
              <p style="margin:0;font-size:15px;color:#C4B9AA;line-height:1.7;">${body}</p>
            </td>
          </tr>

          <tr><td style="height:24px;"></td></tr>

          <tr>
            <td align="center" style="padding:16px 0;">
              <a href="https://commune-eg.com" style="display:inline-block;background-color:#4A3728;color:#FAF7F2;text-decoration:none;font-size:14px;font-weight:600;padding:14px 32px;border-radius:999px;">
                Open Commune
              </a>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:24px 0;border-top:1px solid #EDE8DF;">
              <p style="margin:0 0 6px 0;font-size:13px;color:#8B7355;">Questions? Email us at <a href="mailto:commune.eg@gmail.com" style="color:#4A3728;">commune.eg@gmail.com</a></p>
              <p style="margin:0 0 6px 0;font-size:12px;color:#A09080;">To make sure you receive our emails, add <strong>hello@commune-eg.com</strong> to your contacts.</p>
              <p style="margin:0 0 6px 0;font-size:12px;color:#A09080;">© 2026 Commune. Cairo, Egypt.</p>
              <p style="margin:0;font-size:11px;color:#C4B9AA;">To unsubscribe, reply to this email with the word "unsubscribe".</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
}
