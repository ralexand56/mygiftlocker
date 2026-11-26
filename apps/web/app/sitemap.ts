import type { MetadataRoute } from "next";
import { PUBLIC_PATHS, SITE_URL } from "@/lib/site";

const PRIORITY: Record<string, number> = { "/": 1, "/exchange": 0.8, "/size-charts": 0.7, "/privacy": 0.3 };

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    lastModified: new Date(),
    changeFrequency: path === "/privacy" ? "yearly" : "monthly",
    priority: PRIORITY[path] ?? 0.6,
  }));
}
