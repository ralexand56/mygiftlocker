import type { SharedProfile } from "./shared";
/**
 * Gift exchange ("draw names") domain + matching.
 *
 * The draw produces a giver → receiver assignment such that:
 *  - nobody draws themselves
 *  - every exclusion pair is respected (symmetric: couples can't draw each other)
 *  - optional: nobody gets the same person they had in a previous exchange
 *  - optional: a single loop (A→B→C→…→A) so the exchange can be done in a circle
 */

export interface WishItem {
  id: string;
  title: string;
  url?: string;
  note?: string;
  /** 1 = most wanted */
  rank: number;
}

export interface Participant {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  /** Private token used in the participant's personal link. */
  token: string;
  wishlist: WishItem[];
  /** Set when a parent manages this participant (e.g. a young child). */
  managedBy?: string;
  /** Sizes and favorites they chose to share with whoever draws them. */
  shared?: SharedProfile;
  joinedAt: string;
}

export type ExchangeStatus = "open" | "drawn";

export interface Exchange {
  id: string;
  name: string;
  /** ISO date of the party / exchange */
  date?: string;
  budget?: { amount: number; currency: string };
  message?: string;
  adminId: string;
  /** How many wishes each person is asked for. */
  wishCount: number;
  singleLoop: boolean;
  status: ExchangeStatus;
  participants: Participant[];
  exclusions: [string, string][];
  /** giverId → receiverId. Only the server (or the admin's device in demo mode) holds the full map. */
  assignments?: Record<string, string>;
  /** Assignments from earlier rounds to avoid repeats. */
  previous?: Record<string, string>[];
  createdAt: string;
  drawnAt?: string;
}

export interface DrawOptions {
  exclusions?: [string, string][];
  previous?: Record<string, string>[];
  singleLoop?: boolean;
  /** Returns a float in [0, 1). Injectable for deterministic tests. */
  random?: () => number;
}

export class DrawError extends Error {
  constructor(
    message: string,
    public readonly code: "TOO_FEW" | "IMPOSSIBLE",
  ) {
    super(message);
    this.name = "DrawError";
  }
}

export function secureRandom(): number {
  const c = globalThis.crypto;
  if (c?.getRandomValues) {
    const buf = new Uint32Array(1);
    c.getRandomValues(buf);
    return buf[0]! / 2 ** 32;
  }
  return Math.random();
}

function shuffle<T>(arr: T[], random: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function buildForbidden(ids: string[], opts: DrawOptions): Map<string, Set<string>> {
  const forbidden = new Map<string, Set<string>>();
  for (const id of ids) forbidden.set(id, new Set([id]));
  for (const [a, b] of opts.exclusions ?? []) {
    forbidden.get(a)?.add(b);
    forbidden.get(b)?.add(a);
  }
  for (const round of opts.previous ?? []) {
    for (const [giver, receiver] of Object.entries(round)) forbidden.get(giver)?.add(receiver);
  }
  return forbidden;
}

/**
 * Randomized backtracking with a most-constrained-first heuristic. Fine for
 * the group sizes people actually run (up to a few hundred).
 */
export function drawNames(ids: string[], opts: DrawOptions = {}): Record<string, string> {
  if (new Set(ids).size !== ids.length) throw new DrawError("Duplicate participants", "IMPOSSIBLE");
  if (ids.length < 3) throw new DrawError("A gift exchange needs at least 3 people", "TOO_FEW");
  const random = opts.random ?? secureRandom;
  const forbidden = buildForbidden(ids, opts);
  const allowed = (g: string, r: string) => !forbidden.get(g)!.has(r);

  if (opts.singleLoop) return drawLoop(ids, allowed, random);

  // Fail fast: someone with no possible receiver.
  for (const g of ids) {
    if (!ids.some((r) => allowed(g, r))) {
      throw new DrawError(`Nobody is available for ${g} to draw — loosen the exclusions`, "IMPOSSIBLE");
    }
  }

  const givers = shuffle(ids, random).sort(
    (a, b) => ids.filter((r) => allowed(a, r)).length - ids.filter((r) => allowed(b, r)).length,
  );
  const taken = new Set<string>();
  const result: Record<string, string> = {};
  let steps = 0;

  const solve = (i: number): boolean => {
    if (i === givers.length) return true;
    if (++steps > 200_000) return false;
    const g = givers[i]!;
    for (const r of shuffle(ids, random)) {
      if (taken.has(r) || !allowed(g, r)) continue;
      taken.add(r);
      result[g] = r;
      if (solve(i + 1)) return true;
      taken.delete(r);
      delete result[g];
    }
    return false;
  };

  if (!solve(0)) throw new DrawError("These exclusions make a fair draw impossible", "IMPOSSIBLE");
  return result;
}

function drawLoop(
  ids: string[],
  allowed: (g: string, r: string) => boolean,
  random: () => number,
): Record<string, string> {
  const [start, ...rest] = shuffle(ids, random);
  const path = [start!];
  const used = new Set(path);
  let steps = 0;

  const solve = (): boolean => {
    if (++steps > 200_000) return false;
    const last = path[path.length - 1]!;
    if (path.length === ids.length) return allowed(last, start!);
    for (const next of shuffle(rest, random)) {
      if (used.has(next) || !allowed(last, next)) continue;
      path.push(next);
      used.add(next);
      if (solve()) return true;
      path.pop();
      used.delete(next);
    }
    return false;
  };

  if (!solve()) throw new DrawError("These exclusions make a single circle impossible", "IMPOSSIBLE");
  const result: Record<string, string> = {};
  path.forEach((g, i) => (result[g] = path[(i + 1) % path.length]!));
  return result;
}

/** Is this draw valid for the given rules? Used by tests and by the server before saving. */
export function validateDraw(ids: string[], assignment: Record<string, string>, opts: DrawOptions = {}): boolean {
  const forbidden = buildForbidden(ids, opts);
  const receivers = Object.values(assignment);
  if (Object.keys(assignment).length !== ids.length) return false;
  if (new Set(receivers).size !== ids.length) return false;
  return ids.every((g) => {
    const r = assignment[g];
    return r !== undefined && ids.includes(r) && !forbidden.get(g)!.has(r);
  });
}

export function formatBudget(b?: Exchange["budget"]): string | undefined {
  if (!b) return undefined;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: b.currency, maximumFractionDigits: 0 }).format(b.amount);
  } catch {
    return `${b.amount} ${b.currency}`;
  }
}
