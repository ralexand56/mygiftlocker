import { api, backendEnabled, unwrap } from "./amplify";

/** Turn reminder emails off or on using the token from an email's unsubscribe link. */
export async function setReminders(token: string, on: boolean): Promise<void> {
  if (!backendEnabled) return;
  unwrap<{ ok: boolean }>(await api().mutations.setReminders({ token, on }, { authMode: "apiKey" }));
}
