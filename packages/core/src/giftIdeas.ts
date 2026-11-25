/**
 * "Find the perfect gift": the idea shape the AI returns, the person summary it reads,
 * and shop links (optionally affiliate-tagged). Pure logic shared by the backend
 * function (amplify/functions/gift-ideas) and the web.
 */
import { upcomingEventsFor } from "./events";
import { linkTitle } from "./links";
import type { Person } from "./people";
import { summarizeSizes } from "./sizes";

export const GIFT_STORES = ["amazon", "etsy", "target", "walmart"] as const;
export type GiftStore = (typeof GIFT_STORES)[number];

export const GIFT_CATEGORIES = ["clothing", "accessories", "home", "experience", "hobby", "tech", "beauty", "books", "food", "kids", "other"] as const;
export type GiftCategory = (typeof GIFT_CATEGORIES)[number];

export interface GiftIdea {
  id: string;
  title: string;
  /** Why it fits this person, in a sentence. */
  why: string;
  priceMin: number;
  priceMax: number;
  category: GiftCategory;
  store: GiftStore;
  /** What to type into the store's search box. */
  searchQuery: string;
}

/** Most photos kept per person (they're sent to the AI as images). */
export const MAX_PERSON_PHOTOS = 5;
/** Gift lists (first lists and refinements) each account may run per day. */
export const DAILY_GIFT_RUNS = 10;
export const MAX_GIFT_REQUEST = 300;

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.round(v) : 0);

/** Validates ideas from the model (or storage): drops broken ones, caps lengths, at most 15. */
export function cleanGiftIdeas(input: unknown): GiftIdea[] {
  if (!Array.isArray(input)) return [];
  const out: GiftIdea[] = [];
  for (const [i, raw] of input.entries()) {
    if (!raw || typeof raw !== "object") continue;
    const o = raw as Record<string, unknown>;
    const title = str(o.title, 120);
    const searchQuery = str(o.searchQuery, 120) || title;
    if (!title) continue;
    const priceMin = num(o.priceMin);
    const priceMax = Math.max(priceMin, num(o.priceMax));
    out.push({
      id: str(o.id, 40) || `idea-${i + 1}`,
      title,
      why: str(o.why, 400),
      priceMin,
      priceMax,
      category: (GIFT_CATEGORIES as readonly string[]).includes(o.category as string) ? (o.category as GiftCategory) : "other",
      store: (GIFT_STORES as readonly string[]).includes(o.store as string) ? (o.store as GiftStore) : "amazon",
      searchQuery,
    });
    if (out.length >= 15) break;
  }
  return out;
}

export interface AffiliateConfig {
  /** Amazon Associates tag, e.g. "mygiftlockers-20". */
  amazonTag?: string;
  /** Sovrn Commerce (VigLink) key: wraps links to other stores. */
  sovrnKey?: string;
  /** Skimlinks publisher id: used for other stores when there's no Sovrn key. */
  skimlinksId?: string;
}

const SEARCH: Record<GiftStore, (q: string) => string> = {
  amazon: (q) => `https://www.amazon.com/s?k=${q}`,
  etsy: (q) => `https://www.etsy.com/search?q=${q}`,
  target: (q) => `https://www.target.com/s?searchTerm=${q}`,
  walmart: (q) => `https://www.walmart.com/search?q=${q}`,
};

/** A store search for the idea; affiliate-tagged when the site has the program set up. */
export function giftShopUrl(idea: Pick<GiftIdea, "store" | "searchQuery">, affiliate: AffiliateConfig = {}): string {
  const plain = SEARCH[idea.store](encodeURIComponent(idea.searchQuery));
  if (idea.store === "amazon") return affiliate.amazonTag ? `${plain}&tag=${encodeURIComponent(affiliate.amazonTag)}` : plain;
  if (affiliate.sovrnKey) return `https://redirect.viglink.com/?key=${encodeURIComponent(affiliate.sovrnKey)}&u=${encodeURIComponent(plain)}`;
  if (affiliate.skimlinksId) return `https://go.skimresources.com/?id=${encodeURIComponent(affiliate.skimlinksId)}&url=${encodeURIComponent(plain)}`;
  return plain;
}

/** True when any affiliate program is on, so the page must show a disclosure. */
export const hasAffiliate = (a: AffiliateConfig) => !!(a.amazonTag || a.sovrnKey || a.skimlinksId);

/**
 * Everything known about a person, as plain English lines for the model.
 * Leaves out the address (not needed to pick a gift).
 */
export function giftContext(p: Person, today = new Date()): string {
  const lines: string[] = [`Name: ${p.name}`];
  if (p.relationship) lines.push(`Relationship to me: ${p.relationship}`);
  lines.push(`Kind: ${p.kind === "child" ? "child" : "adult"}`);
  if (p.birthday?.year) lines.push(`Age: about ${today.getFullYear() - p.birthday.year}`);
  if (p.sizes?.fit) lines.push(`Shops in: ${p.sizes.fit === "mens" ? "men's" : p.sizes.fit === "womens" ? "women's" : "kids'"} sections`);
  const sizes = summarizeSizes(p.sizes ?? {});
  if (sizes) lines.push(`Sizes (US): ${sizes}${p.sizes?.ring ? ` · Ring ${p.sizes.ring}` : ""}${p.sizes?.hat ? ` · Hat ${p.sizes.hat}` : ""}`);
  if (p.sizes?.notes) lines.push(`Size notes: ${p.sizes.notes}`);
  const f = p.favorites;
  if (f?.colors?.length) lines.push(`Favorite colors: ${f.colors.join(", ")}`);
  if (f?.likes) lines.push(`Loves: ${f.likes}`);
  if (f?.teams) lines.push(`Favorite sports teams: ${f.teams}`);
  if (f?.avoid) lines.push(`Avoid: ${f.avoid}`);
  const wishes = f?.wishes?.filter(Boolean) ?? [];
  if (wishes.length) lines.push(`Their own wishes: ${wishes.join("; ")}`);
  if (f?.wishlists?.length) lines.push(`Keeps lists at: ${f.wishlists.map((u) => linkTitle(u)).join(", ")}`);
  const soon = upcomingEventsFor(p, today)
    .filter((e) => e.days <= 120)
    .slice(0, 4)
    .map((e) => `${e.label} in ${e.days} days${e.milestone && e.milestone > 0 ? ` (${e.kind === "birthday" ? `turning ${e.milestone}` : `${e.milestone} years`})` : ""}`);
  if (soon.length) lines.push(`Coming up: ${soon.join("; ")}`);
  if (p.ownerNote?.trim()) lines.push(`My private notes about them: ${p.ownerNote.trim()}`);
  return lines.join("\n");
}
