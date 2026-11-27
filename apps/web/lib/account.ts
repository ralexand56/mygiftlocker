"use client";

/**
 * Deleting an account, from the website (the app does the same through @mgl/data):
 * the backend deletes every row the user owns, then their photos, then their Cognito user.
 * Every step can be repeated, so an interrupted attempt is simply run again.
 */
import { api, backendEnabled, unwrap } from "./amplify";
import { setMe, update } from "./store";

export async function deleteMyAccount(): Promise<void> {
  if (!backendEnabled) {
    update((db) => ({ ...db, people: [], exchanges: [], invites: [], self: null, me: null }));
    return;
  }
  unwrap(await api().mutations.deleteMyAccount());
  const { list, remove } = await import("aws-amplify/storage");
  try {
    const { items } = await list({ path: ({ identityId }) => `person-photos/${identityId}/`, options: { listAll: true } });
    await Promise.all(items.map((i) => remove({ path: i.path }).catch(() => {})));
  } catch {
    // Nothing stored.
  }
  const { deleteUser } = await import("aws-amplify/auth");
  await deleteUser();
  setMe(null);
}
