import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ReminderSettings } from "./ReminderSettings";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("titles"))("reminders"), robots: { index: false } };
}

export default function RemindersPage() {
  return (
    <main className="pastel-wash min-h-dvh">
      <SiteHeader />
      <Suspense>
        <ReminderSettings />
      </Suspense>
    </main>
  );
}
