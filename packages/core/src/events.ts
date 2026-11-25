/**
 * Upcoming life events (birthdays, anniversaries, other dates, tagged holidays) for the locker:
 * per-person "next event", sorting, name search, and a month view for the calendar.
 */
import { daysInMonth, nextOccurrence, type PartialDate } from "./dates";
import { holiday, nextHoliday, type HolidayId } from "./holidays";
import type { Person } from "./people";
import { defaultT, intlTag, type Tr } from "./i18n";

export type EventKind = "birthday" | "anniversary" | "other" | "holiday";

export interface LifeEvent {
  personId: string;
  personName: string;
  color: string;
  kind: EventKind;
  /** "Birthday", "Anniversary", the custom label, or the holiday's name. */
  label: string;
  /** Month/day for personal dates; absent for holidays (see holidayId). */
  source?: PartialDate;
  holidayId?: HolidayId;
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
  for (const id of p.holidays ?? []) out.push({ ...base, kind: "holiday", label: holiday(id).name, holidayId: id });
  return out;
}

const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

function toUpcoming(e: LifeEvent, from: Date): UpcomingEvent {
  const date = e.holidayId ? nextHoliday(e.holidayId, from) : nextOccurrence(e.source!, from);
  return {
    ...e,
    date,
    days: Math.round((date.getTime() - midnight(from).getTime()) / 86_400_000),
    milestone: e.source?.year ? date.getFullYear() - e.source.year : undefined,
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
  const out: MonthEvent[] = [];
  for (const e of people.flatMap(lifeEvents)) {
    if (e.holidayId) {
      const d = holiday(e.holidayId).dateIn(year);
      if (d.getMonth() + 1 === month) out.push({ ...e, day: d.getDate() });
    } else if (e.source!.month === month) {
      const n = e.source!.year ? year - e.source!.year : undefined;
      out.push({ ...e, day: Math.min(e.source!.day, last), milestone: n && n > 0 ? n : undefined });
    }
  }
  return out.sort((a, b) => a.day - b.day || a.personName.localeCompare(b.personName));
}

/** "today", "tomorrow", or "in N days". */
export function describeDays(days: number, t: Tr = defaultT): string {
  return t("core.days", { days });
}

/** "Maya's birthday" in the translator's language (first name only). Holiday and custom names keep their case. */
export function occasionName(personName: string, e: Pick<LifeEvent, "kind" | "label" | "holidayId">, t: Tr = defaultT): string {
  const event = eventLabel(e, t);
  const common = e.kind === "birthday" || e.kind === "anniversary";
  return t("core.occasion", { name: personName.split(" ")[0]!, event, eventLower: common ? event.toLocaleLowerCase(intlTag(t)) : event });
}

/** An event's name in the translator's language: "Birthday", the holiday, or the owner's own label. */
export function eventLabel(e: Pick<LifeEvent, "kind" | "label" | "holidayId">, t: Tr = defaultT): string {
  if (e.kind === "birthday") return t("core.events.birthday");
  if (e.kind === "anniversary") return t("core.events.anniversary");
  if (e.kind === "holiday" && e.holidayId) return t(`core.holidays.${e.holidayId}.name`);
  return e.label || t("core.events.specialDay");
}
