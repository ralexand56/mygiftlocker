/**
 * What a signed-in participant can share with whoever draws them in a gift
 * exchange: sizes and favorites from their own profile. Never their address or dates.
 */
import type { Favorites, Person } from "./people";
import type { SizeProfile } from "./sizes";

export interface SharedProfile {
  sizes?: SizeProfile;
  favorites?: Pick<Favorites, "colors" | "likes" | "avoid">;
}

const text = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);
const num = (v: unknown, min: number, max: number) => (typeof v === "number" && Number.isFinite(v) && v >= min && v <= max ? v : undefined);

const SIZE_TEXT = ["fit", "cut", "top", "bottomAlpha", "womensNumeric", "dress", "outerwear", "shoeWidth", "hat"] as const;

function cleanSizes(input: unknown): SizeProfile | undefined {
  if (!input || typeof input !== "object") return undefined;
  const s = input as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of SIZE_TEXT) if (text(s[k], 20)) out[k] = text(s[k], 20);
  const nums: [keyof SizeProfile, number, number][] = [
    ["waist", 10, 80],
    ["inseam", 10, 50],
    ["shoe", 0, 25],
    ["footLengthCm", 5, 40],
    ["ring", 1, 20],
  ];
  for (const [k, min, max] of nums) if (num(s[k], min, max) !== undefined) out[k] = s[k];
  const ds = s.dressShirt as Record<string, unknown> | undefined;
  if (ds && typeof ds === "object") {
    const neck = num(ds.neck, 10, 25);
    const sleeve = text(ds.sleeve, 10);
    if (neck || sleeve) out.dressShirt = { neck, sleeve };
  }
  if (text(s.notes, 300)) out.notes = text(s.notes, 300);
  return Object.keys(out).length ? (out as SizeProfile) : undefined;
}

/** Trims and caps a shared profile from an untrusted source; undefined when nothing's left. */
export function cleanShared(input: unknown): SharedProfile | undefined {
  if (!input || typeof input !== "object") return undefined;
  const s = input as Record<string, unknown>;
  const sizes = cleanSizes(s.sizes);
  const f = (s.favorites ?? {}) as Record<string, unknown>;
  const colors = Array.isArray(f.colors) ? f.colors.map((c) => text(c, 30)).filter((c): c is string => !!c).slice(0, 8) : [];
  const favorites = { colors: colors.length ? colors : undefined, likes: text(f.likes, 500), avoid: text(f.avoid, 500) };
  const hasFavorites = !!(favorites.colors || favorites.likes || favorites.avoid);
  if (!sizes && !hasFavorites) return undefined;
  return { ...(sizes && { sizes }), ...(hasFavorites && { favorites }) };
}

/** The shareable part of someone's own profile. */
export function sharedFromPerson(p: Pick<Person, "sizes" | "favorites">): SharedProfile | undefined {
  return cleanShared({ sizes: p.sizes, favorites: p.favorites });
}
