import { LOCALE_TAGS, type Locale } from "@mgl/core";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { languageAlternates, localePath } from "./site";

/**
 * Title, description, address and social preview for a public page in the visitor's
 * language. Setting `openGraph` on a page replaces the inherited one, so the shared
 * preview image is named here explicitly.
 */
export async function publicMeta(path: string, title: string, description: string, opts: { absoluteTitle?: boolean } = {}): Promise<Metadata> {
  const locale = await getLocale();
  const url = localePath(locale, path);
  return {
    title: opts.absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      title,
      description,
      url,
      locale: LOCALE_TAGS[locale as Locale].replace("-", "_"),
      images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
    },
  };
}
