import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { JoinLoader } from "./JoinLoader";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("titles"))("join") };
}

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  return <JoinLoader segment={(await params).token} />;
}
