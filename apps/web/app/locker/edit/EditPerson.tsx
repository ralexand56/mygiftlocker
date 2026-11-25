"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Button } from "@/components/ui";
import { authMode, useUser } from "@/lib/auth";
import { useAsync } from "@/lib/exchanges";
import { listLockerPeople, updateLockerPerson } from "@/lib/invites";
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
  if (!people || (authMode === "amplify" && (user === undefined || loading)))
    return (
      <Screen>
        <p className="text-ink-soft">{t("loading")}</p>
      </Screen>
    );

  const person = people.find((p) => p.id === id);
  const first = person?.name.split(" ")[0] ?? "";
  // A live connection overwrites these fields from the person's own profile.
  const live = !!person?.linked && !person.linked.ended;
  if (!person || live)
    return (
      <Screen>
        <p className="text-lg">{person ? t("live", { name: first }) : t("notFound")}</p>
        <div className="mt-6">
          <Button href="/locker">{t("back")}</Button>
        </div>
      </Screen>
    );

  return (
    <JoinFlow
      invite={editInvite(person.kind)}
      self={{
        initial: person,
        about: first,
        doneHref: `/locker?open=${encodeURIComponent(person.id)}`,
        onSave: (p) =>
          updateLockerPerson(person.id, {
            name: p.name,
            relationship: p.relationship,
            sizes: p.sizes,
            address: p.address,
            birthday: p.birthday,
            anniversary: p.anniversary,
            favorites: p.favorites,
            payments: person.kind === "adult" ? p.payments : person.payments,
          }),
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
