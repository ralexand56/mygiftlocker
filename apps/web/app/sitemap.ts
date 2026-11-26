import type { MetadataRoute } from "next";
import { PUBLIC_PATHS, SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const priority: Record<string, number> = { "/": 1, "/exchange": 0.8, "/privacy": 0.3 };
  return PUBLIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    lastModified: new Date(),
    changeFrequency: path === "/privacy" ? "yearly" : "monthly",
    priority: priority[path],
  }));
}
