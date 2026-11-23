"use client";

import { formatBudget, type PublicExchange } from "@mgl/core";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FlyingBackdrop } from "@/components/FlyingBackdrop";
import { LogoMark } from "@/components/Logo";
import { Button, Field, Input } from "@/components/ui";
import { getPublicExchange, joinExchange, useAsync } from "@/lib/exchanges";

export function JoinExchange({ id }: { id: string }) {
  const { data: ex, error, loading } = useAsync(() => getPublicExchange(id), [id]);
  if (loading) return <p className="py-24 text-center text-ink-soft">Loading…</p>;
  if (!ex)
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <h1 className="font-display text-3xl font-semibold">We couldn't find that exchange</h1>
          <p className="mt-2 text-ink-soft">{error ?? "Check the link with whoever sent it."}</p>
        </div>
      </div>
    );
  return <Form ex={ex} />;
}

function Form({ ex }: { ex: PublicExchange }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [wishes, setWishes] = useState<{ title: string; url: string }[]>(() => Array.from({ length: ex.wishCount }, () => ({ title: "", url: "" })));

  const closed = ex.status === "drawn";

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const join = async () => {
    setBusy(true);
    setError(null);
    try {
      const { token } = await joinExchange(
        ex.id,
        name.trim(),
        email.trim() || undefined,
        wishes.filter((w) => w.title.trim()).map((w) => ({ title: w.title.trim(), url: w.url.trim() || undefined })),
      );
      // Remember this browser's private link so a returning visitor lands on it.
      try {
        localStorage.setItem(`mgl:token:${ex.id}`, token);
      } catch {}
      router.push(`/exchange/${ex.id}/me/${token}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't join");
      setBusy(false);
    }
  };

  return (
    <div className="pastel-wash relative min-h-dvh overflow-x-clip">
      <FlyingBackdrop scene="favorites" />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-lg items-center px-4 py-10">
        <motion.section initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 140, damping: 18 }} className="glass w-full rounded-[32px] p-7 shadow-lift md:p-9">
          <LogoMark size={44} />
          <p className="mt-4 text-sm font-extrabold tracking-wide text-rose uppercase">You're invited</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{ex.name}</h1>
          <p className="mt-2 text-ink-soft">
            {[ex.budget && `${formatBudget(ex.budget)} budget`, ex.date && new Date(ex.date + "T00:00").toLocaleDateString(undefined, { month: "long", day: "numeric" })].filter(Boolean).join(" · ")}
          </p>
          {ex.message && <p className="mt-3 rounded-2xl bg-white/70 p-4 text-ink-soft italic">“{ex.message}”</p>}

          {closed ? (
            <p className="mt-6 font-bold">Names have already been drawn — ask the organizer to add you.</p>
          ) : (
            <div className="mt-7 grid gap-4">
              <Field label="Your name">
                <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </Field>
              <Field label="Email (to get your match)">
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </Field>
              <div>
                <p className="mb-2 text-sm font-bold text-ink-soft">Your top {ex.wishCount} wishes</p>
                <div className="grid gap-3">
                  {wishes.map((w, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.07 }} className="flex gap-2">
                      <span className="grid h-12 w-9 shrink-0 place-items-center font-display text-xl font-semibold text-rose">{i + 1}</span>
                      <div className="grid flex-1 gap-1.5">
                        <Input value={w.title} placeholder="Cozy wool socks" onChange={(e) => setWishes((ws) => ws.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                        {w.title && <Input value={w.url} placeholder="Link (optional)" className="py-2! text-sm!" onChange={(e) => setWishes((ws) => ws.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              {error && <p className="text-sm font-bold text-rose-deep">{error}</p>}
              {ex.participantNames.length > 0 && (
                <p className="text-sm text-ink-soft">Already in: {ex.participantNames.join(", ")}</p>
              )}
              <Button className="mt-2" onClick={join} disabled={!name.trim() || busy}>
                {busy ? "Joining…" : "Join the exchange"}
              </Button>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}
