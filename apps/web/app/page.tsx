import { SignedInRedirect } from "@/components/SignedInRedirect";
import { SiteHeader } from "@/components/SiteHeader";
import { HeroCollage } from "@/components/HeroCollage";
import { Button } from "@/components/ui";
import { CalendarHeart, Gift, Ruler, Shuffle, Users, Baby } from "lucide-react";
import { useTranslations } from "next-intl";

const FEATURES = [
  { id: "sizes", icon: Ruler, tint: "bg-blush" },
  { id: "dates", icon: CalendarHeart, tint: "bg-lavender" },
  { id: "exchanges", icon: Shuffle, tint: "bg-mint" },
  { id: "invite", icon: Users, tint: "bg-butter" },
  { id: "kids", icon: Baby, tint: "bg-sky" },
  { id: "devices", icon: Gift, tint: "bg-peach" },
] as const;

export default function Home() {
  const t = useTranslations("home");
  return (
    <main className="pastel-wash min-h-dvh overflow-x-clip">
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
            <Button href="/exchange" variant="soft">
              {t("startExchange")}
            </Button>
          </div>
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
        </div>
      </section>

      <footer className="pb-10 text-center text-sm text-ink-soft">
        © {new Date().getFullYear()} My Gift Lockers · mygiftlockers.com ·{" "}
        <a href="/privacy" className="underline hover:text-ink">
          {t("privacy")}
        </a>
      </footer>
    </main>
  );
}
