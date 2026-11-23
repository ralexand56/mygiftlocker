import type { Metadata } from "next";
import { JoinLoader } from "./JoinLoader";

export const metadata: Metadata = { title: "You're invited" };

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  return <JoinLoader segment={(await params).token} />;
}
