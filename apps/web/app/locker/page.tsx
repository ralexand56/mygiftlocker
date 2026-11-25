import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
import { Locker } from "./Locker";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("titles"))("locker") };
}

export default function LockerPage() {
  return (
    <main className="pastel-wash min-h-dvh">
      <SiteHeader />
      <Locker />
    </main>
  );
}
