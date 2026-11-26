import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
import { ExchangeHome } from "./ExchangeHome";

export async function generateMetadata(): Promise<Metadata> {
  const title = (await getTranslations("titles"))("exchange");
  const description = (await getTranslations("meta"))("exchangeDescription");
  return { title, description, openGraph: { title, description, url: "./" } };
}

export default function ExchangePage() {
  return (
    <main className="pastel-wash min-h-dvh">
      <SiteHeader />
      <ExchangeHome />
    </main>
  );
}
