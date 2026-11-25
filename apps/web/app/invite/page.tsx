import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
import { InviteBuilder } from "./InviteBuilder";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("titles"))("invite") };
}

export default function InvitePage() {
  return (
    <main className="pastel-wash min-h-dvh">
      <SiteHeader />
      <InviteBuilder />
    </main>
  );
}
