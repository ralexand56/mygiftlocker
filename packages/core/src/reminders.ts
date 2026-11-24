/**
 * Email reminders for locker owners. Personal dates (birthdays, anniversaries,
 * other dates) are reminded a week before and the day before; tagged holidays
 * three weeks and one week before, grouped into one block per holiday.
 * Pure logic, shared with tests; amplify/functions/event-reminders sends them.
 */
import { upcomingEvents, type EventKind, type UpcomingEvent } from "./events";
import { shortPlace } from "./addresses";
import { isGifted } from "./gifts";
import { holiday, type HolidayId } from "./holidays";
import type { Person } from "./people";
import { summarizeSizes } from "./sizes";

/** Days ahead that trigger a reminder for birthdays, anniversaries and other dates. */
export const PERSONAL_LEAD_DAYS = [7, 1] as const;
/** Holidays need more shopping (and shipping) time. */
export const HOLIDAY_LEAD_DAYS = [21, 7] as const;

export interface DueReminder extends UpcomingEvent {
  person: Person;
}

const leadDays = (kind: EventKind): readonly number[] => (kind === "holiday" ? HOLIDAY_LEAD_DAYS : PERSONAL_LEAD_DAYS);

/** Events whose lead time matches today, soonest first. Occasions already marked gifted are skipped. */
export function dueReminders(people: Person[], today: Date): DueReminder[] {
  const byId = new Map(people.map((p) => [p.id, p]));
  return upcomingEvents(people, today)
    .filter((e) => leadDays(e.kind).includes(e.days))
    .map((e) => ({ ...e, person: byId.get(e.personId)! }))
    .filter((e) => !isGifted(e.person, e));
}

/** Local midnight of the current calendar day in `timeZone` (e.g. "America/New_York"). */
export function todayInTimeZone(timeZone: string, now = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return new Date(get("year"), get("month") - 1, get("day"));
}

/** "2026-11-24" for a local date, used to make one reminder email per owner per day. */
export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const PERSONAL_EMOJI = { birthday: "🎂", anniversary: "💞", other: "✨" } as const;
const emojiFor = (r: DueReminder) => (r.holidayId ? holiday(r.holidayId).emoji : PERSONAL_EMOJI[r.kind as keyof typeof PERSONAL_EMOJI]);
const firstName = (name: string) => name.split(" ")[0]!;

function when(days: number, date: Date): string {
  if (days === 1) return "tomorrow";
  const on = date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  if (days === 7) return `in a week, on ${on}`;
  if (days % 7 === 0) return `in ${days / 7} weeks, on ${on}`;
  return `in ${days} days, on ${on}`;
}

function personalHeadline(r: DueReminder): string {
  const first = firstName(r.personName);
  const extra = r.milestone && r.milestone > 0 ? (r.kind === "birthday" ? ` · turning ${r.milestone}` : r.kind === "anniversary" ? ` · ${r.milestone} years` : "") : "";
  if (r.kind === "other") return `${first}: ${r.label} is ${when(r.days, r.date)}${extra}`;
  const what = `${first}'s ${r.label.toLowerCase()}`;
  return `${what[0]!.toUpperCase()}${what.slice(1)} is ${when(r.days, r.date)}${extra}`;
}

/** Gift-helpful lines for one person, including the owner's private note. */
function details(p: Person): string[] {
  const lines: string[] = [];
  const sizes = summarizeSizes(p.sizes);
  if (sizes) lines.push(`Sizes: ${sizes}`);
  const wishes = p.favorites?.wishes?.filter(Boolean).slice(0, 3) ?? [];
  if (wishes.length) lines.push(`Wishes: ${wishes.join(", ")}`);
  if (p.favorites?.likes) lines.push(`Loves: ${p.favorites.likes}`);
  if (p.favorites?.avoid) lines.push(`Avoid: ${p.favorites.avoid}`);
  if (p.address?.city) lines.push(`Ships to: ${shortPlace(p.address)}`);
  if (p.ownerNote?.trim()) lines.push(`Your note: ${p.ownerNote.trim()}`);
  return lines;
}

/** A block in the email: one personal date, or one holiday with everyone tagged for it. */
type Block =
  | { type: "personal"; emoji: string; title: string; reminder: DueReminder }
  | { type: "holiday"; emoji: string; title: string; holidayId: HolidayId; people: Person[] };

