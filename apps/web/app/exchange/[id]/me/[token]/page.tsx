import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MyExchange } from "./MyExchange";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("titles"))("myExchange") };
}

export default async function Page({ params }: { params: Promise<{ id: string; token: string }> }) {
  const { id, token } = await params;
  return <MyExchange id={id} token={token} />;
}
