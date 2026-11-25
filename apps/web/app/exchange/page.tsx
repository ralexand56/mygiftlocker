import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
import { ExchangeHome } from "./ExchangeHome";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("titles"))("exchange") };
}

export default function ExchangePage() {
  return (
    <main className="pastel-wash min-h-dvh">
      <SiteHeader />
      <ExchangeHome />
    </main>
  );
}
