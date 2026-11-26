import { getTranslations } from "next-intl/server";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { publicMeta } from "@/lib/site";
import { ExchangeHome } from "./ExchangeHome";

export async function generateMetadata() {
  const t = await getTranslations("meta");
  return publicMeta(t("exchangeTitle"), t("exchangeDescription"));
}

const FAQ = ["free", "accounts", "secret", "exclusions", "budget", "apart", "kids", "circle"] as const;

export default async function ExchangePage() {
  const t = await getTranslations("exchangeFaq");
  const faq = FAQ.map((k) => ({ q: t(`items.${k}.q`), a: t(`items.${k}.a`) }));
  const structured = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <main className="pastel-wash min-h-dvh">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured) }} />
      <SiteHeader />
      <ExchangeHome />
      <section className="mx-auto max-w-3xl px-5 pb-24">
        <h2 className="font-display text-3xl font-semibold tracking-tight">{t("title")}</h2>
        <div className="mt-6 space-y-3">
          {faq.map((f) => (
            <details key={f.q} className="glass group rounded-[22px] p-5 shadow-soft">
              <summary className="cursor-pointer list-none font-bold marker:hidden">
                {f.q}
                <span className="float-right text-ink-soft transition-transform group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-3 text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
