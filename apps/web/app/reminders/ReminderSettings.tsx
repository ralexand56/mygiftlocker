"use client";

import { BellOff, BellRing } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { setReminders } from "@/lib/reminders";

type State = "ask" | "off" | "on" | "error";

/**
 * Landing page for the unsubscribe link in reminder emails. It waits for a click
 * instead of unsubscribing on load, because mail scanners (e.g. Outlook Safe Links)
 * open links automatically.
 */
export function ReminderSettings() {
  const token = useSearchParams().get("t") ?? "";
  const [state, setState] = useState<State>(token ? "ask" : "error");
  const [error, setError] = useState(token ? "" : "This link is missing its code. Use the link from a reminder email.");
  const [busy, setBusy] = useState(false);

  const update = async (on: boolean) => {
    setBusy(true);
    try {
      await setReminders(token, on);
      setState(on ? "on" : "off");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
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
            <h1 className="font-display text-3xl font-semibold">Stop reminder emails?</h1>
            <p className="mt-2 text-ink-soft">You won't get emails a week before and the day before birthdays and other dates in your locker.</p>
            <Button className="mt-7 w-full" disabled={busy} onClick={() => update(false)}>
              {busy ? "Saving…" : "Stop reminder emails"}
            </Button>
          </>
        )}
        {state === "off" && (
          <>
            <h1 className="font-display text-3xl font-semibold">Reminders are off</h1>
            <p className="mt-2 text-ink-soft">We won't send you any more reminder emails. Changed your mind?</p>
            <Button variant="soft" className="mt-7 w-full" disabled={busy} onClick={() => update(true)}>
              {busy ? "Saving…" : "Turn reminders back on"}
            </Button>
          </>
        )}
        {state === "on" && (
          <>
            <h1 className="font-display text-3xl font-semibold">Reminders are on</h1>
            <p className="mt-2 text-ink-soft">We'll email you a week before and the day before each date.</p>
            <Button className="mt-7 w-full" href="/locker">
              Open my locker
            </Button>
          </>
        )}
        {state === "error" && (
          <>
            <h1 className="font-display text-3xl font-semibold">Link not recognized</h1>
            <p className="mt-2 text-ink-soft">{error}</p>
          </>
        )}
      </Card>
    </div>
  );
}
