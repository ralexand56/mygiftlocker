"use client";

/**
 * The signed-in user's own profile: their sizes, dates and favorites. Separate
 * from the people in their locker (no reminders about yourself). It can be
 * shared into gift exchanges so they don't retype it.
 *
 * Someone who answers an invite and then creates an account gets those answers
 * as their profile: the invite flow keeps a copy in this browser until they sign in.
 */
import { pastelFor, type Person } from "@mgl/core";
import { api, backendEnabled, parseJson } from "./amplify";
import { readDB, update } from "./store";

const PENDING = "mgl:pendingSelf";

type PD = { month: number; day: number; year?: number | null } | null | undefined;
const date = (d: PD) => (d ? { month: d.month, day: d.day, year: d.year ?? undefined } : undefined);

export async function getSelfProfile(sub: string): Promise<Person | null> {
  if (!backendEnabled) return readDB().self ?? null;
  const { data: p } = await api().models.SelfProfile.get({ ownerSub: sub });
  if (!p) return null;
  return {
    id: "self",
    name: p.name,
    kind: "adult",
    color: pastelFor(p.name),
    sizes: parseJson(p.sizes ?? "{}") ?? {},
    address: parseJson(p.address ?? "null") ?? undefined,
    birthday: date(p.birthday),
    anniversary: date(p.anniversary),
    favorites: parseJson(p.favorites ?? "null") ?? undefined,
    updatedAt: p.updatedAt,
  };
}

export async function saveSelfProfile(sub: string, p: Person): Promise<void> {
  if (!backendEnabled) {
    update((db) => ({ ...db, self: { ...p, id: "self" } }));
    return;
  }
  const json = (v: unknown) => (v === undefined || v === null ? null : JSON.stringify(v));
  const fields = {
    ownerSub: sub,
    name: p.name.trim().slice(0, 80) || "Me",
    sizes: json(p.sizes),
    address: json(p.address),
    birthday: p.birthday ?? null,
    anniversary: p.anniversary ?? null,
    favorites: json(p.favorites),
  };
  const c = api();
  const { data: existing } = await c.models.SelfProfile.get({ ownerSub: sub });
  const { errors } = existing ? await c.models.SelfProfile.update(fields) : await c.models.SelfProfile.create(fields);
  if (errors?.length) throw new Error(errors[0]!.message);
}

/** Called when someone finishes an invite: keep their answers in this browser for a while. */
export function rememberPendingSelf(p: Person): void {
  try {
    localStorage.setItem(PENDING, JSON.stringify({ person: p, at: Date.now() }));
  } catch {}
}

/** Answers from a recent invite in this browser (last 30 days), if any. */
export function pendingSelf(): Person | null {
  try {
    const raw = localStorage.getItem(PENDING);
    if (!raw) return null;
    const { person, at } = JSON.parse(raw) as { person: Person; at: number };
    if (Date.now() - at > 30 * 86_400_000) return (clearPendingSelf(), null);
    return person;
  } catch {
    return null;
  }
}

export function clearPendingSelf(): void {
  try {
    localStorage.removeItem(PENDING);
  } catch {}
}

/**
 * After sign-in: turn pending invite answers into the user's profile if they don't
 * have one yet. Returns the profile (existing, claimed or null).
 */
export async function loadOrClaimSelf(sub: string): Promise<Person | null> {
  const existing = await getSelfProfile(sub);
  const pending = pendingSelf();
  if (existing || !pending) {
    if (existing && pending) clearPendingSelf();
    return existing;
  }
  await saveSelfProfile(sub, pending);
  clearPendingSelf();
  return { ...pending, id: "self" };
}
