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
  cleanAddress,
  cleanPayments,
  cleanShared,
  cleanShares,
  sharesFromAsk,
  syncedFields,
  type ConnectionShares,
  type Person,
  cleanWishlistLinks,
  cleanWishlist,
  drawNames,
  isPlausibleToken,
  pastelFor,
  type JoinResult,
  type MyExchangeView,
  type PublicExchange,
  type PublicInvite,
  type WishItem,
  defaultT,
  type ServerErrorKey,
  isLocale,
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

/** A user-facing error, in English; the site maps it back to its key and shows it in the visitor's language. */
const serverError = (key: ServerErrorKey) => new UserError(defaultT(`core.server.${key}`));

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
        return await joinExchange(str(args.exchangeId), str(args.name), optStr(args.email), parseJson(args.wishlist), parseJson(args.shared));
      case "getMyExchange":
        return await getMyExchange(str(args.exchangeId), str(args.token));
      case "saveWishlist":
        return await saveWishlist(str(args.exchangeId), str(args.token), parseJson(args.wishlist));
      case "saveShared":
        return await saveShared(str(args.exchangeId), str(args.token), parseJson(args.shared));
      case "getPublicInvite":
        return await getPublicInvite(str(args.inviteId));
      case "submitInvite":
        return await submitInvite(str(args.inviteId), parseJson(args.profile), parseJson(args.kids));
      case "drawNames":
        return await draw(str(args.exchangeId), callerSub);
      case "removeExchange":
        return await removeExchange(str(args.exchangeId), callerSub);
      case "connectProfile":
        return await connectProfile(
          str(args.inviteId),
          parseJson(args.shares),
          optStr(args.claimToken),
          callerSub,
          args.addBack === true ? { profileId: optStr(args.backProfileId) } : undefined,
        );
      case "setMyLocale":
        return await setMyLocale(str(args.locale), callerSub);
      case "syncMyProfile":
        return await syncMyProfile(callerSub);
      case "setConnectionSharing":
        return await setConnectionSharing(str(args.connectionId), parseJson(args.shares), callerSub);
      case "endConnection":
        return await endConnection(str(args.connectionId), callerSub, args.both === true);
      case "setReminders":
        return await setReminders(str(args.token), args.enabled === true);
      case "deleteMyAccount":
        return await deleteMyAccount(callerSub);
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
  if (!data) throw serverError("exchangeNotFound");
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

