import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { InviteBuilder } from "./InviteBuilder";

export const metadata: Metadata = { title: "Invite someone" };

export default function InvitePage() {
  return (
    <main className="pastel-wash min-h-dvh">
      <SiteHeader />
      <InviteBuilder />
    </main>
  );
}
