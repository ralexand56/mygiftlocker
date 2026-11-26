import type { Metadata, Viewport } from "next";
import { Fraunces, Lora, Nunito } from "next/font/google";
import { MotionConfig } from "motion/react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { I18nBridge } from "@/components/I18nBridge";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin", "latin-ext"], variable: "--font-fraunces", axes: ["opsz", "SOFT"] });
// Fraunces has no Cyrillic; Lora fills in Russian headings (the browser picks it per glyph).
const lora = Lora({ subsets: ["cyrillic"], variable: "--font-lora" });
const nunito = Nunito({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-nunito" });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: { default: t("homeTitle"), template: "%s · My Gift Lockers" },
    description: t("description"),
    applicationName: "My Gift Lockers",
    metadataBase: new URL(SITE_URL),
    // Each page names its own address as the one to list (www, no query strings).
    alternates: { canonical: "./" },
    // The preview image comes from app/opengraph-image.tsx.
    openGraph: { siteName: "My Gift Lockers", type: "website", title: t("homeTitle"), description: t("description"), url: "./" },
    twitter: { card: "summary_large_image", title: t("homeTitle"), description: t("description") },
  };
}

// The design is light-only; "only light" asks browsers not to auto-darken it.
export const viewport: Viewport = { themeColor: "#fffaf7", colorScheme: "only light" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${fraunces.variable} ${lora.variable} ${nunito.variable}`}>
      <body className="min-h-dvh">
        <NextIntlClientProvider>
          <I18nBridge />
          <MotionConfig reducedMotion="user">{children}</MotionConfig>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
