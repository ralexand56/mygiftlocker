"use client";

import { pastelFor, type ConnectionShares } from "@mgl/core";
import { ArrowLeft, Users } from "lucide-react";
import { useState } from "react";
import { Avatar, Button, Card } from "@/components/ui";
import { ShareToggles } from "@/components/ShareToggles";
import { useUser } from "@/lib/auth";
import { connectionsEnabled, endConnection, listSharingWith, setSharing, type MyConnection } from "@/lib/connections";
import { useAsync } from "@/lib/exchanges";
import { useTranslations } from "next-intl";
import { useIntlTag } from "@/lib/i18n";

/** The people whose lockers get my profile updates, with what each one sees. */
export function Sharing() {
  const t = useTranslations("sharing");
  const user = useUser();
  const { data, loading, reload } = useAsync(async () => (user ? listSharingWith(user.sub) : []), [user?.sub]);

  if (user === null)
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <h1 className="font-display text-4xl font-semibold">{t("title")}</h1>
        <div className="mt-6">
          <Button href="/sign-in?next=/locker/sharing">{t("signIn")}</Button>
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl px-5 pb-24">
      <a href="/locker" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> {t("back")}
      </a>
      <h1 className="font-display text-4xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-2 text-ink-soft">{t("lede")}</p>
      <div className="mt-3">
        <Button href="/locker/me" variant="soft">
          {t("editProfile")}
        </Button>
      </div>

      <div className="mt-8 grid gap-4">
        {!connectionsEnabled ? (
          <Card className="p-6 text-ink-soft">{t("needsBackend")}</Card>
        ) : loading && !data ? (
          <p className="text-ink-soft">{t("loading")}</p>
        ) : !data?.length ? (
          <Card className="p-8 text-center">
            <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-lavender/60">
              <Users className="h-6 w-6" />
            </span>
            <p className="font-bold">{t("emptyTitle")}</p>
            <p className="mt-1 text-sm text-ink-soft">{t("emptyBody")}</p>
          </Card>
        ) : (
          data.map((c) => <ConnectionCard key={c.id} c={c} onChanged={reload} />)
        )}
      </div>
    </div>
  );
}

function ConnectionCard({ c, onChanged }: { c: MyConnection; onChanged: () => void }) {
  const [shares, setShares] = useState(c.shares);
  const [status, setStatus] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const t = useTranslations("sharing");
  const tag = useIntlTag();

  const change = async (next: ConnectionShares) => {
    const before = shares;
    setShares(next);
    setStatus(t("saving"));
    try {
      await setSharing(c.id, next);
      setStatus(t("saved"));
    } catch (e) {
      setShares(before);
      setStatus(e instanceof Error ? e.message : t("saveFailed"));
    }
  };
  const disconnect = async () => {
    setStatus(t("disconnecting"));
    try {
      await endConnection(c.id);
      onChanged();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : t("disconnectFailed"));
    }
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <Avatar name={c.ownerName} color={pastelFor(c.ownerName)} size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-xl font-semibold">{c.ownerName}</p>
          <p className="text-sm text-ink-soft">
            {t("since", { date: new Date(c.since).toLocaleDateString(tag, { month: "short", day: "numeric", year: "numeric" }) })}
            {c.syncedAt && ` · ${t("lastUpdate", { date: new Date(c.syncedAt).toLocaleDateString(tag, { month: "short", day: "numeric" }) })}`}
          </p>
        </div>
      </div>
      <ShareToggles value={shares} onChange={change} />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {confirming ? (
          <>
            <span className="text-sm">{t("confirm", { name: c.ownerName.split(" ")[0]! })}</span>
            <Button variant="soft" onClick={disconnect}>
              {t("disconnect")}
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              {t("cancel")}
            </Button>
          </>
        ) : (
          <Button variant="ghost" onClick={() => setConfirming(true)}>
            {t("disconnect")}
          </Button>
        )}
        {status && (
          <span className="ml-auto text-sm text-ink-soft" aria-live="polite">
            {status}
          </span>
        )}
      </div>
    </Card>
  );
}
