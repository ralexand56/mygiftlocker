"use client";

/**
 * Invite data access. With the backend, an invite is a row and the link carries
 * its id; the invitee's answers become a Profile in the inviter's locker. In demo
 * mode the link carries the whole invite (encoded) and answers stay in this browser.
 */
import {
  MAX_PERSON_PHOTOS,
  cleanGiftIdeas,
  cleanPayments,
  cleanGifted,
  cleanHolidays,
  decodeInvite,
  encodeInvite,
  type HolidayId,
  type InvitePayload,
  type Person,
  type PublicInvite,
} from "@mgl/core";
import { api, backendEnabled, parseJson, unwrap } from "./amplify";
import { patchPerson, readDB, removePerson, saveInvite, upsertPerson } from "./store";
import { endConnection } from "./connections";
import { currentTr } from "./i18n-current";

/** Returns the path segment for /join/<segment>. */
export async function createInvite(payload: InvitePayload, ownerSub?: string): Promise<string> {
  if (!backendEnabled) {
    saveInvite(payload);
    return encodeInvite(payload);
  }
  if (!ownerSub) throw new Error(currentTr()("errors.signInToInvite"));
  const { data, errors } = await api().models.Invite.create({
    ownerSub,
    fromName: payload.from.name,
    toName: payload.to?.name,
    ask: JSON.stringify(payload.ask),
    note: payload.note,
    status: "pending",
  });
  if (!data) throw new Error(errors?.[0]?.message ?? currentTr()("errors.createInvite"));
  return data.id;
}

/** Accepts either an invite id (backend) or an encoded demo invite. */
export async function loadInvite(segment: string): Promise<PublicInvite> {
  const decoded = decodeInvite(segment);
  if (decoded) return decoded;
  if (!backendEnabled) throw new Error(currentTr()("errors.brokenInvite"));
  return unwrap<PublicInvite>(await api().queries.getPublicInvite({ inviteId: segment }, { authMode: "apiKey" }));
}

/** Returns the one-time claim code (backend only) that lets the answerer connect their profile later. */
export async function submitInvite(invite: PublicInvite, profile: Person, kids: Person[]): Promise<string | undefined> {
  // Demo invites (encoded in the link) have ids like "inv_…"; backend ids are UUIDs.
  if (!backendEnabled || invite.id.startsWith("inv_")) {
    upsertPerson(profile);
    kids.forEach(upsertPerson);
    return undefined;
  }
  const strip = ({ name, sizes, address, birthday, anniversary, favorites, payments }: Person) => ({ name, sizes, address, birthday, anniversary, favorites, payments });
  const res = unwrap<{ claimToken?: string }>(
    await api().mutations.submitInvite(
      { inviteId: invite.id, profile: JSON.stringify(strip(profile)), kids: JSON.stringify(kids.map((k) => ({ ...strip(k), relationship: k.relationship }))) },
      { authMode: "apiKey" },
    ),
  );
  return res?.claimToken;
}

/** People in the signed-in user's locker. */
export async function listLockerPeople(): Promise<Person[]> {
  if (!backendEnabled) return readDB().people;
  const { data } = await api().models.Profile.list({ limit: 500 });
  return data.map((p) => ({
    id: p.id,
    name: p.name,
    kind: (p.kind ?? "adult") as Person["kind"],
    relationship: p.relationship ?? undefined,
    color: p.color ?? "#FBD3E3",
    sizes: parseJson(p.sizes ?? "{}") ?? {},
    address: parseJson(p.address ?? "null") ?? undefined,
    birthday: p.birthday ? { month: p.birthday.month, day: p.birthday.day, year: p.birthday.year ?? undefined } : undefined,
    anniversary: p.anniversary ? { month: p.anniversary.month, day: p.anniversary.day, year: p.anniversary.year ?? undefined } : undefined,
    favorites: parseJson(p.favorites ?? "null") ?? undefined,
    guardians: p.guardians?.filter((g): g is string => !!g),
    holidays: cleanHolidays(p.holidays),
    ownerNote: p.ownerNote ?? undefined,
    gifted: cleanGifted(p.gifted),
    linked: p.connectionId ? { connectionId: p.connectionId, syncedAt: p.syncedAt ?? undefined, ended: !!p.connectionEnded } : undefined,
    payments: cleanPayments(parseJson(p.payments ?? "null")),
    photos: p.photos?.filter((x): x is string => !!x),
    giftIdeas: savedIdeas(p.giftIdeas),
    updatedAt: p.updatedAt,
  }));
}

