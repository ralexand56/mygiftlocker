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

/**
 * Step 1 of passwordless sign-in. Signs in existing users, or signs up new
 * ones; either way Cognito emails a one-time code.
 */
export async function startEmailSignIn(email: string): Promise<EmailStep> {
  if (!backendEnabled) {
    setMe({ id: "me", name: email.split("@")[0] ?? email });
    return "signed-in";
  }
  const a = await auth();
  const username = email.trim().toLowerCase();
  try {
    const res = await a.signIn({ username, options: { authFlowType: "USER_AUTH", preferredChallenge: "EMAIL_OTP" } });
    return res.isSignedIn ? "signed-in" : "code-sent";
  } catch (e) {
    if ((e as { name?: string }).name !== "UserNotFoundException") throw e;
    const res = await a.signUp({ username, options: { userAttributes: { email: username }, autoSignIn: { authFlowType: "USER_AUTH" } } });
    pendingSignUp = username;
    return res.isSignUpComplete ? "signed-in" : "code-sent";
  }
}

let pendingSignUp: string | null = null;

/** Step 2: the 6-digit code from the email. */
export async function confirmEmailCode(email: string, code: string): Promise<void> {
  const a = await auth();
  const c = code.trim();
  if (pendingSignUp) {
    await a.confirmSignUp({ username: pendingSignUp, confirmationCode: c });
    pendingSignUp = null;
    await a.autoSignIn();
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
