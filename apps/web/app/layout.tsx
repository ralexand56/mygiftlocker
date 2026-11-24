import type { Metadata, Viewport } from "next";
import { Fraunces, Nunito } from "next/font/google";
import { MotionConfig } from "motion/react";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", axes: ["opsz", "SOFT"] });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });

export const metadata: Metadata = {
  title: { default: "My Gift Lockers", template: "%s · My Gift Lockers" },
  description: "Keep everyone's sizes, addresses and special dates in one place — and run joyful gift exchanges.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://mygiftlockers.com"),
  openGraph: { siteName: "My Gift Lockers", images: ["/lockup.svg"] },
};

export const viewport: Viewport = { themeColor: "#fffaf7" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${nunito.variable}`}>
      <body className="min-h-dvh">
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </body>
    </html>
  );
}
