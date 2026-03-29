/**
 * Commune Valuation Engine
 * Deterministic points scoring for the Egyptian peer-to-peer trading market.
 * Scale: 1–1000 points mapped via logarithmic curve over EGP 50–15,000.
 */

// ─── Scale constants ───────────────────────────────────────────────────────────
const EGP_MIN = 50;
const EGP_MAX = 15_000;
const POINTS_MIN = 1;
const POINTS_MAX = 1_000;

// ─── Types ─────────────────────────────────────────────────────────────────────

export type Condition = "New" | "Like New" | "Good" | "Fair" | "Poor";

export type BrandTier =
  | "international_premium"
  | "international_standard"
  | "local_known"
  | "local_generic"
  | "unknown";

export interface ValuationInput {
  category: string;
  subcategory?: string;
  brand?: string;
  condition: Condition;
  /** Age of item in months. Defaults to 0 (new). */
  ageMonths?: number;
  /** Optional user-provided EGP estimate — used as a 30% signal. */
  userPriceEGP?: number;
  /** Future demand multiplier hook (0.8–1.2). Defaults to 1.0. */
  demandScore?: number;
}

export interface ValuationBreakdown {
  baseEGP: number;
  basePoints: number;
  conditionMultiplier: number;
  depreciationFactor: number;
  brandTier: BrandTier;
  brandAdjustment: number;
  demandScore: number;
}

export interface ValuationResult {
  points: number;
  breakdown: ValuationBreakdown;
  egpRange: { min: number; max: number; median: number };
  /** ±15% window around final points for trade fairness UI */
  fairnessRange: { min: number; max: number };
}

export interface CompareResult {
  fair: boolean;
  side1Points: number;
  side2Points: number;
  differencePoints: number;
  differencePercent: number;
  /** null when fair, otherwise items that could bridge the gap */
  suggestion: TradeSuggestion | null;
}

export interface TradeSuggestion {
  deficitSide: 1 | 2;
  pointsNeeded: number;
  egpEquivalent: number;
  suggestedCategories: SuggestedCategory[];
}

export interface SuggestedCategory {
  category: string;
  subcategory: string;
  estimatedPoints: number;
  egpRange: { min: number; max: number };
}

// ─── Condition multipliers ──────────────────────────────────────────────────────

const CONDITION_MULTIPLIERS: Record<Condition, number> = {
  New: 1.0,
  "Like New": 0.85,
  Good: 0.65,
  Fair: 0.45,
  Poor: 0.25,
};

// ─── Depreciation rates (monthly exponential decay) ────────────────────────────
// Electronics depreciate fast; books and furniture depreciate slowly.

const DEPRECIATION_RATES: Record<string, number> = {
  smartphones: 0.010,   // ~10% value loss after ~10 months
  laptops: 0.009,
  electronics: 0.008,
  clothing: 0.003,
  books: 0.001,
  furniture: 0.002,
  kitchenware: 0.0015,
  toys: 0.002,
  sports: 0.003,
  cosmetics: 0.005,
  stationery: 0.002,
  default: 0.003,
};

// ─── Brand tier multipliers ─────────────────────────────────────────────────────

const BRAND_TIER_MULTIPLIERS: Record<BrandTier, number> = {
  international_premium: 1.15,
  international_standard: 1.05,
  local_known: 1.0,
  local_generic: 0.90,
  unknown: 1.0,
};

// Known brand → tier mapping (lowercase keys)
const BRAND_TIER_MAP: Record<string, BrandTier> = {
  // International premium
  apple: "international_premium",
  samsung: "international_premium",
  sony: "international_premium",
  bose: "international_premium",
  microsoft: "international_premium",
  nike: "international_premium",
  adidas: "international_premium",
  gucci: "international_premium",
  "louis vuitton": "international_premium",
  "levi's": "international_premium",
  "ralph lauren": "international_premium",
  "tommy hilfiger": "international_premium",
  "calvin klein": "international_premium",
  lego: "international_premium",
  dyson: "international_premium",
  nikon: "international_premium",
  canon: "international_premium",
  gopro: "international_premium",
  // International standard
  zara: "international_standard",
  "h&m": "international_standard",
  ikea: "international_standard",
  dell: "international_standard",
  hp: "international_standard",
  lenovo: "international_standard",
  asus: "international_standard",
  lg: "international_standard",
  huawei: "international_standard",
  xiaomi: "international_standard",
  jbl: "international_standard",
  logitech: "international_standard",
  puma: "international_standard",
  "new balance": "international_standard",
  converse: "international_standard",
  mango: "international_standard",
  "massimo dutti": "international_standard",
  "pull&bear": "international_standard",
  bershka: "international_standard",
  "mac cosmetics": "international_standard",
  maybelline: "international_standard",
  "l'oreal": "international_standard",
  "l'oréal": "international_standard",
  nars: "international_standard",
  dior: "international_standard",
  "urban decay": "international_standard",
  "fenty beauty": "international_standard",
  "huda beauty": "international_standard",
  "charlotte tilbury": "international_standard",
  clinique: "international_standard",
  // Local Egyptian / regional brands
  concrete: "local_known",
  "azza fahmy": "local_known",
  kenzz: "local_known",
  mobaco: "local_known",
  "el araby": "local_known",
  olympic: "local_known",
  brawhia: "local_known",
  "cleopatra": "local_known",
  "gad": "local_known",
};

