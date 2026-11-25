import type { Metadata } from "next";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { LOCALE_TAGS } from "@mgl/core";
import { SiteHeader } from "@/components/SiteHeader";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("privacy");
  return { title: (await getTranslations("titles"))("privacy"), description: t("description") };
}

const UPDATED = new Date(2026, 10, 25);
const CONTACT = "privacy@mygiftlockers.com";

const COLLECT = ["account", "locker", "photos", "payments", "profile", "exchanges", "invites", "technical"] as const;
const USE = ["service", "ai", "signIn", "reminders", "contact"] as const;
const SEE = ["locker", "exchange", "connections", "links", "affiliate"] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 text-ink-soft [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  const t = useTranslations("privacy");
  const titles = useTranslations("titles");
  const locale = useLocale();
  const strong = (c: React.ReactNode) => <strong>{c}</strong>;
  return (
    <main className="pastel-wash min-h-dvh">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-5 pt-6 pb-24">
        <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">{titles("privacy")}</h1>
        <p className="mt-3 text-sm text-ink-soft">{t("updated", { date: UPDATED.toLocaleDateString(LOCALE_TAGS[locale], { dateStyle: "long" }) })}</p>
        {locale !== "en" && <p className="mt-2 text-sm text-ink-soft italic">{t("translation")}</p>}

        <p className="mt-8 text-lg text-ink-soft">{t("intro")}</p>

        <Section title={t("collect.title")}>
          <ul>
            {COLLECT.map((k) => (
              <li key={k}>{t.rich(`collect.items.${k}`, { strong })}</li>
            ))}
          </ul>
        </Section>

        <Section title={t("use.title")}>
          <ul>
            {USE.map((k) => (
              <li key={k}>{t(`use.items.${k}`)}</li>
            ))}
          </ul>
          <p>{t("use.noSale")}</p>
        </Section>

        <Section title={t("see.title")}>
          <ul>
            {SEE.map((k) => (
              <li key={k}>{t(`see.items.${k}`)}</li>
            ))}
          </ul>
        </Section>

        <Section title={t("providers.title")}>
          <p>{t("providers.body")}</p>
        </Section>

        <Section title={t("google.title")}>
          <p>
            {t.rich("google.body", {
              link: (c) => (
                <a className="font-bold text-plum underline" href="https://developers.google.com/terms/api-services-user-data-policy">
                  {c}
                </a>
              ),
            })}
          </p>
        </Section>

        {(["children", "keeping", "security", "changes"] as const).map((k) => (
          <Section key={k} title={t(`${k}.title`)}>
            <p>{t(`${k}.body`)}</p>
          </Section>
        ))}

        <Section title={t("contact.title")}>
          <p>
            {t("contact.body")}{" "}
            <a className="font-bold text-plum underline" href={`mailto:${CONTACT}`}>
              {CONTACT}
            </a>
          </p>
        </Section>

        <p className="mt-14 text-sm">
          <Link href="/" className="font-bold text-plum underline">
            {t("back")}
          </Link>
        </p>
      </article>
    </main>
  );
}
