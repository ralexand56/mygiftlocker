import type { PartialDate } from "./dates";
import type { HolidayId } from "./holidays";
import type { SizeProfile } from "./sizes";

export interface Address {
  name?: string;
  line1: string;
  line2?: string;
  city: string;
  region: string; // state / province
  postalCode: string;
  country: string; // ISO-3166 alpha-2
}

export interface Favorites {
  colors?: string[];
  likes?: string;
  /** Favorite sports teams, as they write them ("Chicago Cubs, Real Madrid"). */
  teams?: string;
  avoid?: string; // allergies, dislikes, "please no more mugs"
  wishes?: string[];
  /** Links to wish lists kept elsewhere (Amazon, Target, Etsy…). */
  wishlists?: string[];
}

export type PersonKind = "adult" | "child";

/**
 * A person in someone's locker. Adults fill this in themselves via an invite.
 * Children are "managed profiles" owned by one or more guardians (see docs/kids.md).
 */
export interface Person {
  id: string;
  name: string;
  kind: PersonKind;
  relationship?: string;
  /** Pastel swatch used for their avatar + hero card. */
  color: string;
  sizes: SizeProfile;
  address?: Address;
  birthday?: PartialDate;
  anniversary?: PartialDate;
  otherDates?: { label: string; date: PartialDate }[];
  /** Holidays the locker owner shops for this person (owner-set, not shared with them). */
  holidays?: HolidayId[];
  /** The locker owner's private note about this person (never shown to them). */
  ownerNote?: string;
  /** Occasions the owner has already bought a gift for (see gifts.ts). Owner-only. */
  gifted?: string[];
  favorites?: Favorites;
  /** Set when this card stays in sync with the person's own profile (see connections.ts). */
  linked?: { connectionId: string; syncedAt?: string; ended?: boolean };
  /** Owner-only photos (storage paths), at most MAX_PERSON_PHOTOS; used for gift ideas. Adults only. */
  photos?: string[];
  /** The last "find the perfect gift" list, so reopening it is free. */
  giftIdeas?: { ideas: import("./giftIdeas").GiftIdea[]; request?: string; at: string };
  /** Guardian user ids for managed (child) profiles. */
  guardians?: string[];
  updatedAt: string;
}

export const PASTELS = ["#F9D5E5", "#E3D7FF", "#CDEFE3", "#FFE7B8", "#FFD8C9", "#D4E9FF", "#F6E2FF", "#DDF3C4"];

export function pastelFor(seed: string): string {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PASTELS[h % PASTELS.length]!;
}

export function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter((w) => /^\p{L}/u.test(w))
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

/** Kids' sizes go stale fast; nudge the guardian after this many days. */
export const CHILD_SIZE_STALE_DAYS = 120;

export function isStale(p: Person, now = new Date()): boolean {
  if (p.kind !== "child") return false;
  return (now.getTime() - new Date(p.updatedAt).getTime()) / 86_400_000 > CHILD_SIZE_STALE_DAYS;
}
