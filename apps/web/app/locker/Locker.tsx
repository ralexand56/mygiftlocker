"use client";

import {
  FIT_LABELS,
  convertShoe,
  daysUntil,
  formatPartialDate,
  isStale,
  summarizeSizes,
  upcomingMilestone,
  type Person,
} from "@mgl/core";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { Baby, CalendarHeart, Gift, MapPin, Plus, Ruler, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Avatar, Button } from "@/components/ui";
import { useDB } from "@/lib/store";

const hero = { type: "spring", stiffness: 260, damping: 30 } as const;

export function Locker() {
  const people = useDB((db) => db.people);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = people.find((p) => p.id === openId) ?? null;

  const upcoming = useMemo(
    () =>
      people
        .filter((p) => p.birthday)
        .map((p) => ({ p, days: daysUntil(p.birthday!) }))
        .sort((a, b) => a.days - b.days)[0],
    [people],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenId(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl font-semibold tracking-tight">My locker</h1>
          {upcoming && (
            <p className="mt-2 text-ink-soft">
              Next up: <b className="text-ink">{upcoming.p.name.split(" ")[0]}'s birthday</b> {upcoming.days === 0 ? "is today 🎉" : `in ${upcoming.days} days`}
            </p>
          )}
        </div>
        <Button href="/invite">
          <Plus className="h-4 w-4" /> Invite someone
        </Button>
      </div>

      <LayoutGroup>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((p, i) => (
            <motion.button
              key={p.id}
              layoutId={`card-${p.id}`}
              onClick={() => setOpenId(p.id)}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: openId === p.id ? 0 : 1, y: 0 }}
              transition={{ ...hero, delay: openId ? 0 : i * 0.05 }}
              whileHover={{ y: -6 }}
              className="glass relative overflow-hidden rounded-[28px] p-6 text-left shadow-soft"
              style={{ borderRadius: 28 }}
            >
              <motion.div layoutId={`bg-${p.id}`} className="absolute inset-x-0 top-0 h-24" style={{ background: `linear-gradient(135deg, ${p.color}, transparent)` }} />
              <div className="relative flex items-center gap-4">
                <motion.div layoutId={`avatar-${p.id}`} transition={hero}>
                  <Avatar name={p.name} color={p.color} size={56} />
                </motion.div>
                <div className="min-w-0">
                  <motion.h3 layoutId={`name-${p.id}`} transition={hero} className="truncate font-display text-xl font-semibold">
                    {p.name}
                  </motion.h3>
                  <p className="text-sm text-ink-soft">{p.relationship ?? (p.kind === "child" ? "Child" : "Connection")}</p>
                </div>
              </div>
              <p className="relative mt-5 text-sm font-semibold text-ink">{summarizeSizes(p.sizes) || "No sizes yet"}</p>
              <div className="relative mt-3 flex flex-wrap gap-2 text-xs font-bold text-ink-soft">
                {p.birthday && <span className="rounded-full bg-white/80 px-2.5 py-1">🎂 {daysUntil(p.birthday)}d</span>}
                {p.kind === "child" && <span className="rounded-full bg-mint px-2.5 py-1">Managed</span>}
                {isStale(p) && <span className="rounded-full bg-butter px-2.5 py-1">Sizes may be outgrown</span>}
              </div>
            </motion.button>
          ))}
        </div>

        <AnimatePresence>
          {open && (
            <>
              <motion.div
                key="scrim"
                className="fixed inset-0 z-40 bg-ink/25 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpenId(null)}
              />
              <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
                <motion.article
                  layoutId={`card-${open.id}`}
                  transition={hero}
                  className="pointer-events-auto relative max-h-[90dvh] w-full max-w-2xl overflow-y-auto bg-cream shadow-lift"
                  style={{ borderRadius: 32 }}
                  role="dialog"
                  aria-modal
                  aria-label={open.name}
                >
                  <PersonDetail person={open} onClose={() => setOpenId(null)} />
                </motion.article>
              </div>
            </>
          )}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  );
}

