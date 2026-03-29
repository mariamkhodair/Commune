import { NextRequest, NextResponse } from "next/server";
import {
  valuateItem,
  compareSwap,
  type ValuationInput,
  type Condition,
} from "@/lib/valuationEngine";

const VALID_CONDITIONS: Condition[] = ["New", "Like New", "Good", "Fair", "Poor"];

interface ItemInput {
  category: string;
  subcategory?: string;
  brand?: string;
  condition: Condition;
  ageMonths?: number;
  userPriceEGP?: number;
  demandScore?: number;
  /** Optional pre-computed points — skips valuation if provided */
  points?: number;
}

function validateItem(item: unknown, label: string): { error: string } | null {
  if (!item || typeof item !== "object") return { error: `${label} must be an object` };
  const i = item as Record<string, unknown>;
  if (i.points !== undefined) {
    if (typeof i.points !== "number" || i.points < 1) return { error: `${label}.points must be >= 1` };
    return null; // pre-computed, skip other checks
  }
  if (!i.category || typeof i.category !== "string") return { error: `${label}.category is required` };
  if (!i.condition || !VALID_CONDITIONS.includes(i.condition as Condition)) {
    return { error: `${label}.condition must be one of: ${VALID_CONDITIONS.join(", ")}` };
  }
  return null;
}

/**
 * POST /api/valuate-item/compare
 * Evaluates whether a trade between two sides is fair.
 * Each side is an array of items (caller provides either raw item fields OR
 * a pre-computed `points` value per item for efficiency).
 *
 * Request body:
 * {
 *   side1: ItemInput[],     — required, at least 1 item
 *   side2: ItemInput[],     — required, at least 1 item
 *   tolerancePct?: number   — acceptable imbalance fraction (default 0.15 = ±15%)
 * }
 *
 * Response:
 * {
 *   fair:               boolean,
 *   side1Points:        number,   — total points for side 1
 *   side2Points:        number,   — total points for side 2
 *   differencePoints:   number,
 *   differencePercent:  number,
 *   side1Breakdown:     { points, item }[],
 *   side2Breakdown:     { points, item }[],
 *   suggestion:         TradeSuggestion | null
 * }
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { side1, side2, tolerancePct } = body;

  if (!Array.isArray(side1) || side1.length === 0) {
    return NextResponse.json({ error: "side1 must be a non-empty array of items" }, { status: 400 });
  }
  if (!Array.isArray(side2) || side2.length === 0) {
    return NextResponse.json({ error: "side2 must be a non-empty array of items" }, { status: 400 });
  }
  if (tolerancePct !== undefined && (typeof tolerancePct !== "number" || tolerancePct <= 0 || tolerancePct >= 1)) {
    return NextResponse.json({ error: "tolerancePct must be between 0 and 1 exclusive" }, { status: 400 });
  }

  // Validate each item
  for (let i = 0; i < side1.length; i++) {
    const err = validateItem(side1[i], `side1[${i}]`);
    if (err) return NextResponse.json(err, { status: 400 });
  }
  for (let i = 0; i < side2.length; i++) {
    const err = validateItem(side2[i], `side2[${i}]`);
    if (err) return NextResponse.json(err, { status: 400 });
  }

  // Valuate each item on each side
  function resolvePoints(item: ItemInput): { points: number; valuation: unknown } {
    if (item.points !== undefined) return { points: item.points, valuation: null };
    const result = valuateItem(item as ValuationInput);
    return { points: result.points, valuation: result };
  }

  const side1Breakdown = (side1 as ItemInput[]).map((item) => ({
    item,
    ...resolvePoints(item),
  }));
  const side2Breakdown = (side2 as ItemInput[]).map((item) => ({
    item,
    ...resolvePoints(item),
  }));

  const total1 = side1Breakdown.reduce((s, i) => s + i.points, 0);
  const total2 = side2Breakdown.reduce((s, i) => s + i.points, 0);

  const comparison = compareSwap(total1, total2, typeof tolerancePct === "number" ? tolerancePct : 0.15);

  return NextResponse.json({
    ...comparison,
    side1Breakdown,
    side2Breakdown,
  });
}
