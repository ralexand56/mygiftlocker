/**
 * Invites ask someone to share their sizes (and optionally address + dates).
 *
 * In demo / offline mode the invite is a self-contained, URL-safe token so a link
 * works without a backend. With the Amplify backend the link carries an opaque
 * invite id instead and the payload lives server-side.
 */
import { defaultT, type Tr } from "./i18n";

export type InviteSection = "sizes" | "address" | "dates" | "favorites" | "payments" | "kids";

export interface InvitePayload {
  v: 1;
  id: string;
  from: { name: string; userId?: string };
  to?: { name?: string };
  ask: Record<InviteSection, boolean>;
  note?: string;
  /** "connect": asks someone already in your locker to link their own profile to their card. */
  purpose?: "profile" | "connect";
  createdAt: string;
}

export type InviteChannel = "link" | "email" | "sms" | "whatsapp" | "messenger" | "share" | "qr";

export const DEFAULT_ASK: InvitePayload["ask"] = {
  sizes: true,
  address: true,
  dates: true,
  favorites: true,
  payments: false,
  kids: false,
};

export function newId(prefix = ""): string {
  const c = globalThis.crypto;
  const raw = c?.randomUUID ? c.randomUUID().replace(/-/g, "") : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return prefix + raw.slice(0, 16);
}

function toBase64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeInvite(p: InvitePayload): string {
  return toBase64Url(JSON.stringify(p));
}

export function decodeInvite(token: string): InvitePayload | null {
  try {
    const p = JSON.parse(fromBase64Url(token)) as InvitePayload;
    if (p?.v !== 1 || typeof p.from?.name !== "string") return null;
    return { ...p, ask: { ...DEFAULT_ASK, ...p.ask } };
  } catch {
    return null;
  }
}

export interface ShareLinks {
  email: string;
  sms: string;
  whatsapp: string;
  messenger: string;
}

/**
 * `sms:` link that opens the phone's Messages app with `body` prefilled; the sender
 * picks recipients. `sms:?&body=` works on iOS and Android (iOS needs the `&`).
 */
export function smsHref(body: string): string {
  return `sms:?&body=${encodeURIComponent(body)}`;
}

/** Message inviting someone to join a gift exchange. */
export function exchangeJoinMessage(exchangeName: string, url: string, t: Tr = defaultT): string {
  return t("core.share.exchangeJoin", { exchange: exchangeName, url });
}

/** Message carrying a participant's private reveal link (only they should open it). */
export function exchangeRevealMessage(name: string, exchangeName: string, url: string, t: Tr = defaultT): string {
  return t("core.share.exchangeReveal", { name, exchange: exchangeName, url });
}

/**
 * An invite link that opens in a chosen language (?lang=es). The website uses it unless the
 * person has already picked a language on the site; they can still switch on the page.
 */
export function withInviteLang(url: string, lang?: string | null): string {
  if (!lang) return url;
  const u = new URL(url);
  u.searchParams.set("lang", lang);
  return u.toString();
}

/** Prefilled deep links for each channel. */
export function inviteShareLinks(url: string, fromName: string, toName?: string, t: Tr = defaultT): ShareLinks {
  const hi = toName ? t("core.share.inviteHi", { name: toName }) : t("core.share.inviteHiAnon");
  const body = t("core.share.inviteBody", { hi, from: fromName, url });
  const subject = t("core.share.inviteSubject", { from: fromName });
  const enc = encodeURIComponent;
  return {
    email: `mailto:?subject=${enc(subject)}&body=${enc(body)}`,
    sms: smsHref(body),
    whatsapp: `https://wa.me/?text=${enc(body)}`,
    messenger: `fb-messenger://share/?link=${enc(url)}`,
  };
}
