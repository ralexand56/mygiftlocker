/** Month/day dates where the year is optional (people often skip birth years). */
export interface PartialDate {
  month: number; // 1-12
  day: number; // 1-31
  year?: number;
}

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function daysInMonth(month: number, year = 2024 /* leap-safe default */): number {
  return new Date(year, month, 0).getDate();
}

export function isValidPartialDate(d: PartialDate): boolean {
  if (!Number.isInteger(d.month) || d.month < 1 || d.month > 12) return false;
  if (!Number.isInteger(d.day) || d.day < 1) return false;
  return d.day <= daysInMonth(d.month, d.year ?? 2024);
}

export function formatPartialDate(d: PartialDate): string {
  const base = `${MONTHS[d.month - 1]} ${d.day}`;
  return d.year ? `${base}, ${d.year}` : base;
}

/** Next occurrence on or after `from` (Feb 29 falls back to Feb 28 in non-leap years). */
export function nextOccurrence(d: PartialDate, from = new Date()): Date {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const make = (y: number) => new Date(y, d.month - 1, Math.min(d.day, daysInMonth(d.month, y)));
  const thisYear = make(today.getFullYear());
  return thisYear >= today ? thisYear : make(today.getFullYear() + 1);
}

export function daysUntil(d: PartialDate, from = new Date()): number {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((nextOccurrence(d, from).getTime() - today.getTime()) / 86_400_000);
}

/** Age / years-married they will turn on the next occurrence, if year known. */
export function upcomingMilestone(d: PartialDate, from = new Date()): number | undefined {
  if (!d.year) return undefined;
  return nextOccurrence(d, from).getFullYear() - d.year;
}
