import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { ConnectFlow } from "./ConnectFlow";

export const metadata: Metadata = { title: "Connect profiles" };

export default async function ConnectPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="pastel-wash min-h-dvh">
      <SiteHeader />
      <ConnectFlow inviteId={(await params).id} />
    </main>
  );
}
