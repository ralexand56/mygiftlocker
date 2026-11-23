import { SiteHeader } from "@/components/SiteHeader";
import { ExchangeAdmin } from "./ExchangeAdmin";

export default async function ExchangeAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="pastel-wash min-h-dvh">
      <SiteHeader />
      <ExchangeAdmin id={id} />
    </main>
  );
}
