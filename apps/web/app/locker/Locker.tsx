"use client";

import {
  FIT_LABELS,
  convertShoe,
  daysUntil,
  describeDays,
  filterPeopleByName,
  formatPartialDate,
  isStale,
  nextEvent,
  sortPeople,
  summarizeSizes,
  upcomingEvents,
  upcomingMilestone,
  type EventKind,
  type PeopleSort,
  type Person,
} from "@mgl/core";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { Baby, Cake, CalendarHeart, Gift, Heart, MapPin, Plus, Ruler, Search, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Avatar, Button, ChipGroup, inputCls } from "@/components/ui";
import { authMode, useUser } from "@/lib/auth";
import { useAsync } from "@/lib/exchanges";
import { listLockerPeople } from "@/lib/invites";
import { useDB } from "@/lib/store";
import { LockerCalendar } from "./LockerCalendar";

const hero = { type: "spring", stiffness: 260, damping: 30 } as const;

export function Locker() {
  const user = useUser();
  const localPeople = useDB((db) => db.people);
  const { data: remotePeople, loading: loadingPeople } = useAsync(async () => (authMode === "amplify" && user ? listLockerPeople() : null), [user?.sub]);
  const people = authMode === "amplify" ? (remotePeople ?? []) : localPeople;
  const [openId, setOpenId] = useState<string | null>(null);
  const open = people.find((p) => p.id === openId) ?? null;

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<PeopleSort>("next");
  const shown = useMemo(() => sortPeople(filterPeopleByName(people, query), sort), [people, query, sort]);
  const upcoming = useMemo(() => upcomingEvents(people)[0], [people]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenId(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (authMode === "amplify" && user === null)
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <h1 className="font-display text-4xl font-semibold">Your locker</h1>
        <p className="mt-2 text-ink-soft">Sign in to see everyone you shop for.</p>
        <div className="mt-6">
          <Button href="/sign-in?next=/locker">Sign in</Button>
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl font-semibold tracking-tight">My locker</h1>
          {upcoming && (
            <p className="mt-2 text-ink-soft">
              Next up:{" "}
              <b className="text-ink">
                {upcoming.personName.split(" ")[0]}'s {upcoming.label.toLowerCase()}
              </b>{" "}
              {upcoming.days === 0 ? "is today 🎉" : describeDays(upcoming.days)}
            </p>
          )}
        </div>
        {/* Empty lockers get the invite button in the welcome card instead. */}
        {people.length > 0 && (
          <Button href="/invite">
            <Plus className="h-4 w-4" /> Invite someone
          </Button>
        )}
      </div>

      {people.length === 0 && !(authMode === "amplify" && (user === undefined || loadingPeople)) && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass mx-auto mt-6 max-w-xl rounded-[32px] p-10 text-center shadow-soft"
        >
          <span className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-blush">
            <Gift className="h-8 w-8 text-ink" strokeWidth={2.2} />
          </span>
          <h2 className="font-display text-3xl font-semibold">Your locker is empty</h2>
          <p className="mx-auto mt-2 max-w-sm text-ink-soft">
            Invite the first person you shop for. They add their own sizes, dates and favorites, and they'll show up
            right here.
          </p>
          <div className="mt-7 flex justify-center">
            <Button href="/invite">
              <Plus className="h-4 w-4" /> Invite someone
            </Button>
          </div>
        </motion.div>
      )}

      {people.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <label className="relative min-w-0 flex-1 basis-64">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              type="search"
              className={`${inputCls} pl-11`}
              placeholder="Search by name"
              aria-label="Search by name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-ink-soft">Sort</span>
            <ChipGroup<PeopleSort>
              label="Sort people"
              options={["next", "name"]}
              value={sort}
              onChange={(v) => v && setSort(v)}
              render={(v) => (v === "next" ? "Next event" : "Name")}
            />
          </div>
        </div>
      )}

      <LayoutGroup>
        {people.length > 0 && shown.length === 0 && (
          <p className="rounded-3xl bg-white/70 p-8 text-center text-ink-soft">No one matches “{query.trim()}”.</p>
        )}
        <ul className="grid gap-3">
          {shown.map((p, i) => (
            <li key={p.id}>
              <PersonRow person={p} index={i} hidden={openId === p.id} onOpen={() => setOpenId(p.id)} />
            </li>
          ))}
        </ul>

        {people.length > 0 && <LockerCalendar people={people} onOpenPerson={setOpenId} />}

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
                  className="pointer-events-auto relative max-h-[92dvh] w-full max-w-5xl overflow-y-auto bg-cream shadow-lift md:overflow-hidden"
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

const EVENT_ICON: Record<EventKind, typeof Cake> = { birthday: Cake, anniversary: Heart, other: Sparkles };

export function EventIcon({ kind, className }: { kind: EventKind; className?: string }) {
  const Icon = EVENT_ICON[kind];
  return <Icon className={className ?? "h-4 w-4"} />;
}

function PersonRow({ person: p, index, hidden, onOpen }: { person: Person; index: number; hidden: boolean; onOpen: () => void }) {
  const next = nextEvent(p);
  return (
    <motion.button
      layoutId={`card-${p.id}`}
      onClick={onOpen}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: hidden ? 0 : 1, y: 0 }}
      transition={{ ...hero, delay: hidden ? 0 : Math.min(index, 10) * 0.04 }}
      whileHover={{ y: -3 }}
      className="glass relative flex w-full items-center gap-4 overflow-hidden p-4 text-left shadow-soft sm:p-5"
      style={{ borderRadius: 24 }}
    >
      <motion.div
        layoutId={`bg-${p.id}`}
        className="absolute inset-y-0 left-0 w-40"
        style={{ background: `linear-gradient(90deg, ${p.color}, transparent)` }}
      />
      <motion.div layoutId={`avatar-${p.id}`} transition={hero} className="relative shrink-0">
        <Avatar name={p.name} color={p.color} size={52} />
      </motion.div>
      <div className="relative min-w-0 flex-1">
        <motion.h3 layoutId={`name-${p.id}`} transition={hero} className="truncate font-display text-xl font-semibold">
          {p.name}
        </motion.h3>
        <p className="truncate text-sm text-ink-soft">
          {p.relationship ?? (p.kind === "child" ? "Child" : "Connection")}
          {summarizeSizes(p.sizes) ? ` · ${summarizeSizes(p.sizes)}` : ""}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs font-bold text-ink-soft sm:hidden">
          {isStale(p) && <span className="rounded-full bg-butter px-2.5 py-1">Sizes may be outgrown</span>}
        </div>
      </div>
      <div className="relative hidden shrink-0 gap-1.5 text-xs font-bold text-ink-soft sm:flex">
        {p.kind === "child" && <span className="rounded-full bg-mint px-2.5 py-1">Managed</span>}
        {isStale(p) && <span className="rounded-full bg-butter px-2.5 py-1">Sizes may be outgrown</span>}
      </div>
      <div className="relative shrink-0 text-right">
        {next ? (
          <>
            <p className="flex items-center justify-end gap-1.5 text-sm font-bold text-ink">
              <EventIcon kind={next.kind} className="h-4 w-4 text-rose" />
              {next.label}
            </p>
            <p className={`text-sm ${next.days <= 7 ? "font-bold text-rose-deep" : "text-ink-soft"}`}>
              {next.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · {describeDays(next.days)}
            </p>
          </>
        ) : (
          <p className="text-sm text-ink-soft">No dates yet</p>
        )}
      </div>
    </motion.button>
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

  // Details column follows the hero ~250ms later, sliding in from the right.
  const EASE = [0.16, 1, 0.3, 1] as const;
  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.28 } } };
  const item = { hidden: { opacity: 0, x: 48 }, show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: EASE } } };

  return (
    <div className="relative grid md:h-[min(720px,92dvh)] md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <button onClick={onClose} className="absolute top-4 right-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/80 shadow-soft" aria-label="Close">
        <X className="h-5 w-5" />
      </button>

      <div className="relative flex flex-col items-center justify-center overflow-hidden px-7 py-12 text-center">
        <motion.div layoutId={`bg-${p.id}`} className="absolute inset-0" style={{ background: `radial-gradient(110% 80% at 30% 20%, #fffaf6, ${p.color} 60%)` }} />
        <span className="clay absolute top-[14%] left-[14%] h-8 w-8" style={{ ["--clay" as string]: "#fef5ec" }} />
        <span className="clay absolute right-[16%] bottom-[18%] h-5 w-5" style={{ ["--clay" as string]: "#a8c4da" }} />
        <motion.div layoutId={`avatar-${p.id}`} transition={hero} className="relative drop-shadow-[0_24px_30px_rgba(120,90,90,0.25)]">
          <Avatar name={p.name} color="#fffaf6" size={148} />
        </motion.div>
        <motion.h2 layoutId={`name-${p.id}`} transition={hero} className="relative mt-6 font-display text-4xl font-semibold md:text-5xl">
          {p.name}
        </motion.h2>
        <p className="relative mt-1 text-ink-soft">{p.relationship}</p>
      </div>

      <div className="relative bg-white/90 px-7 pt-8 pb-10 md:overflow-y-auto md:px-10 md:pt-14">
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-6">
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
