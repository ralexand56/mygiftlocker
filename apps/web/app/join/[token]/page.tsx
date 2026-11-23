import { decodeInvite } from "@mgl/core";
import type { Metadata } from "next";
import { Button } from "@/components/ui";
import { JoinFlow } from "./JoinFlow";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const invite = decodeInvite((await params).token);
  return { title: invite ? `${invite.from.name} invited you` : "Invite" };
}

export default async function JoinPage({ params }: Props) {
  const invite = decodeInvite((await params).token);
  if (!invite) {
    return (
      <main className="pastel-wash grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <h1 className="font-display text-4xl font-semibold">This invite link looks broken</h1>
          <p className="mt-2 text-ink-soft">Ask the sender for a fresh link.</p>
          <div className="mt-6">
            <Button href="/">Go home</Button>
          </div>
        </div>
      </main>
    );
  }
  return <JoinFlow invite={invite} />;
}
