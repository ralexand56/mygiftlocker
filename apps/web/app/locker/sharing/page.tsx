import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { Sharing } from "./Sharing";

export const metadata: Metadata = { title: "Who can see my profile" };

export default function SharingPage() {
  return (
    <main className="pastel-wash min-h-dvh">
      <SiteHeader />
      <Sharing />
    </main>
  );
}