// ─── Price lookup table (Egyptian market, EGP) ─────────────────────────────────
// Prices sourced from OLX Egypt, Amazon.eg, and Souq typical listings.

interface PriceRange {
  min: number;
  max: number;
  median: number;
  depreciationKey: string;
}

const CATEGORY_PRICES: Record<string, Record<string, PriceRange>> = {
  Electronics: {
    Smartphones:          { min: 3_000,  max: 28_000, median: 9_000,  depreciationKey: "smartphones" },
    Laptops:              { min: 8_000,  max: 45_000, median: 18_000, depreciationKey: "laptops" },
    Tablets:              { min: 3_000,  max: 22_000, median: 8_000,  depreciationKey: "electronics" },
    Headphones:           { min: 200,    max: 6_000,  median: 1_200,  depreciationKey: "electronics" },
    Cameras:              { min: 4_000,  max: 35_000, median: 12_000, depreciationKey: "electronics" },
    TVs:                  { min: 3_000,  max: 30_000, median: 9_000,  depreciationKey: "electronics" },
    "Gaming Consoles":    { min: 5_000,  max: 22_000, median: 12_000, depreciationKey: "electronics" },
    Speakers:             { min: 300,    max: 8_000,  median: 1_500,  depreciationKey: "electronics" },
    "Smart Watches":      { min: 1_500,  max: 12_000, median: 4_000,  depreciationKey: "smartphones" },
    Keyboards:            { min: 200,    max: 3_000,  median: 700,    depreciationKey: "electronics" },
    Monitors:             { min: 2_000,  max: 15_000, median: 5_000,  depreciationKey: "electronics" },
    Printers:             { min: 1_500,  max: 10_000, median: 3_500,  depreciationKey: "electronics" },
    "General Electronics":{ min: 200,    max: 10_000, median: 2_000,  depreciationKey: "electronics" },
  },
  Clothing: {
    Jackets:              { min: 300,    max: 5_000,  median: 1_200,  depreciationKey: "clothing" },
    Shoes:                { min: 300,    max: 5_000,  median: 1_000,  depreciationKey: "clothing" },
    "T-shirts":           { min: 100,    max: 1_500,  median: 350,    depreciationKey: "clothing" },
    Dresses:              { min: 300,    max: 4_000,  median: 1_000,  depreciationKey: "clothing" },
    Jeans:                { min: 300,    max: 3_000,  median: 800,    depreciationKey: "clothing" },
    Bags:                 { min: 200,    max: 8_000,  median: 1_500,  depreciationKey: "clothing" },
    Accessories:          { min: 100,    max: 3_000,  median: 500,    depreciationKey: "clothing" },
    Sportswear:           { min: 200,    max: 3_000,  median: 800,    depreciationKey: "clothing" },
    "Suits & Formalwear": { min: 500,    max: 8_000,  median: 2_000,  depreciationKey: "clothing" },
    "General Clothing":   { min: 100,    max: 3_000,  median: 700,    depreciationKey: "clothing" },
  },
  Books: {
    Textbooks:            { min: 100,    max: 800,    median: 250,    depreciationKey: "books" },
    Novels:               { min: 50,     max: 400,    median: 120,    depreciationKey: "books" },
    "Children's Books":   { min: 50,     max: 300,    median: 100,    depreciationKey: "books" },
    "Self-help":          { min: 80,     max: 500,    median: 180,    depreciationKey: "books" },
    "Art & Photography":  { min: 150,    max: 1_000,  median: 350,    depreciationKey: "books" },
    "General Books":      { min: 50,     max: 600,    median: 150,    depreciationKey: "books" },
  },
  "Furniture & Home Decor": {
    Sofas:                { min: 3_000,  max: 25_000, median: 8_000,  depreciationKey: "furniture" },
    Tables:               { min: 1_000,  max: 15_000, median: 4_000,  depreciationKey: "furniture" },
    Chairs:               { min: 500,    max: 8_000,  median: 2_000,  depreciationKey: "furniture" },
    Beds:                 { min: 2_000,  max: 20_000, median: 7_000,  depreciationKey: "furniture" },
    Wardrobes:            { min: 2_000,  max: 15_000, median: 6_000,  depreciationKey: "furniture" },
    Shelves:              { min: 300,    max: 5_000,  median: 1_500,  depreciationKey: "furniture" },
    Desks:                { min: 800,    max: 8_000,  median: 2_500,  depreciationKey: "furniture" },
    "Home Decor":         { min: 100,    max: 3_000,  median: 600,    depreciationKey: "furniture" },
    "General Furniture":  { min: 500,    max: 15_000, median: 4_000,  depreciationKey: "furniture" },
  },
  Kitchenware: {
    "Pots & Pans":        { min: 200,    max: 3_000,  median: 700,    depreciationKey: "kitchenware" },
    Blenders:             { min: 300,    max: 3_000,  median: 900,    depreciationKey: "kitchenware" },
    "Air Fryers":         { min: 800,    max: 4_000,  median: 1_800,  depreciationKey: "kitchenware" },
    "Coffee Makers":      { min: 500,    max: 5_000,  median: 1_500,  depreciationKey: "kitchenware" },
    "Dining Sets":        { min: 500,    max: 5_000,  median: 1_500,  depreciationKey: "kitchenware" },
    "Kitchen Appliances": { min: 300,    max: 5_000,  median: 1_200,  depreciationKey: "kitchenware" },
    "General Kitchenware":{ min: 100,    max: 3_000,  median: 600,    depreciationKey: "kitchenware" },
  },
  Toys: {
    "Board Games":        { min: 150,    max: 1_500,  median: 450,    depreciationKey: "toys" },
    "Action Figures":     { min: 100,    max: 1_500,  median: 400,    depreciationKey: "toys" },
    "LEGO & Building Sets":{ min: 300,   max: 5_000,  median: 1_200,  depreciationKey: "toys" },
    Dolls:                { min: 100,    max: 2_000,  median: 400,    depreciationKey: "toys" },
    "Educational Toys":   { min: 200,    max: 2_000,  median: 600,    depreciationKey: "toys" },
    "Outdoor Toys":       { min: 200,    max: 3_000,  median: 700,    depreciationKey: "toys" },
    "General Toys":       { min: 100,    max: 2_000,  median: 500,    depreciationKey: "toys" },
  },
  Sports: {
    Bicycles:             { min: 1_500,  max: 20_000, median: 5_000,  depreciationKey: "sports" },
    "Gym Equipment":      { min: 500,    max: 15_000, median: 3_000,  depreciationKey: "sports" },
    "Racket Sports":      { min: 300,    max: 5_000,  median: 1_200,  depreciationKey: "sports" },
    Football:             { min: 150,    max: 2_000,  median: 500,    depreciationKey: "sports" },
    Swimming:             { min: 100,    max: 1_500,  median: 400,    depreciationKey: "sports" },
    "Hiking & Outdoor":   { min: 300,    max: 5_000,  median: 1_500,  depreciationKey: "sports" },
    "General Sports":     { min: 200,    max: 5_000,  median: 1_200,  depreciationKey: "sports" },
  },
  Cosmetics: {
    Skincare:             { min: 200,    max: 4_000,  median: 900,    depreciationKey: "cosmetics" },
    Makeup:               { min: 100,    max: 3_000,  median: 700,    depreciationKey: "cosmetics" },
    Fragrances:           { min: 300,    max: 5_000,  median: 1_200,  depreciationKey: "cosmetics" },
    Haircare:             { min: 100,    max: 2_000,  median: 500,    depreciationKey: "cosmetics" },
    "General Cosmetics":  { min: 100,    max: 3_000,  median: 600,    depreciationKey: "cosmetics" },
  },
  "Stationery & Art Supplies": {
    "Art Supplies":       { min: 100,    max: 3_000,  median: 600,    depreciationKey: "stationery" },
    "Notebooks & Journals":{ min: 50,   max: 500,    median: 150,    depreciationKey: "stationery" },
    "Writing Instruments":{ min: 50,    max: 2_000,  median: 300,    depreciationKey: "stationery" },
    "Craft Supplies":     { min: 100,    max: 2_000,  median: 500,    depreciationKey: "stationery" },
    "General Stationery": { min: 50,    max: 1_500,  median: 300,    depreciationKey: "stationery" },
  },
  Miscellaneous: {
    "Musical Instruments":{ min: 500,    max: 20_000, median: 3_000,  depreciationKey: "electronics" },
    "Travel Gear":        { min: 300,    max: 5_000,  median: 1_500,  depreciationKey: "default" },
    "Baby & Toddler":     { min: 200,    max: 5_000,  median: 1_200,  depreciationKey: "toys" },
    "Pet Supplies":       { min: 100,    max: 2_000,  median: 500,    depreciationKey: "default" },
    "General Miscellaneous":{ min: 100,  max: 3_000,  median: 700,    depreciationKey: "default" },
  },
};

