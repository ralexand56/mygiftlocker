"use client";

import {
  FIT_LABELS,
  HOLIDAYS,
  convertShoe,
  daysUntil,
  describeDays,
  filterPeopleByName,
  formatAddress,
  formatPartialDate,
  isGifted,
  linkTitle,
  smsHref,
  isStale,
  nextEvent,
  sortPeople,
  summarizeSizes,
  upcomingEvents,
  upcomingEventsFor,
  upcomingMilestone,
  withGifted,
  type UpcomingEvent,
  type HolidayId,
  type PeopleSort,
  type Person,
} from "@mgl/core";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { Baby, CalendarHeart, Copy, ExternalLink, Gift, Link2, Lock, MessageCircle, Share2, Unlink, MapPin, Pencil, Plus, Ruler, Search, UserRound, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Avatar, Button, ChipGroup, inputCls } from "@/components/ui";
import { EventIcon } from "./EventIcon";
import { HolidayLists } from "./HolidayLists";
import { authMode, useUser } from "@/lib/auth";
import { useAsync } from "@/lib/exchanges";
import { listLockerPeople, updateOwnerFields, type OwnerFields } from "@/lib/invites";
import { loadOrClaimSelf } from "@/lib/self";
import { askToConnect, connectionsEnabled, endConnection } from "@/lib/connections";
import { GiftLock } from "@/components/GiftLock";
import { useDB } from "@/lib/store";
import { LockerCalendar } from "./LockerCalendar";

const hero = { type: "spring", stiffness: 260, damping: 30 } as const;

export function Locker() {
  const user = useUser();
  const localPeople = useDB((db) => db.people);
  const { data: remotePeople, loading: loadingPeople, reload: reloadPeople } = useAsync(async () => (authMode === "amplify" && user ? listLockerPeople() : null), [user?.sub]);
  const basePeople = authMode === "amplify" ? (remotePeople ?? []) : localPeople;
  // Owner edits (holiday tags, notes) show immediately and are saved in the background.
  const [edits, setEdits] = useState<Record<string, Partial<Person>>>({});
  const people = useMemo(() => basePeople.map((p) => (edits[p.id] ? { ...p, ...edits[p.id] } : p)), [basePeople, edits]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [holidaysOpen, setHolidaysOpen] = useState(false);

  /** Optimistically apply, then save; roll back and rethrow if the save fails. */
  const saveOwner = async (id: string, changes: OwnerFields) => {
    const before = edits[id];
    setEdits((e) => ({ ...e, [id]: { ...e[id], ...changes } }));
    try {
      await updateOwnerFields(id, changes);
    } catch (err) {
      setEdits((e) => ({ ...e, [id]: before ?? {} }));
      throw err;
    }
  };
  const open = people.find((p) => p.id === openId) ?? null;
  const toggleGift = (p: Person, e: UpcomingEvent) => saveOwner(p.id, { gifted: withGifted(p, e, !isGifted(p, e)) }).catch(() => {});
  // Their own profile (claimed from a recent invite in this browser, if they just signed up).
  const { data: self } = useAsync(async () => (user ? loadOrClaimSelf(user.sub) : null), [user?.sub]);

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
          <button
            type="button"
            onClick={() => setHolidaysOpen(true)}
            className="rounded-full bg-white/70 px-4 py-2.5 text-[15px] font-bold text-ink ring-1 ring-lavender/50 hover:bg-white"
          >
            🎄 Holidays
          </button>
        </div>
      )}

      {user && !loadingPeople && (
        <div className={people.length ? "" : "mx-auto mt-5 max-w-xl"}>
          <SelfCard self={self ?? null} />
        </div>
      )}

      <HolidayLists open={holidaysOpen} people={people} onClose={() => setHolidaysOpen(false)} onSave={saveOwner} />

      <LayoutGroup>
        {people.length > 0 && shown.length === 0 && (
          <p className="rounded-3xl bg-white/70 p-8 text-center text-ink-soft">No one matches “{query.trim()}”.</p>
        )}
        <ul className="grid gap-3">
          {shown.map((p, i) => (
            <li key={p.id}>
              <PersonRow person={p} index={i} hidden={openId === p.id} onOpen={() => setOpenId(p.id)} onToggleGift={(e) => toggleGift(p, e)} />
            </li>
          ))}
        </ul>

        {people.length > 0 && <LockerCalendar people={people} onOpenPerson={setOpenId} onToggleGift={toggleGift} />}

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
                  <PersonDetail
                    person={open}
                    onClose={() => setOpenId(null)}
                    onSaveOwner={(changes) => saveOwner(open.id, changes)}
                    onToggleGift={(e) => toggleGift(open, e)}
                    onConnectionChanged={reloadPeople}
                  />
                </motion.article>
              </div>
            </>
          )}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  );
}

