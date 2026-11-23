"use client";

/**
 * Demo-mode persistence. Everything lives in localStorage so the app is fully
 * clickable without a backend. The function signatures mirror the Amplify Data
 * models (see /amplify/data/resource.ts) so swapping the implementation later
 * doesn't touch UI code.
 */
import { useSyncExternalStore } from "react";
import { type Exchange, type InvitePayload, type Person, pastelFor } from "@mgl/core";

interface DB {
  people: Person[];
  exchanges: Exchange[];
  invites: InvitePayload[];
  me: { id: string; name: string } | null;
}

const KEY = "mgl:v1";
const listeners = new Set<() => void>();
let cache: DB | null = null;

const SEED_PEOPLE: Person[] = [
  {
    id: "seed-maya",
    name: "Maya Chen",
    kind: "adult",
    relationship: "Sister",
    color: "#FBD3E3",
    sizes: { fit: "womens", top: "S", womensNumeric: "4", dress: "4", outerwear: "S", shoe: 7.5, ring: 6 },
    birthday: { month: 3, day: 14 },
    favorites: { colors: ["sage", "cream"], likes: "Pottery, matcha, anything linen", avoid: "No scented candles please" },
    address: { line1: "41 Willow Lane", city: "Portland", region: "OR", postalCode: "97205", country: "US" },
    updatedAt: new Date().toISOString(),
  },
  {
    id: "seed-james",
    name: "James Okafor",
    kind: "adult",
    relationship: "Best friend",
    color: "#D4E9FF",
    sizes: { fit: "mens", top: "L", waist: 34, inseam: 32, outerwear: "L", shoe: 11, shoeWidth: "Wide" },
    birthday: { month: 8, day: 2, year: 1991 },
    anniversary: { month: 6, day: 21 },
    favorites: { likes: "Cycling, single-origin coffee, vinyl", wishes: ["Rapha cycling cap", "Hario V60 kettle"] },
    updatedAt: new Date().toISOString(),
  },
  {
    id: "seed-lily",
    name: "Lily (age 6)",
    kind: "child",
    relationship: "Daughter",
    color: "#CDEFE3",
    sizes: { fit: "kids", top: "S (6-7)", bottomAlpha: "S (6-7)", shoe: 12 },
    birthday: { month: 12, day: 9, year: 2020 },
    favorites: { likes: "Dinosaurs, glitter, LEGO Friends", colors: ["purple"] },
    guardians: ["me"],
    updatedAt: new Date(Date.now() - 150 * 86_400_000).toISOString(),
  },
];

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