// ─── Core helpers ───────────────────────────────────────────────────────────────

/** Convert an EGP value to a 1–1000 point score using a logarithmic curve. */
export function egpToPoints(egp: number): number {
  const clamped = Math.max(EGP_MIN, Math.min(egp, EGP_MAX * 3));
  const logMin = Math.log(EGP_MIN);
  const logMax = Math.log(EGP_MAX);
  const logVal = Math.log(clamped);
  const raw = ((logVal - logMin) / (logMax - logMin)) * (POINTS_MAX - POINTS_MIN) + POINTS_MIN;
  return Math.min(POINTS_MAX, Math.max(POINTS_MIN, Math.round(raw)));
}

/** Reverse: convert points back to approximate EGP midpoint for display. */
export function pointsToEGP(points: number): number {
  const clamped = Math.max(POINTS_MIN, Math.min(points, POINTS_MAX));
  const logMin = Math.log(EGP_MIN);
  const logMax = Math.log(EGP_MAX);
  const logVal = ((clamped - POINTS_MIN) / (POINTS_MAX - POINTS_MIN)) * (logMax - logMin) + logMin;
  return Math.round(Math.exp(logVal));
}

/** Exponential depreciation capped at a floor of 20% of original value. */
function depreciationFactor(ageMonths: number, depreciationKey: string): number {
  const rate = DEPRECIATION_RATES[depreciationKey] ?? DEPRECIATION_RATES.default;
  return Math.max(0.20, Math.exp(-rate * ageMonths));
}

