/**
 * Sign-in, same accounts as the website: a one-time email code (Cognito USER_AUTH / EMAIL_OTP) or
 * Google through Cognito's hosted page, which returns to mygiftlocker://auth. Demo mode simulates it.
 * Mirrors apps/web/lib/auth.ts.
 */
import { setMyLocale } from "@mgl/data";
import { useEffect, useState, useSyncExternalStore } from "react";
import { backendEnabled } from "./amplify";
import { currentLocale, currentTr } from "./i18n";

export interface User {
  sub: string;
  email?: string;
  name: string;
  /** False for email-code users who haven't told us their name yet. */
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

// One shared user state for the whole app.
let user: User | null | undefined = backendEnabled ? undefined : null;
const listeners = new Set<() => void>();
const set = (u: User | null) => {
  user = u;
  listeners.forEach((l) => l());
};
export const reloadUser = () => loadUser().then(set);

let started = false;
function start() {
  if (started || !backendEnabled) return;
  started = true;
  void reloadUser();
  void import("aws-amplify/utils").then(({ Hub }) =>
    Hub.listen("auth", ({ payload }) => {
      void reloadUser();
      if (payload.event === "signedIn" || payload.event === "signInWithRedirect") void setMyLocale(currentLocale());
    }),
  );
}

/** Current user: undefined while loading, null when signed out. */
export function useUser(): User | null | undefined {
  useEffect(start, []);
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => user,
  );
}

export async function signInWithGoogle(): Promise<void> {
  if (!backendEnabled) return set({ sub: "me", name: "Google user", hasName: true });
  const a = await auth();
  await a.signInWithRedirect({ provider: "Google" });
}

export type EmailStep = "code-sent" | "signed-in";
const errName = (e: unknown) => (e as { name?: string }).name;
const lang = () => ({ locale: currentLocale() });
let pendingSignUp: string | null = null;

/**
 * Step 1: signs up new users or signs in existing ones; Cognito emails a code either way.
 * Sign-up goes first because the pool hides unknown users at sign-in (see web lib/auth.ts).
 */
export async function startEmailSignIn(email: string): Promise<EmailStep> {
  const username = email.trim().toLowerCase();
  if (!backendEnabled) {
    set({ sub: "me", email: username, name: username.split("@")[0] ?? username, hasName: false });
    return "signed-in";
  }
  const a = await auth();
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
    if (errName(e) !== "UserNotConfirmedException") throw e;
    await a.resendSignUpCode({ username, options: { clientMetadata: lang() } });
    pendingSignUp = username;
    return "code-sent";
  }
}

/** Step 2: the 6-digit code from the email. */
export async function confirmEmailCode(code: string): Promise<void> {
  const a = await auth();
  const c = code.trim();
  if (pendingSignUp) {
    const username = pendingSignUp;
    await a.confirmSignUp({ username, confirmationCode: c });
    pendingSignUp = null;
    try {
      await a.autoSignIn();
    } catch {
      await a.signIn({ username, options: { authFlowType: "USER_AUTH", preferredChallenge: "EMAIL_OTP", clientMetadata: lang() } });
      throw new Error(currentTr()("errors.emailVerified"));
    }
  } else {
    const res = await a.confirmSignIn({ challengeResponse: c });
    if (!res.isSignedIn) throw new Error(currentTr()("errors.badCode"));
  }
  await reloadUser();
}

export async function saveDisplayName(name: string): Promise<void> {
  const clean = name.trim().slice(0, 80);
  if (!clean) throw new Error(currentTr()("errors.enterName"));
  if (!backendEnabled) return set({ ...(user ?? { sub: "me" }), name: clean, hasName: true } as User);
  await (await auth()).updateUserAttributes({ userAttributes: { name: clean } });
  await reloadUser();
}

export async function signOut(): Promise<void> {
  if (backendEnabled) await (await auth()).signOut();
  set(null);
}
