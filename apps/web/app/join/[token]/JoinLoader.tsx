"use client";

import { Button } from "@/components/ui";
import { useAsync } from "@/lib/exchanges";
import { loadInvite } from "@/lib/invites";
import { JoinFlow } from "./JoinFlow";

/** Loads the invite (from the backend, or decoded from a demo link), then runs the form. */
export function JoinLoader({ segment }: { segment: string }) {
  const { data: invite, error, loading } = useAsync(() => loadInvite(segment), [segment]);
  if (loading) return <main className="pastel-wash grid min-h-dvh place-items-center text-ink-soft">Opening your invite…</main>;
  if (!invite)
    return (
      <main className="pastel-wash grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <h1 className="font-display text-4xl font-semibold">This invite link isn't working</h1>
          <p className="mt-2 text-ink-soft">{error ?? "Ask the sender for a fresh link."}</p>
          <div className="mt-6">
            <Button href="/">Go home</Button>
          </div>
        </div>
      </main>
    );
  return <JoinFlow invite={invite} />;
}
