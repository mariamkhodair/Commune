import { NextRequest, NextResponse } from "next/server";
import {
  valuateItem,
  getCatalogue,
  type ValuationInput,
  type Condition,
} from "@/lib/valuationEngine";

const VALID_CONDITIONS: Condition[] = ["New", "Like New", "Good", "Fair", "Poor"];

/**
 * GET /api/valuate-item
 * Returns all available categories and subcategories for frontend dropdowns.
 */
export async function GET() {
  return NextResponse.json({ catalogue: getCatalogue() });
}

/**
 * POST /api/valuate-item
 * Valuates a single item and returns its point score with a full breakdown.
 *
 * Request body:
 * {
 *   category:      string            — required
 *   subcategory?:  string            — optional
 *   brand?:        string            — optional
 *   condition:     "New"|"Like New"|"Good"|"Fair"|"Poor"  — required
 *   ageMonths?:    number            — optional, defaults to 0
 *   userPriceEGP?: number            — optional EGP estimate signal
 *   demandScore?:  number (0.8–1.2)  — optional, defaults to 1.0
 * }
 *
 * Response:
 * {
 *   points:         number,
 *   breakdown:      { baseEGP, basePoints, conditionMultiplier,
 *                     depreciationFactor, brandTier, brandAdjustment, demandScore },
 *   egpRange:       { min, max, median },
 *   fairnessRange:  { min, max }   — ±15% window for trade UI
 * }
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { category, subcategory, brand, condition, ageMonths, userPriceEGP, demandScore } = body;

  // Validate required fields
  if (!category || typeof category !== "string") {
    return NextResponse.json({ error: "category is required" }, { status: 400 });
  }
  if (!condition || !VALID_CONDITIONS.includes(condition as Condition)) {
    return NextResponse.json(
      { error: `condition must be one of: ${VALID_CONDITIONS.join(", ")}` },
      { status: 400 }
    );
  }
  if (ageMonths !== undefined && (typeof ageMonths !== "number" || ageMonths < 0)) {
    return NextResponse.json({ error: "ageMonths must be a non-negative number" }, { status: 400 });
  }
  if (userPriceEGP !== undefined && (typeof userPriceEGP !== "number" || userPriceEGP < 0)) {
    return NextResponse.json({ error: "userPriceEGP must be a non-negative number" }, { status: 400 });
  }
  if (demandScore !== undefined && (typeof demandScore !== "number" || demandScore < 0.8 || demandScore > 1.2)) {
    return NextResponse.json({ error: "demandScore must be between 0.8 and 1.2" }, { status: 400 });
  }

  const input: ValuationInput = {
    category: category as string,
    subcategory: typeof subcategory === "string" ? subcategory : undefined,
    brand: typeof brand === "string" ? brand : undefined,
    condition: condition as Condition,
    ageMonths: typeof ageMonths === "number" ? ageMonths : 0,
    userPriceEGP: typeof userPriceEGP === "number" ? userPriceEGP : undefined,
    demandScore: typeof demandScore === "number" ? demandScore : 1.0,
  };

  const result = valuateItem(input);
  return NextResponse.json(result);
}
