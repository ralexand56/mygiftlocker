"use client";

/**
 * Invite data access. With the backend, an invite is a row and the link carries
 * its id; the invitee's answers become a Profile in the inviter's locker. In demo
 * mode the link carries the whole invite (encoded) and answers stay in this browser.
 */
import { decodeInvite, encodeInvite, type InvitePayload, type Person, type PublicInvite } from "@mgl/core";
import { api, backendEnabled, parseJson, unwrap } from "./amplify";
import { readDB, saveInvite, upsertPerson } from "./store";

/** Returns the path segment for /join/<segment>. */
export async function createInvite(payload: InvitePayload, ownerSub?: string): Promise<string> {
  if (!backendEnabled) {
    saveInvite(payload);
    return encodeInvite(payload);
  }
  if (!ownerSub) throw new Error("Sign in to send invites");
  const { data, errors } = await api().models.Invite.create({
    ownerSub,
    fromName: payload.from.name,
    toName: payload.to?.name,
    ask: JSON.stringify(payload.ask),
    note: payload.note,
    status: "pending",
  });
  if (!data) throw new Error(errors?.[0]?.message ?? "Couldn't create the invite");
  return data.id;
}

/** Accepts either an invite id (backend) or an encoded demo invite. */
export async function loadInvite(segment: string): Promise<PublicInvite> {
  const decoded = decodeInvite(segment);
  if (decoded) return decoded;
  if (!backendEnabled) throw new Error("This invite link looks broken. Ask the sender for a fresh link.");
  return unwrap<PublicInvite>(await api().queries.getPublicInvite({ inviteId: segment }, { authMode: "apiKey" }));
}

export async function submitInvite(invite: PublicInvite, profile: Person, kids: Person[]): Promise<void> {
  // Demo invites (encoded in the link) have ids like "inv_…"; backend ids are UUIDs.
  if (!backendEnabled || invite.id.startsWith("inv_")) {
    upsertPerson(profile);
    kids.forEach(upsertPerson);
    return;
  }
  const strip = ({ name, sizes, address, birthday, anniversary, favorites }: Person) => ({ name, sizes, address, birthday, anniversary, favorites });
  unwrap(
    await api().mutations.submitInvite(
      { inviteId: invite.id, profile: JSON.stringify(strip(profile)), kids: JSON.stringify(kids.map(strip)) },
      { authMode: "apiKey" },
    ),
  );
}

/** People in the signed-in user's locker. */
export async function listLockerPeople(): Promise<Person[]> {
  if (!backendEnabled) return readDB().people;
  const { data } = await api().models.Profile.list({ limit: 500 });
  return data.map((p) => ({
    id: p.id,
    name: p.name,
    kind: (p.kind ?? "adult") as Person["kind"],
    relationship: p.relationship ?? undefined,
    color: p.color ?? "#FBD3E3",
    sizes: parseJson(p.sizes ?? "{}") ?? {},
    address: parseJson(p.address ?? "null") ?? undefined,
    birthday: p.birthday ? { month: p.birthday.month, day: p.birthday.day, year: p.birthday.year ?? undefined } : undefined,
    anniversary: p.anniversary ? { month: p.anniversary.month, day: p.anniversary.day, year: p.anniversary.year ?? undefined } : undefined,
    favorites: parseJson(p.favorites ?? "null") ?? undefined,
    guardians: p.guardians?.filter((g): g is string => !!g),
    updatedAt: p.updatedAt,
  }));
}
