"use client";

/**
 * Connections: locker cards that stay in sync with someone's own profile.
 * Needs the backend (signed-in users on both sides); in demo mode everything here is a no-op.
 */
import { cleanShares, type ConnectionShares, type Person } from "@mgl/core";
import { api, backendEnabled, parseJson, unwrap } from "./amplify";

export const connectionsEnabled = backendEnabled;

export interface MyConnection {
  id: string;
  ownerName: string;
  shares: ConnectionShares;
  since: string;
  syncedAt?: string;
}

/** Link my own profile to the card an invite created (or, for "connect" links, targets). */
export async function connectProfile(inviteId: string, shares?: ConnectionShares, claimToken?: string): Promise<{ ownerName: string }> {
  if (!backendEnabled) return { ownerName: "" };
  return unwrap(await api().mutations.connectProfile({ inviteId, shares: shares ? JSON.stringify(shares) : undefined, claimToken }));
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
      ownerName: c.ownerName ?? "Someone",
      shares: cleanShares(parseJson(c.shares ?? "{}")),
      since: c.createdAt,
      syncedAt: c.syncedAt ?? undefined,
    }))
    .sort((a, b) => a.ownerName.localeCompare(b.ownerName));
}

export async function setSharing(connectionId: string, shares: ConnectionShares): Promise<void> {
  unwrap(await api().mutations.setConnectionSharing({ connectionId, shares: JSON.stringify(shares) }));
}

export async function endConnection(connectionId: string): Promise<void> {
  unwrap(await api().mutations.endConnection({ connectionId }));
}

/** Owner: a link asking the person on this card to connect their own profile. */
export async function askToConnect(person: Person, ownerSub: string, fromName: string): Promise<string> {
  const { data, errors } = await api().models.Invite.create({
    ownerSub,
    fromName,
    toName: person.name,
    ask: JSON.stringify({ sizes: true, favorites: true, dates: true, address: false, kids: false }),
    status: "pending",
    purpose: "connect",
    targetProfileId: person.id,
  });
  if (!data) throw new Error(errors?.[0]?.message ?? "Couldn't create the link");
  return `${window.location.origin}/connect/${data.id}`;
}
