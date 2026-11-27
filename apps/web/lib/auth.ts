"use client";

/**
 * Auth facade over Cognito (Amplify). Organizers and locker owners sign in with
 * a passwordless email code or Google. In demo mode (no backend) sign-in is simulated.
 */
import { useEffect, useState } from "react";
import { backendEnabled } from "./amplify";
import { setMe, useDB } from "./store";
import { currentTr } from "./i18n-current";

export const authMode: "amplify" | "demo" = backendEnabled ? "amplify" : "demo";

export interface User {
  sub: string;
  email?: string;
  /** Display name; falls back to the email's local part when the user hasn't set one. */
  name: string;
  /** False for email-code users who haven't told us their name yet (Google supplies one). */
  hasName: boolean;
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
    const name = attrs.name?.trim();
    return { sub: u.userId, email, name: name || email?.split("@")[0] || "You", hasName: !!name };
  } catch {
    return null;
  }
}

/** Mounted useUser hooks, so changes that don't emit Hub auth events (e.g. a new name) still refresh. */
const reloaders = new Set<() => void>();

/** Current user (undefined while loading, null when signed out). */
export function useUser(): User | null | undefined {
  const demoMe = useDB((db) => db.me);
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    if (!backendEnabled) return;
    let stop = () => {};
    const reload = () => void loadUser().then(setUser);
    reload();
    reloaders.add(reload);
    import("aws-amplify/utils").then(({ Hub }) => {
      stop = Hub.listen("auth", reload);
    });
    return () => {
      reloaders.delete(reload);
      stop();
    };
  }, []);

  if (!backendEnabled) return demoMe ? { sub: demoMe.id, name: demoMe.name, hasName: true } : null;
  return user;
}

/** Saves the signed-in user's display name (Cognito `name`) and refreshes every useUser. */
export async function saveDisplayName(name: string): Promise<void> {
  const clean = name.trim().slice(0, 80);
  if (!clean) throw new Error(currentTr()("errors.enterName"));
  if (!backendEnabled) {
    setMe({ id: "me", name: clean });
    return;
  }
  await (await auth()).updateUserAttributes({ userAttributes: { name: clean } });
  reloaders.forEach((r) => r());
}

export async function signInWithGoogle(): Promise<void> {
  if (!backendEnabled) {
    setMe({ id: "me", name: "Google user" });
    return;
  }
  const a = await auth();
  await a.signInWithRedirect({ provider: "Google" });
}

export async function signInWithApple(): Promise<void> {
  if (!backendEnabled) {
    setMe({ id: "me", name: "Apple user" });
    return;
  }
  const a = await auth();
  await a.signInWithRedirect({ provider: "Apple" });
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
    const res = await a.signUp({ username, options: { userAttributes: { email: username }, autoSignIn: { authFlowType: "USER_AUTH" }, clientMetadata: lang() } });
    if (res.isSignUpComplete) return "signed-in";
    pendingSignUp = username;
    return "code-sent";
  } catch (e) {
    if (errName(e) !== "UsernameExistsException") throw e;
  }

  try {
    const res = await a.signIn({ username, options: { authFlowType: "USER_AUTH", preferredChallenge: "EMAIL_OTP", clientMetadata: lang() } });
    return res.isSignedIn ? "signed-in" : "code-sent";
  } catch (e) {
    // Signed up earlier but never entered the code: send a fresh confirmation code.
    if (errName(e) !== "UserNotConfirmedException") throw e;
    await a.resendSignUpCode({ username, options: { clientMetadata: lang() } });
    pendingSignUp = username;
    return "code-sent";
  }
}

let pendingSignUp: string | null = null;

/** The visitor's language, so the code email (functions/auth-message) is written in it. */
const lang = () => ({ locale: currentTr().locale });

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
      await a.signIn({ username, options: { authFlowType: "USER_AUTH", preferredChallenge: "EMAIL_OTP", clientMetadata: lang() } });
      throw new Error(currentTr()("errors.emailVerified"));
    }
    return;
  }
  const res = await a.confirmSignIn({ challengeResponse: c });
  if (!res.isSignedIn) throw new Error(currentTr()("errors.badCode"));
  void email;
}

export async function signOut() {
  setMe(null);
  if (backendEnabled) await (await auth()).signOut();
}