/** Return the BrandTier for a given brand string. */
export function classifyBrand(brand?: string): BrandTier {
  if (!brand || brand.trim() === "") return "unknown";
  const key = brand.toLowerCase().trim();
  if (BRAND_TIER_MAP[key]) return BRAND_TIER_MAP[key];
  // Partial match
  for (const [knownBrand, tier] of Object.entries(BRAND_TIER_MAP)) {
    if (key.includes(knownBrand) || knownBrand.includes(key)) return tier;
  }
  return "unknown";
}

/** Look up the price range for a category/subcategory pair.
 *  Falls back to category-level "General X" if subcategory not found. */
function lookupPriceRange(category: string, subcategory?: string): PriceRange {
  const catData = CATEGORY_PRICES[category];
  if (!catData) {
    // Unknown category — return a neutral midrange
    return { min: 200, max: 3_000, median: 800, depreciationKey: "default" };
  }
  if (subcategory && catData[subcategory]) return catData[subcategory];
  // Try "General X" fallback
  const generalKey = `General ${category.split(" ")[0]}`;
  const generalFallback = Object.entries(catData).find(([k]) => k.startsWith("General"));
  return generalFallback ? generalFallback[1] : Object.values(catData)[0];
}

// ─── Main valuation function ────────────────────────────────────────────────────

