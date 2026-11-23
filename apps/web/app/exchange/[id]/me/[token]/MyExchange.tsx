"use client";

import { formatBudget, newId, pastelFor, type Exchange, type Participant } from "@mgl/core";
import { AnimatePresence, motion } from "motion/react";
import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { Avatar, Button, Card, Input } from "@/components/ui";
import { SiteHeader } from "@/components/SiteHeader";
import { patchExchange, useDB, useHydrated } from "@/lib/store";

export function MyExchange({ id, token }: { id: string; token: string }) {
  const hydrated = useHydrated();
  const ex = useDB((db) => db.exchanges.find((x) => x.id === id));
  const me = ex?.participants.find((p) => p.token === token);
  return (
    <main className="pastel-wash min-h-dvh">
      <SiteHeader />
      {hydrated && (!ex || !me) ? (
        <Card className="mx-auto max-w-md p-10 text-center">
          <h1 className="font-display text-3xl font-semibold">Link not recognized</h1>
          <p className="mt-2 text-ink-soft">Ask your organizer for your private link.</p>
        </Card>
      ) : hydrated && ex && me ? (
        <View ex={ex} me={me} />
      ) : null}
    </main>
  );
}

function View({ ex, me }: { ex: Exchange; me: Participant }) {
  const match = ex.assignments?.[me.id] ? ex.participants.find((p) => p.id === ex.assignments![me.id]) : undefined;
  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-5 pb-24 md:grid-cols-2">
      <div>
        <p className="text-sm font-extrabold tracking-wide text-rose uppercase">{ex.name}</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Hi {me.name.split(" ")[0]}!</h1>
        <p className="mt-1 text-ink-soft">
          {[ex.budget && `${formatBudget(ex.budget)} budget`, ex.date && new Date(ex.date + "T00:00").toLocaleDateString(undefined, { month: "long", day: "numeric" })].filter(Boolean).join(" · ")}
        </p>
        <div className="mt-6">{match ? <Reveal match={match} /> : <Waiting />}</div>
      </div>
      <WishlistEditor ex={ex} me={me} />
    </div>
  );
}

function Waiting() {
  return (
    <Card className="p-8 text-center">
      <motion.div className="mx-auto mb-4 w-fit text-6xl" animate={{ rotate: [-6, 6, -6] }} transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}>
        🎁
      </motion.div>
      <h2 className="font-display text-2xl font-semibold">Names haven't been drawn yet</h2>
      <p className="mt-1 text-ink-soft">Add your wishes while you wait — your Santa will thank you.</p>
    </Card>
  );
}

function Reveal({ match }: { match: Participant }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="relative overflow-hidden p-8 text-center">
      <AnimatePresence mode="wait">
        {!open ? (
          <motion.button key="box" onClick={() => setOpen(true)} className="mx-auto block" exit={{ scale: 1.15, opacity: 0, transition: { duration: 0.35 } }} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}>
            <motion.svg viewBox="0 0 120 120" className="mx-auto h-44 w-44" animate={{ rotate: [0, -4, 4, -2, 0] }} transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}>
              <rect x="18" y="52" width="84" height="56" rx="8" fill="#FBD3E3" />
              <rect x="12" y="38" width="96" height="18" rx="6" fill="#F7B9CF" />
              <rect x="53" y="38" width="14" height="70" fill="#E9779F" />
              <path d="M60 38 C 50 20, 30 20, 34 32 C 37 40, 52 40, 60 38 C 68 40, 83 40, 86 32 C 90 20, 70 20, 60 38 Z" fill="#E9779F" />
            </motion.svg>
            <p className="mt-3 font-display text-2xl font-semibold">Tap to see who you're gifting</p>
          </motion.button>
        ) : (
          <motion.div key="match" initial={{ y: 40, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 160, damping: 14 }}>
            <p className="text-sm font-extrabold tracking-wide text-rose uppercase">You're gifting</p>
            <div className="mt-4 flex flex-col items-center gap-3">
              <motion.div initial={{ rotate: -20, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", delay: 0.15 }}>
                <Avatar name={match.name} color={pastelFor(match.name)} size={96} />
              </motion.div>
              <h2 className="font-display text-4xl font-semibold">{match.name}</h2>
            </div>
            <div className="mt-6 grid gap-2 text-left">
              {match.wishlist.length ? (
                match.wishlist.map((w, i) => (
                  <motion.div key={w.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.08 }} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-soft">
                    <span className="font-display text-xl font-semibold text-rose">{w.rank}</span>
                    <span className="flex-1 font-bold">{w.title}</span>
                    {w.url && (
                      <a href={w.url} target="_blank" rel="noreferrer noopener" className="rounded-full p-2 text-ink-soft hover:bg-blush" aria-label={`Open link for ${w.title}`}>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </motion.div>
                ))
              ) : (
                <p className="text-center text-ink-soft">They haven't added wishes yet — check back soon.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function WishlistEditor({ ex, me }: { ex: Exchange; me: Participant }) {
  const [items, setItems] = useState(() =>
    Array.from({ length: ex.wishCount }, (_, i) => ({ title: me.wishlist[i]?.title ?? "", url: me.wishlist[i]?.url ?? "" })),
  );
  const [saved, setSaved] = useState(false);
  const save = () => {
    patchExchange(ex.id, (x) => ({
      ...x,
      participants: x.participants.map((p) =>
        p.id === me.id
          ? { ...p, wishlist: items.filter((w) => w.title.trim()).map((w, i) => ({ id: newId("w_"), title: w.title.trim(), url: w.url.trim() || undefined, rank: i + 1 })) }
          : p,
      ),
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };
  return (
    <Card className="p-7">
      <h2 className="font-display text-2xl font-semibold">My top {ex.wishCount}</h2>
      <p className="mt-1 text-sm text-ink-soft">Ranked — #1 is the one you'd love most.</p>
      <div className="mt-5 grid gap-3">
        {items.map((w, i) => (
          <div key={i} className="flex gap-2">
            <span className="grid h-12 w-8 shrink-0 place-items-center font-display text-xl font-semibold text-rose">{i + 1}</span>
            <div className="grid flex-1 gap-1.5">
              <Input value={w.title} placeholder="What would make you smile?" onChange={(e) => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
              <Input value={w.url} placeholder="Link (optional)" className="py-2! text-sm!" onChange={(e) => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
            </div>
          </div>
        ))}
      </div>
      <Button className="mt-5 w-full" onClick={save}>
        {saved ? "Saved ✓" : "Save wishes"}
      </Button>
    </Card>
  );
}
