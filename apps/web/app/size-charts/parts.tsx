/**
 * Building blocks for the public size chart pages: plain server-rendered HTML tables
 * (so search engines can read them), built from the same conversion data the locker uses.
 */
import { SIZE_SYSTEMS, type SizeSystem } from "@mgl/core";
import { ChevronRight, Footprints, Gem, Shirt } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui";
import { publicMeta, SITE_URL } from "@/lib/site";

export const CHARTS = [
  { id: "shoes", icon: Footprints, tint: "bg-blush" },
  { id: "clothing", icon: Shirt, tint: "bg-lavender" },
  { id: "rings", icon: Gem, tint: "bg-butter" },
] as const;
export type ChartId = (typeof CHARTS)[number]["id"];

export async function chartMeta(page: ChartId | "hub") {
  const t = await getTranslations(`sizeCharts.${page}`);
  return publicMeta(t("metaTitle"), t("metaDescription"));
}

/** A conversion table: one row per size, one column per sizing system (plus any extras). */
export function SizeTable({
  title,
  note,
  rows,
  extra = [],
  systems = SIZE_SYSTEMS,
}: {
  title: string;
  note?: string;
  rows: Record<string, string>[];
  /** Extra columns after the sizing systems, e.g. chest measurement. */
  extra?: { key: string; label: string }[];
  systems?: readonly SizeSystem[];
}) {
  const core = useTranslations("core.sizeSystem");
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      {note && <p className="mt-2 text-sm text-ink-soft">{note}</p>}
      <div className="glass mt-4 overflow-x-auto rounded-[24px] shadow-soft">
        <table className="w-full min-w-[36rem] border-collapse text-center text-[15px] tabular-nums">
          <thead>
            <tr className="border-b border-ink/10">
              {systems.map((s) => (
                <th key={s} scope="col" className="px-3 py-3 font-bold first:sticky first:left-0 first:bg-white/90">
                  {s}
                  <span className="block text-[11px] font-normal text-ink-soft">{core(s)}</span>
                </th>
              ))}
              {extra.map((c) => (
                <th key={c.key} scope="col" className="px-3 py-3 font-bold">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-ink/5 last:border-0 even:bg-white/30">
                {systems.map((s, j) =>
                  j === 0 ? (
                    <th key={s} scope="row" className="sticky left-0 bg-white/90 px-3 py-2 font-bold">
                      {r[s]}
                    </th>
                  ) : (
                    <td key={s} className="px-3 py-2">
                      {r[s]}
                    </td>
                  ),
                )}
                {extra.map((c) => (
                  <td key={c.key} className="px-3 py-2 text-ink-soft">
                    {r[c.key] ?? "–"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function Tip({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 rounded-[24px] bg-mint/50 p-6">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-ink-soft">{children}</p>
    </section>
  );
}

/** Links to the other charts. */
export function ChartLinks({ except }: { except?: ChartId }) {
  const t = useTranslations("sizeCharts");
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {CHARTS.filter((c) => c.id !== except).map((c) => (
        <Link key={c.id} href={`/size-charts/${c.id}`} className="glass group rounded-[24px] p-6 shadow-soft hover:bg-white/80">
          <span className={`mb-4 inline-grid h-11 w-11 place-items-center rounded-2xl ${c.tint}`}>
            <c.icon className="h-5 w-5 text-ink" strokeWidth={2.2} />
          </span>
          <h3 className="font-display text-lg font-semibold group-hover:underline">{t(`${c.id}.short`)}</h3>
          <p className="mt-1 text-sm text-ink-soft">{t(`${c.id}.blurb`)}</p>
        </Link>
      ))}
    </div>
  );
}

/** Page frame: header, breadcrumb, title, intro, the charts, the locker pitch and more charts. */
export function ChartPage({ id, children }: { id: ChartId | "hub"; children: ReactNode }) {
  const t = useTranslations("sizeCharts");
  const hub = t("hub.title");
  const crumbs = [{ name: hub, url: `${SITE_URL}/size-charts` }, ...(id === "hub" ? [] : [{ name: t(`${id}.short`), url: `${SITE_URL}/size-charts/${id}` }])];
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.url })),
  };
  return (
    <main className="pastel-wash min-h-dvh overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <SiteHeader />
      <article className="mx-auto max-w-5xl px-5 pt-4 pb-20">
        {id !== "hub" && (
          <nav aria-label={t("common.breadcrumb")} className="mb-4 flex items-center gap-1 text-sm font-bold text-ink-soft">
            <Link href="/size-charts" className="hover:text-ink hover:underline">
              {hub}
            </Link>
            <ChevronRight className="h-4 w-4" aria-hidden />
            <span className="text-ink">{t(`${id}.short`)}</span>
          </nav>
        )}
        <p className="mb-3 inline-flex rounded-full bg-white/70 px-4 py-1.5 text-sm font-bold text-plum shadow-soft">{t("common.eyebrow")}</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-balance md:text-5xl">{t(`${id}.title`)}</h1>
        <p className="mt-4 max-w-3xl text-lg text-ink-soft">{t(`${id}.intro`)}</p>

        {children}

        {id !== "hub" && (
          <p className="mt-6 text-sm text-ink-soft">
            {t("common.approx")} {t("common.brands")}
          </p>
        )}

        <section className="glass mt-14 rounded-[28px] p-8 shadow-soft">
          <h2 className="font-display text-2xl font-semibold">{t("common.ctaTitle")}</h2>
          <p className="mt-2 max-w-2xl text-ink-soft">{t("common.ctaBody")}</p>
          <div className="mt-5">
            <Button href="/locker">{t("common.cta")}</Button>
          </div>
        </section>

        {id !== "hub" && (
          <section className="mt-14">
            <h2 className="mb-4 font-display text-2xl font-semibold">{t("common.more")}</h2>
            <ChartLinks except={id} />
          </section>
        )}
      </article>
      <SiteFooter />
    </main>
  );
}