function toBlocks(reminders: DueReminder[]): Block[] {
  const blocks: Block[] = [];
  const holidays = new Map<string, Extract<Block, { type: "holiday" }>>();
  for (const r of reminders) {
    if (!r.holidayId) {
      blocks.push({ type: "personal", emoji: emojiFor(r), title: personalHeadline(r), reminder: r });
      continue;
    }
    const key = `${r.holidayId}:${r.days}`;
    let b = holidays.get(key);
    if (!b) {
      b = { type: "holiday", emoji: emojiFor(r), title: `${r.label} is ${when(r.days, r.date)}`, holidayId: r.holidayId, people: [] };
      holidays.set(key, b);
      blocks.push(b);
    }
    b.people.push(r.person);
  }
  return blocks;
}

const listNames = (people: Person[]) => {
  const names = people.map((p) => firstName(p.name));
  if (names.length <= 3) return names.length === 1 ? names[0]! : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
  return `${names.slice(0, 3).join(", ")} and ${names.length - 3} more`;
};

function subjectFor(blocks: Block[]): string {
  if (blocks.length === 1) {
    const b = blocks[0]!;
    return b.type === "personal" ? `${b.emoji} ${b.title}` : `${b.emoji} ${b.title} · shopping for ${listNames(b.people)}`;
  }
  const names = blocks.map((b) => (b.type === "personal" ? firstName(b.reminder.personName) : holiday(b.holidayId).name));
  return `🎁 ${blocks.length} special days coming up: ${names.join(", ")}`;
}

export interface ReminderEmail {
  subject: string;
  text: string;
  html: string;
}

/** One email listing every due reminder for an owner. */
export function buildReminderEmail(opts: { ownerName?: string; reminders: DueReminder[]; lockerUrl: string; unsubscribeUrl: string }): ReminderEmail {
  const { lockerUrl, unsubscribeUrl } = opts;
  const hi = opts.ownerName ? `Hi ${firstName(opts.ownerName)},` : "Hi,";
  const blocks = toBlocks(opts.reminders);

  const textBlock = (b: Block) =>
    b.type === "personal"
      ? [`${b.emoji} ${b.title}`, ...details(b.reminder.person).map((l) => `   ${l}`), ""]
      : [`${b.emoji} ${b.title}`, ...b.people.flatMap((p) => [`   ${p.name}`, ...details(p).map((l) => `      ${l}`)]), ""];

  const text = [
    hi,
    "",
    ...blocks.flatMap(textBlock),
    `Open your locker: ${lockerUrl}`,
    "",
    "—",
    "You're getting this because you keep people's dates in My Gift Lockers.",
    `Stop these reminders: ${unsubscribeUrl}`,
  ].join("\n");

  const detailHtml = (p: Person) => details(p).map((l) => `<p style="margin:4px 0 0;font-size:14px;color:#6b5f80">${esc(l)}</p>`).join("");
  const card = (b: Block) => `
    <tr><td style="padding:16px 20px;background:#ffffff;border-radius:16px">
      <p style="margin:0;font-size:18px;font-weight:700;color:#3b2f52">${b.emoji} ${esc(b.title)}</p>
      ${
        b.type === "personal"
          ? detailHtml(b.reminder.person)
          : b.people.map((p) => `<p style="margin:12px 0 0;font-size:15px;font-weight:700;color:#3b2f52">${esc(p.name)}</p>${detailHtml(p)}`).join("")
      }
    </td></tr><tr><td style="height:12px"></td></tr>`;

  const html = `<!doctype html><html><body style="margin:0;background:#fff7f3;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 16px">
    <table role="presentation" width="100%" style="max-width:520px" cellpadding="0" cellspacing="0">
      <tr><td style="padding-bottom:18px;font-size:20px;font-weight:700;color:#3b2f52"><span style="color:#e9779f">My</span> Gift Lockers</td></tr>
      <tr><td style="padding-bottom:14px;font-size:15px;color:#3b2f52">${esc(hi)}</td></tr>
      ${blocks.map(card).join("")}
      <tr><td style="padding:8px 0 24px"><a href="${esc(lockerUrl)}" style="display:inline-block;background:#4a3b66;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px">Open my locker</a></td></tr>
      <tr><td style="font-size:12px;color:#8a7f9c">You're getting this because you keep people's dates in My Gift Lockers.
        <a href="${esc(unsubscribeUrl)}" style="color:#8a7f9c">Stop these reminders</a>.</td></tr>
    </table>
  </td></tr></table></body></html>`;

  return { subject: subjectFor(blocks), text, html };
}
