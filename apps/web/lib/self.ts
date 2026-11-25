"use client";

/**
 * The signed-in user's own profile: their sizes, dates and favorites. Separate
 * from the people in their locker (no reminders about yourself). It can be
 * shared into gift exchanges so they don't retype it.
 *
 * Someone who answers an invite and then creates an account gets those answers
 * as their profile: the invite flow keeps a copy in this browser until they sign in.
 */
import { pastelFor, sharesFromAsk, type Person, type PublicInvite, cleanPayments } from "@mgl/core";
import { connectProfile, syncMyProfile } from "./connections";
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
    payments: cleanPayments(parseJson(p.payments ?? "null")),
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
    payments: json(cleanPayments(p.payments)),
  };
  const c = api();
  const { data: existing } = await c.models.SelfProfile.get({ ownerSub: sub });
  const { errors } = existing ? await c.models.SelfProfile.update(fields) : await c.models.SelfProfile.create(fields);
  if (errors?.length) throw new Error(errors[0]!.message);
  // Connected lockers get the update; a failure here shouldn't undo the save.
  await syncMyProfile().catch(() => {});
}

interface Pending {
  person: Person;
  at: number;
  /** The invite they answered, so their card can be connected after sign-up. */
  invite?: Pick<PublicInvite, "id" | "ask"> & { fromName: string; claimToken?: string };
  /** Their choice on the thank-you screen: keep the inviter updated. */
  connect?: boolean;
}

function readPending(): Pending | null {
  try {
    const raw = localStorage.getItem(PENDING);
    if (!raw) return null;
    const p = JSON.parse(raw) as Pending;
    if (Date.now() - p.at > 30 * 86_400_000) return (clearPendingSelf(), null);
    return p;
  } catch {
    return null;
  }
}

/** Called when someone finishes an invite: keep their answers in this browser for a while. */
export function rememberPendingSelf(p: Person, invite?: PublicInvite, claimToken?: string): void {
  try {
    const entry: Pending = {
      person: p,
      at: Date.now(),
      connect: true,
      invite: invite && { id: invite.id, ask: invite.ask, fromName: invite.from.name, claimToken },
    };
    localStorage.setItem(PENDING, JSON.stringify(entry));
  } catch {}
}

export function setPendingConnect(on: boolean): void {
  const p = readPending();
  if (!p) return;
  try {
    localStorage.setItem(PENDING, JSON.stringify({ ...p, connect: on }));
  } catch {}
}

/** Answers from a recent invite in this browser (last 30 days), if any. */
export function pendingSelf(): Person | null {
  return readPending()?.person ?? null;
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
  const pending = readPending();
  if (existing || !pending) {
    if (existing && pending) clearPendingSelf();
    return existing;
  }
  await saveSelfProfile(sub, pending.person);
  clearPendingSelf();
  // They asked on the thank-you screen to keep the inviter updated.
  if (pending.connect && pending.invite?.claimToken) {
    await connectProfile(pending.invite.id, sharesFromAsk(pending.invite.ask), pending.invite.claimToken).catch(() => {});
  }
  return { ...pending.person, id: "self" };
}
