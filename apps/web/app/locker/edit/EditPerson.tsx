"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Button } from "@/components/ui";
import { authMode, useUser } from "@/lib/auth";
import { useAsync } from "@/lib/exchanges";
import { listLockerPeople, updateLockerPerson, type EditableFields } from "@/lib/invites";
import { cardShares } from "@/lib/connections";
import type { ConnectionShares } from "@mgl/core";
import { useDB, useHydrated } from "@/lib/store";
import { JoinFlow, editInvite } from "../../join/[token]/JoinFlow";

/** The invite questions, answered by the locker owner about someone on their card (/locker/edit?id=…). */
export function EditPerson() {
  const id = useSearchParams().get("id");
  const user = useUser();
  const t = useTranslations("editPerson");
  const tl = useTranslations("locker");
  const hydrated = useHydrated();
  const localPeople = useDB((db) => db.people);
  const { data: remotePeople, loading } = useAsync(async () => (authMode === "amplify" && user ? listLockerPeople() : null), [user?.sub]);
  // On a linked card, the sections the person shares come from their profile; the rest is editable.
  const linkId = remotePeople?.find((p) => p.id === id && p.linked && !p.linked.ended)?.linked?.connectionId;
  const { data: shared, loading: loadingShares } = useAsync(
    async (): Promise<ConnectionShares | null> => (linkId ? cardShares(linkId).catch(() => ALL_SHARED) : null),
    [linkId],
  );

  if (authMode === "amplify" && user === null)
    return (
      <Screen>
        <h1 className="font-display text-4xl font-semibold">{tl("signedOutTitle")}</h1>
        <div className="mt-6">
          <Button href={`/sign-in?next=${encodeURIComponent(`/locker/edit?id=${id ?? ""}`)}`}>{tl("signIn")}</Button>
        </div>
      </Screen>
    );
  const people = authMode === "amplify" ? remotePeople : hydrated ? localPeople : undefined;
  if (!people || (authMode === "amplify" && (user === undefined || loading || loadingShares)))
    return (
      <Screen>
        <p className="text-ink-soft">{t("loading")}</p>
      </Screen>
    );

  const person = people.find((p) => p.id === id);
  const first = person?.name.split(" ")[0] ?? "";
  const live = !!person?.linked && !person.linked.ended;
  if (!person || (live && !shared))
    return (
      <Screen>
        <p className="text-lg">{t("notFound")}</p>
        <div className="mt-6">
          <Button href="/locker">{t("back")}</Button>
        </div>
      </Screen>
    );

  return (
    <JoinFlow
      invite={editInvite(person.kind, live ? shared! : undefined)}
      self={{
        initial: person,
        about: first,
        notice: live ? t("live", { name: first }) : undefined,
        doneHref: `/locker?open=${encodeURIComponent(person.id)}`,
        onSave: (p) => {
          const skip = live ? shared! : NONE_SHARED;
          const f: EditableFields = { name: p.name, relationship: p.relationship };
          if (!skip.sizes) f.sizes = p.sizes;
          if (!skip.address) f.address = p.address;
          if (!skip.dates) Object.assign(f, { birthday: p.birthday, anniversary: p.anniversary });
          if (!skip.favorites) f.favorites = p.favorites;
          if (!skip.payments && person.kind === "adult") f.payments = p.payments;
          return updateLockerPerson(person.id, f);
        },
      }}
    />
  );
}

function Screen({ children }: { children: ReactNode }) {
  return (
    <main className="pastel-wash grid min-h-dvh place-items-center p-6 text-center">
      <div className="max-w-md">{children}</div>
    </main>
  );
}

const ALL_SHARED: ConnectionShares = { sizes: true, favorites: true, dates: true, address: true, payments: true };
const NONE_SHARED: ConnectionShares = { sizes: false, favorites: false, dates: false, address: false, payments: false };
