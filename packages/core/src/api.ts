/**
 * Shapes returned by the backend's link-holder operations (amplify/functions/exchange-api).
 * Shared so the server, web and mobile agree on them.
 */
import type { ExchangeStatus, WishItem } from "./exchange";
import type { InvitePayload } from "./invite";
import type { SharedProfile } from "./shared";

/** What anyone holding the join link may see. No emails, tokens or matches. */
export interface PublicExchange {
  id: string;
  name: string;
  date?: string;
  budget?: { amount: number; currency: string };
  message?: string;
  wishCount: number;
  singleLoop: boolean;
  status: ExchangeStatus;
  participantNames: string[];
}

/** What a participant sees on their private page (link = exchange id + their token). */
export interface MyExchangeView {
  exchange: PublicExchange;
  me: { id: string; name: string; wishlist: WishItem[]; shared?: SharedProfile };
  people: { id: string; name: string; wishCount: number }[];
  /** Only after the draw, and only their own. */
  match: { name: string; wishlist: WishItem[]; shared?: SharedProfile } | null;
}

export interface JoinResult {
  participantId: string;
  token: string;
}

/** The invite as the invitee sees it. */
export type PublicInvite = Pick<InvitePayload, "id" | "from" | "to" | "ask" | "note">;

/** Tokens are 24 random bytes, base64url. */
export function isPlausibleToken(t: unknown): t is string {
  return typeof t === "string" && /^[A-Za-z0-9_-]{20,64}$/.test(t);
}

/** Normalize user-supplied wishlists: trim, cap length, re-rank. */
export function cleanWishlist(input: unknown, max: number): WishItem[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((w): w is { title: string; url?: string; note?: string; id?: string } => !!w && typeof w.title === "string" && w.title.trim().length > 0)
    .slice(0, Math.max(1, Math.min(max, 10)))
    .map((w, i) => {
      const url = typeof w.url === "string" && /^https?:\/\//i.test(w.url.trim()) ? w.url.trim().slice(0, 500) : undefined;
      return { id: typeof w.id === "string" ? w.id.slice(0, 40) : `w${i + 1}`, title: w.title.trim().slice(0, 200), url, rank: i + 1 };
    });
}
