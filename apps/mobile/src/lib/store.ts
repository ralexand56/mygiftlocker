/**
 * In-memory demo store for the mobile app. Mirrors apps/web/lib/store.ts;
 * both are replaced by Amplify Data (`generateClient<Schema>()`) once the
 * backend in /amplify is deployed, which keeps web + mobile in sync.
 *
 * Exchanges are *created* on the website. The app only manages the ones
 * you're in: wishlists, reveals, and (for organizers) sharing + drawing.
 */
import { DEMO_EXCHANGES, DEMO_ME, DEMO_PEOPLE, type Exchange, type Person, type WishItem } from "@mgl/core";
import { useSyncExternalStore } from "react";

let people: Person[] = DEMO_PEOPLE;
let exchanges: Exchange[] = DEMO_EXCHANGES;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const me = DEMO_ME;

export function usePeople(): Person[] {
  return useSyncExternalStore(subscribe, () => people);
}

export function addPerson(p: Person) {
  people = [p, ...people.filter((x) => x.id !== p.id)];
  emit();
}

/** Exchanges the signed-in user is part of (as a player or as a kid's guardian). */
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
