"use client";

import { DrawError, drawNames, formatBudget, newId, type Exchange } from "@mgl/core";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, Eye, EyeOff, Link2, Plus, RotateCcw, Shuffle, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar, Button, Card, Input, inputCls } from "@/components/ui";
import { deleteExchange, patchExchange, useDB, useHydrated } from "@/lib/store";
import { pastelFor } from "@mgl/core";
import { useRouter } from "next/navigation";

export function ExchangeAdmin({ id }: { id: string }) {
  const hydrated = useHydrated();
  const ex = useDB((db) => db.exchanges.find((x) => x.id === id));
  if (!hydrated) return null;
  if (!ex)
    return (
      <Card className="mx-auto max-w-md p-10 text-center">
        <h1 className="font-display text-3xl font-semibold">Exchange not found</h1>
        <p className="mt-2 text-ink-soft">In demo mode exchanges are saved in the browser that created them.</p>
        <div className="mt-6">
          <Button href="/exchange">Back to exchanges</Button>
        </div>
      </Card>
    );
  return <Admin ex={ex} />;
}

function Admin({ ex }: { ex: Exchange }) {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [drawing, setDrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [peek, setPeek] = useState(false);
  useEffect(() => setOrigin(window.location.origin), []);

  const joinUrl = `${origin}/exchange/${ex.id}/join`;
  const byId = Object.fromEntries(ex.participants.map((p) => [p.id, p]));

  const runDraw = () => {
    setError(null);
    let result: Record<string, string>;
    try {
      result = drawNames(
        ex.participants.map((p) => p.id),
        { exclusions: ex.exclusions, singleLoop: ex.singleLoop, previous: ex.previous },
      );
    } catch (e) {
      setError(e instanceof DrawError ? e.message : "Something went wrong");
      return;
    }
    setDrawing(true);
    setTimeout(() => {
      patchExchange(ex.id, (x) => ({ ...x, status: "drawn", assignments: result, drawnAt: new Date().toISOString() }));
      setDrawing(false);
    }, 2200);
  };

  const reset = () => patchExchange(ex.id, (x) => ({ ...x, status: "open", assignments: undefined, drawnAt: undefined }));

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-5 pb-24 lg:grid-cols-[1.4fr_1fr]">
      <div className="grid content-start gap-6">
        <motion.div layoutId={`ex-${ex.id}`} className="glass rounded-[28px] p-7 shadow-soft">
          <p className="text-xs font-extrabold tracking-wide text-rose uppercase">{ex.status === "drawn" ? "Names drawn 🎉" : "Collecting wishes"}</p>
          <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight">{ex.name}</h1>
          <div className="mt-3 flex flex-wrap gap-2 text-sm font-bold">
            {ex.date && <span className="rounded-full bg-white px-3 py-1">📅 {new Date(ex.date + "T00:00").toLocaleDateString(undefined, { weekday: "short", month: "long", day: "numeric" })}</span>}
            {ex.budget && <span className="rounded-full bg-white px-3 py-1">💸 {formatBudget(ex.budget)} budget</span>}
            <span className="rounded-full bg-white px-3 py-1">🎁 Top {ex.wishCount} wishes</span>
            {ex.singleLoop && <span className="rounded-full bg-white px-3 py-1">⭕ One circle</span>}
          </div>
          {ex.message && <p className="mt-4 text-ink-soft">{ex.message}</p>}
        </motion.div>

        <Card className="p-7">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold">People ({ex.participants.length})</h2>
            {ex.status === "drawn" && (
              <button onClick={() => setPeek((p) => !p)} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-ink-soft shadow-soft">
                {peek ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {peek ? "Hide" : "Peek at"} matches
              </button>
            )}
          </div>
          <motion.ul layout className="mt-5 grid gap-2">
            <AnimatePresence initial={false}>
              {ex.participants.map((p) => (
                <motion.li key={p.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex items-center gap-3 rounded-2xl bg-white/80 p-3">
                  <Avatar name={p.name} color={pastelFor(p.name)} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">
                      {p.name} {p.id === ex.adminId && <span className="text-xs text-plum">(organizer)</span>}
                    </p>
                    <p className="truncate text-sm text-ink-soft">
                      {p.wishlist.length ? p.wishlist.map((w) => w.title).join(" · ") : "No wishes yet"}
                    </p>
                    {peek && ex.assignments?.[p.id] && <p className="text-sm font-bold text-rose">→ gifting {byId[ex.assignments[p.id]!]?.name}</p>}
                  </div>
                  {ex.status === "drawn" ? (
                    <CopyButton text={`${origin}/exchange/${ex.id}/me/${p.token}`} label="Private link" />
                  ) : (
                    <>
                      <Link href={`/exchange/${ex.id}/me/${p.token}`} className="rounded-full px-3 py-1.5 text-sm font-bold text-ink-soft hover:bg-white">
                        Wishes
                      </Link>
                      {p.id !== ex.adminId && (
                        <button
                          aria-label={`Remove ${p.name}`}
                          onClick={() =>
                            patchExchange(ex.id, (x) => ({
                              ...x,
                              participants: x.participants.filter((q) => q.id !== p.id),
                              exclusions: x.exclusions.filter(([a, b]) => a !== p.id && b !== p.id),
                            }))
                          }
                          className="rounded-full p-2 text-ink-soft hover:bg-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
          {ex.status === "open" && <AddPerson ex={ex} />}
        </Card>
      </div>

      <div className="grid content-start gap-6">
        <Card className="p-7">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
            <Link2 className="h-5 w-5 text-rose" /> Invite link
          </h2>
          <p className="mt-1 text-sm text-ink-soft">Anyone with this link can join and add their wishes.</p>
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white/80 p-2 pl-4 shadow-soft">
            <span className="truncate text-sm text-ink-soft">{joinUrl}</span>
            <CopyButton text={joinUrl} label="Copy" dark />
          </div>
        </Card>

        {ex.status === "open" && <Exclusions ex={ex} />}

        <Card className="p-7 text-center">
          {ex.status === "open" ? (
            <>
              <h2 className="font-display text-xl font-semibold">Ready when you are</h2>
              <p className="mt-1 text-sm text-ink-soft">{ex.participants.length < 3 ? `Add ${3 - ex.participants.length} more ${ex.participants.length === 2 ? "person" : "people"} to draw.` : "Everyone gets someone — fairly and secretly."}</p>
              {error && <p className="mt-3 text-sm font-bold text-rose-deep">{error}</p>}
              <Button className="mt-5 w-full" onClick={runDraw} disabled={ex.participants.length < 3}>
                <Shuffle className="h-4 w-4" /> Draw names
              </Button>
            </>
          ) : (
            <>
              <h2 className="font-display text-xl font-semibold">Names are drawn!</h2>
              <p className="mt-1 text-sm text-ink-soft">Send each person their private link so they can reveal their match.</p>
              <Button variant="soft" className="mt-5 w-full" onClick={reset}>
                <RotateCcw className="h-4 w-4" /> Redo the draw
              </Button>
            </>
          )}
          <button
            className="mt-4 text-xs font-bold text-ink-soft hover:text-rose-deep"
            onClick={() => {
              deleteExchange(ex.id);
              router.push("/exchange");
            }}
          >
            Delete exchange
          </button>
        </Card>
      </div>

      <AnimatePresence>{drawing && <DrawingOverlay names={ex.participants.map((p) => p.name)} />}</AnimatePresence>
    </div>
  );
}

function AddPerson({ ex }: { ex: Exchange }) {
  const [name, setName] = useState("");
  const add = () => {
    if (!name.trim()) return;
    patchExchange(ex.id, (x) => ({
      ...x,
      participants: [...x.participants, { id: newId("pt_"), name: name.trim(), token: newId("t_"), wishlist: [], joinedAt: new Date().toISOString() }],
    }));
    setName("");
  };
  return (
    <form
      className="mt-4 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        add();
      }}
    >
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Add someone by name (e.g. a child you'll manage)" />
      <Button type="submit" variant="soft" className="px-4!" aria-label="Add person">
        <Plus className="h-4 w-4" />
      </Button>
    </form>
  );
}

function Exclusions({ ex }: { ex: Exchange }) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const name = (id: string) => ex.participants.find((p) => p.id === id)?.name ?? "?";
  const add = () => {
    if (!a || !b || a === b) return;
    if (ex.exclusions.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return;
    patchExchange(ex.id, (x) => ({ ...x, exclusions: [...x.exclusions, [a, b]] }));
    setA("");
    setB("");
  };
  return (
    <Card className="p-7">
      <h2 className="font-display text-xl font-semibold">Exclusions</h2>
      <p className="mt-1 text-sm text-ink-soft">Couples or housemates who shouldn't draw each other.</p>
      <div className="mt-4 grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
        {[
          [a, setA],
          [b, setB],
        ].map(([val, setVal], i) => (
          <div key={i} className="contents">
            <select aria-label={`Person ${i + 1}`} className={`${inputCls} px-3!`} value={val as string} onChange={(e) => (setVal as (v: string) => void)(e.target.value)}>
              <option value="">Pick…</option>
              {ex.participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {i === 0 && <span className="text-ink-soft">↔</span>}
          </div>
        ))}
        <Button variant="soft" className="px-4!" onClick={add} aria-label="Add exclusion">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <AnimatePresence>
          {ex.exclusions.map(([x, y]) => (
            <motion.span key={x + y} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} className="inline-flex items-center gap-1 rounded-full bg-lavender/60 py-1 pr-1 pl-3 text-sm font-bold">
              {name(x)} ↔ {name(y)}
              <button
                aria-label="Remove exclusion"
                className="rounded-full p-1 hover:bg-white/60"
                onClick={() => patchExchange(ex.id, (e) => ({ ...e, exclusions: e.exclusions.filter(([p, q]) => !(p === x && q === y)) }))}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </Card>
  );
}

function CopyButton({ text, label, dark }: { text: string; label: string; dark?: boolean }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setOk(true);
        setTimeout(() => setOk(false), 1600);
      }}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold ${dark ? "bg-ink text-white" : "bg-white text-ink shadow-soft"}`}
    >
      {ok ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {ok ? "Copied" : label}
    </button>
  );
}

/** Names fly around and shuffle like slips of paper in a hat. */
function DrawingOverlay({ names }: { names: string[] }) {
  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center bg-cream/80 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="relative h-72 w-72">
        {names.map((n, i) => {
          const angle = (i / names.length) * Math.PI * 2;
          return (
            <motion.div
              key={i}
              className="absolute top-1/2 left-1/2 -ml-16 -mt-6 w-32 rounded-2xl bg-white py-3 text-center font-bold shadow-lift"
              style={{ background: pastelFor(n) }}
              initial={{ x: 0, y: 0, rotate: 0, scale: 0.5 }}
              animate={{
                x: [0, Math.cos(angle) * 120, Math.cos(angle + 2) * 60, 0],
                y: [0, Math.sin(angle) * 120, Math.sin(angle + 2) * 60, 0],
                rotate: [0, 20 - i * 7, -15 + i * 5, 0],
                scale: [0.5, 1, 1, 0.3],
              }}
              transition={{ duration: 2, ease: "easeInOut", times: [0, 0.35, 0.7, 1] }}
            >
              {n}
            </motion.div>
          );
        })}
      </div>
      <motion.p className="absolute bottom-[20%] font-display text-3xl font-semibold" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2 }}>
        Drawing names…
      </motion.p>
    </motion.div>
  );
}
