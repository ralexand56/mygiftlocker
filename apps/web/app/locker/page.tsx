import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { Locker } from "./Locker";

export const metadata: Metadata = { title: "My locker" };

export default function LockerPage() {
  return (
    <main className="pastel-wash min-h-dvh">
      <SiteHeader />
      <Locker />
    </main>
  );
}
