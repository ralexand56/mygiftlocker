"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogoMark } from "@/components/Logo";
import { useUser } from "@/lib/auth";
import { useTranslations } from "next-intl";

/** Google sends people back here; Amplify's OAuth listener finishes sign-in. */
export default function AuthCallback() {
  const user = useUser();
  const router = useRouter();
  const t = useTranslations("signIn");
  useEffect(() => {
    if (!user) return;
    const next = sessionStorage.getItem("mgl:next");
    sessionStorage.removeItem("mgl:next");
    router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/locker");
  }, [user, router]);
  return (
    <main className="pastel-wash grid min-h-dvh place-items-center">
      <div className="text-center">
        <LogoMark size={64} className="mx-auto animate-pulse" />
        <p className="mt-4 font-display text-2xl">{t("signingIn")}</p>
      </div>
    </main>
  );
}
