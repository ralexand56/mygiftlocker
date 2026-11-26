import { SignedInRedirect } from "@/components/SignedInRedirect";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { HeroCollage } from "@/components/HeroCollage";
import { TourButton } from "@/components/TourVideo";
import { Button } from "@/components/ui";
import { BellRing, CalendarHeart, ExternalLink, Gift, Ruler, Shuffle, Sparkles, Users, Baby } from "lucide-react";
import { useTranslations } from "next-intl";
import { publicMeta } from "@/lib/meta";
import { SITE_URL } from "@/lib/site";
import { useLocalePath } from "@/lib/use-locale-path";
import { getTranslations } from "next-intl/server";

const FEATURES = [
  { id: "sizes", icon: Ruler, tint: "bg-blush" },
  { id: "dates", icon: CalendarHeart, tint: "bg-lavender" },
  { id: "exchanges", icon: Shuffle, tint: "bg-mint" },
  { id: "invite", icon: Users, tint: "bg-butter" },
  { id: "kids", icon: Baby, tint: "bg-sky" },
  { id: "devices", icon: Gift, tint: "bg-peach" },
] as const;

/** A sample gift idea; also verifies the site with Sovrn Commerce (affiliate program). */
const EXAMPLE_IDEA_URL = "https://sovrn.co/dmq0v03";

/** Tells search engines what the site is: a free web app (structured data, schema.org). */
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL, name: "My Gift Lockers" },
    {
      "@type": "WebApplication",
      name: "My Gift Lockers",
      url: SITE_URL,
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      featureList: ["Clothing, shoe and ring sizes with international conversions", "Birthday, anniversary and holiday reminder emails", "Gift ideas for each person", "Secret Santa gift exchanges"],
      inLanguage: ["en", "es", "fr", "pt-BR", "ru"],
    },
    {
      "@type": "VideoObject",
      name: "My Gift Lockers in 45 seconds",
      description: "A quick tour: keep everyone's sizes, birthdays and wish lists in one place, get AI gift ideas and reminders before every birthday, and run Secret Santa.",
      thumbnailUrl: `${SITE_URL}/video/tour-en-16x9.jpg`,
      contentUrl: `${SITE_URL}/video/tour-en-16x9.mp4`,
      uploadDate: "2026-11-26",
      duration: "PT45S",
      inLanguage: "en",
    },
  ],
};

export async function generateMetadata() {
  const t = await getTranslations("meta");
  return publicMeta("/", t("homeTitle"), t("description"), { absoluteTitle: true });
}

export default function Home() {
  const t = useTranslations("home");
  const href = useLocalePath();
  return (
    <main className="pastel-wash min-h-dvh overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }} />
      <SignedInRedirect />
      <SiteHeader />

      <section className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pt-6 pb-20 md:grid-cols-[1.1fr_1fr] md:pt-16">
        <div className="relative z-10">
          <p className="mb-4 inline-flex rounded-full bg-white/70 px-4 py-1.5 text-sm font-bold text-plum shadow-soft">
            {t("eyebrow")}
          </p>
          <h1 className="font-display text-5xl leading-[1.02] font-semibold tracking-tight text-balance md:text-7xl">
            {t.rich("title", { em: (c) => <em className="text-rose not-italic">{c}</em> })}
          </h1>
          <p className="mt-6 max-w-lg text-lg text-ink-soft">
            {t("lede")}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button href="/invite">{t("invite")}</Button>
            <Button href={href("/exchange")} variant="soft">
              {t("startExchange")}
            </Button>
          </div>
          <TourButton className="mt-6" />
          <p className="mt-5 flex items-center gap-2 text-sm font-bold text-ink-soft">
            <BellRing className="h-4 w-4 shrink-0 text-rose" aria-hidden /> {t("reminderLine")}
          </p>
        </div>
        <HeroCollage />
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-28">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.id} className="glass rounded-[28px] p-7 shadow-soft">
              <span className={`mb-5 inline-grid h-12 w-12 place-items-center rounded-2xl ${f.tint}`}>
                <f.icon className="h-6 w-6 text-ink" strokeWidth={2.2} />
              </span>
              <h3 className="font-display text-xl font-semibold">{t(`features.${f.id}.title`)}</h3>
              <p className="mt-2 text-ink-soft">{t(`features.${f.id}.body`)}</p>
            </div>
          ))}
          <div className="glass rounded-[28px] p-7 shadow-soft sm:col-span-2 lg:col-span-3">
            <div className="flex flex-wrap items-start gap-5">
              <span className="inline-grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-rose to-plum">
                <Sparkles className="h-6 w-6 text-white" strokeWidth={2.2} />
              </span>
              <div className="min-w-0 flex-1 basis-72">
                <h3 className="font-display text-xl font-semibold">{t("ideas.title")}</h3>
                <p className="mt-2 text-ink-soft">{t("ideas.body")}</p>
                <p className="mt-4 text-sm font-bold text-ink-soft">{t("ideas.example")}</p>
                <a
                  href={EXAMPLE_IDEA_URL}
                  target="_blank"
                  rel="sponsored noopener"
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blush/60 px-4 py-2 text-sm font-bold text-ink hover:bg-blush"
                >
                  {t("ideas.exampleLink")} <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <p className="mt-2 text-xs text-ink-soft">{t("ideas.affiliate")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
