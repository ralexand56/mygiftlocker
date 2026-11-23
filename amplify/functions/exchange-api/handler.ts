/**
 * Link-holder operations + the organizer's draw, all behind one Lambda.
 *
 * Link holders (no account) call these with the API key. Each operation checks
 * the secret token from the link before reading or writing anything, and only
 * returns that participant's own data. The function itself has full data access
 * (schema-level allow.resource), so all authorization decisions live here.
 */
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import {
  DrawError,
  cleanWishlist,
  drawNames,
  isPlausibleToken,
  pastelFor,
  type JoinResult,
  type MyExchangeView,
  type PublicExchange,
  type PublicInvite,
  type WishItem,
} from "@mgl/core";
import { env } from "$amplify/env/exchange-api";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { randomBytes, timingSafeEqual } from "node:crypto";
import type { Schema } from "../../data/resource";

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>({ authMode: "iam" });

type Exchange = Schema["Exchange"]["type"];
type Participant = Schema["Participant"]["type"];

interface ResolverEvent {
  fieldName?: string;
  info?: { fieldName: string };
  arguments: Record<string, unknown>;
  identity?: { sub?: string } | null;
}

class UserError extends Error {}

const MAX_PARTICIPANTS = 200;

export const handler = async (event: ResolverEvent) => {
  const field = event.info?.fieldName ?? event.fieldName;
  const args = event.arguments;
  const callerSub = event.identity?.sub;
  try {
    switch (field) {
      case "getPublicExchange":
        return await getPublicExchange(str(args.exchangeId));
      case "joinExchange":
        return await joinExchange(str(args.exchangeId), str(args.name), optStr(args.email), parseJson(args.wishlist));
      case "getMyExchange":
        return await getMyExchange(str(args.exchangeId), str(args.token));
      case "saveWishlist":
        return await saveWishlist(str(args.exchangeId), str(args.token), parseJson(args.wishlist));
      case "getInvite":
        return await getInvite(str(args.inviteId));
      case "submitInvite":
        return await submitInvite(str(args.inviteId), parseJson(args.profile), parseJson(args.kids));
      case "drawNames":
        return await draw(str(args.exchangeId), callerSub);
      default:
        throw new Error(`Unknown operation ${field}`);
    }
  } catch (e) {
    // User-facing problems go back as a message; anything else is a server error.
    if (e instanceof UserError) return { error: e.message };
    throw e;
  }
};

// ---- exchanges -------------------------------------------------------------

async function loadExchange(id: string): Promise<Exchange> {
  const { data } = await client.models.Exchange.get({ id });
  if (!data) throw new UserError("We couldn't find that gift exchange.");
  return data;
}

async function loadParticipants(exchangeId: string): Promise<Participant[]> {
  const out: Participant[] = [];
  let nextToken: string | null | undefined;
  do {
    const res = await client.models.Participant.listParticipantByExchangeId({ exchangeId }, { limit: 500, nextToken });
    out.push(...res.data);
    nextToken = res.nextToken;
  } while (nextToken);
  return out.sort((a, b) => (a.joinedAt ?? "").localeCompare(b.joinedAt ?? ""));
}

function toPublic(ex: Exchange, people: Participant[]): PublicExchange {
  return {
    id: ex.id,
    name: ex.name,
    date: ex.date ?? undefined,
    budget: ex.budgetAmount ? { amount: ex.budgetAmount, currency: ex.currency ?? "USD" } : undefined,
    message: ex.message ?? undefined,
    wishCount: ex.wishCount,
    singleLoop: !!ex.singleLoop,
    status: (ex.status ?? "open") as PublicExchange["status"],
    participantNames: people.map((p) => p.name),
  };
}

async function getPublicExchange(exchangeId: string): Promise<PublicExchange> {
  const ex = await loadExchange(exchangeId);
  return toPublic(ex, await loadParticipants(exchangeId));
}

async function joinExchange(exchangeId: string, name: string, email: string | undefined, wishlist: unknown): Promise<JoinResult> {
  const ex = await loadExchange(exchangeId);
  if (ex.status === "drawn") throw new UserError("Names have already been drawn. Ask the organizer to add you.");
  const cleanName = name.trim().slice(0, 80);
  if (!cleanName) throw new UserError("Please add your name.");
  const people = await loadParticipants(exchangeId);
  if (people.length >= MAX_PARTICIPANTS) throw new UserError("This exchange is full.");

  const token = randomBytes(24).toString("base64url");
  const { data, errors } = await client.models.Participant.create({
    exchangeId,
    adminSub: ex.adminSub,
    name: cleanName,
    email: email?.trim().slice(0, 200) || undefined,
    token,
    wishlist: JSON.stringify(cleanWishlist(wishlist, ex.wishCount)),
    joinedAt: new Date().toISOString(),
  });
  if (!data) throw new Error(errors?.[0]?.message ?? "Could not join");
  return { participantId: data.id, token };
}

