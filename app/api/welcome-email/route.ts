import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { name, email } = await req.json();
    if (typeof name !== "string" || name.length === 0 || name.length > 100) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const safeName = name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const { error } = await resend.emails.send({
      from: "Commune <hello@commune-eg.com>",
      to: email,
      subject: "Welcome to Commune 🤝🏽",
      html: welcomeEmail(safeName),
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("welcome-email error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

function welcomeEmail(name: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Commune</title>
</head>
<body style="margin:0;padding:0;background-color:#FAF7F2;font-family:Georgia,serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF7F2;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-size:36px;font-weight:bold;color:#4A3728;letter-spacing:-1px;">Commune</span>
            </td>
          </tr>

          <!-- Hero card -->
          <tr>
            <td style="background-color:#4A3728;border-radius:20px;padding:36px 40px;">
              <p style="margin:0 0 8px 0;font-size:13px;color:#C4B9AA;letter-spacing:0.5px;text-transform:uppercase;">Welcome</p>
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:300;color:#FAF7F2;line-height:1.3;">
                Hi ${name}, you're in 🤝🏽
              </h1>
              <p style="margin:0;font-size:15px;color:#C4B9AA;line-height:1.7;">
                You've joined a community of people who believe in giving things a second life — and in the joy of swapping with neighbours. We're so glad you're here.
              </p>
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td style="height:24px;"></td></tr>

          <!-- How it works -->
          <tr>
            <td style="background-color:#ffffff;border-radius:20px;padding:32px 40px;border:1px solid #EDE8DF;">
              <h2 style="margin:0 0 20px 0;font-size:16px;font-weight:600;color:#4A3728;">Here's how Commune works</h2>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:16px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:32px;height:32px;background-color:#EDE8DF;border-radius:50%;text-align:center;vertical-align:middle;font-size:14px;font-weight:700;color:#4A3728;">1</td>
                        <td style="padding-left:12px;font-size:14px;color:#6B5040;line-height:1.5;">List items from your home — clothes, books, electronics, cosmetics, and more.</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:16px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:32px;height:32px;background-color:#EDE8DF;border-radius:50%;text-align:center;vertical-align:middle;font-size:14px;font-weight:700;color:#4A3728;">2</td>
                        <td style="padding-left:12px;font-size:14px;color:#6B5040;line-height:1.5;">Browse what other members have listed and propose a swap when something catches your eye.</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:16px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:32px;height:32px;background-color:#EDE8DF;border-radius:50%;text-align:center;vertical-align:middle;font-size:14px;font-weight:700;color:#4A3728;">3</td>
                        <td style="padding-left:12px;font-size:14px;color:#6B5040;line-height:1.5;">Chat with the member, agree on a date, and meet in a public place to exchange.</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:32px;height:32px;background-color:#EDE8DF;border-radius:50%;text-align:center;vertical-align:middle;font-size:14px;font-weight:700;color:#4A3728;">4</td>
                        <td style="padding-left:12px;font-size:14px;color:#6B5040;line-height:1.5;">Rate each other and build your community reputation over time.</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td style="height:24px;"></td></tr>

          <!-- Community Guidelines -->
          <tr>
            <td style="background-color:#ffffff;border-radius:20px;padding:32px 40px;border:1px solid #EDE8DF;">
              <h2 style="margin:0 0 8px 0;font-size:16px;font-weight:600;color:#4A3728;">Community Guidelines</h2>
              <p style="margin:0 0 24px 0;font-size:13px;color:#8B7355;">By being a member of Commune, you agree to the following.</p>

              <!-- Section 1 -->
              <h3 style="margin:0 0 8px 0;font-size:14px;font-weight:600;color:#4A3728;">1. Respect Above All</h3>
              <p style="margin:0 0 8px 0;font-size:13px;color:#6B5040;line-height:1.7;">Commune is a community built on trust. Every member is expected to treat others with courtesy and respect at all times — in messages, at exchange points, and in every interaction on the platform.</p>
              <p style="margin:0 0 24px 0;font-size:13px;color:#6B5040;line-height:1.7;">Disrespectful behaviour, harassment, hate speech, or any form of indecency will not be tolerated. Members found to have engaged in such conduct will be permanently banned and their subscription cancelled with no refund.</p>

              <!-- Section 2 -->
              <h3 style="margin:0 0 8px 0;font-size:14px;font-weight:600;color:#4A3728;">2. Honesty About Your Stuff</h3>
              <p style="margin:0 0 8px 0;font-size:13px;color:#6B5040;line-height:1.7;">When listing an item, you are responsible for describing it accurately — including its condition, any defects, signs of wear, or relevant history. Misrepresenting an item is a breach of community trust and may result in a negative rating or removal from the platform.</p>
              <p style="margin:0 0 8px 0;font-size:13px;color:#6B5040;line-height:1.7;">If you are unsure whether something is worth mentioning, mention it anyway. The person on the other end deserves the full picture.</p>
              <p style="margin:0 0 24px 0;font-size:13px;color:#6B5040;line-height:1.7;">We strongly encourage members to share additional photos in the chat if the other party asks. If something looks different in person from how it was listed, be upfront — it goes a long way.</p>

              <!-- Section 3 -->
              <h3 style="margin:0 0 8px 0;font-size:14px;font-weight:600;color:#4A3728;">3. Ratings and Standing</h3>
              <p style="margin:0 0 8px 0;font-size:13px;color:#6B5040;line-height:1.7;">After each completed swap, both members have the opportunity to rate each other. Your rating reflects your reliability and honesty as a community member.</p>
              <p style="margin:0 0 24px 0;font-size:13px;color:#6B5040;line-height:1.7;">Members whose rating falls below 3 stars will be matched less frequently on the platform. Honest listings tend to earn better ratings than overpromised ones.</p>

              <!-- Section 4 -->
              <h3 style="margin:0 0 8px 0;font-size:14px;font-weight:600;color:#4A3728;">4. Exchange Safety — Please Read Carefully</h3>
              <p style="margin:0 0 8px 0;font-size:13px;color:#6B5040;line-height:1.7;">Commune facilitates connections between members but is not present at any physical exchange. Participating in swaps is done at each member's own discretion and risk.</p>
              <p style="margin:0 0 8px 0;font-size:13px;color:#6B5040;line-height:1.7;">We strongly recommend:</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr><td style="padding:4px 0 4px 12px;font-size:13px;color:#6B5040;line-height:1.6;">• Meet in a public place — a café, a mall, or any busy, well-lit location.</td></tr>
                <tr><td style="padding:4px 0 4px 12px;font-size:13px;color:#6B5040;line-height:1.6;">• Do not go alone to meet a member you have never met before. Bring a friend or let someone know where you are going.</td></tr>
                <tr><td style="padding:4px 0 4px 12px;font-size:13px;color:#6B5040;line-height:1.6;">• Inspect the item thoroughly at the exchange point before the swap is finalised.</td></tr>
                <tr><td style="padding:4px 0 4px 12px;font-size:13px;color:#6B5040;line-height:1.6;">• Ask for more photos in the chat if you have any doubts before meeting.</td></tr>
              </table>

              <!-- Section 5 -->
              <h3 style="margin:0 0 8px 0;font-size:14px;font-weight:600;color:#4A3728;">5. Calling Off an Exchange</h3>
              <p style="margin:0 0 24px 0;font-size:13px;color:#6B5040;line-height:1.7;">Either member may choose not to proceed with a swap at the exchange point — for any reason. If you have a change of heart, please communicate this as early as possible out of respect for the other member's time.</p>

              <!-- Section 6 -->
              <h3 style="margin:0 0 8px 0;font-size:14px;font-weight:600;color:#4A3728;">6. Reporting and Bans</h3>
              <p style="margin:0 0 24px 0;font-size:13px;color:#6B5040;line-height:1.7;">If a member makes you feel unsafe, uncomfortable, or deceived, you can report them from their profile. Members confirmed to have engaged in harassment or repeated misrepresentation will be permanently removed from the platform.</p>

              <!-- Section 7 -->
              <h3 style="margin:0 0 8px 0;font-size:14px;font-weight:600;color:#4A3728;">7. Subscription and Membership</h3>
              <p style="margin:0 0 0 0;font-size:13px;color:#6B5040;line-height:1.7;">Membership is available as an annual plan at 500 EGP per year, or a monthly plan at 70 EGP per month. You may cancel at any time from your account settings; your access will continue until the end of the current billing period. Commune is currently available in Egypt only.</p>
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td style="height:24px;"></td></tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 0;border-top:1px solid #EDE8DF;">
              <p style="margin:0 0 8px 0;font-size:13px;color:#8B7355;">Questions? Email us at <a href="mailto:commune.eg@gmail.com" style="color:#4A3728;">commune.eg@gmail.com</a></p>
              <p style="margin:0;font-size:12px;color:#A09080;">© 2026 Commune. Cairo, Egypt.</p>
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
