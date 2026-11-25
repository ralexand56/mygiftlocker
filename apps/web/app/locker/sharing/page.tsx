import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
import { Sharing } from "./Sharing";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("titles"))("sharing") };
}

export default function SharingPage() {
  return (
    <main className="pastel-wash min-h-dvh">
      <SiteHeader />
      <Sharing />
    </main>
  );
}