function tokensMatch(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

async function findByToken(exchangeId: string, token: string) {
  if (!isPlausibleToken(token)) throw new UserError("That link isn't valid.");
  const [ex, people] = await Promise.all([loadExchange(exchangeId), loadParticipants(exchangeId)]);
  const me = people.find((p) => tokensMatch(p.token, token));
  if (!me) throw new UserError("That link isn't valid. Ask the organizer for your private link.");
  return { ex, people, me };
}

const wishes = (p: Participant): WishItem[] => {
  const raw = typeof p.wishlist === "string" ? JSON.parse(p.wishlist) : p.wishlist;
  return Array.isArray(raw) ? (raw as WishItem[]) : [];
};

async function getMyExchange(exchangeId: string, token: string): Promise<MyExchangeView> {
  const { ex, people, me } = await findByToken(exchangeId, token);
  let match: MyExchangeView["match"] = null;
  if (ex.status === "drawn") {
    const { data: rows } = await client.models.Assignment.listAssignmentByExchangeId({ exchangeId }, { limit: 1000 });
    const mine = rows.find((r) => r.giverId === me.id);
    const receiver = mine && people.find((p) => p.id === mine.receiverId);
    if (receiver) match = { name: receiver.name, wishlist: wishes(receiver) };
  }
  return {
    exchange: toPublic(ex, people),
    me: { id: me.id, name: me.name, wishlist: wishes(me) },
    people: people.map((p) => ({ id: p.id, name: p.name, wishCount: wishes(p).length })),
    match,
  };
}

async function saveWishlist(exchangeId: string, token: string, wishlist: unknown) {
  const { ex, me } = await findByToken(exchangeId, token);
  const clean = cleanWishlist(wishlist, ex.wishCount);
  await client.models.Participant.update({ id: me.id, wishlist: JSON.stringify(clean) });
  return { wishlist: clean };
}

async function draw(exchangeId: string, callerSub: string | undefined) {
  const ex = await loadExchange(exchangeId);
  if (!callerSub || ex.adminSub !== callerSub) throw new UserError("Only the organizer can draw names.");
  const people = await loadParticipants(exchangeId);
  const ids = people.map((p) => p.id);
  const exclusions = (parseJson(ex.exclusions) ?? []) as [string, string][];
  const previous = (parseJson(ex.previous) ?? []) as Record<string, string>[];

  let result: Record<string, string>;
  try {
    result = drawNames(ids, { exclusions: exclusions.filter(([a, b]) => ids.includes(a) && ids.includes(b)), previous, singleLoop: !!ex.singleLoop });
  } catch (e) {
    if (e instanceof DrawError) throw new UserError(e.message);
    throw e;
  }

  // Replace any earlier draw.
  const { data: old } = await client.models.Assignment.listAssignmentByExchangeId({ exchangeId }, { limit: 1000 });
  await Promise.all(old.map((a) => client.models.Assignment.delete({ id: a.id })));
  await Promise.all(
    Object.entries(result).map(([giverId, receiverId]) => client.models.Assignment.create({ exchangeId, adminSub: ex.adminSub, giverId, receiverId })),
  );
  await client.models.Exchange.update({ id: exchangeId, status: "drawn", drawnAt: new Date().toISOString() });
  return { ok: true, count: ids.length };
}

// ---- invites ---------------------------------------------------------------

async function getInvite(inviteId: string): Promise<PublicInvite> {
  const { data: inv } = await client.models.Invite.get({ id: inviteId });
  if (!inv || inv.status === "revoked") throw new UserError("This invite link is no longer active.");
  return {
    id: inv.id,
    from: { name: inv.fromName },
    to: inv.toName ? { name: inv.toName } : undefined,
    ask: (parseJson(inv.ask) ?? {}) as PublicInvite["ask"],
    note: inv.note ?? undefined,
  };
}

async function submitInvite(inviteId: string, profile: unknown, kids: unknown) {
  const { data: inv } = await client.models.Invite.get({ id: inviteId });
  if (!inv || inv.status === "revoked") throw new UserError("This invite link is no longer active.");
  const p = (profile ?? {}) as Record<string, unknown>;
  const name = typeof p.name === "string" ? p.name.trim().slice(0, 80) : "";
  if (!name) throw new UserError("Please add your name.");

  const json = (v: unknown) => (v === undefined || v === null ? undefined : JSON.stringify(v).slice(0, 20_000));
  const { data: created } = await client.models.Profile.create({
    ownerSub: inv.ownerSub,
    name,
    kind: "adult",
    color: pastelFor(name),
    sizes: json(p.sizes),
    address: json(p.address),
    birthday: date(p.birthday),
    anniversary: date(p.anniversary),
    favorites: json(p.favorites),
    fromInviteId: inv.id,
  });

  if (Array.isArray(kids)) {
    for (const k of kids.slice(0, 10) as Record<string, unknown>[]) {
      const kidName = typeof k.name === "string" ? k.name.trim().slice(0, 80) : "";
      if (!kidName) continue;
      await client.models.Profile.create({
        ownerSub: inv.ownerSub,
        name: kidName,
        kind: "child",
        relationship: `${name.split(" ")[0]}'s child`,
        color: pastelFor(kidName),
        sizes: json(k.sizes),
        birthday: date(k.birthday),
        fromInviteId: inv.id,
      });
    }
  }
  await client.models.Invite.update({ id: inv.id, status: "accepted", acceptedProfileId: created?.id });
  return { ok: true };
}

// ---- helpers ---------------------------------------------------------------

function str(v: unknown): string {
  if (typeof v !== "string" || !v) throw new UserError("Missing information.");
  return v;
}
function optStr(v: unknown): string | undefined {
  return typeof v === "string" && v ? v : undefined;
}
function parseJson(v: unknown): unknown {
  if (typeof v !== "string") return v ?? undefined;
  try {
    return JSON.parse(v);
  } catch {
    return undefined;
  }
}
function date(v: unknown) {
  const d = v as { month?: number; day?: number; year?: number } | undefined;
  if (!d || !Number.isInteger(d.month) || !Number.isInteger(d.day)) return undefined;
  return { month: d.month!, day: d.day!, year: Number.isInteger(d.year) && d.year! >= 1900 ? d.year : undefined };
}
