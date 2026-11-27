/**
 * App state. The locker (people + your own profile) comes from the backend when signed in, or from
 * demo data. Owner edits show at once and roll back if the save fails.
 *
 * Exchanges are still demo data here; Secret Santa moves to the backend in a later phase.
 */
import { DEMO_EXCHANGES, DEMO_ME, DEMO_PEOPLE, cleanGiftIdeas, decodeInvite, encodeInvite, type AffiliateConfig, type GiftIdea, type Locale, type Exchange, type InvitePayload, type Person, type PublicInvite, type WishItem } from "@mgl/core";
import {
  addLockerPerson,
  addPersonPhoto,
  findGifts,
  removePersonPhoto,
  createInvite,
  inviteUrl,
  loadInvite,
  submitInvite,
  getSelfProfile,
  listLockerPeople,
  removeLockerPerson,
  saveSelfProfile,
  updateLockerPerson,
  updateOwnerFields,
  type EditableFields,
  type OwnerFields,
} from "@mgl/data";
import { useSyncExternalStore } from "react";
import { backendEnabled } from "./amplify";

type Locker = {
  /** undefined while loading. */
  people: Person[] | undefined;
  self: Person | null;
  error: string | null;
  loadedFor: string | null;
};

let state: Locker = { people: backendEnabled ? undefined : DEMO_PEOPLE, self: null, error: null, loadedFor: null };
let exchanges: Exchange[] = DEMO_EXCHANGES;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const setState = (patch: Partial<Locker>) => {
  state = { ...state, ...patch };
  emit();
};

export const me = DEMO_ME;

export function useLocker(): Locker {
  return useSyncExternalStore(subscribe, () => state);
}

export function usePeople(): Person[] {
  return useLocker().people ?? [];
}

export function usePerson(id: string | undefined): Person | undefined {
  return usePeople().find((p) => p.id === id);
}

/** Loads (or reloads) the signed-in user's locker. */
export async function loadLocker(sub: string | null, force = false): Promise<void> {
  if (!backendEnabled) return;
  if (!sub) return setState({ people: undefined, self: null, loadedFor: null, error: null });
  if (!force && state.loadedFor === sub) return;
  try {
    const [people, self] = await Promise.all([listLockerPeople(), getSelfProfile(sub)]);
    setState({ people, self, loadedFor: sub, error: null });
  } catch (e) {
    setState({ people: state.people ?? [], error: e instanceof Error ? e.message : String(e) });
  }
}

const patchLocal = (id: string, changes: Partial<Person>) =>
  setState({ people: (state.people ?? []).map((p) => (p.id === id ? { ...p, ...changes } : p)) });

/** Holiday tags, private note, gift locks: shown at once, saved in the background. */
export async function saveOwner(id: string, changes: OwnerFields): Promise<void> {
  const before = state.people?.find((p) => p.id === id);
  patchLocal(id, changes);
  if (!backendEnabled) return;
  try {
    await updateOwnerFields(id, changes);
  } catch (e) {
    if (before) patchLocal(id, before);
    throw e;
  }
}

export async function savePerson(id: string, fields: EditableFields): Promise<void> {
  if (backendEnabled) await updateLockerPerson(id, fields);
  patchLocal(id, { ...fields, updatedAt: new Date().toISOString() });
}

export async function addPerson(ownerSub: string | undefined, p: Person): Promise<string> {
  const id = backendEnabled && ownerSub ? await addLockerPerson(ownerSub, p) : p.id;
  setState({ people: [{ ...p, id }, ...(state.people ?? [])] });
  return id;
}

export async function removePerson(p: Person): Promise<void> {
  if (backendEnabled) {
    const { remove } = await import("aws-amplify/storage");
    await removeLockerPerson(p, (path) => remove({ path }));
  }
  setState({ people: (state.people ?? []).filter((x) => x.id !== p.id) });
}

export async function saveSelf(sub: string, p: Person): Promise<void> {
  if (backendEnabled) await saveSelfProfile(sub, p);
  setState({ self: { ...p, id: "self" } });
}

// ---- Exchanges (demo until the Secret Santa phase) ----

export function useMyExchanges(): Exchange[] {
  return useSyncExternalStore(subscribe, () => exchanges);
}

export function useExchange(id: string | undefined): Exchange | undefined {
  return useSyncExternalStore(subscribe, () => exchanges.find((x) => x.id === id));
}

export function patchExchange(id: string, fn: (ex: Exchange) => Exchange) {
  exchanges = exchanges.map((x) => (x.id === id ? fn(x) : x));
  emit();
}

export function setWishlist(exchangeId: string, participantId: string, wishlist: WishItem[]) {
  patchExchange(exchangeId, (ex) => ({
    ...ex,
    participants: ex.participants.map((p) => (p.id === participantId ? { ...p, wishlist } : p)),
  }));
}