export type OwnerFields = { holidays?: HolidayId[]; ownerNote?: string; gifted?: string[]; photos?: string[] };

/** The saved gift list on a card, validated. */
function savedIdeas(v: unknown): Person["giftIdeas"] {
  const o = parseJson<{ ideas?: unknown; request?: string; at?: string } | null>(v ?? "null");
  const ideas = cleanGiftIdeas(o?.ideas);
  return ideas.length && o?.at ? { ideas, request: o.request, at: o.at } : undefined;
}

/** The locker owner's own fields on a person: holiday tags, a private note, gifted locks. */
export async function updateOwnerFields(id: string, changes: OwnerFields): Promise<void> {
  const clean = {
    ...(changes.gifted && { gifted: cleanGifted(changes.gifted) }),
    ...(changes.holidays && { holidays: cleanHolidays(changes.holidays) }),
    ...(changes.ownerNote !== undefined && { ownerNote: changes.ownerNote.trim().slice(0, 2000) }),
    ...(changes.photos && { photos: changes.photos.slice(0, MAX_PERSON_PHOTOS) }),
  };
  if (!backendEnabled) return patchPerson(id, clean);
  unwrap(await api().models.Profile.update({ id, ...clean }));
}

/**
 * The details the owner can edit on a card (what an invite asks for, plus how they know them).
 * Sections left out aren't touched (on a linked card, the ones the person shares).
 */
export type EditableFields = Pick<Person, "name" | "relationship"> &
  Partial<Pick<Person, "sizes" | "address" | "birthday" | "anniversary" | "favorites" | "payments">>;

/** Saves the owner's edits to someone's details. Cleared fields are removed. */
export async function updateLockerPerson(id: string, f: EditableFields): Promise<void> {
  const has = (k: keyof EditableFields) => k in f;
  const fields: Partial<Person> = { name: f.name.trim(), relationship: f.relationship?.trim() || undefined };
  for (const k of ["sizes", "address", "birthday", "anniversary", "favorites"] as const) if (has(k)) Object.assign(fields, { [k]: f[k] });
  if (has("payments")) fields.payments = cleanPayments(f.payments);
  if (!backendEnabled) return patchPerson(id, { ...fields, updatedAt: new Date().toISOString() });
  const json = (v: unknown) => (v === undefined ? null : JSON.stringify(v));
  unwrap(
    await api().models.Profile.update({
      id,
      name: fields.name,
      relationship: fields.relationship ?? null,
      ...(has("sizes") && { sizes: JSON.stringify(fields.sizes ?? {}) }),
      ...(has("address") && { address: json(fields.address) }),
      ...(has("birthday") && { birthday: fields.birthday ?? null }),
      ...(has("anniversary") && { anniversary: fields.anniversary ?? null }),
      ...(has("favorites") && { favorites: json(fields.favorites) }),
      ...(has("payments") && { payments: json(fields.payments) }),
    }),
  );
}

/**
 * Removes someone from the locker for good: ends a live connection first (so their
 * updates stop), deletes their photos, then the card with its notes and gift ideas.
 */
export async function removeLockerPerson(p: Person): Promise<void> {
  if (!backendEnabled) return removePerson(p.id);
  if (p.linked && !p.linked.ended) await endConnection(p.linked.connectionId);
  if (p.photos?.length) {
    const { remove } = await import("aws-amplify/storage");
    await Promise.all(p.photos.map((path) => remove({ path }).catch(() => {})));
  }
  unwrap(await api().models.Profile.delete({ id: p.id }));
}
