/**
 * Gift-giving holidays the locker owner can tag per person. Unlike birthdays,
 * these are shared dates, and some move every year (US Mother's/Father's Day).
 */

export type HolidayId = "christmas" | "valentines" | "mothers-day" | "fathers-day";

export interface Holiday {
  id: HolidayId;
  name: string;
  emoji: string;
  /** Short rule shown in the UI. */
  when: string;
  /** The date in a given year (local midnight). */
  dateIn: (year: number) => Date;
}

import { defaultT, type Tr } from "./i18n";

export const holidayName = (id: HolidayId, t: Tr = defaultT) => t(`core.holidays.${id}.name`);
/** When it falls, e.g. "2nd Sunday in May". */
export const holidayWhen = (id: HolidayId, t: Tr = defaultT) => t(`core.holidays.${id}.when`);

/** The nth (1-based) given weekday (0 = Sunday) of a month (1-12). */
export function nthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): Date {
  const first = new Date(year, month - 1, 1).getDay();
  return new Date(year, month - 1, 1 + ((weekday - first + 7) % 7) + (n - 1) * 7);
}

export const HOLIDAYS: readonly Holiday[] = [
  { id: "valentines", name: "Valentine's Day", emoji: "💝", when: "February 14", dateIn: (y) => new Date(y, 1, 14) },
  { id: "mothers-day", name: "Mother's Day", emoji: "💐", when: "2nd Sunday in May", dateIn: (y) => nthWeekdayOfMonth(y, 5, 0, 2) },
  { id: "fathers-day", name: "Father's Day", emoji: "👔", when: "3rd Sunday in June", dateIn: (y) => nthWeekdayOfMonth(y, 6, 0, 3) },
  { id: "christmas", name: "Christmas", emoji: "🎄", when: "December 25", dateIn: (y) => new Date(y, 11, 25) },
];

const BY_ID = new Map(HOLIDAYS.map((h) => [h.id, h]));

export function holiday(id: HolidayId): Holiday {
  return BY_ID.get(id)!;
}

export function isHolidayId(v: unknown): v is HolidayId {
  return typeof v === "string" && BY_ID.has(v as HolidayId);
}

/** Next occurrence on or after `from`'s calendar day. */
export function nextHoliday(id: HolidayId, from = new Date()): Date {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const h = holiday(id);
  const thisYear = h.dateIn(today.getFullYear());
  return thisYear >= today ? thisYear : h.dateIn(today.getFullYear() + 1);
}

/** Keeps only known holiday ids, deduplicated, in calendar order. */
export function cleanHolidays(input: unknown): HolidayId[] {
  if (!Array.isArray(input)) return [];
  const set = new Set(input.filter(isHolidayId));
  return HOLIDAYS.map((h) => h.id).filter((id) => set.has(id));
}
