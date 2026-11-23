/**
 * Clothing size catalog + conversions.
 *
 * MVP collects everything in US sizing. Conversions to UK / EU / JP are shown
 * as "≈" hints and are approximate — brands vary. Tables are intentionally data
 * so new regions can be added without touching UI code.
 */

export type SizeSystem = "US" | "UK" | "EU" | "JP";
export const SIZE_SYSTEMS: SizeSystem[] = ["US", "UK", "EU", "JP"];

/** Which section of the store someone usually shops. */
export type Fit = "mens" | "womens" | "kids";

export const FIT_LABELS: Record<Fit, string> = {
  mens: "Men's",
  womens: "Women's",
  kids: "Kids'",
};

export const ALPHA_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"] as const;
export type AlphaSize = (typeof ALPHA_SIZES)[number];

export const KIDS_SIZES = [
  "Preemie", "NB", "0-3M", "3-6M", "6-12M", "12-18M", "18-24M",
  "2T", "3T", "4T", "5T", "XS (4-5)", "S (6-7)", "M (8)", "L (10-12)", "XL (14-16)",
] as const;

export const WOMENS_NUMERIC = ["00", "0", "2", "4", "6", "8", "10", "12", "14", "16", "18", "20", "22", "24"] as const;

export const MENS_WAIST = [26, 28, 29, 30, 31, 32, 33, 34, 36, 38, 40, 42, 44, 46, 48] as const;
export const MENS_INSEAM = [26, 28, 29, 30, 31, 32, 33, 34, 36] as const;

export const SHIRT_NECK = [14, 14.5, 15, 15.5, 16, 16.5, 17, 17.5, 18, 18.5] as const;
export const SHIRT_SLEEVE = ["32/33", "34/35", "36/37"] as const;

export const SHOE_WIDTHS = ["Narrow", "Regular", "Wide", "Extra wide"] as const;
export const RING_SIZES = [3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 13] as const;
export const HAT_SIZES = ["S/M", "M/L", "L/XL", "One size"] as const;

// ---------------------------------------------------------------------------
// Shoes

type ShoeRow = { us: number; uk: number; eu: number; jp: number };

/** jp = foot length in cm (Japan labels shoes by cm). */
const MENS_SHOES: ShoeRow[] = [
  { us: 6, uk: 5.5, eu: 39, jp: 24 },
  { us: 6.5, uk: 6, eu: 39.5, jp: 24.5 },
  { us: 7, uk: 6.5, eu: 40, jp: 25 },
  { us: 7.5, uk: 7, eu: 40.5, jp: 25.5 },
  { us: 8, uk: 7.5, eu: 41, jp: 26 },
  { us: 8.5, uk: 8, eu: 42, jp: 26.5 },
  { us: 9, uk: 8.5, eu: 42.5, jp: 27 },
  { us: 9.5, uk: 9, eu: 43, jp: 27.5 },
  { us: 10, uk: 9.5, eu: 44, jp: 28 },
  { us: 10.5, uk: 10, eu: 44.5, jp: 28.5 },
  { us: 11, uk: 10.5, eu: 45, jp: 29 },
  { us: 11.5, uk: 11, eu: 45.5, jp: 29.5 },
  { us: 12, uk: 11.5, eu: 46, jp: 30 },
  { us: 13, uk: 12.5, eu: 47.5, jp: 31 },
  { us: 14, uk: 13.5, eu: 48.5, jp: 32 },
  { us: 15, uk: 14.5, eu: 49.5, jp: 33 },
];

const WOMENS_SHOES: ShoeRow[] = [
  { us: 5, uk: 3, eu: 35.5, jp: 22 },
  { us: 5.5, uk: 3.5, eu: 36, jp: 22.5 },
  { us: 6, uk: 4, eu: 36.5, jp: 23 },
  { us: 6.5, uk: 4.5, eu: 37, jp: 23.5 },
  { us: 7, uk: 5, eu: 37.5, jp: 24 },
  { us: 7.5, uk: 5.5, eu: 38, jp: 24.5 },
  { us: 8, uk: 6, eu: 38.5, jp: 25 },
  { us: 8.5, uk: 6.5, eu: 39, jp: 25.5 },
  { us: 9, uk: 7, eu: 40, jp: 26 },
  { us: 9.5, uk: 7.5, eu: 40.5, jp: 26.5 },
  { us: 10, uk: 8, eu: 41, jp: 27 },
  { us: 10.5, uk: 8.5, eu: 42, jp: 27.5 },
  { us: 11, uk: 9, eu: 42.5, jp: 28 },
  { us: 12, uk: 10, eu: 44, jp: 29 },
];

