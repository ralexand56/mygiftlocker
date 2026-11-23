import type { Metadata } from "next";
import { MyExchange } from "./MyExchange";

export const metadata: Metadata = { title: "Your gift exchange" };

export default async function Page({ params }: { params: Promise<{ id: string; token: string }> }) {
  const { id, token } = await params;
  return <MyExchange id={id} token={token} />;
}
