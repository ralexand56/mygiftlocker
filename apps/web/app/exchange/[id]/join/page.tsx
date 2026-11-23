import type { Metadata } from "next";
import { JoinExchange } from "./JoinExchange";

export const metadata: Metadata = { title: "Join the gift exchange" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <JoinExchange id={(await params).id} />;
}
