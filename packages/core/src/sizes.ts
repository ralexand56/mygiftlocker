/**
 * Clothing size catalog + conversions.
 *
 * Everything is stored in US sizing; other systems are display conversions and
 * approximate (brands vary). Values starting with "≈" are rules of thumb where
 * published charts disagree. Tables are data so regions can be added without UI code.
 *
 * Latin America (researched Nov 2026):
 *  - BR shoes: Nike Brasil's official chart (static.nike.com.br/web/prd/tabela-de-medidas.html).
 *    Clothing: PP/P/M/G/GG/XG letters; women's numeric ≈ US + 34 (36 = US 2).
 *  - MX shoes: labeled in centimeters (same number as JP/CM). Clothing: XCH/CH/M/G/EG
 *    letters; women's pants ≈ US + 24 (24 = US 0). Men's waist in inches.
 *  - CO shoes: ≈ US + 30 (women) / + 31 (men), per Nike/ASICS Colombia guides;
 *    other charts differ by 1–2. Clothing: US letters; women's numeric ≈ US + 2.
 */

import { defaultT, type Tr } from "./i18n";

export type SizeSystem = "US" | "UK" | "EU" | "JP" | "BR" | "MX" | "CO";
export const SIZE_SYSTEMS: SizeSystem[] = ["US", "UK", "EU", "JP", "BR", "MX", "CO"];

export const SIZE_SYSTEM_LABELS: Record<SizeSystem, string> = {
  US: "United States",
  UK: "United Kingdom",
  EU: "Europe",
  JP: "Japan",
  BR: "Brazil",
  MX: "Mexico",
  CO: "Colombia",
};

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

/** jp = cm label (Japan and Mexico label shoes by cm). br = Nike Brasil chart; absent → estimated from EU. */
type ShoeRow = { us: number; uk: number; eu: number; jp: number; br?: number };

const MENS_SHOES: ShoeRow[] = [
  { us: 6, uk: 5.5, eu: 39, jp: 24, br: 37 },
  { us: 6.5, uk: 6, eu: 39.5, jp: 24.5, br: 37.5 },
  { us: 7, uk: 6.5, eu: 40, jp: 25, br: 38 },
  { us: 7.5, uk: 7, eu: 40.5, jp: 25.5, br: 39 },
  { us: 8, uk: 7.5, eu: 41, jp: 26, br: 39.5 },
  { us: 8.5, uk: 8, eu: 42, jp: 26.5, br: 40 },
  { us: 9, uk: 8.5, eu: 42.5, jp: 27, br: 40.5 },
  { us: 9.5, uk: 9, eu: 43, jp: 27.5, br: 41 },
  { us: 10, uk: 9.5, eu: 44, jp: 28, br: 42 },
  { us: 10.5, uk: 10, eu: 44.5, jp: 28.5, br: 42.5 },
  { us: 11, uk: 10.5, eu: 45, jp: 29, br: 43 },
  { us: 11.5, uk: 11, eu: 45.5, jp: 29.5, br: 43.5 },
  { us: 12, uk: 11.5, eu: 46, jp: 30, br: 44 },
  { us: 13, uk: 12.5, eu: 47.5, jp: 31, br: 46 },
  { us: 14, uk: 13.5, eu: 48.5, jp: 32 },
  { us: 15, uk: 14.5, eu: 49.5, jp: 33 },
];

