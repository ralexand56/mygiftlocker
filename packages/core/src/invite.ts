/**
 * Invites ask someone to share their sizes (and optionally address + dates).
 *
 * In demo / offline mode the invite is a self-contained, URL-safe token so a link
 * works without a backend. With the Amplify backend the link carries an opaque
 * invite id instead and the payload lives server-side.
 */

export type InviteSection = "sizes" | "address" | "dates" | "favorites" | "kids";

export interface InvitePayload {
  v: 1;
  id: string;
  from: { name: string; userId?: string };
  to?: { name?: string };
  ask: Record<InviteSection, boolean>;
  note?: string;
  createdAt: string;
}

export type InviteChannel = "link" | "email" | "sms" | "whatsapp" | "messenger" | "share" | "qr";

export const DEFAULT_ASK: InvitePayload["ask"] = {
  sizes: true,
  address: true,
  dates: true,
  favorites: true,
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
export function exchangeJoinMessage(exchangeName: string, url: string): string {
  return `You're invited to "${exchangeName}" 🎁 Join and add your top wishes on My Gift Locker: ${url}`;
}

/** Message carrying a participant's private reveal link (only they should open it). */
export function exchangeRevealMessage(name: string, exchangeName: string, url: string): string {
  return `Hi ${name}! Names are drawn for "${exchangeName}" 🎁 Tap your private link to see who you're gifting (keep it to yourself!): ${url}`;
}

/** Prefilled deep links for each channel. */
export function inviteShareLinks(url: string, fromName: string, toName?: string): ShareLinks {
  const hi = toName ? `Hi ${toName}! ` : "Hi! ";
  const body = `${hi}${fromName} wants to get your gifts just right. Add your sizes & favorite things to their Gift Locker (takes 2 min): ${url}`;
  const subject = `${fromName} invited you to My Gift Locker 🎁`;
  const enc = encodeURIComponent;
  return {
    email: `mailto:?subject=${enc(subject)}&body=${enc(body)}`,
    sms: smsHref(body),
    whatsapp: `https://wa.me/?text=${enc(body)}`,
    messenger: `fb-messenger://share/?link=${enc(url)}`,
  };
}
