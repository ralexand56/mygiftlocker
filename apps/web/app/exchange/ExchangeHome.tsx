"use client";

import { exchangeSchema, formatBudget, newId, type Exchange } from "@mgl/core";
import { motion } from "motion/react";
import { CalendarDays, Gift, Shuffle, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, ChipGroup, Field, Input, Textarea } from "@/components/ui";
import { saveExchange, useDB } from "@/lib/store";

export function ExchangeHome() {
  const exchanges = useDB((db) => db.exchanges);
  const router = useRouter();
  const [name, setName] = useState("");
  const [you, setYou] = useState("");
  const [date, setDate] = useState("");
  const [budget, setBudget] = useState("");
  const [message, setMessage] = useState("");
  const [wishCount, setWishCount] = useState<number | undefined>(3);
  const [singleLoop, setSingleLoop] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = () => {
    const parsed = exchangeSchema.safeParse({
      name: name.trim(),
      date: date || undefined,
      budget: budget ? Number(budget) : undefined,
      message: message.trim() || undefined,
      wishCount: wishCount ?? 3,
    });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Check the form");
    if (!you.trim()) return setError("Add your name — organizers usually play too");
    const adminId = newId("pt_");
    const ex: Exchange = {
      id: newId("ex_"),
      ...parsed.data,
      budget: parsed.data.budget ? { amount: parsed.data.budget, currency: "USD" } : undefined,
      adminId,
      singleLoop,
      status: "open",
      participants: [{ id: adminId, name: you.trim(), token: newId("t_"), wishlist: [], joinedAt: new Date().toISOString() }],
      exclusions: [],
      createdAt: new Date().toISOString(),
    };
    saveExchange(ex);
    router.push(`/exchange/${ex.id}`);
  };

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24">
      <section className="grid items-center gap-8 pt-4 pb-12 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="mb-4 inline-flex rounded-full bg-white/70 px-4 py-1.5 text-sm font-bold text-plum shadow-soft">Secret Santa, sorted</p>
          <h1 className="font-display text-5xl leading-[1.02] font-semibold tracking-tight md:text-6xl">
            Draw names in seconds.
            <br />
            <span className="text-rose">Gift with confidence.</span>
          </h1>
          <ul className="mt-7 grid gap-3 text-ink-soft">
            {[
              [Users, "Invite everyone with one link — family, friends or the office"],
              [Gift, "Everyone adds their top 3 wishes"],
              [Shuffle, "Set exclusions (no drawing your partner) and draw when you're ready"],
              [CalendarDays, "Each person privately reveals who they're gifting"],
            ].map(([Icon, t], i) => {
              const I = Icon as typeof Gift;
              return (
                <motion.li key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.08 }} className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white shadow-soft">
                    <I className="h-4 w-4 text-rose" />
                  </span>
                  {t as string}
                </motion.li>
              );
            })}
          </ul>
        </div>

        <Card className="p-7">
          <h2 className="font-display text-2xl font-semibold">Start an exchange</h2>
          <div className="mt-5 grid gap-4">
            <Field label="Exchange name">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Chen Family Christmas 2026" />
            </Field>
            <Field label="Your name">
              <Input value={you} onChange={(e) => setYou(e.target.value)} placeholder="Alex" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Exchange date">
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
              <Field label="Budget (USD)">
                <Input inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value.replace(/[^\d]/g, ""))} placeholder="50" />
              </Field>
            </div>
            <Field label="Wishes per person">
              <ChipGroup label="Wishes per person" options={[1, 3, 5]} value={wishCount} onChange={setWishCount} />
            </Field>
            <Field label="Message to everyone (optional)">
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Party's at our place — bring cookies!" />
            </Field>
            <label className="flex items-center gap-3 text-sm font-bold text-ink-soft">
              <input type="checkbox" checked={singleLoop} onChange={(e) => setSingleLoop(e.target.checked)} className="h-5 w-5 accent-rose" />
              One big circle (great for opening gifts in turn)
            </label>
            {error && <p className="text-sm font-bold text-rose-deep">{error}</p>}
            <Button onClick={create}>Create exchange</Button>
          </div>
        </Card>
      </section>

      {exchanges.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-2xl font-semibold">Your exchanges</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {exchanges.map((ex) => (
              <Link key={ex.id} href={`/exchange/${ex.id}`}>
                <motion.div layoutId={`ex-${ex.id}`} whileHover={{ y: -4 }} className="glass rounded-[28px] p-6 shadow-soft">
                  <p className="text-xs font-extrabold tracking-wide text-rose uppercase">{ex.status === "drawn" ? "Names drawn" : "Collecting wishes"}</p>
                  <h3 className="mt-1 font-display text-xl font-semibold">{ex.name}</h3>
                  <p className="mt-2 text-sm text-ink-soft">
                    {ex.participants.length} people{ex.budget ? ` · ${formatBudget(ex.budget)}` : ""}
                    {ex.date ? ` · ${new Date(ex.date + "T00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : ""}
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
