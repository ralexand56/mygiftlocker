/**
 * Invites: "please share your sizes with me". The link carries the Invite id; the invitee's
 * answers become a Profile in the inviter's locker. Same as apps/web/lib/invites.ts (backend).
 */
import type { InvitePayload, Person, PublicInvite } from "@mgl/core";
import { api, t, unwrap } from "./client";

/** Creates the invite row and returns its id (the /join/<id> path segment). */
export async function createInvite(ownerSub: string, payload: InvitePayload): Promise<string> {
  const { data, errors } = await api().models.Invite.create({
    ownerSub,
    fromName: payload.from.name,
    toName: payload.to?.name,
    ask: JSON.stringify(payload.ask),
    note: payload.note,
    status: "pending",
  });
  if (!data) throw new Error(errors?.[0]?.message ?? t("errors.createInvite"));
  return data.id;
}

/** What the person opening the link sees (no account needed). */
export async function loadInvite(inviteId: string): Promise<PublicInvite> {
  return unwrap<PublicInvite>(await api().queries.getPublicInvite({ inviteId }, { authMode: "apiKey" }));
}

/** Sends the answers. Returns the one-time claim code that lets the answerer connect their profile later. */
export async function submitInvite(inviteId: string, profile: Person, kids: Person[]): Promise<string | undefined> {
  const strip = ({ name, sizes, address, birthday, anniversary, favorites, payments }: Person) => ({ name, sizes, address, birthday, anniversary, favorites, payments });
  const res = unwrap<{ claimToken?: string }>(
    await api().mutations.submitInvite(
      { inviteId, profile: JSON.stringify(strip(profile)), kids: JSON.stringify(kids.map((k) => ({ ...strip(k), relationship: k.relationship }))) },
      { authMode: "apiKey" },
    ),
  );
  return res?.claimToken;
}

/** The public link for an invite. */
export const inviteUrl = (id: string, origin = "https://www.mygiftlockers.com") => `${origin}/join/${id}`;