export function valuateItem(input: ValuationInput): ValuationResult {
  const priceRange = lookupPriceRange(input.category, input.subcategory);

  // 1. Base EGP — blend category median with optional user signal (70/30)
  let baseEGP = priceRange.median;
  if (input.userPriceEGP && input.userPriceEGP > 0) {
    baseEGP = priceRange.median * 0.7 + input.userPriceEGP * 0.3;
  }

  // 2. Base points on log scale
  const basePoints = egpToPoints(baseEGP);

  // 3. Condition multiplier
  const conditionMultiplier = CONDITION_MULTIPLIERS[input.condition] ?? 0.65;

  // 4. Depreciation
  const depreciation = depreciationFactor(input.ageMonths ?? 0, priceRange.depreciationKey);

  // 5. Brand adjustment
  const brandTier = classifyBrand(input.brand);
  const brandAdjustment = BRAND_TIER_MULTIPLIERS[brandTier];

  // 6. Demand signal hook (default 1.0, range 0.8–1.2)
  const demandScore = Math.max(0.8, Math.min(1.2, input.demandScore ?? 1.0));

  // Final score
  const rawPoints = basePoints * conditionMultiplier * depreciation * brandAdjustment * demandScore;
  const finalPoints = Math.min(POINTS_MAX, Math.max(POINTS_MIN, Math.round(rawPoints)));

  return {
    points: finalPoints,
    breakdown: {
      baseEGP: Math.round(baseEGP),
      basePoints,
      conditionMultiplier,
      depreciationFactor: Math.round(depreciation * 1_000) / 1_000,
      brandTier,
      brandAdjustment,
      demandScore,
    },
    egpRange: { min: priceRange.min, max: priceRange.max, median: priceRange.median },
    fairnessRange: {
      min: Math.max(POINTS_MIN, Math.round(finalPoints * 0.85)),
      max: Math.min(POINTS_MAX, Math.round(finalPoints * 1.15)),
    },
  };
}

// ─── Trade fairness comparison ──────────────────────────────────────────────────

/**
 * Compare two sides of a trade.
 * @param side1Points  Total points for side 1 (one or more items summed by caller)
 * @param side2Points  Total points for side 2
 * @param tolerancePct Acceptable imbalance as a fraction (default 0.15 = ±15%)
 */
export function compareSwap(
  side1Points: number,
  side2Points: number,
  tolerancePct = 0.15
): CompareResult {
  const diff = Math.abs(side1Points - side2Points);
  const maxPoints = Math.max(side1Points, side2Points, 1);
  const diffPct = diff / maxPoints;
  const fair = diffPct <= tolerancePct;

  return {
    fair,
    side1Points,
    side2Points,
    differencePoints: diff,
    differencePercent: Math.round(diffPct * 100),
    suggestion: fair ? null : buildSuggestion(side1Points, side2Points),
  };
}

/** Build item-type suggestions to bridge the points gap. */
function buildSuggestion(side1Points: number, side2Points: number): TradeSuggestion {
  const deficitSide = side1Points < side2Points ? 1 : 2;
  const pointsNeeded = Math.abs(side1Points - side2Points);
  const egpEquivalent = pointsToEGP(Math.min(POINTS_MAX, Math.max(POINTS_MIN, pointsNeeded)));

  // Find subcategories whose "Good" condition median lands close to the gap
  const suggestions: SuggestedCategory[] = [];
  for (const [category, subcats] of Object.entries(CATEGORY_PRICES)) {
    for (const [subcategory, range] of Object.entries(subcats)) {
      // Simulate "Good" condition (0.65) on the median
      const estimatedPoints = Math.round(
        egpToPoints(range.median) * CONDITION_MULTIPLIERS["Good"]
      );
      const delta = Math.abs(estimatedPoints - pointsNeeded);
      if (delta / Math.max(pointsNeeded, 1) <= 0.30) {
        suggestions.push({
          category,
          subcategory,
          estimatedPoints,
          egpRange: { min: range.min, max: range.max },
        });
      }
    }
  }

  // Sort by how close they are and return top 5
  suggestions.sort(
    (a, b) =>
      Math.abs(a.estimatedPoints - pointsNeeded) -
      Math.abs(b.estimatedPoints - pointsNeeded)
  );

  return {
    deficitSide,
    pointsNeeded,
    egpEquivalent,
    suggestedCategories: suggestions.slice(0, 5),
  };
}

// ─── Category catalogue (for frontend dropdowns) ────────────────────────────────

export interface CategoryCatalogue {
  category: string;
  subcategories: string[];
}

export function getCatalogue(): CategoryCatalogue[] {
  return Object.entries(CATEGORY_PRICES).map(([category, subcats]) => ({
    category,
    subcategories: Object.keys(subcats),
  }));
}

export { CONDITION_MULTIPLIERS, BRAND_TIER_MULTIPLIERS };
