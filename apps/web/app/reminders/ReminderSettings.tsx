"use client";

import { BellOff, BellRing } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { setReminders } from "@/lib/reminders";
import { useTranslations } from "next-intl";

type State = "ask" | "off" | "on" | "error";

/**
 * Landing page for the unsubscribe link in reminder emails. It waits for a click
 * instead of unsubscribing on load, because mail scanners (e.g. Outlook Safe Links)
 * open links automatically.
 */
export function ReminderSettings() {
  const token = useSearchParams().get("t") ?? "";
  const t = useTranslations("reminders");
  const [state, setState] = useState<State>(token ? "ask" : "error");
  const [error, setError] = useState(token ? "" : t("missingCode"));
  const [busy, setBusy] = useState(false);

  const update = async (on: boolean) => {
    setBusy(true);
    try {
      await setReminders(token, on);
      setState(on ? "on" : "off");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failed"));
      setState("error");
    } finally {
      setBusy(false);
    }
  };

  const Icon = state === "on" ? BellRing : BellOff;
  return (
    <div className="mx-auto max-w-md px-5 py-12">
      <Card className="p-9 text-center">
        <span className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-blush">
          <Icon className="h-8 w-8 text-ink" strokeWidth={2.2} />
        </span>
        {state === "ask" && (
          <>
            <h1 className="font-display text-3xl font-semibold">{t("askTitle")}</h1>
            <p className="mt-2 text-ink-soft">{t("askBody")}</p>
            <Button className="mt-7 w-full" disabled={busy} onClick={() => update(false)}>
              {busy ? t("saving") : t("stop")}
            </Button>
          </>
        )}
        {state === "off" && (
          <>
            <h1 className="font-display text-3xl font-semibold">{t("offTitle")}</h1>
            <p className="mt-2 text-ink-soft">{t("offBody")}</p>
            <Button variant="soft" className="mt-7 w-full" disabled={busy} onClick={() => update(true)}>
              {busy ? t("saving") : t("turnOn")}
            </Button>
          </>
        )}
        {state === "on" && (
          <>
            <h1 className="font-display text-3xl font-semibold">{t("onTitle")}</h1>
            <p className="mt-2 text-ink-soft">{t("onBody")}</p>
            <Button className="mt-7 w-full" href="/locker">
              {t("openLocker")}
            </Button>
          </>
        )}
        {state === "error" && (
          <>
            <h1 className="font-display text-3xl font-semibold">{t("errorTitle")}</h1>
            <p className="mt-2 text-ink-soft">{error}</p>
          </>
        )}
      </Card>
    </div>
  );
}
