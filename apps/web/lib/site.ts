import type { Metadata } from "next";

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

/** Path prefixes that are never indexed: signed-in areas and links carrying private tokens. */
export const PRIVATE_PREFIXES = ["/locker", "/join", "/connect", "/exchange/", "/invite", "/sign-in", "/auth", "/reminders"] as const;

/**
 * Title, description and social preview for a public page. Setting `openGraph` on a page
 * replaces the inherited one, so the shared preview image is named here explicitly.
 */
export function publicMeta(title: string, description: string): Metadata {
  return {
    title,
    description,
    openGraph: { title, description, url: "./", images: [{ url: "/opengraph-image", width: 1200, height: 630 }] },
  };
}
