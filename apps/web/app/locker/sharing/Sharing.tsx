"use client";

import { pastelFor, type ConnectionShares } from "@mgl/core";
import { ArrowLeft, Users } from "lucide-react";
import { useState } from "react";
import { Avatar, Button, Card } from "@/components/ui";
import { ShareToggles } from "@/components/ShareToggles";
import { useUser } from "@/lib/auth";
import { connectionsEnabled, endConnection, listSharingWith, setSharing, type MyConnection } from "@/lib/connections";
import { useAsync } from "@/lib/exchanges";

/** The people whose lockers get my profile updates, with what each one sees. */
export function Sharing() {
  const user = useUser();
  const { data, loading, reload } = useAsync(async () => (user ? listSharingWith(user.sub) : []), [user?.sub]);

  if (user === null)
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <h1 className="font-display text-4xl font-semibold">Who can see my profile</h1>
        <div className="mt-6">
          <Button href="/sign-in?next=/locker/sharing">Sign in</Button>
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl px-5 pb-24">
      <a href="/locker" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> My locker
      </a>
      <h1 className="font-display text-4xl font-semibold tracking-tight">Who can see my profile</h1>
      <p className="mt-2 text-ink-soft">These people get your updates automatically when you change your profile.</p>
      <div className="mt-3">
        <Button href="/locker/me" variant="soft">
          Edit my profile
        </Button>
      </div>

      <div className="mt-8 grid gap-4">
        {!connectionsEnabled ? (
          <Card className="p-6 text-ink-soft">Connections need an account on the live site.</Card>
        ) : loading && !data ? (
          <p className="text-ink-soft">Loading…</p>
        ) : !data?.length ? (
          <Card className="p-8 text-center">
            <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-lavender/60">
              <Users className="h-6 w-6" />
            </span>
            <p className="font-bold">You're not sharing with anyone yet</p>
            <p className="mt-1 text-sm text-ink-soft">When someone sends you an invite or a connect link, you can choose to keep them updated.</p>
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

  const change = async (next: ConnectionShares) => {
    const before = shares;
    setShares(next);
    setStatus("Saving…");
    try {
      await setSharing(c.id, next);
      setStatus("Saved");
    } catch (e) {
      setShares(before);
      setStatus(e instanceof Error ? e.message : "Couldn't save");
    }
  };
  const disconnect = async () => {
    setStatus("Disconnecting…");
    try {
      await endConnection(c.id);
      onChanged();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Couldn't disconnect");
    }
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <Avatar name={c.ownerName} color={pastelFor(c.ownerName)} size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-xl font-semibold">{c.ownerName}</p>
          <p className="text-sm text-ink-soft">
            Connected {new Date(c.since).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            {c.syncedAt && ` · last update ${new Date(c.syncedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
          </p>
        </div>
      </div>
      <ShareToggles value={shares} onChange={change} />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {confirming ? (
          <>
            <span className="text-sm">Stop sharing with {c.ownerName.split(" ")[0]}? They keep what you shared so far.</span>
            <Button variant="soft" onClick={disconnect}>
              Disconnect
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <Button variant="ghost" onClick={() => setConfirming(true)}>
            Disconnect
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
