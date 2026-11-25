import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
import { ConnectFlow } from "./ConnectFlow";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("titles"))("connect") };
}

export default async function ConnectPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="pastel-wash min-h-dvh">
      <SiteHeader />
      <ConnectFlow inviteId={(await params).id} />
    </main>
  );
}