async function joinExchange(exchangeId: string, name: string, email: string | undefined, wishlist: unknown, shared: unknown): Promise<JoinResult> {
  const ex = await loadExchange(exchangeId);
  if (ex.status === "drawn") throw serverError("alreadyDrawn");
  const cleanName = name.trim().slice(0, 80);
  if (!cleanName) throw serverError("addName");
  const people = await loadParticipants(exchangeId);
  if (people.length >= MAX_PARTICIPANTS) throw serverError("exchangeFull");

  const token = randomBytes(24).toString("base64url");
  const { data, errors } = await client.models.Participant.create({
    exchangeId,
    adminSub: ex.adminSub,
    name: cleanName,
    email: email?.trim().slice(0, 200) || undefined,
    token,
    wishlist: JSON.stringify(cleanWishlist(wishlist, ex.wishCount)),
    shared: sharedJson(shared),
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
  if (!isPlausibleToken(token)) throw serverError("linkInvalid");
  const [ex, people] = await Promise.all([loadExchange(exchangeId), loadParticipants(exchangeId)]);
  const me = people.find((p) => tokensMatch(p.token, token));
  if (!me) throw serverError("privateLinkInvalid");
  return { ex, people, me };
}

const sharedJson = (v: unknown) => {
  const clean = cleanShared(v);
  return clean ? JSON.stringify(clean) : null;
};
const sharedOf = (p: Participant) => cleanShared(parseJson(p.shared));

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
    if (receiver) match = { name: receiver.name, wishlist: wishes(receiver), shared: sharedOf(receiver) };
  }
  return {
    exchange: toPublic(ex, people),
    me: { id: me.id, name: me.name, wishlist: wishes(me), shared: sharedOf(me) },
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

async function saveShared(exchangeId: string, token: string, shared: unknown) {
  const { me } = await findByToken(exchangeId, token);
  const json = sharedJson(shared);
  await client.models.Participant.update({ id: me.id, shared: json });
  return { shared: json ? JSON.parse(json) : null };
}

async function draw(exchangeId: string, callerSub: string | undefined) {
  const ex = await loadExchange(exchangeId);
  if (!callerSub || ex.adminSub !== callerSub) throw serverError("organizerDraw");
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

/** Organizer only. Assignments go first so an interrupted delete never leaves orphaned matches. */
async function removeExchange(exchangeId: string, callerSub: string | undefined) {
  const ex = await loadExchange(exchangeId);
  if (!callerSub || ex.adminSub !== callerSub) throw serverError("organizerDelete");
  const { data: assignments } = await client.models.Assignment.listAssignmentByExchangeId({ exchangeId }, { limit: 1000 });
  await Promise.all(assignments.map((a) => client.models.Assignment.delete({ id: a.id })));
  const people = await loadParticipants(exchangeId);
  await Promise.all(people.map((p) => client.models.Participant.delete({ id: p.id })));
  await client.models.Exchange.delete({ id: exchangeId });
  return { ok: true, deleted: { assignments: assignments.length, participants: people.length } };
}

// ---- reminder emails -------------------------------------------------------

/** From the unsubscribe link in a reminder email; the random token is the only credential. */
async function setReminders(token: string, on: boolean) {
  if (token.length < 20 || token.length > 100) throw serverError("linkInvalid");
  const { data } = await client.models.ReminderSettings.listReminderSettingsByUnsubscribeToken({ unsubscribeToken: token }, { limit: 1 });
  const settings = data[0];
  if (!settings) throw serverError("linkInvalid");
  await client.models.ReminderSettings.update({ ownerSub: settings.ownerSub, remindersOff: !on });
  return { ok: true, on };
}

// ---- invites ---------------------------------------------------------------

async function getPublicInvite(inviteId: string): Promise<PublicInvite> {
  const { data: inv } = await client.models.Invite.get({ id: inviteId });
  if (!inv || inv.status === "revoked") throw serverError("inviteInactive");
  return {
    id: inv.id,
    from: { name: inv.fromName },
    to: inv.toName ? { name: inv.toName } : undefined,
    ask: (parseJson(inv.ask) ?? {}) as PublicInvite["ask"],
    note: inv.note ?? undefined,
    purpose: inv.purpose === "connect" ? "connect" : undefined,
    // Only offered while the sender still has a profile to share.
    shareBack: inv.purpose === "connect" && inv.shareBack && inv.ownerSub && (await loadSelf(inv.ownerSub)) ? cleanShares(parseJson(inv.shareBack)) : undefined,
  };
}

async function submitInvite(inviteId: string, profile: unknown, kids: unknown) {
  const { data: inv } = await client.models.Invite.get({ id: inviteId });
  if (!inv || inv.status === "revoked") throw serverError("inviteInactive");
  if (inv.purpose === "connect") throw serverError("connectOnly");
  const p = (profile ?? {}) as Record<string, unknown>;
  const name = typeof p.name === "string" ? p.name.trim().slice(0, 80) : "";
  if (!name) throw serverError("addName");

  const json = (v: unknown) => (v === undefined || v === null ? undefined : JSON.stringify(v).slice(0, 20_000));
  const { data: created } = await client.models.Profile.create({
    ownerSub: inv.ownerSub,
    name,
    kind: "adult",
    color: pastelFor(name),
    sizes: json(p.sizes),
    address: json(cleanAddress(p.address)), // trimmed, per-country checks; dropped if unusable
    // Only when the invite asked for them.
    payments: (parseJson(inv.ask) as { payments?: boolean } | undefined)?.payments ? json(cleanPayments(p.payments)) : undefined,
    birthday: date(p.birthday),
    anniversary: date(p.anniversary),
    favorites: json(cleanFavorites(p.favorites)),
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
        // Sent in the invitee's language; English if missing.
        relationship: (typeof k.relationship === "string" && k.relationship.trim().slice(0, 80)) || `${name.split(" ")[0]}'s child`,
        color: pastelFor(kidName),
        sizes: json(k.sizes),
        birthday: date(k.birthday),
        fromInviteId: inv.id,
      });
    }
  }
  // Only the person who answered gets this, so only they can later link their own profile to the card.
  const claimToken = randomBytes(24).toString("base64url");
  await client.models.Invite.update({ id: inv.id, status: "accepted", acceptedProfileId: created?.id, claimToken });
  return { ok: true, claimToken };
}

// ---- connections -------------------------------------------------------------

type Connection = Schema["Connection"]["type"];

const needSignIn = (sub: string | undefined): string => {
  if (!sub) throw serverError("signIn");
  return sub;
};

async function loadSelf(sub: string): Promise<(Pick<Person, "sizes" | "favorites" | "birthday" | "anniversary" | "address" | "payments"> & { name: string }) | null> {
  const { data: p } = await client.models.SelfProfile.get({ ownerSub: sub });
  if (!p) return null;
  const d = (x: { month: number; day: number; year?: number | null } | null | undefined) => (x ? { month: x.month, day: x.day, year: x.year ?? undefined } : undefined);
  return {
    name: p.name,
    sizes: (parseJson(p.sizes) ?? {}) as Person["sizes"],
    favorites: parseJson(p.favorites) as Person["favorites"],
    birthday: d(p.birthday),
    anniversary: d(p.anniversary),
    address: parseJson(p.address) as Person["address"],
    payments: cleanPayments(parseJson(p.payments)),
  };
}

async function connectionsOf(memberSub: string): Promise<Connection[]> {
  const { data } = await client.models.Connection.listConnectionByMemberSub({ memberSub }, { limit: 500 });
  return data;
}

/** Writes the shared parts of the member's profile onto one card. */
async function pushTo(conn: Connection, self: NonNullable<Awaited<ReturnType<typeof loadSelf>>>, now: string) {
  const { data: card } = await client.models.Profile.get({ id: conn.profileId });
  // The card must still exist and still belong to the connection's owner.
  if (!card || card.ownerSub !== conn.ownerSub) return false;
  const f = syncedFields(self, cleanShares(parseJson(conn.shares)));
  const json = (v: unknown) => (v === undefined ? undefined : v === null ? null : JSON.stringify(v).slice(0, 20_000));
  await client.models.Profile.update({
    id: card.id,
    ...(f.sizes !== undefined && { sizes: json(f.sizes) }),
    ...(f.favorites !== undefined && { favorites: json(f.favorites) }),
    ...(f.birthday !== undefined && { birthday: f.birthday }),
    ...(f.anniversary !== undefined && { anniversary: f.anniversary }),
    ...(f.address !== undefined && { address: json(f.address) }),
    ...(f.payments !== undefined && { payments: json(f.payments) }),
    connectionId: conn.id,
    connectionEnded: false,
    syncedAt: now,
  });
  await client.models.Connection.update({ id: conn.id, syncedAt: now });
  return true;
}

async function endConnections(conns: Connection[], now: string) {
  for (const c of conns) {
    await client.models.Connection.update({ id: c.id, status: "ended", endedAt: now });
    const { data: card } = await client.models.Profile.get({ id: c.profileId });
    if (card && card.ownerSub === c.ownerSub && card.connectionId === c.id) await client.models.Profile.update({ id: card.id, connectionEnded: true });
  }
}

/**
 * The reverse direction of a two-way connection: `theirSub`'s profile kept on a card in `mySub`'s locker.
 * Only called when theirSub offered it on their connect link.
 */
async function connectBack(mySub: string, myName: string, theirSub: string, theirName: string, shares: ConnectionShares, cardId: string | undefined, now: string) {
  const theirs = await loadSelf(theirSub);
  if (!theirs) return null;
  let profileId: string;
  if (cardId) {
    const { data: card } = await client.models.Profile.get({ id: cardId });
    if (!card || card.ownerSub !== mySub || card.kind !== "adult") throw serverError("pickGrownUp");
    profileId = card.id;
  } else {
    const { data: card } = await client.models.Profile.create({ ownerSub: mySub, name: theirs.name || theirName, kind: "adult", color: pastelFor(theirs.name || theirName) });
    if (!card) throw new Error("Couldn't add them to your locker");
    profileId = card.id;
  }
  // One live connection per card.
  const { data: onMine } = await client.models.Connection.listConnectionByOwnerSub({ ownerSub: mySub }, { limit: 500 });
  await endConnections(onMine.filter((c) => c.status === "active" && (c.profileId === profileId || c.memberSub === theirSub)), now);
  const { data: conn } = await client.models.Connection.create({
    ownerSub: mySub,
    memberSub: theirSub,
    profileId,
    ownerName: myName,
    memberName: theirs.name,
    shares: JSON.stringify(shares),
    status: "active",
  });
  if (!conn) throw new Error("Couldn't connect back");
  await pushTo(conn, theirs, now);
  return profileId;
}

async function connectProfile(
  inviteId: string,
  sharesIn: unknown,
  claimToken: string | undefined,
  callerSub: string | undefined,
  addBack?: { profileId?: string },
) {
  const sub = needSignIn(callerSub);
  const { data: inv } = await client.models.Invite.get({ id: inviteId });
  if (!inv || inv.status === "revoked") throw serverError("linkInactive");
  if (inv.ownerSub === sub) throw serverError("ownLink");
  const isConnectLink = inv.purpose === "connect";
  const profileId = isConnectLink ? inv.targetProfileId : inv.acceptedProfileId;
  if (!profileId) throw serverError("answerFirst");
  const mine = await connectionsOf(sub);
  const alreadyMine = mine.some((c) => c.profileId === profileId && c.ownerSub === inv.ownerSub);
  if (isConnectLink) {
    // Single use: once accepted, only the person who accepted can reconnect.
    if (inv.status === "accepted" && !alreadyMine) throw serverError("linkUsed");
  } else if (!claimToken || !inv.claimToken || !tokensMatch(inv.claimToken, claimToken)) {
    throw serverError("onlyAnswerer");
  }
  const { data: card } = await client.models.Profile.get({ id: profileId });
  if (!card || card.ownerSub !== inv.ownerSub) throw serverError("cardGone");
  const self = await loadSelf(sub);
  if (!self) throw serverError("createProfileFirst");

  // One live connection per card: replace any earlier one of mine.
  for (const c of mine.filter((c) => c.status === "active" && c.profileId === profileId))
    await client.models.Connection.update({ id: c.id, status: "ended", endedAt: new Date().toISOString() });

  const fallback = sharesFromAsk(parseJson(inv.ask) as Partial<ConnectionShares> | undefined);
  const shares = cleanShares(sharesIn, fallback);
  const now = new Date().toISOString();
  const { data: conn, errors } = await client.models.Connection.create({
    ownerSub: inv.ownerSub!,
    memberSub: sub,
    profileId,
    ownerName: inv.fromName,
    memberName: self.name,
    shares: JSON.stringify(shares),
    status: "active",
  });
  if (!conn) throw new Error(errors?.[0]?.message ?? "Couldn't connect");
  await pushTo(conn, self, now);
  // Two-way: only if the sender offered it on this connect link and the caller asked for it.
  const offered = isConnectLink && inv.shareBack ? cleanShares(parseJson(inv.shareBack)) : null;
  const backProfileId = offered && addBack ? await connectBack(sub, self.name, inv.ownerSub!, inv.fromName, offered, addBack.profileId, now) : null;
  // Spent either way: the claim code and the connect link each work once.
  await client.models.Invite.update({ id: inv.id, status: "accepted", claimToken: null });
  return { ok: true, connectionId: conn.id, ownerName: inv.fromName, shares, backProfileId };
}

async function syncMyProfile(callerSub: string | undefined) {
  const sub = needSignIn(callerSub);
  const self = await loadSelf(sub);
  if (!self) return { ok: true, updated: 0 };
  const now = new Date().toISOString();
  const live = (await connectionsOf(sub)).filter((c) => c.status === "active");
  const results = await Promise.all(live.map((c) => pushTo(c, self, now)));
  return { ok: true, updated: results.filter(Boolean).length };
}

async function loadConnection(id: string, sub: string): Promise<Connection> {
  const { data } = await client.models.Connection.get({ id });
  if (!data || (data.memberSub !== sub && data.ownerSub !== sub)) throw serverError("connectionNotFound");
  return data;
}

async function setConnectionSharing(id: string, sharesIn: unknown, callerSub: string | undefined) {
  const sub = needSignIn(callerSub);
  const conn = await loadConnection(id, sub);
  if (conn.memberSub !== sub) throw serverError("onlyThey");
  if (conn.status !== "active") throw serverError("connectionEnded");
  const shares = cleanShares(sharesIn, cleanShares(parseJson(conn.shares)));
  const { data: updated } = await client.models.Connection.update({ id, shares: JSON.stringify(shares) });
  const self = await loadSelf(sub);
  if (updated && self) await pushTo(updated, self, new Date().toISOString());
  return { ok: true, shares };
}

async function endConnection(id: string, callerSub: string | undefined, both: boolean) {
  const sub = needSignIn(callerSub);
  const conn = await loadConnection(id, sub);
  const now = new Date().toISOString();
  const ending = [conn];
  if (both) {
    // The reverse direction: the same two people with roles swapped.
    const reverse = (await connectionsOf(conn.ownerSub)).filter((c) => c.status === "active" && c.ownerSub === conn.memberSub);
    ending.push(...reverse);
  }
  await endConnections(ending, now);
  return { ok: true, ended: ending.length };
}

/** Reminder emails go out in this language. Creates the owner's settings on first use. */
async function setMyLocale(locale: string, callerSub: string | undefined) {
  const sub = needSignIn(callerSub);
  if (!isLocale(locale)) throw serverError("missingInfo");
  const { data } = await client.models.ReminderSettings.get({ ownerSub: sub });
  if (data) await client.models.ReminderSettings.update({ ownerSub: sub, locale });
  else await client.models.ReminderSettings.create({ ownerSub: sub, locale, remindersOff: false, unsubscribeToken: randomBytes(24).toString("base64url") });
  return { ok: true, locale };
}

// ---- account deletion ------------------------------------------------------

/** Every row of `model` matching `filter`, across pages (small tables; a filtered scan). */
async function listAll<T>(list: (o: { filter: object; limit: number; nextToken?: string | null }) => Promise<{ data: T[]; nextToken?: string | null }>, filter: object): Promise<T[]> {
  const out: T[] = [];
  let nextToken: string | null | undefined;
  do {
    const res = await list({ filter, limit: 1000, nextToken });
    out.push(...res.data);
    nextToken = res.nextToken;
  } while (nextToken);
  return out;
}

/**
 * Deletes everything the signed-in user owns: their locker, own profile, invites, gift lists,
 * connections (both sides stop syncing; other people keep the last version on their own cards),
 * Secret Santa exchanges they organize (with participants and matches), reminder settings and
 * logs. They're also removed as a co-guardian or kid manager elsewhere. Photos live under their
 * storage identity, so the app deletes those itself, then deletes the Cognito account.
 * Safe to run twice (e.g. after an interrupted attempt).
 */
async function deleteMyAccount(callerSub: string | undefined) {
  const sub = needSignIn(callerSub);
  const m = client.models;
  const own = { ownerSub: { eq: sub } };
  const now = new Date().toISOString();
  const count: Record<string, number> = {};

  // Connections first, so nothing syncs while the rest goes.
  const asMember = await connectionsOf(sub);
  await endConnections(asMember.filter((c) => c.status !== "ended"), now);
  const asOwner = await listAll((o) => m.Connection.list(o), own);
  for (const c of [...asMember, ...asOwner]) await m.Connection.delete({ id: c.id });
  count.connections = asMember.length + asOwner.length;

  const profiles = await listAll((o) => m.Profile.list(o), own);
  for (const p of profiles) await m.Profile.delete({ id: p.id });
  count.profiles = profiles.length;
  // Kids someone else owns that this user co-guarded.
  const guarded = await listAll((o) => m.Profile.list(o), { guardians: { contains: sub } });
  for (const p of guarded) await m.Profile.update({ id: p.id, guardians: (p.guardians ?? []).filter((g) => g && g !== sub) });

  for (const [name, list, del] of [
    ["invites", (o: never) => m.Invite.list(o), (id: string) => m.Invite.delete({ id })],
    ["giftJobs", (o: never) => m.GiftJob.list(o), (id: string) => m.GiftJob.delete({ id })],
    ["giftUsage", (o: never) => m.GiftUsage.list(o), (id: string) => m.GiftUsage.delete({ id })],
    ["reminderLogs", (o: never) => m.ReminderLog.list(o), (id: string) => m.ReminderLog.delete({ id })],
  ] as const) {
    const rows = await listAll<{ id: string }>(list as never, own);
    for (const r of rows) await del(r.id);
    count[name] = rows.length;
  }

  const exchanges = await listAll((o) => m.Exchange.list(o), { adminSub: { eq: sub } });
  for (const ex of exchanges) await removeExchange(ex.id, sub);
  count.exchanges = exchanges.length;
  const managed = await listAll((o) => m.Participant.list(o), { managedBySub: { eq: sub } });
  for (const p of managed) await m.Participant.update({ id: p.id, managedBySub: null });

  await m.SelfProfile.delete({ ownerSub: sub }).catch(() => {});
  await m.ReminderSettings.delete({ ownerSub: sub }).catch(() => {});
  return { ok: true, deleted: count };
}

// ---- helpers ---------------------------------------------------------------

function str(v: unknown): string {
  if (typeof v !== "string" || !v) throw serverError("missingInfo");
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
/** Favorites as submitted, with wish list links checked (web links only). */
function cleanFavorites(v: unknown) {
  if (!v || typeof v !== "object") return undefined;
  const f = v as Record<string, unknown>;
  const wishlists = cleanWishlistLinks(f.wishlists);
  return { ...f, wishlists: wishlists.length ? wishlists : undefined };
}
function date(v: unknown) {
  const d = v as { month?: number; day?: number; year?: number } | undefined;
  if (!d || !Number.isInteger(d.month) || !Number.isInteger(d.day)) return undefined;
  return { month: d.month!, day: d.day!, year: Number.isInteger(d.year) && d.year! >= 1900 ? d.year : undefined };
}
