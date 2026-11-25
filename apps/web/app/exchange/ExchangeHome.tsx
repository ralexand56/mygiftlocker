"use client";

import { exchangeSchema, formatBudget } from "@mgl/core";
import { motion } from "motion/react";
import { CalendarDays, Gift, Shuffle, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, ChipGroup, Field, Input, Textarea } from "@/components/ui";
import { useUser } from "@/lib/auth";
import { createExchange, listMyExchanges, useAsync } from "@/lib/exchanges";
import { useTranslations } from "next-intl";
import { useIntlTag, useTr } from "@/lib/i18n";

export function ExchangeHome() {
  const user = useUser();
  const t = useTranslations("exchangeHome");
  const tr = useTr();
  const tag = useIntlTag();
  const { data: exchanges = [] } = useAsync(async () => (user ? listMyExchanges() : []), [user?.sub]);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [you, setYou] = useState("");
  const [date, setDate] = useState("");
  const [budget, setBudget] = useState("");
  const [message, setMessage] = useState("");
  const [wishCount, setWishCount] = useState<number | undefined>(3);
  const [singleLoop, setSingleLoop] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    const parsed = exchangeSchema.safeParse({
      name: name.trim(),
      date: date || undefined,
      budget: budget ? Number(budget) : undefined,
      message: message.trim() || undefined,
      wishCount: wishCount ?? 3,
    });
    if (!parsed.success) return setError(parsed.error.issues[0]?.path[0] === "name" ? t("errors.name") : t("errors.check"));
    if (!you.trim()) return setError(t("errors.you"));
    // Organizers need an account so only they can manage and draw.
    if (!user) return router.push("/sign-in?next=/exchange");
    setBusy(true);
    setError(null);
    try {
      const id = await createExchange({ ...parsed.data, singleLoop, organizerName: you.trim() }, user.sub);
      router.push(`/exchange/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errors.failed"));
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24">
      <section className="grid items-center gap-8 pt-4 pb-12 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="mb-4 inline-flex rounded-full bg-white/70 px-4 py-1.5 text-sm font-bold text-plum shadow-soft">{t("eyebrow")}</p>
          <h1 className="font-display text-5xl leading-[1.02] font-semibold tracking-tight md:text-6xl">
            {t("title")}
            <br />
            <span className="text-rose">{t("titleAccent")}</span>
          </h1>
          <ul className="mt-7 grid gap-3 text-ink-soft">
            {[
              [Users, t("points.invite")],
              [Gift, t("points.wishes")],
              [Shuffle, t("points.exclusions")],
              [CalendarDays, t("points.reveal")],
            ].map(([Icon, text], i) => {
              const I = Icon as typeof Gift;
              return (
                <motion.li key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.08 }} className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white shadow-soft">
                    <I className="h-4 w-4 text-rose" />
                  </span>
                  {text as string}
                </motion.li>
              );
            })}
          </ul>
        </div>

        <Card className="p-7">
          <h2 className="font-display text-2xl font-semibold">{t("start")}</h2>
          <div className="mt-5 grid gap-4">
            <Field label={t("name")}>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("namePlaceholder")} />
            </Field>
            <Field label={t("you")}>
              <Input value={you} onChange={(e) => setYou(e.target.value)} placeholder={t("youPlaceholder")} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("date")}>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
              <Field label={t("budget")}>
                <Input inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value.replace(/[^\d]/g, ""))} placeholder="50" />
              </Field>
            </div>
            <Field label={t("wishCount")}>
              <ChipGroup label={t("wishCount")} options={[1, 3, 5]} value={wishCount} onChange={setWishCount} />
            </Field>
            <Field label={t("message")}>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("messagePlaceholder")} />
            </Field>
            <label className="flex items-center gap-3 text-sm font-bold text-ink-soft">
              <input type="checkbox" checked={singleLoop} onChange={(e) => setSingleLoop(e.target.checked)} className="h-5 w-5 accent-rose" />
              {t("circle")}
            </label>
            {error && <p className="text-sm font-bold text-rose-deep">{error}</p>}
            <Button onClick={create} disabled={busy}>
              {busy ? t("creating") : user === null ? t("signInCreate") : t("create")}
            </Button>
          </div>
        </Card>
      </section>

      {exchanges.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-2xl font-semibold">{t("yours")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {exchanges.map((ex) => (
              <Link key={ex.id} href={`/exchange/${ex.id}`}>
                <motion.div layoutId={`ex-${ex.id}`} whileHover={{ y: -4 }} className="glass rounded-[28px] p-6 shadow-soft">
                  <p className="text-xs font-extrabold tracking-wide text-rose uppercase">{ex.status === "drawn" ? t("drawn") : t("collecting")}</p>
                  <h3 className="mt-1 font-display text-xl font-semibold">{ex.name}</h3>
                  <p className="mt-2 text-sm text-ink-soft">
                    {t("people", { count: ex.participants.length })}
                    {ex.budget ? ` · ${formatBudget(ex.budget, tr)}` : ""}
                    {ex.date ? ` · ${new Date(ex.date + "T00:00").toLocaleDateString(tag, { month: "short", day: "numeric" })}` : ""}
                  </p>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
