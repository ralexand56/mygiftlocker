"use client";

import { MONTHS, daysInMonth, eventsInMonth, type MonthEvent, type Person } from "@mgl/core";
import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui";
import { EventIcon } from "./EventIcon";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** A row in the month list: one personal date, or one holiday with everyone tagged for it. */
type Row = { key: string; day: number; event: MonthEvent; people: { id: string; name: string; color: string }[] };

function toRows(events: MonthEvent[]): Row[] {
  const rows: Row[] = [];
  const holidays = new Map<string, Row>();
  for (const e of events) {
    const who = { id: e.personId, name: e.personName, color: e.color };
    if (!e.holidayId) {
      rows.push({ key: `${e.personId}-${e.kind}-${e.label}`, day: e.day, event: e, people: [who] });
      continue;
    }
    const key = `${e.holidayId}-${e.day}`;
    const row = holidays.get(key);
    if (row) row.people.push(who);
    else {
      const r = { key, day: e.day, event: e, people: [who] };
      holidays.set(key, r);
      rows.push(r);
    }
  }
  return rows;
}

const nameList = (names: string[]) =>
  names.length <= 3 ? (names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`) : `${names.slice(0, 3).join(", ")} +${names.length - 3}`;

const milestoneText = (e: MonthEvent) =>
  e.milestone ? (e.kind === "birthday" ? ` · turns ${e.milestone}` : ` · ${e.milestone} ${e.milestone === 1 ? "year" : "years"}`) : "";

/** Month calendar of everyone's birthdays, anniversaries and other dates, with that month's list below. */
export function LockerCalendar({ people, onOpenPerson }: { people: Person[]; onOpenPerson: (id: string) => void }) {
  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() + 1 });
  const [direction, setDirection] = useState(1);

  const events = useMemo(() => eventsInMonth(people, view.year, view.month), [people, view]);
  const byDay = useMemo(() => {
    const m = new Map<number, MonthEvent[]>();
    for (const e of events) m.set(e.day, [...(m.get(e.day) ?? []), e]);
    return m;
  }, [events]);

  const first = new Date(view.year, view.month - 1, 1).getDay();
  const total = daysInMonth(view.month, view.year);
  const cells: (number | null)[] = [...Array.from({ length: first }, () => null), ...Array.from({ length: total }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  const isCurrentMonth = view.year === today.getFullYear() && view.month === today.getMonth() + 1;
  const isToday = (day: number) => isCurrentMonth && day === today.getDate();
  const isPast = (day: number) => new Date(view.year, view.month - 1, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const go = (delta: number) => {
    setDirection(delta);
    setView(({ year, month }) => {
      const d = new Date(year, month - 1 + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
  };
  const goToday = () => {
    setDirection(view.year * 12 + view.month < today.getFullYear() * 12 + today.getMonth() + 1 ? 1 : -1);
    setView({ year: today.getFullYear(), month: today.getMonth() + 1 });
  };

  const navBtn = "grid h-10 w-10 place-items-center rounded-full bg-white/80 shadow-soft hover:bg-white";

  return (
    <section aria-labelledby="locker-calendar" className="glass mt-10 rounded-[32px] p-5 shadow-soft sm:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 id="locker-calendar" className="flex items-center gap-2 font-display text-2xl font-semibold">
          <CalendarDays className="h-6 w-6 text-rose" /> Upcoming dates
        </h2>
        <div className="flex items-center gap-2">
          {!isCurrentMonth && (
            <button onClick={goToday} className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold shadow-soft hover:bg-white">
              Today
            </button>
          )}
          <button onClick={() => go(-1)} className={navBtn} aria-label="Previous month">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <p className="w-40 text-center font-display text-lg font-semibold" aria-live="polite">
            {MONTHS[view.month - 1]} {view.year}
          </p>
          <button onClick={() => go(1)} className={navBtn} aria-label="Next month">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.div
          key={`${view.year}-${view.month}`}
          custom={direction}
          initial={{ opacity: 0, x: direction * 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -24 }}
          transition={{ duration: 0.2 }}
        >
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-extrabold tracking-wide text-ink-soft uppercase">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1">
                <span className="hidden sm:inline">{w}</span>
                <span className="sm:hidden">{w[0]}</span>
              </div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={`blank-${i}`} />;
              const dayEvents = byDay.get(day) ?? [];
              const label = `${MONTHS[view.month - 1]} ${day}${dayEvents.length ? `: ${dayEvents.map((e) => `${e.personName} ${e.label.toLowerCase()}`).join(", ")}` : ""}`;
              return (
                <button
                  key={day}
                  type="button"
                  disabled={!dayEvents.length}
                  onClick={() => dayEvents[0] && onOpenPerson(dayEvents[0].personId)}
                  aria-label={label}
                  title={dayEvents.map((e) => `${e.personName}: ${e.label}`).join("\n") || undefined}
                  className={`flex min-h-16 flex-col items-center gap-1 rounded-2xl p-1.5 text-sm transition-colors sm:min-h-20 ${
                    dayEvents.length ? "bg-white shadow-soft hover:bg-blush/60" : "bg-white/40"
                  } ${isToday(day) ? "ring-2 ring-rose" : ""} ${isPast(day) && !isToday(day) ? "opacity-55" : ""}`}
                >
                  <span className={`font-bold ${isToday(day) ? "text-rose-deep" : "text-ink"}`}>{day}</span>
                  {dayEvents.length > 0 && (
                    <span className="flex -space-x-2">
                      {dayEvents.slice(0, 3).map((e) => (
                        <span key={`${e.personId}-${e.kind}-${e.label}`} className="rounded-full ring-2 ring-white">
                          <Avatar name={e.personName} color={e.color} size={22} />
                        </span>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-lavender text-[10px] font-bold ring-2 ring-white">
                          +{dayEvents.length - 3}
                        </span>
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <ul className="mt-6 grid gap-2">
            {events.length === 0 && <li className="rounded-2xl bg-white/60 p-4 text-center text-sm text-ink-soft">No dates in {MONTHS[view.month - 1]}.</li>}
            {toRows(events).map((r) => {
              const e = r.event;
              const when = new Date(view.year, view.month - 1, r.day);
              const isHoliday = e.kind === "holiday";
              return (
                <li key={r.key}>
                  <button
                    onClick={() => onOpenPerson(r.people[0]!.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl bg-white/80 p-3 text-left shadow-soft hover:bg-white ${isPast(r.day) ? "opacity-60" : ""}`}
                  >
                    <span className="w-14 shrink-0 text-center">
                      <span className="block text-xs font-extrabold text-ink-soft uppercase">{when.toLocaleDateString(undefined, { weekday: "short" })}</span>
                      <span className="block font-display text-2xl leading-none font-semibold">{r.day}</span>
                    </span>
                    <span className="flex shrink-0 -space-x-2">
                      {r.people.slice(0, 3).map((p) => (
                        <span key={p.id} className="rounded-full ring-2 ring-white">
                          <Avatar name={p.name} color={p.color} size={36} />
                        </span>
                      ))}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{isHoliday ? e.label : e.personName}</span>
                      <span className="flex items-center gap-1.5 text-sm text-ink-soft">
                        <EventIcon kind={e.kind} holidayId={e.holidayId} className="h-3.5 w-3.5 text-rose" />
                        <span className="truncate">{isHoliday ? nameList(r.people.map((p) => p.name.split(" ")[0]!)) : `${e.label}${milestoneText(e)}`}</span>
                      </span>
                    </span>
                    {isToday(r.day) && <span className="rounded-full bg-rose px-2.5 py-1 text-xs font-bold text-white">Today</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
