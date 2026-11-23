/**
 * In-memory demo store for the mobile app. Mirrors apps/web/lib/store.ts;
 * both are replaced by Amplify Data (`generateClient<Schema>()`) once the
 * backend in /amplify is deployed, which keeps web + mobile in sync.
 */
import { DEMO_PEOPLE, type Person } from "@mgl/core";
import { useSyncExternalStore } from "react";

let people: Person[] = DEMO_PEOPLE;
const listeners = new Set<() => void>();

export function usePeople(): Person[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => people,
  );
}

export function addPerson(p: Person) {
  people = [p, ...people.filter((x) => x.id !== p.id)];
  listeners.forEach((l) => l());
}
