/**
 * Upcoming life events (birthdays, anniversaries, other dates) for the locker:
 * per-person "next event", sorting, name search, and a month view for the calendar.
 */
import { daysInMonth, daysUntil, nextOccurrence, type PartialDate } from "./dates";
import type { Person } from "./people";

export type EventKind = "birthday" | "anniversary" | "other";

export interface LifeEvent {
  personId: string;
  personName: string;
  color: string;
  kind: EventKind;
  /** "Birthday", "Anniversary", or the custom label. */
  label: string;
  source: PartialDate;
}

export interface UpcomingEvent extends LifeEvent {
  /** Next occurrence on or after the reference day (local midnight). */
  date: Date;
  /** Whole days from the reference day; 0 means today. */
  days: number;
  /** Age they turn / years celebrated, when the year is known. */
  milestone?: number;
}

export type PeopleSort = "next" | "name";

/** Every dated event for one person, without computing occurrences. */
export function lifeEvents(p: Person): LifeEvent[] {
  const base = { personId: p.id, personName: p.name, color: p.color };
  const out: LifeEvent[] = [];
  if (p.birthday) out.push({ ...base, kind: "birthday", label: "Birthday", source: p.birthday });
  if (p.anniversary) out.push({ ...base, kind: "anniversary", label: "Anniversary", source: p.anniversary });
  for (const o of p.otherDates ?? []) out.push({ ...base, kind: "other", label: o.label || "Special day", source: o.date });
  return out;
}

function toUpcoming(e: LifeEvent, from: Date): UpcomingEvent {
  const date = nextOccurrence(e.source, from);
  return {
    ...e,
    date,
    days: daysUntil(e.source, from),
    milestone: e.source.year ? date.getFullYear() - e.source.year : undefined,
  };
}

const byDaysThenName = (a: UpcomingEvent, b: UpcomingEvent) => a.days - b.days || a.personName.localeCompare(b.personName) || a.label.localeCompare(b.label);

/** All of a person's events by next occurrence, soonest first. */
export function upcomingEventsFor(p: Person, from = new Date()): UpcomingEvent[] {
  return lifeEvents(p)
    .map((e) => toUpcoming(e, from))
    .sort(byDaysThenName);
}

/** The person's soonest upcoming event, if they have any dates. */
export function nextEvent(p: Person, from = new Date()): UpcomingEvent | undefined {
  return upcomingEventsFor(p, from)[0];
}

/** Everyone's events, soonest first, optionally limited to the next `withinDays` days. */
export function upcomingEvents(people: Person[], from = new Date(), withinDays?: number): UpcomingEvent[] {
  const all = people.flatMap((p) => lifeEvents(p).map((e) => toUpcoming(e, from)));
  return all.filter((e) => withinDays === undefined || e.days <= withinDays).sort(byDaysThenName);
}

const byName = (a: Person, b: Person) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

/**
 * "next": soonest upcoming event first (ties by name); people without dates go last, by name.
 * "name": alphabetical, case-insensitive.
 */
export function sortPeople(people: Person[], by: PeopleSort, from = new Date()): Person[] {
  if (by === "name") return [...people].sort(byName);
  const next = new Map(people.map((p) => [p.id, nextEvent(p, from)?.days]));
  return [...people].sort((a, b) => {
    const da = next.get(a.id);
    const db = next.get(b.id);
    if (da === undefined && db === undefined) return byName(a, b);
    if (da === undefined) return 1;
    if (db === undefined) return -1;
    return da - db || byName(a, b);
  });
}

/** Case-insensitive name match on any part of the name; blank query keeps everyone. */
export function filterPeopleByName(people: Person[], query: string): Person[] {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return people;
  return people.filter((p) => p.name.toLocaleLowerCase().includes(q));
}

export interface MonthEvent extends LifeEvent {
  /** Day of the month this event falls on in the given year (Feb 29 → Feb 28 in non-leap years). */
  day: number;
  /** Age / years celebrated in that year, when the year is known and positive. */
  milestone?: number;
}

/** Events falling in `month` (1-12) of `year`, ordered by day then name. */
export function eventsInMonth(people: Person[], year: number, month: number): MonthEvent[] {
  const last = daysInMonth(month, year);
  return people
    .flatMap(lifeEvents)
    .filter((e) => e.source.month === month)
    .map((e) => {
      const n = e.source.year ? year - e.source.year : undefined;
      return { ...e, day: Math.min(e.source.day, last), milestone: n && n > 0 ? n : undefined };
    })
    .sort((a, b) => a.day - b.day || a.personName.localeCompare(b.personName));
}

/** "today", "tomorrow", or "in N days". */
export function describeDays(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}
