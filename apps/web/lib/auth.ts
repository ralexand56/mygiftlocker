"use client";

/**
 * Auth facade over Cognito (Amplify). Organizers and locker owners sign in with
 * a passwordless email code or Google. In demo mode (no backend) sign-in is simulated.
 */
import { useEffect, useState } from "react";
import { backendEnabled } from "./amplify";
import { setMe, useDB } from "./store";

export const authMode: "amplify" | "demo" = backendEnabled ? "amplify" : "demo";

export interface User {
  sub: string;
  email?: string;
  name: string;
}

async function auth() {
  return import("aws-amplify/auth");
}

async function loadUser(): Promise<User | null> {
  const a = await auth();
  try {
    const u = await a.getCurrentUser();
    const attrs = await a.fetchUserAttributes().catch(() => ({}) as Record<string, string>);
    const email = attrs.email;
    return { sub: u.userId, email, name: attrs.name || email?.split("@")[0] || "You" };
  } catch {
    return null;
  }
}

/** Current user (undefined while loading, null when signed out). */
export function useUser(): User | null | undefined {
  const demoMe = useDB((db) => db.me);
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    if (!backendEnabled) return;
    let stop = () => {};
    loadUser().then(setUser);
    import("aws-amplify/utils").then(({ Hub }) => {
      stop = Hub.listen("auth", () => loadUser().then(setUser));
    });
    return () => stop();
  }, []);

  if (!backendEnabled) return demoMe ? { sub: demoMe.id, name: demoMe.name } : null;
  return user;
}

export async function signInWithGoogle(): Promise<void> {
  if (!backendEnabled) {
    setMe({ id: "me", name: "Google user" });
    return;
  }
  const a = await auth();
  await a.signInWithRedirect({ provider: "Google" });
}

export type EmailStep = "code-sent" | "signed-in";

const errName = (e: unknown) => (e as { name?: string }).name;

/**
 * Step 1 of passwordless sign-in. Signs up new users or signs in existing ones;
 * either way Cognito emails a one-time code.
 *
 * Sign-up goes first on purpose: the user pool hides unknown users at sign-in
 * (PreventUserExistenceErrors), returning a fake code challenge and sending no
 * email, so "sign in, then sign up on UserNotFound" never creates anyone.
 * Sign-up does report an existing address (UsernameExistsException).
 */
export async function startEmailSignIn(email: string): Promise<EmailStep> {
  if (!backendEnabled) {
    setMe({ id: "me", name: email.split("@")[0] ?? email });
    return "signed-in";
  }
  const a = await auth();
  const username = email.trim().toLowerCase();
  pendingSignUp = null;

  try {
    const res = await a.signUp({ username, options: { userAttributes: { email: username }, autoSignIn: { authFlowType: "USER_AUTH" } } });
    if (res.isSignUpComplete) return "signed-in";
    pendingSignUp = username;
    return "code-sent";
  } catch (e) {
    if (errName(e) !== "UsernameExistsException") throw e;
  }

  try {
    const res = await a.signIn({ username, options: { authFlowType: "USER_AUTH", preferredChallenge: "EMAIL_OTP" } });
    return res.isSignedIn ? "signed-in" : "code-sent";
  } catch (e) {
    // Signed up earlier but never entered the code: send a fresh confirmation code.
    if (errName(e) !== "UserNotConfirmedException") throw e;
    await a.resendSignUpCode({ username });
    pendingSignUp = username;
    return "code-sent";
  }
}

let pendingSignUp: string | null = null;

/** Step 2: the 6-digit code from the email. */
export async function confirmEmailCode(email: string, code: string): Promise<void> {
  const a = await auth();
  const c = code.trim();
  if (pendingSignUp) {
    const username = pendingSignUp;
    await a.confirmSignUp({ username, confirmationCode: c });
    pendingSignUp = null;
    try {
      await a.autoSignIn();
    } catch {
      // autoSignIn only works in the session that called signUp (not after a resend).
      await a.signIn({ username, options: { authFlowType: "USER_AUTH", preferredChallenge: "EMAIL_OTP" } });
      throw new Error("Email verified! We just sent you a new code. Enter it to finish signing in.");
    }
    return;
  }
  const res = await a.confirmSignIn({ challengeResponse: c });
  if (!res.isSignedIn) throw new Error("That code didn't work. Try again.");
  void email;
}

export async function signOut() {
  setMe(null);
  if (backendEnabled) await (await auth()).signOut();
}
