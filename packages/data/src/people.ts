/**
 * The signed-in user's locker (Profile rows) and their own profile (SelfProfile).
 * Same behavior as apps/web/lib/invites.ts and lib/self.ts (backend branch).
 */
import {
  MAX_PERSON_PHOTOS,
  cleanGiftIdeas,
  cleanGifted,
  cleanHolidays,
  cleanPayments,
  pastelFor,
  type HolidayId,
  type Locale,
  type Person,
} from "@mgl/core";
import { api, parseJson, unwrap } from "./client";

type PD = { month: number; day: number; year?: number | null } | null | undefined;
const date = (d: PD) => (d ? { month: d.month, day: d.day, year: d.year ?? undefined } : undefined);
const json = (v: unknown) => (v === undefined || v === null ? null : JSON.stringify(v));

/** A saved gift list, validated. */
export function savedIdeas(v: unknown): Person["giftIdeas"] {
  const o = parseJson<{ ideas?: unknown; request?: string; at?: string } | null>(v ?? "null");
  const ideas = cleanGiftIdeas(o?.ideas);
  return ideas.length && o?.at ? { ideas, request: o.request, at: o.at } : undefined;
}

/** People in the signed-in user's locker. */
export async function listLockerPeople(): Promise<Person[]> {
  const { data, errors } = await api().models.Profile.list({ limit: 500 });
  if (errors?.length) throw new Error(errors[0]!.message);
  return data.map((p) => ({
    id: p.id,
    name: p.name,
    kind: (p.kind ?? "adult") as Person["kind"],
    relationship: p.relationship ?? undefined,
    color: p.color ?? "#FBD3E3",
    sizes: parseJson(p.sizes ?? "{}") ?? {},
    address: parseJson(p.address ?? "null") ?? undefined,
    birthday: date(p.birthday),
    anniversary: date(p.anniversary),
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

/** The locker owner's own fields on a person: holiday tags, a private note, gifted locks, photos. */
export async function updateOwnerFields(id: string, changes: OwnerFields): Promise<void> {
  unwrap(
    await api().models.Profile.update({
      id,
      ...(changes.gifted && { gifted: cleanGifted(changes.gifted) }),
      ...(changes.holidays && { holidays: cleanHolidays(changes.holidays) }),
      ...(changes.ownerNote !== undefined && { ownerNote: changes.ownerNote.trim().slice(0, 2000) }),
      ...(changes.photos && { photos: changes.photos.slice(0, MAX_PERSON_PHOTOS) }),
    }),
  );
}

/** What the owner can edit on a card. Sections left out aren't touched (on linked cards, what the person shares). */
export type EditableFields = Pick<Person, "name" | "relationship"> &
  Partial<Pick<Person, "sizes" | "address" | "birthday" | "anniversary" | "favorites" | "payments">>;

export async function updateLockerPerson(id: string, f: EditableFields): Promise<void> {
  const has = (k: keyof EditableFields) => k in f;
  unwrap(
    await api().models.Profile.update({
      id,
      name: f.name.trim(),
      relationship: f.relationship?.trim() || null,
      ...(has("sizes") && { sizes: JSON.stringify(f.sizes ?? {}) }),
      ...(has("address") && { address: json(f.address) }),
      ...(has("birthday") && { birthday: f.birthday ?? null }),
      ...(has("anniversary") && { anniversary: f.anniversary ?? null }),
      ...(has("favorites") && { favorites: json(f.favorites) }),
      ...(has("payments") && { payments: json(cleanPayments(f.payments)) }),
    }),
  );
}

/** A card the owner adds by hand (a child they manage, or someone they fill in themselves). */
export async function addLockerPerson(ownerSub: string, p: Person): Promise<string> {
  const { data, errors } = await api().models.Profile.create({
    ownerSub,
    name: p.name.trim(),
    kind: p.kind,
    relationship: p.relationship?.trim() || undefined,
    color: p.color || pastelFor(p.name),
    sizes: JSON.stringify(p.sizes ?? {}),
    address: json(p.address),
    birthday: p.birthday ?? null,
    anniversary: p.anniversary ?? null,
    favorites: json(p.favorites),
    guardians: p.kind === "child" ? [ownerSub] : undefined,
  });
  if (!data) throw new Error(errors?.[0]?.message ?? "Couldn't add them");
  return data.id;
}

/**
 * Removes someone for good: ends a live connection first, deletes their photos, then the card.
 * `removePhoto` is the app's storage remove (aws-amplify/storage).
 */
export async function removeLockerPerson(p: Person, removePhoto: (path: string) => PromiseLike<unknown>): Promise<void> {
  if (p.linked && !p.linked.ended) unwrap(await api().mutations.endConnection({ connectionId: p.linked.connectionId, both: false }));
  if (p.photos?.length) await Promise.all(p.photos.map((path) => Promise.resolve(removePhoto(path)).catch(() => {})));
  unwrap(await api().models.Profile.delete({ id: p.id }));
}

export async function getSelfProfile(sub: string): Promise<Person | null> {
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
    photos: p.photos?.filter((x): x is string => !!x),
    giftIdeas: savedIdeas(p.giftIdeas),
    updatedAt: p.updatedAt,
  };
}

/** Saves your own profile; connected lockers get the update. */
export async function saveSelfProfile(sub: string, p: Person): Promise<void> {
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
  await c.mutations.syncMyProfile().catch(() => {});
}

/** Tells the backend which language to email in (reminders, codes). Best effort. */
export async function setMyLocale(locale: Locale): Promise<void> {
  await api().mutations.setMyLocale({ locale }).catch(() => {});
}
