"use client";

import { DEFAULT_SHARES, describeShares, likelyCardFor, summarizeSizes, type ConnectionShares } from "@mgl/core";
import { motion } from "motion/react";
import { Check, Link2 } from "lucide-react";
import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { ShareToggles } from "@/components/ShareToggles";
import { useUser } from "@/lib/auth";
import { connectProfile } from "@/lib/connections";
import { useAsync } from "@/lib/exchanges";
import { listLockerPeople, loadInvite } from "@/lib/invites";
import { getSelfProfile } from "@/lib/self";

/** "Rico wants to stay up to date with your sizes and wishes." */
export function ConnectFlow({ inviteId }: { inviteId: string }) {
  const user = useUser();
  const { data: invite, error, loading } = useAsync(() => loadInvite(inviteId), [inviteId]);
  const { data: self, loading: loadingSelf } = useAsync(async () => (user ? getSelfProfile(user.sub) : null), [user?.sub]);
  const [shares, setShares] = useState<ConnectionShares>(DEFAULT_SHARES);
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [addBack, setAddBack] = useState(true);
  // undefined: not chosen yet (use the likely match); "new": a new card; else one of my cards.
  const [backCard, setBackCard] = useState<string | undefined>();
  const [addedBack, setAddedBack] = useState(false);
  const { data: people } = useAsync(async () => (user && invite?.shareBack ? listLockerPeople() : []), [user?.sub, invite?.shareBack]);
  const [failure, setFailure] = useState<string | null>(null);
  const here = `/connect/${inviteId}`;

  if (loading || user === undefined) return <p className="py-24 text-center text-ink-soft">Loading…</p>;
  if (!invite)
    return (
      <Card className="mx-auto max-w-md p-10 text-center">
        <h1 className="font-display text-3xl font-semibold">This link isn't working</h1>
        <p className="mt-2 text-ink-soft">{error ?? "Ask for a fresh link."}</p>
      </Card>
    );
  const from = invite.from.name;
  const first = from.split(" ")[0];
  const adults = (people ?? []).filter((p) => p.kind === "adult");
  const chosenCard = backCard ?? likelyCardFor(adults, from)?.id ?? "new";
  const offer = invite.shareBack;

  const connect = async () => {
    setState("busy");
    setFailure(null);
    try {
      const res = await connectProfile(invite.id, shares, undefined, offer && addBack ? { profileId: chosenCard === "new" ? undefined : chosenCard } : undefined);
      setAddedBack(!!res.backProfileId);
      setState("done");
    } catch (e) {
      setFailure(e instanceof Error ? e.message : "Couldn't connect");
      setState("idle");
    }
  };

  return (
    <div className="mx-auto max-w-lg px-5 pb-24">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-7 shadow-lift md:p-9">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-blush">
          <Link2 className="h-7 w-7" />
        </span>
        {state === "done" ? (
          <>
            <h1 className="mt-4 font-display text-3xl font-semibold">You're connected</h1>
            <p className="mt-2 text-ink-soft">
              {first} now sees your {describeShares(shares)}, and it updates whenever you change your profile.
              {addedBack && ` ${first} is in your locker too, and stays up to date the same way.`}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button href="/locker" variant={addedBack ? "primary" : "soft"}>
                Open my locker
              </Button>
              <Button href="/locker/sharing" variant={addedBack ? "soft" : "primary"}>
                Who can see my profile
              </Button>
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">{from} wants to keep your gift info up to date</h1>
            <p className="mt-2 text-ink-soft">
              Connect your My Gift Lockers profile and {first}'s locker updates whenever you change your sizes or wishes. No more asking again.
            </p>

            {user === null ? (
              <div className="mt-6">
                <Button href={`/sign-in?next=${encodeURIComponent(here)}`} className="w-full">
                  Sign in or create a free account
                </Button>
              </div>
            ) : loadingSelf ? (
              <p className="mt-6 text-ink-soft">Loading your profile…</p>
            ) : !self ? (
              <div className="mt-6 rounded-2xl bg-white/75 p-5">
                <p className="font-bold">First, fill in your profile</p>
                <p className="mt-1 text-sm text-ink-soft">Your sizes, favorites and wishes. It takes a couple of minutes, and you come right back here.</p>
                <Button href={`/locker/me?next=${encodeURIComponent(here)}`} className="mt-4">
                  Create my profile
                </Button>
              </div>
            ) : (
              <>
                <p className="mt-6 text-sm text-ink-soft">
                  Your profile: <b className="text-ink">{self.name}</b>
                  {summarizeSizes(self.sizes) && ` · ${summarizeSizes(self.sizes)}`} ·{" "}
                  <a href={`/locker/me?next=${encodeURIComponent(here)}`} className="font-bold text-plum underline">
                    edit
                  </a>
                </p>
                <p className="mt-5 mb-2 text-sm font-bold text-ink-soft">What {first} can see</p>
                <ShareToggles value={shares} onChange={setShares} />
                {offer && (
                  <div className="mt-5 rounded-2xl bg-white/80 p-4 shadow-soft">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input type="checkbox" checked={addBack} onChange={(e) => setAddBack(e.target.checked)} className="mt-1 h-4 w-4 accent-plum" />
                      <span>
                        <b className="block">Add {first} to my locker too</b>
                        <span className="text-sm text-ink-soft">
                          {first} shares their {describeShares(offer)} with you, kept up to date when they change it.
                        </span>
                      </span>
                    </label>
                    {addBack && adults.length > 0 && (
                      <label className="mt-3 block text-sm">
                        <span className="font-bold text-ink-soft">Already have a card for {first}?</span>
                        <select value={chosenCard} onChange={(e) => setBackCard(e.target.value)} className="mt-1 w-full rounded-xl bg-cream px-3 py-2 ring-1 ring-lavender/60">
                          <option value="new">No, add a new card</option>
                          {adults.map((p) => (
                            <option key={p.id} value={p.id}>
                              Use my card for {p.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                )}
                {failure && <p className="mt-3 text-sm font-bold text-rose-deep">{failure}</p>}
                <Button onClick={connect} disabled={state === "busy" || !Object.values(shares).some(Boolean)} className="mt-6 w-full">
                  <Check className="h-4 w-4" /> {state === "busy" ? "Connecting…" : `Connect with ${first}`}
                </Button>
                <p className="mt-3 text-center text-xs text-ink-soft">You can change this or disconnect anytime.</p>
              </>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
