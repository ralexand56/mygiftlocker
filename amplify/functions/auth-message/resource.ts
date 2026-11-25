import { defineFunction } from "@aws-amplify/backend";

/** Cognito custom-message trigger: sign-up and sign-in code emails in the user's language. */
export const authMessage = defineFunction({
  name: "auth-message",
  entry: "./handler.ts",
  // Cognito waits at most 5 seconds for a trigger; the handler falls back to English well before that.
  timeoutSeconds: 5,
  // Lives with auth (it's an auth trigger) to avoid a circular auth <-> data stack dependency.
  resourceGroupName: "auth",
});
