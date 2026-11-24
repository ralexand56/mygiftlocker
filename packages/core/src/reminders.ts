/**
 * Email reminders for locker owners: a week before and the day before each
 * person's birthday, anniversary or other date. Pure logic, shared with tests;
 * the scheduled function in amplify/functions/event-reminders sends them.
 */
import { upcomingEvents, type UpcomingEvent } from "./events";
import type { Person } from "./people";
import { summarizeSizes } from "./sizes";

/** Days ahead that trigger a reminder: a week out (time to shop) and the day before. */
export const REMINDER_LEAD_DAYS = [7, 1] as const;

export interface DueReminder extends UpcomingEvent {
  person: Person;
}

/** Events exactly REMINDER_LEAD_DAYS away from `today`, soonest first. */
export function dueReminders(people: Person[], today: Date): DueReminder[] {
  const byId = new Map(people.map((p) => [p.id, p]));
  return upcomingEvents(people, today)
    .filter((e) => (REMINDER_LEAD_DAYS as readonly number[]).includes(e.days))
    .map((e) => ({ ...e, person: byId.get(e.personId)! }));
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

const EMOJI = { birthday: "🎂", anniversary: "💞", other: "✨" } as const;

function headline(r: DueReminder): string {
  const first = r.personName.split(" ")[0];
  const when = r.days === 1 ? "tomorrow" : `in a week, on ${r.date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}`;
  const what = r.kind === "other" ? r.label : `${first}'s ${r.label.toLowerCase()}`;
  const extra = r.milestone && r.milestone > 0 ? (r.kind === "birthday" ? ` · turning ${r.milestone}` : r.kind === "anniversary" ? ` · ${r.milestone} years` : "") : "";
  return r.kind === "other" ? `${first}: ${what} is ${when}${extra}` : `${what[0]!.toUpperCase()}${what.slice(1)} is ${when}${extra}`;
}

function details(p: Person): string[] {
  const lines: string[] = [];
  const sizes = summarizeSizes(p.sizes);
  if (sizes) lines.push(`Sizes: ${sizes}`);
  const wishes = p.favorites?.wishes?.filter(Boolean).slice(0, 3) ?? [];
  if (wishes.length) lines.push(`Wishes: ${wishes.join(", ")}`);
  if (p.favorites?.likes) lines.push(`Loves: ${p.favorites.likes}`);
  if (p.favorites?.avoid) lines.push(`Avoid: ${p.favorites.avoid}`);
  if (p.address?.city) lines.push(`Ships to: ${[p.address.city, p.address.region].filter(Boolean).join(", ")}`);
  return lines;
}

export interface ReminderEmail {
  subject: string;
  text: string;
  html: string;
}

/** One email listing every due reminder for an owner. */
export function buildReminderEmail(opts: { ownerName?: string; reminders: DueReminder[]; lockerUrl: string; unsubscribeUrl: string }): ReminderEmail {
  const { reminders, lockerUrl, unsubscribeUrl } = opts;
  const hi = opts.ownerName ? `Hi ${opts.ownerName.split(" ")[0]},` : "Hi,";
  const first = reminders[0]!;
  const subject =
    reminders.length === 1 ? `${EMOJI[first.kind]} ${headline(first)}` : `🎁 ${reminders.length} special days coming up: ${reminders.map((r) => r.personName.split(" ")[0]).join(", ")}`;

  const text = [
    hi,
    "",
    ...reminders.flatMap((r) => [`${EMOJI[r.kind]} ${headline(r)}`, ...details(r.person).map((l) => `   ${l}`), ""]),
    `Open your locker: ${lockerUrl}`,
    "",
    "—",
    "You're getting this because you keep people's dates in My Gift Lockers.",
    `Stop these reminders: ${unsubscribeUrl}`,
  ].join("\n");

  const card = (r: DueReminder) => `
    <tr><td style="padding:16px 20px;background:#ffffff;border-radius:16px">
      <p style="margin:0;font-size:18px;font-weight:700;color:#3b2f52">${EMOJI[r.kind]} ${esc(headline(r))}</p>
      ${details(r.person)
        .map((l) => `<p style="margin:6px 0 0;font-size:14px;color:#6b5f80">${esc(l)}</p>`)
        .join("")}
    </td></tr><tr><td style="height:12px"></td></tr>`;

  const html = `<!doctype html><html><body style="margin:0;background:#fff7f3;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 16px">
    <table role="presentation" width="100%" style="max-width:520px" cellpadding="0" cellspacing="0">
      <tr><td style="padding-bottom:18px;font-size:20px;font-weight:700;color:#3b2f52"><span style="color:#e9779f">My</span> Gift Lockers</td></tr>
      <tr><td style="padding-bottom:14px;font-size:15px;color:#3b2f52">${esc(hi)}</td></tr>
      ${reminders.map(card).join("")}
      <tr><td style="padding:8px 0 24px"><a href="${esc(lockerUrl)}" style="display:inline-block;background:#4a3b66;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px">Open my locker</a></td></tr>
      <tr><td style="font-size:12px;color:#8a7f9c">You're getting this because you keep people's dates in My Gift Lockers.
        <a href="${esc(unsubscribeUrl)}" style="color:#8a7f9c">Stop these reminders</a>.</td></tr>
    </table>
  </td></tr></table></body></html>`;

  return { subject, text, html };
}
