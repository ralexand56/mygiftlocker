import { LOCALES } from "@mgl/core";
import type { MetadataRoute } from "next";
import { languageAlternates, localePath, PUBLIC_PATHS, SITE_URL } from "@/lib/site";

const PRIORITY: Record<string, number> = { "/": 1, "/exchange": 0.8, "/size-charts": 0.7, "/privacy": 0.3 };

/** Every public page in every language, each listing its translations (hreflang). */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PUBLIC_PATHS.flatMap((path) =>
    LOCALES.map((locale) => ({
      url: SITE_URL + localePath(locale, path),
      lastModified,
      changeFrequency: path === "/privacy" ? ("yearly" as const) : ("monthly" as const),
      priority: PRIORITY[path] ?? 0.6,
      alternates: { languages: languageAlternates(path, true) },
    })),
  );
}