function PersonRow({
  person: p,
  index,
  hidden,
  onOpen,
  onToggleGift,
}: {
  person: Person;
  index: number;
  hidden: boolean;
  onOpen: () => void;
  onToggleGift: (e: UpcomingEvent) => void;
}) {
  const next = nextEvent(p);
  return (
    <motion.div
      layoutId={`card-${p.id}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: hidden ? 0 : 1, y: 0 }}
      transition={{ ...hero, delay: hidden ? 0 : Math.min(index, 10) * 0.04 }}
      whileHover={{ y: -3 }}
      className="glass relative flex w-full items-center gap-4 overflow-hidden p-4 text-left shadow-soft sm:p-5"
      style={{ borderRadius: 24 }}
    >
      {/* The whole card opens the person; the lock sits above it as its own button. */}
      <button type="button" onClick={onOpen} aria-label={`Open ${p.name}`} className="absolute inset-0 z-[1] rounded-[24px]" />
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
          {p.linked && !p.linked.ended && <LiveBadge />}
        </div>
      </div>
      <div className="relative hidden shrink-0 gap-1.5 text-xs font-bold text-ink-soft sm:flex">
        {p.kind === "child" && <span className="rounded-full bg-mint px-2.5 py-1">Managed</span>}
        {p.linked && !p.linked.ended && <LiveBadge />}
        {isStale(p) && <span className="rounded-full bg-butter px-2.5 py-1">Sizes may be outgrown</span>}
      </div>
      <div className="relative shrink-0 text-right">
        {next ? (
          <>
            <p className="flex items-center justify-end gap-1.5 text-sm font-bold text-ink">
              <EventIcon kind={next.kind} holidayId={next.holidayId} className="h-4 w-4 text-rose" />
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
      {next && (
        <div className="relative z-[2] -my-1 -mr-1 shrink-0">
          <GiftLock locked={isGifted(p, next)} onToggle={() => onToggleGift(next)} label={`${p.name.split(" ")[0]}'s ${next.label.toLowerCase()}`} size={38} />
        </div>
      )}
    </motion.div>
  );
}

/** The user's own profile: what they share in gift exchanges. */
function SelfCard({ self }: { self: Person | null }) {
  const sizes = self ? summarizeSizes(self.sizes) : "";
  return (
    <div className="mb-5 flex flex-wrap items-center gap-4 rounded-3xl bg-white/60 p-4 ring-1 ring-lavender/40 sm:p-5">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-lavender/60">
        <UserRound className="h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1 basis-56">
        <p className="font-bold">
          {self ? "My profile" : "Add your own sizes and wishes"}
          {self && connectionsEnabled && (
            <a href="/locker/sharing" className="ml-2 text-sm font-bold text-plum underline">
              Who can see it
            </a>
          )}
        </p>
        <p className="truncate text-sm text-ink-soft">
          {self ? sizes || "No sizes yet" : "Fill it in once, then share it in gift exchanges instead of retyping it."}
        </p>
      </div>
      <Button href="/locker/me" variant="soft">
        <Pencil className="h-4 w-4" /> {self ? "Edit" : "Add mine"}
      </Button>
    </div>
  );
}

type OwnerChanges = OwnerFields;

