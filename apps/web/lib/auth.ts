"use client";

/**
 * Auth facade. Uses Amplify (Cognito) when NEXT_PUBLIC_AMPLIFY_CONFIG is set
 * (the JSON from `amplify_outputs.json`), otherwise falls back to demo mode.
 *
 * Providers: Google, Facebook (Cognito federated sign-in) and passwordless
 * email one-time codes. The same Cognito user pool backs the Expo app, so
 * accounts and data stay in sync across web and mobile.
 */
import { setMe } from "./store";

export const authMode: "amplify" | "demo" = process.env.NEXT_PUBLIC_AMPLIFY_CONFIG ? "amplify" : "demo";

let configured = false;
async function amplify() {
  const { Amplify } = await import("aws-amplify");
  if (!configured) {
    Amplify.configure(JSON.parse(process.env.NEXT_PUBLIC_AMPLIFY_CONFIG!));
    configured = true;
  }
  return import("aws-amplify/auth");
}

export async function signInWithProvider(provider: "Google" | "Facebook"): Promise<void> {
  if (authMode === "demo") {
    setMe({ id: "me", name: `${provider} user` });
    return;
  }
  const auth = await amplify();
  await auth.signInWithRedirect({ provider });
}

/** Passwordless: Cognito emails a one-time code (USER_AUTH / EMAIL_OTP flow). */
export async function signInWithEmail(email: string): Promise<"code-sent" | "signed-in"> {
  if (authMode === "demo") {
    setMe({ id: "me", name: email.split("@")[0] ?? email });
    return "signed-in";
  }
  const auth = await amplify();
  const res = await auth.signIn({ username: email, options: { authFlowType: "USER_AUTH", preferredChallenge: "EMAIL_OTP" } });
  return res.isSignedIn ? "signed-in" : "code-sent";
}

export async function signOut() {
  setMe(null);
  if (authMode === "amplify") await (await amplify()).signOut();
}
