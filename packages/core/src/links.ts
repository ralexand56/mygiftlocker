/** Links to wish lists people keep elsewhere (Amazon, Target, Etsy…). */

export const MAX_WISHLIST_LINKS = 5;

/** "amazon.com/hz/wishlist/…" → "https://amazon.com/hz/wishlist/…"; null if it isn't a web link. */
export function normalizeLink(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let s = raw.trim();
  if (!s || s.length > 500 || /\s/.test(s)) return null;
  if (!/^https?:\/\//i.test(s)) {
    if (!/^[\w-]+(\.[\w-]+)+(\/|$)/.test(s)) return null;
    s = `https://${s}`;
  }
  try {
    const u = new URL(s);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** Valid, de-duplicated web links, at most five. */
export function cleanWishlistLinks(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const out = input.map(normalizeLink).filter((l): l is string => !!l);
  return [...new Set(out)].slice(0, MAX_WISHLIST_LINKS);
}

const STORES: [RegExp, string][] = [
  [/(^|\.)amazon\.|(^|\.)amzn\./, "Amazon"],
  [/(^|\.)target\.com$/, "Target"],
  [/(^|\.)etsy\.com$/, "Etsy"],
  [/(^|\.)walmart\./, "Walmart"],
  [/(^|\.)mercadolivre\.|(^|\.)mercadolibre\./, "Mercado Libre"],
  [/(^|\.)bestbuy\./, "Best Buy"],
  [/(^|\.)kohls\.com$/, "Kohl's"],
  [/(^|\.)nordstrom\.com$/, "Nordstrom"],
  [/(^|\.)ikea\.com$/, "IKEA"],
  [/(^|\.)zola\.com$|(^|\.)theknot\.com$|(^|\.)myregistry\.com$|(^|\.)babylist\.com$/, "Registry"],
];

/** A friendly name for a link: the store ("Amazon") or the bare domain. */
export function linkLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return STORES.find(([re]) => re.test(host))?.[1] ?? host;
  } catch {
    return url;
  }
}