// ---- Invites ----

/** Creates an invite and returns its public link (www.mygiftlockers.com/join/…). */
export async function makeInvite(ownerSub: string | undefined, payload: InvitePayload): Promise<string> {
  const segment = backendEnabled && ownerSub ? await createInvite(ownerSub, payload) : encodeInvite(payload);
  return inviteUrl(segment);
}

/** Loads the invite behind a /join/<segment> link: a backend id, or an encoded demo invite. */
export async function openInvite(segment: string): Promise<PublicInvite> {
  const decoded = decodeInvite(segment);
  if (decoded) return decoded;
  if (!backendEnabled) throw new Error("Invite links need the backend");
  return loadInvite(segment);
}

/** Sends an invitee's answers. Demo invites land in this app's own locker. */
export async function answerInvite(invite: PublicInvite, profile: Person, kids: Person[]): Promise<string | undefined> {
  if (!backendEnabled || invite.id.startsWith("inv_")) {
    setState({ people: [profile, ...kids, ...(state.people ?? [])] });
    return undefined;
  }
  return submitInvite(invite.id, profile, kids);
}

// ---- Gift ideas and photos ----

export const giftAffiliate: AffiliateConfig = {
  amazonTag: process.env.EXPO_PUBLIC_AMAZON_TAG || undefined,
  sovrnKey: process.env.EXPO_PUBLIC_SOVRN_KEY || undefined,
};

/** Shows a change on a card (or your own profile, id "self") that's already saved elsewhere. */
export function showLocally(id: string, changes: Partial<Person>) {
  if (id === "self") setState({ self: state.self ? { ...state.self, ...changes } : state.self });
  else patchLocal(id, changes);
}

/** One gift list. With the backend the function also saves it on the card; we mirror it here. */
export async function runGiftIdeas(ownerSub: string | undefined, person: Person, request: string, locale: Locale): Promise<GiftIdea[]> {
  const ideas = backendEnabled && ownerSub ? await findGifts(ownerSub, person, request, locale) : await demoIdeas(person, request);
  showLocally(person.id, { giftIdeas: { ideas, request: request.trim() || undefined, at: new Date().toISOString() } });
  return ideas;
}

/** Demo mode: a few ideas from their own wishes and loves (same as the website's demo). */
async function demoIdeas(p: Person, request: string): Promise<GiftIdea[]> {
  await new Promise((r) => setTimeout(r, 1600));
  const f = p.favorites ?? {};
  const seeds = [
    ...(f.wishes ?? []).filter(Boolean).map((w) => ({ title: w, why: "It's on their own wish list.", category: "other" as const })),
    ...(f.likes ? [{ title: `Something for ${f.likes.split(",")[0]!.trim()}`, why: `They love ${f.likes}.`, category: "hobby" as const }] : []),
    { title: "Cozy knit throw", why: "Always welcome, and it fits any home.", category: "home" as const },
    { title: "Personalized photo book", why: "Memories you share, made into something to keep.", category: "home" as const },
    { title: "Cooking class for two", why: "An experience you can enjoy together.", category: "experience" as const },
  ];
  return cleanGiftIdeas(
    seeds.slice(0, 6).map((s, i) => ({
      ...s,
      id: `demo-${i}`,
      title: request && i === 0 ? `${s.title} (${request})` : s.title,
      priceMin: 20 + i * 10,
      priceMax: 40 + i * 15,
      store: s.category === "home" && i % 2 ? "etsy" : "amazon",
      searchQuery: s.title,
    })),
  );
}

/** Picks a photo from the library, shrinks it to 1280 px JPEG, uploads it and adds it to the card. */
export async function addPhoto(ownerSub: string, person: Person): Promise<void> {
  const ImagePicker = await import("expo-image-picker");
  const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
  if (picked.canceled || !picked.assets[0]) return;
  const { manipulateAsync, SaveFormat } = await import("expo-image-manipulator");
  const a = picked.assets[0];
  const scale = Math.min(1, 1280 / Math.max(a.width, a.height));
  const small = await manipulateAsync(a.uri, scale < 1 ? [{ resize: { width: Math.round(a.width * scale) } }] : [], { compress: 0.82, format: SaveFormat.JPEG });
  const bytes = await (await fetch(small.uri)).arrayBuffer();
  const photos = await addPersonPhoto(person, bytes, ownerSub);
  showLocally(person.id, { photos });
}

export async function deletePhoto(ownerSub: string, person: Person, path: string): Promise<void> {
  const photos = await removePersonPhoto(person, path, ownerSub);
  showLocally(person.id, { photos });
}
