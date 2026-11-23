"use client";

import { formatBudget, newId, type Exchange } from "@mgl/core";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FlyingBackdrop } from "@/components/FlyingBackdrop";
import { LogoMark } from "@/components/Logo";
import { Button, Field, Input } from "@/components/ui";
import { patchExchange, useDB, useHydrated } from "@/lib/store";

export function JoinExchange({ id }: { id: string }) {
  const hydrated = useHydrated();
  const ex = useDB((db) => db.exchanges.find((x) => x.id === id));
  if (!hydrated) return null;
  if (!ex)
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <h1 className="font-display text-3xl font-semibold">We couldn't find that exchange</h1>
          <p className="mt-2 text-ink-soft">Demo mode stores exchanges in the organizer's browser. Connect the Amplify backend to share across devices.</p>
        </div>
      </div>
    );
  return <Form ex={ex} />;
}

function Form({ ex }: { ex: Exchange }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [wishes, setWishes] = useState<{ title: string; url: string }[]>(() => Array.from({ length: ex.wishCount }, () => ({ title: "", url: "" })));

  const closed = ex.status === "drawn";

  const join = () => {
    const token = newId("t_");
    patchExchange(ex.id, (x) => ({
      ...x,
      participants: [
        ...x.participants,
        {
          id: newId("pt_"),
          name: name.trim(),
          email: email.trim() || undefined,
          token,
          joinedAt: new Date().toISOString(),
          wishlist: wishes
            .filter((w) => w.title.trim())
            .map((w, i) => ({ id: newId("w_"), title: w.title.trim(), url: w.url.trim() || undefined, rank: i + 1 })),
        },
      ],
    }));
    router.push(`/exchange/${ex.id}/me/${token}`);
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
              <Button className="mt-2" onClick={join} disabled={!name.trim()}>
                Join the exchange
              </Button>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}
