import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ReminderSettings } from "./ReminderSettings";

export const metadata: Metadata = { title: "Reminder emails", robots: { index: false } };

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
