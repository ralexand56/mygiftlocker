"use client";

import { motion } from "motion/react";
import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FlyingBackdrop } from "@/components/FlyingBackdrop";
import { LogoMark } from "@/components/Logo";
import { Button, Input } from "@/components/ui";
import { authMode, confirmEmailCode, signInWithGoogle, startEmailSignIn } from "@/lib/auth";
import { useTranslations } from "next-intl";
import { LanguagePicker } from "@/components/LanguagePicker";

export function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("signIn");

  /** Return to where the user came from (?next=/exchange), else the locker. */
  const done = () => {
    const next = new URLSearchParams(window.location.search).get("next");
    router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : "/locker");
  };
  const attempt = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("somethingWrong"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="pastel-wash relative grid min-h-dvh place-items-center overflow-x-clip py-10 px-4">
      <FlyingBackdrop scene="welcome" />
      <LanguagePicker className="absolute top-4 right-4 z-20 text-[15px]" />
      <motion.section
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 140, damping: 18 }}
        className="glass relative z-10 w-full max-w-sm rounded-[32px] p-8 text-center shadow-lift"
      >
        <LogoMark size={64} className="mx-auto" />
        <h1 className="mt-4 font-display text-3xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-ink-soft">{t("subtitle")}</p>

        <div className="mt-7 grid gap-3">
          <button
            onClick={() =>
              attempt(async () => {
                const next = new URLSearchParams(window.location.search).get("next");
                if (next) sessionStorage.setItem("mgl:next", next);
                await signInWithGoogle();
                if (authMode === "demo") done();
              })
            }
            className="flex items-center justify-center gap-3 rounded-full bg-white px-5 py-3 font-bold shadow-soft transition hover:-translate-y-0.5"
          >
            <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
              <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.3-.4-3.5z" />
            </svg>
            {t("google")}
          </button>
          <div className="my-2 flex items-center gap-3 text-xs font-bold text-ink-soft">
            <span className="h-px flex-1 bg-ink/10" /> {t("or")} <span className="h-px flex-1 bg-ink/10" />
          </div>

          {sent ? (
            <form
              className="grid gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                attempt(async () => {
                  await confirmEmailCode(email, code);
                  done();
                });
              }}
            >
              <p className="rounded-2xl bg-mint/70 p-4 text-sm font-bold">{t("sent", { email })}</p>
              <Input inputMode="numeric" autoComplete="one-time-code" maxLength={8} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder={t("codePlaceholder")} className="text-center tracking-[0.4em]" autoFocus />
              <Button type="submit" disabled={busy || code.length < 6}>
                {busy ? t("checking") : t("signIn")}
              </Button>
              <button type="button" className="text-xs font-bold text-ink-soft hover:text-ink" onClick={() => (setSent(false), setCode(""))}>
                {t("differentEmail")}
              </button>
            </form>
          ) : (
            <form
              className="grid gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                attempt(async () => {
                  const r = await startEmailSignIn(email);
                  if (r === "signed-in") done();
                  else setSent(true);
                });
              }}
            >
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
              <Button type="submit" disabled={busy}>
                <Mail className="h-4 w-4" /> {busy ? t("sending") : t("email")}
              </Button>
            </form>
          )}
          {error && <p className="text-sm font-bold text-rose-deep">{error}</p>}
        </div>
        {authMode === "demo" && <p className="mt-5 text-xs text-ink-soft">{t("demo")}</p>}
      </motion.section>
    </main>
  );
}
