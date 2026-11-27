/**
 * Backend setup. amplify_outputs.json (git-ignored) points at the same Amplify backend as the
 * website, so people see the same locker everywhere. When it's `{}` the app runs on demo data.
 * Import this module first (it installs the crypto polyfill Amplify needs).
 */
import "react-native-get-random-values";
import "@aws-amplify/react-native";
import { setClient, type Schema } from "@mgl/data";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import outputs from "../../amplify_outputs.json";
import { currentTr } from "./i18n";

const config = outputs as Record<string, unknown>;
export const backendEnabled = Boolean(config.auth);
export const photosEnabled = backendEnabled && Boolean(config.storage);

/** Sign-in on our own address (see amplify/backend.ts): Google's chooser shows mygiftlockers.com. */
const AUTH_DOMAIN = "auth.mygiftlockers.com";
const auth = config.auth as { oauth?: { domain?: string } } | undefined;
if (auth?.oauth) config.auth = { ...auth, oauth: { ...auth.oauth, domain: AUTH_DOMAIN } };

if (backendEnabled) {
  Amplify.configure(config as Parameters<typeof Amplify.configure>[0]);
  setClient(generateClient<Schema>(), currentTr);
}
