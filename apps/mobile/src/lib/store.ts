/**
 * App state. The locker (people + your own profile) comes from the backend when signed in, or from
 * demo data. Owner edits show at once and roll back if the save fails.
 *
 * Exchanges are still demo data here; Secret Santa moves to the backend in a later phase.
 */
import { DEMO_EXCHANGES, DEMO_ME, DEMO_PEOPLE, decodeInvite, encodeInvite, type Exchange, type InvitePayload, type Person, type PublicInvite, type WishItem } from "@mgl/core";
import {
  addLockerPerson,
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
