"use client";

import { Button } from "@/components/ui";
import { useUser } from "@/lib/auth";
import { useAsync } from "@/lib/exchanges";
import { getSelfProfile, saveSelfProfile } from "@/lib/self";
import { JoinFlow, SELF_INVITE } from "../../join/[token]/JoinFlow";
import { useTranslations } from "next-intl";

/** The invite questions, answered for yourself. */
export function MyProfile() {
  const user = useUser();
  const t = useTranslations("myProfile");
  const { data: self, loading } = useAsync(async () => (user ? getSelfProfile(user.sub) : null), [user?.sub]);
  if (user === null)
    return (
      <main className="pastel-wash grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <h1 className="font-display text-4xl font-semibold">{t("title")}</h1>
          <p className="mt-2 text-ink-soft">{t("signInBody")}</p>
          <div className="mt-6">
            <Button href="/sign-in?next=/locker/me">{t("signIn")}</Button>
          </div>
        </div>
      </main>
    );
  if (!user || loading) return <main className="pastel-wash grid min-h-dvh place-items-center text-ink-soft">{t("loading")}</main>;
  // Back to where they came from (e.g. a connect link), else the locker.
  const next = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") : null;
  const doneHref = next && next.startsWith("/") && !next.startsWith("//") ? next : "/locker";
  return (
    <JoinFlow
      invite={{ ...SELF_INVITE, to: { name: user.hasName ? user.name : undefined } }}
      self={{ initial: self ?? null, onSave: (p) => saveSelfProfile(user.sub, p), doneHref }}
    />
  );
}
