import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
import { Account } from "./Account";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("account"))("section"), robots: { index: false } };
}

export default function AccountPage() {
  return (
    <main className="pastel-wash min-h-dvh">
      <SiteHeader />
      <Account />
    </main>
  );
}
