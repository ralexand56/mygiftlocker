"use client";

/**
 * Demo-mode persistence. Everything lives in localStorage so the app is fully
 * clickable without a backend. The function signatures mirror the Amplify Data
 * models (see /amplify/data/resource.ts) so swapping the implementation later
 * doesn't touch UI code.
 */
import { useSyncExternalStore } from "react";
import { DEMO_PEOPLE as SEED_PEOPLE, type Exchange, type InvitePayload, type Person, pastelFor } from "@mgl/core";

interface DB {
  people: Person[];
  exchanges: Exchange[];
  invites: InvitePayload[];
  me: { id: string; name: string } | null;
}

const KEY = "mgl:v1";
const listeners = new Set<() => void>();
let cache: DB | null = null;


function empty(): DB {
  return { people: SEED_PEOPLE, exchanges: [], invites: [], me: null };
}

function read(): DB {
  if (cache) return cache;
  if (typeof window === "undefined") return empty();
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? { ...empty(), ...(JSON.parse(raw) as DB) } : empty();
  } catch {
    cache = empty();
  }
  return cache;
}

function write(next: DB) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode / quota — keep in memory */
  }
  listeners.forEach((l) => l());
}

/** Current snapshot (client only). */
export function readDB(): DB {
  return read();
}

export function update(fn: (db: DB) => DB) {
  write(fn(read()));
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
};

const SERVER_SNAPSHOT = empty();

export function useDB<T>(select: (db: DB) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(read()),
    () => select(SERVER_SNAPSHOT),
  );
}

// ---- people -----------------------------------------------------------------

export function upsertPerson(p: Person) {
  update((db) => ({ ...db, people: [p, ...db.people.filter((x) => x.id !== p.id)] }));
}

/** Update one person in place (keeps list order). */
export function patchPerson(id: string, changes: Partial<Person>) {
  update((db) => ({ ...db, people: db.people.map((p) => (p.id === id ? { ...p, ...changes } : p)) }));
}

export function newPersonColor(name: string) {
  return pastelFor(name);
}

// ---- invites ----------------------------------------------------------------

export function saveInvite(inv: InvitePayload) {
  update((db) => ({ ...db, invites: [inv, ...db.invites.filter((i) => i.id !== inv.id)] }));
}

// ---- exchanges --------------------------------------------------------------

export function saveExchange(ex: Exchange) {
  update((db) => ({ ...db, exchanges: [ex, ...db.exchanges.filter((x) => x.id !== ex.id)] }));
}

export function patchExchange(id: string, fn: (ex: Exchange) => Exchange) {
  update((db) => ({ ...db, exchanges: db.exchanges.map((x) => (x.id === id ? fn(x) : x)) }));
}

export function deleteExchange(id: string) {
  update((db) => ({ ...db, exchanges: db.exchanges.filter((x) => x.id !== id) }));
}

export function setMe(me: DB["me"]) {
  update((db) => ({ ...db, me }));
}

const noop = () => () => {};
/** False during SSR/hydration, true once client storage can be read. */
export function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}
