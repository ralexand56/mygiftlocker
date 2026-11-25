import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { JoinExchange } from "./JoinExchange";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("titles"))("joinExchange") };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <JoinExchange id={(await params).id} />;
}
