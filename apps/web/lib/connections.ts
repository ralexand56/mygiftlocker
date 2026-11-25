"use client";

/**
 * Connections: locker cards that stay in sync with someone's own profile.
 * Needs the backend (signed-in users on both sides); in demo mode everything here is a no-op.
 */
import { cleanShares, type ConnectionShares, type Person } from "@mgl/core";
import { api, backendEnabled, parseJson, unwrap } from "./amplify";
import { currentTr } from "./i18n-current";

export const connectionsEnabled = backendEnabled;

export interface MyConnection {
  id: string;
  ownerName: string;
  shares: ConnectionShares;
  since: string;
  syncedAt?: string;
}

/**
 * Link my own profile to the card an invite created (or, for "connect" links, targets).
 * addBack (two-way connect links): also keep the sender's profile in my locker, on `profileId` or a new card.
 */
export async function connectProfile(
  inviteId: string,
  shares?: ConnectionShares,
  claimToken?: string,
  addBack?: { profileId?: string },
): Promise<{ ownerName: string; backProfileId?: string | null }> {
  if (!backendEnabled) return { ownerName: "" };
  return unwrap(
    await api().mutations.connectProfile({
      inviteId,
      shares: shares ? JSON.stringify(shares) : undefined,
      claimToken,
      addBack: !!addBack,
      backProfileId: addBack?.profileId,
    }),
  );
}

/** Push my profile to everyone I'm connected with. Call after saving it. */
export async function syncMyProfile(): Promise<number> {
  if (!backendEnabled) return 0;
  return unwrap<{ updated: number }>(await api().mutations.syncMyProfile()).updated;
}

/** People whose lockers get my updates. */
export async function listSharingWith(mySub: string): Promise<MyConnection[]> {
  if (!backendEnabled) return [];
  const { data } = await api().models.Connection.listConnectionByMemberSub({ memberSub: mySub }, { limit: 200 });
  return data
    .filter((c) => c.status === "active")
    .map((c) => ({
      id: c.id,
      ownerName: c.ownerName ?? currentTr()("common.someone"),
      shares: cleanShares(parseJson(c.shares ?? "{}")),
      since: c.createdAt,
      syncedAt: c.syncedAt ?? undefined,
    }))
    .sort((a, b) => a.ownerName.localeCompare(b.ownerName));
}

export async function setSharing(connectionId: string, shares: ConnectionShares): Promise<void> {
  unwrap(await api().mutations.setConnectionSharing({ connectionId, shares: JSON.stringify(shares) }));
}

/** both: also stop sharing my profile back with them (two-way connections). */
export async function endConnection(connectionId: string, both = false): Promise<void> {
  unwrap(await api().mutations.endConnection({ connectionId, both }));
}

/** What the person on a linked card shares into it (those sections update from their profile). */
export async function cardShares(connectionId: string): Promise<ConnectionShares> {
  const { data } = await api().models.Connection.get({ id: connectionId });
  if (!data) throw new Error("connection not found");
  return cleanShares(parseJson(data.shares ?? "{}"));
}

/** For a card synced from someone's profile: do I also share mine back with them? */
export async function sharesBack(connectionId: string, mySub: string): Promise<boolean> {
  if (!backendEnabled) return false;
  const { data: conn } = await api().models.Connection.get({ id: connectionId });
  if (!conn || conn.ownerSub !== mySub) return false;
  const { data } = await api().models.Connection.listConnectionByMemberSub({ memberSub: mySub }, { limit: 200 });
  return data.some((c) => c.status === "active" && c.ownerSub === conn.memberSub);
}

/**
 * Owner: a link asking the person on this card to connect their own profile.
 * shareBack: what of my own profile they may keep in their locker in return (two-way).
 */
export async function askToConnect(person: Person, ownerSub: string, fromName: string, shareBack?: ConnectionShares): Promise<string> {
  const { data, errors } = await api().models.Invite.create({
    ownerSub,
    fromName,
    toName: person.name,
    ask: JSON.stringify({ sizes: true, favorites: true, dates: true, address: false, kids: false }),
    status: "pending",
    purpose: "connect",
    targetProfileId: person.id,
    shareBack: shareBack ? JSON.stringify(shareBack) : undefined,
  });
  if (!data) throw new Error(errors?.[0]?.message ?? currentTr()("errors.createLink"));
  return `${window.location.origin}/connect/${data.id}`;
}