/** Kids' shoes (little kid → big kid), US kids sizing. */
const KIDS_SHOES: ShoeRow[] = [
  { us: 4, uk: 3, eu: 19.5, jp: 12 },
  { us: 5, uk: 4, eu: 20.5, jp: 12.5 },
  { us: 6, uk: 5, eu: 22, jp: 13 },
  { us: 7, uk: 6, eu: 23, jp: 14 },
  { us: 8, uk: 7, eu: 24.5, jp: 15 },
  { us: 9, uk: 8, eu: 25.5, jp: 15.5 },
  { us: 10, uk: 9, eu: 27, jp: 16.5 },
  { us: 11, uk: 10, eu: 28, jp: 17 },
  { us: 12, uk: 11, eu: 29.5, jp: 18 },
  { us: 13, uk: 12, eu: 31, jp: 19 },
];

const SHOE_TABLE: Record<Fit, ShoeRow[]> = { mens: MENS_SHOES, womens: WOMENS_SHOES, kids: KIDS_SHOES };

export function shoeSizes(fit: Fit): number[] {
  return SHOE_TABLE[fit].map((r) => r.us);
}

export function convertShoe(usSize: number, fit: Fit): Record<SizeSystem, string> | null {
  const row = SHOE_TABLE[fit].find((r) => r.us === usSize);
  if (!row) return null;
  return { US: fmt(row.us), UK: fmt(row.uk), EU: fmt(row.eu), JP: `${fmt(row.jp)} cm` };
}

// ---------------------------------------------------------------------------
// Women's numeric (dresses, pants)

export function convertWomensNumeric(us: string): Record<SizeSystem, string> | null {
  const n = us === "00" ? -2 : Number(us);
  if (Number.isNaN(n)) return null;
  return {
    US: us,
    UK: fmt(Math.max(n + 4, 2)),
    EU: fmt(n + 32),
    JP: fmt(n + 5), // JP ladies' sizes step 5/7/9/11…
  };
}

export function womensNumericToAlpha(us: string): AlphaSize {
  const n = us === "00" ? -2 : Number(us);
  if (n <= 0) return "XS";
  if (n <= 6) return "S";
  if (n <= 10) return "M";
  if (n <= 14) return "L";
  if (n <= 18) return "XL";
  if (n <= 22) return "XXL";
  return "3XL";
}

// ---------------------------------------------------------------------------
// Alpha tops

/** EU/UK keep letters; JP runs roughly one size smaller. */
export function convertAlpha(size: AlphaSize): Record<SizeSystem, string> {
  const i = ALPHA_SIZES.indexOf(size);
  const jp = ALPHA_SIZES[Math.min(i + 1, ALPHA_SIZES.length - 1)] ?? size;
  return { US: size, UK: size, EU: size, JP: jp };
}

export const MENS_CHEST_IN: Partial<Record<AlphaSize, string>> = {
  XS: "32–34″", S: "34–36″", M: "38–40″", L: "42–44″", XL: "46–48″", XXL: "50–52″", "3XL": "54–56″",
};

// ---------------------------------------------------------------------------
// Men's pants

export function convertWaist(inches: number): Record<SizeSystem, string> {
  return { US: `${inches}`, UK: `${inches}`, EU: `${Math.round(inches + 16)}`, JP: `${Math.round(inches * 2.54)} cm` };
}

export function convertRing(us: number): Record<SizeSystem, string> {
  // UK uses letters; EU uses inner circumference in mm.
  const ukLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const ukIndex = Math.round(us * 2 - 1); // US 3 → F, US 7 → N
  const circ = 36.55 + us * 2.55; // inner circumference, mm
  return {
    US: fmt(us),
    UK: ukLetters[Math.min(Math.max(ukIndex, 0), 25)] ?? "?",
    EU: fmt(Math.round(circ)),
    JP: fmt(Math.max(1, Math.round(us * 2.5 - 3.5))),
  };
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

// ---------------------------------------------------------------------------
// The collected profile

export interface SizeProfile {
  fit?: Fit;
  /** Prefer a looser/tighter cut when in doubt. */
  cut?: "slim" | "regular" | "relaxed";
  top?: string;
  dressShirt?: { neck?: number; sleeve?: string };
  bottomAlpha?: string;
  waist?: number;
  inseam?: number;
  womensNumeric?: string;
  dress?: string;
  outerwear?: string;
  shoe?: number;
  shoeWidth?: (typeof SHOE_WIDTHS)[number];
  hat?: string;
  ring?: number;
  notes?: string;
}

/** A friendly one-liner for cards, e.g. "Top M · Pants 32×30 · Shoe 10". */
export function summarizeSizes(s: SizeProfile): string {
  const parts: string[] = [];
  if (s.top) parts.push(`Top ${s.top}`);
  if (s.waist) parts.push(`Pants ${s.waist}${s.inseam ? `×${s.inseam}` : ""}`);
  else if (s.womensNumeric) parts.push(`Pants ${s.womensNumeric}`);
  else if (s.bottomAlpha) parts.push(`Pants ${s.bottomAlpha}`);
  if (s.dress) parts.push(`Dress ${s.dress}`);
  if (s.shoe) parts.push(`Shoe ${s.shoe}`);
  return parts.join(" · ");
}
