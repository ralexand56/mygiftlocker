"use client";

import { ArrowLeft, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Card } from "@/components/ui";
import { deleteMyAccount } from "@/lib/account";
import { useUser } from "@/lib/auth";

/** Account settings: deleting the account and everything in it, right away. */
export function Account() {
  const t = useTranslations("account");
  const tc = useTranslations("common");
  const user = useUser();
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);

  if (done)
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <h1 className="font-display text-3xl font-semibold">{t("done")}</h1>
        <div className="mt-6">
          <Button href="/">{tc("home")}</Button>
        </div>
      </div>
    );
  if (user === null)
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <h1 className="font-display text-4xl font-semibold">{t("section")}</h1>
        <div className="mt-6">
          <Button href="/sign-in?next=/locker/account">{tc("signIn")}</Button>
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-xl px-5 pb-24">
      <a href="/locker" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> {tc("myLocker")}
      </a>
      <Card className="p-7">
        <h1 className="font-display text-3xl font-semibold">{t("section")}</h1>
        {user?.email && <p className="mt-1 text-sm text-ink-soft">{user.email}</p>}
        {!asking ? (
          <button
            type="button"
            onClick={() => setAsking(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-bold text-rose-deep shadow-soft hover:bg-blush/40"
          >
            <Trash2 className="h-4 w-4" /> {t("delete")}
          </button>
        ) : (
          <div className="mt-6 rounded-2xl bg-blush/40 p-5 ring-1 ring-rose/30" role="alertdialog" aria-label={t("title")}>
            <p className="font-bold">{t("title")}</p>
            <p className="mt-1 text-sm text-ink-soft">{t("body")}</p>
            {error && <p className="mt-2 text-sm font-bold text-rose-deep">{t("failed")}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setError(false);
                  try {
                    await deleteMyAccount();
                    setDone(true);
                    router.refresh();
                  } catch {
                    setError(true);
                    setBusy(false);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-rose-deep px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" /> {busy ? t("deleting") : t("confirm")}
              </button>
              <Button variant="ghost" onClick={() => setAsking(false)} disabled={busy}>
                {tc("cancel")}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