function PersonDetail({
  person: p,
  onClose,
  onSaveOwner,
  onToggleGift,
  onConnectionChanged,
}: {
  person: Person;
  onClose: () => void;
  onSaveOwner: (changes: OwnerChanges) => Promise<void>;
  onToggleGift: (e: UpcomingEvent) => void;
  onConnectionChanged: () => void;
}) {
  const comingUp = upcomingEventsFor(p).slice(0, 5);
  const shoe = p.sizes.shoe && p.sizes.fit ? convertShoe(p.sizes.shoe, p.sizes.fit) : null;
  const sizes: [string, string | undefined][] = [
    ["Section", p.sizes.fit ? FIT_LABELS[p.sizes.fit] : undefined],
    ["Top", p.sizes.top],
    ["Pants", p.sizes.waist ? `${p.sizes.waist} × ${p.sizes.inseam ?? "?"}` : (p.sizes.womensNumeric ?? p.sizes.bottomAlpha)],
    ["Dress", p.sizes.dress],
    ["Outerwear", p.sizes.outerwear],
    ["Shoe", p.sizes.shoe ? `${p.sizes.shoe}${p.sizes.shoeWidth && p.sizes.shoeWidth !== "Regular" ? ` ${p.sizes.shoeWidth}` : ""}` : undefined],
    ["Foot length", p.sizes.footLengthCm ? `${p.sizes.footLengthCm} cm` : undefined],
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
        {connectionsEnabled && p.kind === "adult" && <ConnectionPanel person={p} onChanged={onConnectionChanged} />}
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
                Shoe ≈ UK {shoe.UK} · EU {shoe.EU} · BR {shoe.BR} · MX {shoe.MX} · CO {shoe.CO} · JP {shoe.JP}
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

          {comingUp.length > 0 && (
            <motion.section variants={item}>
              <SectionTitle icon={Gift}>Gift checklist</SectionTitle>
              <ul className="grid gap-2">
                {comingUp.map((e) => {
                  const done = isGifted(p, e);
                  return (
                    <li key={`${e.kind}-${e.label}`} className={`flex items-center gap-3 rounded-2xl bg-white p-3 shadow-soft transition-opacity ${done ? "opacity-80" : ""}`}>
                      <EventIcon kind={e.kind} holidayId={e.holidayId} className="h-4 w-4 text-rose" />
                      <span className="min-w-0 flex-1">
                        <span className={`block font-bold ${done ? "text-ink-soft line-through decoration-rose/60" : ""}`}>{e.label}</span>
                        <span className="text-sm text-ink-soft">
                          {e.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · {e.days === 0 ? "today" : describeDays(e.days)}
                        </span>
                      </span>
                      <GiftLock locked={done} onToggle={() => onToggleGift(e)} label={`${p.name.split(" ")[0]}'s ${e.label.toLowerCase()}`} showText size={28} />
                    </li>
                  );
                })}
              </ul>
              <p className="mt-1.5 text-xs text-ink-soft">Locked occasions skip their reminder emails.</p>
            </motion.section>
          )}

          <motion.section variants={item}>
            <OwnerSection person={p} onSave={onSaveOwner} />
          </motion.section>

          {p.address && (
            <motion.section variants={item}>
              <SectionTitle icon={MapPin}>Ship to</SectionTitle>
              <address className="rounded-2xl bg-white p-4 not-italic shadow-soft">
                {[p.name, ...formatAddress(p.address)].map((line, i) => (
                  <span key={i} className="block">
                    {line}
                  </span>
                ))}
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
                {!!p.favorites.wishlists?.length && <WishlistLinkList links={p.favorites.wishlists} />}
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

/** Holiday tags and a private note: the owner's own info, never shown to the person. */
function OwnerSection({ person: p, onSave }: { person: Person; onSave: (changes: OwnerChanges) => Promise<void> }) {
  const [note, setNote] = useState(p.ownerNote ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const tags = new Set(p.holidays ?? []);

  const run = async (changes: OwnerChanges) => {
    setStatus("saving");
    try {
      await onSave(changes);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  };
  const toggle = (id: HolidayId) => {
    const next = new Set(tags);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    void run({ holidays: [...next] });
  };
  const noteChanged = note.trim() !== (p.ownerNote ?? "").trim();

  return (
    <>
      <SectionTitle icon={Lock}>Just for you</SectionTitle>
      <div className="rounded-2xl bg-white p-4 shadow-soft">
        <p className="text-sm font-bold text-ink-soft">Holidays you shop for {p.name.split(" ")[0]}</p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Holidays">
          {HOLIDAYS.map((h) => {
            const on = tags.has(h.id);
            return (
              <button
                key={h.id}
                type="button"
                aria-pressed={on}
                aria-label={`${h.name} (${h.when})`}
                onClick={() => toggle(h.id)}
                title={h.when}
                className={`rounded-full px-3.5 py-2 text-sm font-bold transition-colors ${
                  on ? "bg-gradient-to-br from-rose to-plum text-white shadow-lift" : "bg-cream text-ink ring-1 ring-lavender/60 hover:bg-white"
                }`}
              >
                {h.emoji} {h.name}
              </button>
            );
          })}
        </div>
        <label className="mt-4 block">
          <span className="text-sm font-bold text-ink-soft">Private note</span>
          <textarea
            className={`${inputCls} mt-1.5 min-h-20 resize-y`}
            placeholder="Gift ideas, things they already have, what they mentioned…"
            value={note}
            maxLength={2000}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => noteChanged && void run({ ownerNote: note })}
          />
        </label>
        <p className="mt-1.5 text-xs text-ink-soft" aria-live="polite">
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : status === "error" ? "Couldn't save. Try again." : `Only you can see this${p.kind === "child" ? " (and co-guardians)" : ""}.`}
        </p>
      </div>
    </>
  );
}

function SectionTitle({ icon: Icon, children }: { icon: typeof Gift; children: React.ReactNode }) {
  return (
    <h3 className="mb-2.5 flex items-center gap-2 text-sm font-extrabold tracking-wide text-ink-soft uppercase">
      <Icon className="h-4 w-4" /> {children}
    </h3>
  );
}

export function WishlistLinkList({ links }: { links: string[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {links.map((url) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 rounded-full bg-blush/60 px-3.5 py-1.5 text-sm font-bold text-ink hover:bg-blush"
        >
          {linkTitle(url)} <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ))}
    </div>
  );
}

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky px-2.5 py-1" title="Updates automatically from their own profile">
      <Link2 className="h-3 w-3" /> Live
    </span>
  );
}

/** Connected (live) status, or a way to ask the person to connect their own profile. */
function ConnectionPanel({ person: p, onChanged }: { person: Person; onChanged: () => void }) {
  const user = useUser();
  const first = p.name.split(" ")[0]!;
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const day = (iso?: string) => (iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "");

  const ask = async () => {
    if (!user) return;
    setBusy(true);
    setNote(null);
    try {
      setLink(await askToConnect(p, user.sub, user.name));
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Couldn't create the link");
    } finally {
      setBusy(false);
    }
  };
  const stop = async () => {
    if (!p.linked) return;
    setBusy(true);
    try {
      await endConnection(p.linked.connectionId);
      onChanged();
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Couldn't stop syncing");
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };
  const message = link ? `Hi ${first}! Connect your My Gift Lockers profile so I always have your current sizes and wishes: ${link}` : "";

  const pill = "relative mt-4 rounded-2xl bg-white/80 px-4 py-3 text-sm shadow-soft";
  if (p.linked && !p.linked.ended)
    return (
      <div className={pill}>
        <p className="flex items-center justify-center gap-1.5 font-bold">
          <Link2 className="h-4 w-4 text-plum" /> Connected to {first}'s profile
        </p>
        <p className="text-ink-soft">Updates automatically{p.linked.syncedAt ? ` · last ${day(p.linked.syncedAt)}` : ""}</p>
        {confirming ? (
          <p className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <span>Stop syncing? You keep what's here.</span>
            <button onClick={stop} disabled={busy} className="rounded-full bg-ink px-3 py-1 font-bold text-white">
              Stop
            </button>
            <button onClick={() => setConfirming(false)} className="rounded-full px-3 py-1 font-bold text-ink-soft">
              Cancel
            </button>
          </p>
        ) : (
          <button onClick={() => setConfirming(true)} className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-ink-soft hover:text-ink">
            <Unlink className="h-3 w-3" /> Stop syncing
          </button>
        )}
        {note && <p className="mt-1 text-xs font-bold text-rose-deep">{note}</p>}
      </div>
    );

  return (
    <div className={pill}>
      {p.linked?.ended && <p className="mb-1 text-ink-soft">No longer updating{p.linked.syncedAt ? ` · last update ${day(p.linked.syncedAt)}` : ""}</p>}
      {!link ? (
        <button onClick={ask} disabled={busy} className="inline-flex items-center gap-1.5 font-bold text-plum hover:underline">
          <Link2 className="h-4 w-4" /> {busy ? "Creating link…" : `Ask ${first} to connect`}
        </button>
      ) : (
        <>
          <p className="font-bold">Send {first} this link</p>
          <p className="text-xs text-ink-soft">When they connect, their changes show up here automatically.</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => navigator.clipboard?.writeText(link).then(() => setNote("Link copied"))}
              className="inline-flex items-center gap-1 rounded-full bg-cream px-3 py-1.5 font-bold ring-1 ring-lavender/60"
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
            <a href={smsHref(message)} className="inline-flex items-center gap-1 rounded-full bg-cream px-3 py-1.5 font-bold ring-1 ring-lavender/60">
              <MessageCircle className="h-3.5 w-3.5" /> Text
            </a>
            {typeof navigator !== "undefined" && "share" in navigator && (
              <button
                onClick={() => navigator.share({ text: message }).catch(() => {})}
                className="inline-flex items-center gap-1 rounded-full bg-cream px-3 py-1.5 font-bold ring-1 ring-lavender/60"
              >
                <Share2 className="h-3.5 w-3.5" /> Share
              </button>
            )}
          </div>
        </>
      )}
      {note && <p className="mt-1 text-xs font-bold text-ink-soft">{note}</p>}
    </div>
  );
}
