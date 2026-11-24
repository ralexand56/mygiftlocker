/**
 * "Gifted" locks: the locker owner marks an occasion once they've bought the gift.
 * Keys name one occurrence (e.g. "birthday:Birthday:2026-12-03"), so the lock
 * reopens by itself for next year's date. Owner-only data.
 */
import type { LifeEvent } from "./events";
import type { Person } from "./people";

const MAX_KEYS = 60;
const KEY_RE = /^(birthday|anniversary|other|holiday):[^:]{1,60}:\d{4}-\d{2}-\d{2}$/;

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Identifies one occurrence of one event. */
export function giftKey(e: Pick<LifeEvent, "kind" | "label" | "holidayId"> & { date: Date }): string {
  return `${e.kind}:${(e.holidayId ?? e.label).replace(/:/g, " ").slice(0, 60)}:${ymd(e.date)}`;
}

export function isGifted(p: Pick<Person, "gifted">, e: Parameters<typeof giftKey>[0]): boolean {
  return !!p.gifted?.includes(giftKey(e));
}

/** Valid keys only, dropping occasions more than 60 days past so the list stays short. */
export function cleanGifted(input: unknown, today = new Date()): string[] {
  if (!Array.isArray(input)) return [];
  const cutoff = ymd(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 60));
  const keys = input.filter((k): k is string => typeof k === "string" && KEY_RE.test(k) && k.slice(-10) >= cutoff);
  return [...new Set(keys)].slice(-MAX_KEYS);
}

/** The person's gifted list with this occasion locked (on) or reopened (off). */
export function withGifted(p: Pick<Person, "gifted">, e: Parameters<typeof giftKey>[0], on: boolean, today = new Date()): string[] {
  const key = giftKey(e);
  const rest = (p.gifted ?? []).filter((k) => k !== key);
  return cleanGifted(on ? [...rest, key] : rest, today);
}