const WOMENS_SHOES: ShoeRow[] = [
  { us: 5, uk: 3, eu: 35.5, jp: 22, br: 33.5 },
  { us: 5.5, uk: 3.5, eu: 36, jp: 22.5, br: 34 },
  { us: 6, uk: 4, eu: 36.5, jp: 23, br: 35 },
  { us: 6.5, uk: 4.5, eu: 37, jp: 23.5, br: 35.5 },
  { us: 7, uk: 5, eu: 37.5, jp: 24, br: 36 },
  { us: 7.5, uk: 5.5, eu: 38, jp: 24.5, br: 37 },
  { us: 8, uk: 6, eu: 38.5, jp: 25, br: 37.5 },
  { us: 8.5, uk: 6.5, eu: 39, jp: 25.5, br: 38 },
  { us: 9, uk: 7, eu: 40, jp: 26, br: 39 },
  { us: 9.5, uk: 7.5, eu: 40.5, jp: 26.5, br: 39.5 },
  { us: 10, uk: 8, eu: 41, jp: 27, br: 40 },
  { us: 10.5, uk: 8.5, eu: 42, jp: 27.5, br: 41 },
  { us: 11, uk: 9, eu: 42.5, jp: 28, br: 41.5 },
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
  // Colombia: US + 30 (women) / + 31 (men); kids' charts follow EU numbering about one lower.
  const co = fit === "kids" ? `≈${fmt(Math.round(row.eu) - 1)}` : `≈${fmt(row.us + (fit === "mens" ? 31 : 30))}`;
  return {
    US: fmt(row.us),
    UK: fmt(row.uk),
    EU: fmt(row.eu),
    JP: `${fmt(row.jp)} cm`,
    // Beyond Nike Brasil's chart: adults run ~1.5 below EU (US 13 = BR 46 = EU 47.5), kids ~1.
    BR: row.br !== undefined ? fmt(row.br) : `≈${fmt(Math.round(row.eu - (fit === "kids" ? 1 : 1.5)))}`,
    MX: fmt(row.jp),
    CO: co,
  };
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
    BR: fmt(n + 34), // 36 = US 2 … 44 = US 10
    MX: `≈${fmt(n + 24)}`, // pants 22–44 ↔ US 00–20
    CO: `≈${fmt(n + 2)}`, // shops run ~one step above US (8 ≈ S)
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

/** Brazil: PP (XS), P (S), M, G (L), GG (XL), XG (XXL)… */
const BR_ALPHA: Record<AlphaSize, string> = { XXS: "PPP", XS: "PP", S: "P", M: "M", L: "G", XL: "GG", XXL: "XG", "3XL": "XGG", "4XL": "XXGG" };
/** Mexico: XCH (XS), CH (S), M, G (L), EG (XL), EEG (XXL)… */
const MX_ALPHA: Record<AlphaSize, string> = { XXS: "XXCH", XS: "XCH", S: "CH", M: "M", L: "G", XL: "EG", XXL: "EEG", "3XL": "3EG", "4XL": "4EG" };

/** EU/UK/Colombia keep letters; JP runs roughly one size smaller. */
export function convertAlpha(size: AlphaSize): Record<SizeSystem, string> {
  const i = ALPHA_SIZES.indexOf(size);
  const jp = ALPHA_SIZES[Math.min(i + 1, ALPHA_SIZES.length - 1)] ?? size;
  return { US: size, UK: size, EU: size, JP: jp, BR: BR_ALPHA[size], MX: MX_ALPHA[size], CO: size };
}

export const MENS_CHEST_IN: Partial<Record<AlphaSize, string>> = {
  XS: "32–34″", S: "34–36″", M: "38–40″", L: "42–44″", XL: "46–48″", XXL: "50–52″", "3XL": "54–56″",
};

// ---------------------------------------------------------------------------
// Men's pants

export function convertWaist(inches: number): Record<SizeSystem, string> {
  // Brazil's men's pants run even numbers ≈ waist + 10 (BR 42 ≈ 32″); MX/CO use inches.
  const br = Math.round((inches + 10) / 2) * 2;
  return { US: `${inches}`, UK: `${inches}`, EU: `${Math.round(inches + 16)}`, JP: `${Math.round(inches * 2.54)} cm`, BR: `≈${br}`, MX: `${inches}`, CO: `${inches}` };
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
    // Brazil's "aro" numbers vary by jeweler; inner circumference is unambiguous.
    BR: `${fmt(Math.round(circ))} mm`,
    MX: fmt(us),
    CO: fmt(us),
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
  /** Heel-to-toe foot length in cm: the one shoe measure that converts reliably everywhere. */
  footLengthCm?: number;
  hat?: string;
  ring?: number;
  notes?: string;
}

/** A friendly one-liner for cards, e.g. "Top M · Pants 32×30 · Shoe 10". */
export function summarizeSizes(s: SizeProfile, t: Tr = defaultT): string {
  const parts: string[] = [];
  const add = (k: string, v: string | number) => parts.push(t(`core.summary.${k}`, { v: String(v) }));
  if (s.top) add("top", s.top);
  if (s.waist) add("pants", `${s.waist}${s.inseam ? `×${s.inseam}` : ""}`);
  else if (s.womensNumeric) add("pants", s.womensNumeric);
  else if (s.bottomAlpha) add("pants", s.bottomAlpha);
  if (s.dress) add("dress", s.dress);
  if (s.shoe) add("shoe", s.shoe);
  if (s.footLengthCm) add("foot", fmt(s.footLengthCm));
  return parts.join(" · ");
}

/** A size value as shown: words like "Preemie" or "One size" translated, codes left as they are. */
export function sizeValueLabel(v: string, t: Tr = defaultT): string {
  return ["Preemie", "NB", "One size"].includes(v) ? t(`core.sizeWord.${v}`) : v;
}