function PersonDetail({ person: p, onClose }: { person: Person; onClose: () => void }) {
  const shoe = p.sizes.shoe && p.sizes.fit ? convertShoe(p.sizes.shoe, p.sizes.fit) : null;
  const sizes: [string, string | undefined][] = [
    ["Section", p.sizes.fit ? FIT_LABELS[p.sizes.fit] : undefined],
    ["Top", p.sizes.top],
    ["Pants", p.sizes.waist ? `${p.sizes.waist} × ${p.sizes.inseam ?? "?"}` : (p.sizes.womensNumeric ?? p.sizes.bottomAlpha)],
    ["Dress", p.sizes.dress],
    ["Outerwear", p.sizes.outerwear],
    ["Shoe", p.sizes.shoe ? `${p.sizes.shoe}${p.sizes.shoeWidth && p.sizes.shoeWidth !== "Regular" ? ` ${p.sizes.shoeWidth}` : ""}` : undefined],
    ["Ring", p.sizes.ring?.toString()],
    ["Hat", p.sizes.hat],
  ];

  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.18 } } };
  const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="relative">
      <motion.div layoutId={`bg-${p.id}`} className="absolute inset-x-0 top-0 h-44" style={{ background: `linear-gradient(135deg, ${p.color}, transparent)` }} />
      <button onClick={onClose} className="absolute top-4 right-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/80 shadow-soft" aria-label="Close">
        <X className="h-5 w-5" />
      </button>

      <div className="relative px-7 pt-10 pb-8 md:px-10">
        <div className="flex items-center gap-5">
          <motion.div layoutId={`avatar-${p.id}`} transition={hero}>
            <Avatar name={p.name} color={p.color} size={96} />
          </motion.div>
          <div>
            <motion.h2 layoutId={`name-${p.id}`} transition={hero} className="font-display text-4xl font-semibold">
              {p.name}
            </motion.h2>
            <p className="text-ink-soft">{p.relationship}</p>
          </div>
        </div>

        <motion.div variants={stagger} initial="hidden" animate="show" className="mt-8 grid gap-5">
          {isStale(p) && (
            <motion.div variants={item} className="flex items-center gap-3 rounded-2xl bg-butter/70 p-4 text-sm">
              <Baby className="h-5 w-5 shrink-0" /> Sizes were last updated a while ago — kids grow fast! Ask a guardian to refresh them.
            </motion.div>
          )}

          <motion.section variants={item}>
            <SectionTitle icon={Ruler}>Sizes</SectionTitle>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {sizes
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="rounded-2xl bg-white p-3 shadow-soft">
                    <p className="text-xs font-bold text-ink-soft">{k}</p>
                    <p className="font-display text-xl font-semibold">{v}</p>
                  </div>
                ))}
            </div>
            {shoe && (
              <p className="mt-2 text-sm text-ink-soft">
                Shoe ≈ UK {shoe.UK} · EU {shoe.EU} · JP {shoe.JP}
              </p>
            )}
          </motion.section>

          {(p.birthday || p.anniversary) && (
            <motion.section variants={item}>
              <SectionTitle icon={CalendarHeart}>Dates</SectionTitle>
              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    ["Birthday", p.birthday, "turns"],
                    ["Anniversary", p.anniversary, "celebrates year"],
                  ] as const
                ).map(([label, d, verb]) =>
                  d ? (
                    <div key={label} className="rounded-2xl bg-white p-4 shadow-soft">
                      <p className="text-xs font-bold text-ink-soft">{label}</p>
                      <p className="font-display text-xl font-semibold">{formatPartialDate(d)}</p>
                      <p className="text-sm text-ink-soft">
                        in {daysUntil(d)} days{upcomingMilestone(d) ? ` · ${verb} ${upcomingMilestone(d)}` : ""}
                      </p>
                    </div>
                  ) : null,
                )}
              </div>
            </motion.section>
          )}

          {p.address && (
            <motion.section variants={item}>
              <SectionTitle icon={MapPin}>Ship to</SectionTitle>
              <address className="rounded-2xl bg-white p-4 not-italic shadow-soft">
                {p.name}
                <br />
                {p.address.line1}
                {p.address.line2 && `, ${p.address.line2}`}
                <br />
                {p.address.city}, {p.address.region} {p.address.postalCode}
              </address>
            </motion.section>
          )}

          {p.favorites && (
            <motion.section variants={item}>
              <SectionTitle icon={Gift}>Favorites</SectionTitle>
              <div className="rounded-2xl bg-white p-4 shadow-soft">
                {p.favorites.likes && <p>{p.favorites.likes}</p>}
                {!!p.favorites.colors?.length && <p className="mt-2 text-sm text-ink-soft">Colors: {p.favorites.colors.join(", ")}</p>}
                {p.favorites.avoid && <p className="mt-2 text-sm text-rose-deep">Avoid: {p.favorites.avoid}</p>}
                {!!p.favorites.wishes?.length && (
                  <ol className="mt-3 list-decimal pl-5 text-sm">
                    {p.favorites.wishes.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ol>
                )}
              </div>
            </motion.section>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, children }: { icon: typeof Gift; children: React.ReactNode }) {
  return (
    <h3 className="mb-2.5 flex items-center gap-2 text-sm font-extrabold tracking-wide text-ink-soft uppercase">
      <Icon className="h-4 w-4" /> {children}
    </h3>
  );
}
