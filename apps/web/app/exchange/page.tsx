import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { ExchangeHome } from "./ExchangeHome";

export const metadata: Metadata = { title: "Gift exchange" };

export default function ExchangePage() {
  return (
    <main className="pastel-wash min-h-dvh">
      <SiteHeader />
      <ExchangeHome />
    </main>
  );
}
