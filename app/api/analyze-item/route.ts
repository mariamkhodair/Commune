import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { name, brand, category, condition, description } = await req.json();

  if (!name || !category || !condition) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const prompt = `You are a pricing assistant for a swapping platform in Egypt called Commune. Users list secondhand items and assign them a points value based on the item's approximate market value in Egyptian Pounds (EGP).

The points system works like this:
- 1 point ≈ 1 EGP of market value
- So an item worth 500 EGP would be ~500 points
- Items are secondhand, so factor in condition

Item details:
- Name: ${name}
- Brand: ${brand || "Unknown/unbranded"}
- Category: ${category}
- Condition: ${condition}
- Description: ${description || "None provided"}

Based on the current Egyptian secondhand market, suggest a fair points value for this item. Reply with ONLY a number (no text, no EGP, just the integer). Be realistic for the Egyptian market.`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 64,
      messages: [{ role: "user", content: prompt }],
    });

    const text = (message.content[0] as { type: string; text: string }).text.trim();
    const points = parseInt(text.replace(/[^0-9]/g, ""));

    if (isNaN(points) || points <= 0) {
      return NextResponse.json({ error: "Could not determine points" }, { status: 500 });
    }

    return NextResponse.json({ points });
  } catch (err) {
    return NextResponse.json({ error: "AI analysis failed" }, { status: 500 });
  }
}
