/**
 * Email reminders for locker owners. Personal dates (birthdays, anniversaries,
 * other dates) are reminded a week before and the day before; tagged holidays
 * three weeks and one week before, grouped into one block per holiday.
 * Pure logic, shared with tests; amplify/functions/event-reminders sends them.
 */
import { eventLabel, upcomingEvents, type EventKind, type UpcomingEvent } from "./events";
import { defaultT, intlTag, listJoin, type Tr } from "./i18n";
import { shortPlace } from "./addresses";
import { linkTitle } from "./links";
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

function when(days: number, date: Date, t: Tr): string {
  const on = date.toLocaleDateString(intlTag(t), { weekday: "long", month: "short", day: "numeric" });
  if (days !== 7 && days > 1 && days % 7 === 0) return t("email.whenWeeks", { weeks: days / 7, date: on });
  return t("email.when", { days, date: on });
}

function personalHeadline(r: DueReminder, t: Tr): string {
  const name = firstName(r.personName);
  const w = when(r.days, r.date, t);
  const m = r.milestone && r.milestone > 0 ? r.milestone : 0;
  const extra = m ? (r.kind === "birthday" ? ` · ${t("email.turning", { n: m })}` : r.kind === "anniversary" ? ` · ${t("email.years", { n: m })}` : "") : "";
  if (r.kind === "other") return `${t("email.other", { name, label: r.label, when: w })}${extra}`;
  return `${t(r.kind === "anniversary" ? "email.anniversary" : "email.birthday", { name, when: w })}${extra}`;
}

/** Gift-helpful lines for one person, including the owner's private note. */
function details(p: Person, t: Tr): string[] {
  const lines: string[] = [];
  const sizes = summarizeSizes(p.sizes, t);
  if (sizes) lines.push(t("email.sizes", { v: sizes }));
  const wishes = p.favorites?.wishes?.filter(Boolean).slice(0, 3) ?? [];
  if (wishes.length) lines.push(t("email.wishes", { v: wishes.join(", ") }));
  if (p.favorites?.likes) lines.push(t("email.loves", { v: p.favorites.likes }));
  if (p.favorites?.teams) lines.push(t("email.teams", { v: p.favorites.teams }));
  if (p.favorites?.avoid) lines.push(t("email.avoid", { v: p.favorites.avoid }));
  for (const url of p.favorites?.wishlists?.slice(0, 2) ?? []) lines.push(`${linkTitle(url, t)}: ${url}`);
  if (p.address?.city) lines.push(t("email.shipsTo", { v: shortPlace(p.address, "US", t) }));
  if (p.ownerNote?.trim()) lines.push(t("email.yourNote", { v: p.ownerNote.trim() }));
  return lines;
}

/** A block in the email: one personal date, or one holiday with everyone tagged for it. */
type Block =
  | { type: "personal"; emoji: string; title: string; reminder: DueReminder }
  | { type: "holiday"; emoji: string; title: string; holidayId: HolidayId; people: Person[] };

function toBlocks(reminders: DueReminder[], t: Tr): Block[] {
  const blocks: Block[] = [];
  const holidays = new Map<string, Extract<Block, { type: "holiday" }>>();
  for (const r of reminders) {
    if (!r.holidayId) {
      blocks.push({ type: "personal", emoji: emojiFor(r), title: personalHeadline(r, t), reminder: r });
      continue;
    }
    const key = `${r.holidayId}:${r.days}`;
    let b = holidays.get(key);
    if (!b) {
      b = { type: "holiday", emoji: emojiFor(r), title: t("email.holiday", { holiday: eventLabel(r, t), when: when(r.days, r.date, t) }), holidayId: r.holidayId, people: [] };
      holidays.set(key, b);
      blocks.push(b);
    }
    b.people.push(r.person);
  }
  return blocks;
}

