/**
 * Deleting an account (required by the App Store, offered on the website too):
 * 1. the backend deletes every row the user owns (deleteMyAccount),
 * 2. their photos are removed under their own storage identity,
 * 3. their Cognito user is deleted with their own session.
 * Each step is safe to repeat, so an interrupted attempt can simply be run again.
 */
import { api, unwrap } from "./client";

/** Names the step that failed, so the error shown to the user can be traced. */
const step = async <T>(name: string, run: () => Promise<T>): Promise<T> => {
  try {
    return await run();
  } catch (e) {
    const why = e instanceof Error ? `${e.name !== "Error" ? `${e.name}: ` : ""}${e.message}` : String(e);
    throw new Error(`${name}: ${why}`);
  }
};

export async function deleteMyAccount(): Promise<void> {
  await step("data", async () => unwrap(await api().mutations.deleteMyAccount()));
  const { list, remove } = await import("aws-amplify/storage");
  try {
    const { items } = await list({ path: ({ identityId }) => `person-photos/${identityId}/`, options: { listAll: true } });
    await Promise.all(items.map((i) => Promise.resolve(remove({ path: i.path })).catch(() => {})));
  } catch {
    // No storage configured or nothing there.
  }
  await step("sign-in", async () => {
    const { deleteUser } = await import("aws-amplify/auth");
    await deleteUser();
  });
}
