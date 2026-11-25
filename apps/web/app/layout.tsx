import type { Metadata, Viewport } from "next";
import { Fraunces, Lora, Nunito } from "next/font/google";
import { MotionConfig } from "motion/react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { I18nBridge } from "@/components/I18nBridge";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin", "latin-ext"], variable: "--font-fraunces", axes: ["opsz", "SOFT"] });
// Fraunces has no Cyrillic; Lora fills in Russian headings (the browser picks it per glyph).
const lora = Lora({ subsets: ["cyrillic"], variable: "--font-lora" });
const nunito = Nunito({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-nunito" });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: { default: "My Gift Lockers", template: "%s · My Gift Lockers" },
    description: t("description"),
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://mygiftlockers.com"),
    openGraph: { siteName: "My Gift Lockers", images: ["/lockup.svg"] },
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