const listNames = (people: Person[], t: Tr) => {
  const names = people.map((p) => firstName(p.name));
  if (names.length <= 3) return listJoin(names, t);
  return t("email.andMore", { names: names.slice(0, 3).join(", "), count: names.length - 3 });
};

function subjectFor(blocks: Block[], t: Tr): string {
  if (blocks.length === 1) {
    const b = blocks[0]!;
    return b.type === "personal" ? `${b.emoji} ${b.title}` : `${b.emoji} ${b.title} · ${t("email.shoppingFor", { names: listNames(b.people, t) })}`;
  }
  const names = blocks.map((b) => (b.type === "personal" ? firstName(b.reminder.personName) : t(`core.holidays.${holiday(b.holidayId).id}.name`)));
  return `🎁 ${t("email.manyDays", { count: blocks.length, names: names.join(", ") })}`;
}

export interface ReminderEmail {
  subject: string;
  text: string;
  html: string;
}

/** One email listing every due reminder for an owner. */
export function buildReminderEmail(opts: { ownerName?: string; reminders: DueReminder[]; lockerUrl: string; unsubscribeUrl: string; t?: Tr }): ReminderEmail {
  const { lockerUrl, unsubscribeUrl } = opts;
  const t = opts.t ?? defaultT;
  const details_ = (p: Person) => details(p, t);
  const hi = opts.ownerName ? t("email.hi", { name: firstName(opts.ownerName) }) : t("email.hiAnon");
  const blocks = toBlocks(opts.reminders, t);

  const textBlock = (b: Block) =>
    b.type === "personal"
      ? [`${b.emoji} ${b.title}`, ...details_(b.reminder.person).map((l) => `   ${l}`), ""]
      : [`${b.emoji} ${b.title}`, ...b.people.flatMap((p) => [`   ${p.name}`, ...details_(p).map((l) => `      ${l}`)]), ""];

  const text = [
    hi,
    "",
    ...blocks.flatMap(textBlock),
    t("email.openLockerText", { url: lockerUrl }),
    "",
    "—",
    t("email.why"),
    t("email.stopText", { url: unsubscribeUrl }),
  ].join("\n");

  const detailHtml = (p: Person) => details_(p).map((l) => `<p style="margin:4px 0 0;font-size:14px;color:#6b5f80">${esc(l)}</p>`).join("");
  const card = (b: Block) => `
    <tr><td style="padding:16px 20px;background:#ffffff;border-radius:16px">
      <p style="margin:0;font-size:18px;font-weight:700;color:#3b2f52">${b.emoji} ${esc(b.title)}</p>
      ${
        b.type === "personal"
          ? detailHtml(b.reminder.person)
          : b.people.map((p) => `<p style="margin:12px 0 0;font-size:15px;font-weight:700;color:#3b2f52">${esc(p.name)}</p>${detailHtml(p)}`).join("")
      }
    </td></tr><tr><td style="height:12px"></td></tr>`;

  const html = `<!doctype html><html lang="${t.locale}"><body style="margin:0;background:#fff7f3;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 16px">
    <table role="presentation" width="100%" style="max-width:520px" cellpadding="0" cellspacing="0">
      <tr><td style="padding-bottom:18px;font-size:20px;font-weight:700;color:#3b2f52"><span style="color:#e9779f">My</span> Gift Lockers</td></tr>
      <tr><td style="padding-bottom:14px;font-size:15px;color:#3b2f52">${esc(hi)}</td></tr>
      ${blocks.map(card).join("")}
      <tr><td style="padding:8px 0 24px"><a href="${esc(lockerUrl)}" style="display:inline-block;background:#4a3b66;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px">${esc(t("email.openLocker"))}</a></td></tr>
      <tr><td style="font-size:12px;color:#8a7f9c">${esc(t("email.why"))}
        <a href="${esc(unsubscribeUrl)}" style="color:#8a7f9c">${esc(t("email.stop"))}</a>.</td></tr>
    </table>
  </td></tr></table></body></html>`;

  return { subject: subjectFor(blocks, t), text, html };
}
