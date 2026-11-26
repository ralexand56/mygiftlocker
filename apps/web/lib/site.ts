import { LOCALE_TAGS, LOCALES, type Locale } from "@mgl/core";

/** The site's one public address (the bare domain redirects here). */
export const SITE_URL = "https://www.mygiftlockers.com";

/** Pages search engines may list. Everything else is private (sign-in, tokens) and kept out. */
export const PUBLIC_PATHS = [
  "/",
  "/exchange",
  "/size-charts",
  "/size-charts/shoes",
  "/size-charts/clothing",
  "/size-charts/rings",
  "/privacy",
] as const;

export const isPublicPath = (path: string) => (PUBLIC_PATHS as readonly string[]).includes(path);

/** Path prefixes that are never indexed: signed-in areas and links carrying private tokens. */
export const PRIVATE_PREFIXES = ["/locker", "/join", "/connect", "/exchange/", "/invite", "/sign-in", "/auth", "/reminders"] as const;

/**
 * Public pages have an address per language: English at the plain path, others under
 * /es, /fr, /pt, /ru (proxy.ts serves those from the same pages in that language).
 * Private pages keep one address for everyone, so shared links work in any language.
 */
export const LOCALE_HEADER = "x-mgl-locale";

export function localePath(locale: string, path: string): string {
  if (locale === "en" || !(LOCALES as readonly string[]).includes(locale)) return path;
  return `/${locale}${path === "/" ? "" : path}`;
}

/** hreflang code per language (Portuguese is Brazilian). */
export const HREFLANG: Record<Locale, string> = { ...LOCALE_TAGS, en: "en" };

/** Every language's address for a public page, plus x-default (English). */
export function languageAlternates(path: string, absolute = false): Record<string, string> {
  const base = absolute ? SITE_URL : "";
  const out: Record<string, string> = {};
  for (const l of LOCALES) out[HREFLANG[l]] = base + localePath(l, path);
  out["x-default"] = base + path;
  return out;
}
