/**
 * Connections: a locker card that stays up to date with someone's own profile.
 * The member chooses which parts they share; when they change their profile,
 * those parts are copied onto every card linked to them. The owner's private
 * fields (note, holiday tags, gift locks) are never touched.
 */
import { cleanAddress } from "./addresses";
import { cleanWishlistLinks } from "./links";
import { cleanPayments, type PaymentHandles } from "./payments";
import type { PartialDate } from "./dates";
import type { Address, Favorites, Person } from "./people";
import type { SizeProfile } from "./sizes";
import { defaultT, listJoin, type Tr } from "./i18n";

export type ShareSection = "sizes" | "favorites" | "dates" | "address" | "payments";
export type ConnectionShares = Record<ShareSection, boolean>;

export const SHARE_SECTIONS: { id: ShareSection; label: string; hint: string }[] = [
  { id: "sizes", label: "Sizes", hint: "Clothes, shoes, rings…" },
  { id: "favorites", label: "Favorites & wishes", hint: "Likes, wishes, wish lists and registries" },
  { id: "dates", label: "Birthday & anniversary", hint: "For their reminders" },
  { id: "address", label: "Shipping address", hint: "So gifts can be sent to you" },
  { id: "payments", label: "Money gifts", hint: "PayPal, Venmo, Zelle and other payment apps" },
];

/** Address and payment apps stay off unless they choose them. */
export const DEFAULT_SHARES: ConnectionShares = { sizes: true, favorites: true, dates: true, address: false, payments: false };

export function cleanShares(input: unknown, fallback: ConnectionShares = DEFAULT_SHARES): ConnectionShares {
  const s = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const pick = (k: ShareSection) => (typeof s[k] === "boolean" ? (s[k] as boolean) : fallback[k]);
  return { sizes: pick("sizes"), favorites: pick("favorites"), dates: pick("dates"), address: pick("address"), payments: pick("payments") };
}

/** What someone agreed to share when answering an invite, as starting shares. */
export function sharesFromAsk(ask: Partial<Record<"sizes" | "address" | "dates" | "favorites" | "payments", boolean>> | undefined): ConnectionShares {
  return { sizes: ask?.sizes ?? true, favorites: ask?.favorites ?? true, dates: ask?.dates ?? true, address: ask?.address ?? false, payments: ask?.payments ?? false };
}

export interface SyncedFields {
  sizes?: SizeProfile;
  favorites?: Favorites;
  birthday?: PartialDate | null;
  anniversary?: PartialDate | null;
  address?: Address | null;
  payments?: PaymentHandles | null;
}

/** The card fields to overwrite from the member's own profile; sections not shared are left alone. */
export function syncedFields(self: Pick<Person, "sizes" | "favorites" | "birthday" | "anniversary" | "address" | "payments">, shares: ConnectionShares): SyncedFields {
  const out: SyncedFields = {};
  if (shares.sizes) out.sizes = self.sizes ?? {};
  if (shares.favorites) {
    const f = self.favorites ?? {};
    out.favorites = { ...f, wishlists: cleanWishlistLinks(f.wishlists) };
  }
  if (shares.dates) {
    out.birthday = self.birthday ?? null;
    out.anniversary = self.anniversary ?? null;
  }
  if (shares.address) out.address = cleanAddress(self.address) ?? null;
  if (shares.payments) out.payments = cleanPayments(self.payments) ?? null;
  return out;
}

/** A share section's label and hint in the translator's language. */
export function shareSectionText(id: ShareSection, t: Tr = defaultT): { label: string; hint: string } {
  return { label: t(`core.shares.${id}.label`), hint: t(`core.shares.${id}.hint`) };
}

export function describeShares(s: ConnectionShares, t: Tr = defaultT): string {
  const on = SHARE_SECTIONS.filter((x) => s[x.id]).map((x) => shareSectionText(x.id, t).label.toLocaleLowerCase());
  if (!on.length) return t("core.shares.nothing");
  return listJoin(on, t);
}

/**
 * The card in someone's locker most likely to be `name` (same full name, else same first name),
 * so a two-way connection links it instead of adding a duplicate.
 */
export function likelyCardFor<T extends Pick<Person, "id" | "name" | "kind">>(people: T[], name: string): T | undefined {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const first = (s: string) => norm(s).split(" ")[0]!;
  const adults = people.filter((p) => p.kind === "adult");
  return adults.find((p) => norm(p.name) === norm(name)) ?? (adults.filter((p) => first(p.name) === first(name)).length === 1 ? adults.find((p) => first(p.name) === first(name)) : undefined);
}
