"use client";

import { pastelFor, type Person } from "@mgl/core";
import { Baby, UserRound } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui";
import { authMode, useUser } from "@/lib/auth";
import { addLockerPerson } from "@/lib/invites";
import { JoinFlow, editInvite } from "../../join/[token]/JoinFlow";

/**
 * Add someone to your locker by hand (/locker/add): choose adult or child, then answer the same
 * questions as editing a card. Nothing is sent to them; you can invite them later to fill in the rest.
 */
export function AddPerson() {
  const t = useTranslations("addPerson");
  const tl = useTranslations("locker");
  const user = useUser();
  const preset = useSearchParams().get("kind");
  const [kind, setKind] = useState<Person["kind"] | null>(preset === "child" || preset === "adult" ? preset : null);

  if (authMode === "amplify" && user === null)
    return (
      <main className="pastel-wash grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <h1 className="font-display text-4xl font-semibold">{t("title")}</h1>
          <div className="mt-6">
            <Button href="/sign-in?next=/locker/add">{tl("signIn")}</Button>
          </div>
        </div>
      </main>
    );

  if (!kind)
    return (
      <main className="pastel-wash min-h-dvh">
        <SiteHeader />
        <div className="mx-auto max-w-xl px-5 pt-6 pb-24">
          <h1 className="font-display text-4xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-2 text-ink-soft">{t("lede")}</p>
          <a href="/invite" className="mt-3 inline-flex text-sm font-bold text-plum underline">
            {t("orInvite")}
          </a>
          <p className="mt-8 mb-3 text-sm font-bold text-ink-soft">{t("who")}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["adult", UserRound, "bg-blush", t("adult"), t("adultBody")],
                ["child", Baby, "bg-mint", t("child"), t("childBody")],
              ] as const
            ).map(([k, Icon, tint, label, body]) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className="glass flex items-start gap-4 rounded-[24px] p-5 text-left shadow-soft transition hover:-translate-y-0.5 hover:bg-white/80"
              >
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${tint}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-display text-lg font-semibold">{label}</span>
                  <span className="block text-sm text-ink-soft">{body}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>
    );

  return (
    <JoinFlow
      invite={editInvite(kind)}
      self={{
        initial: kind === "child" ? { id: "new", name: "", kind, color: "#CDEFE3", sizes: { fit: "kids" }, updatedAt: "" } : null,
        adding: { title: t("welcome"), save: t("save") },
        onSave: async (p) => {
          const id = await addLockerPerson(user?.sub, { ...p, kind, color: pastelFor(p.name), guardians: kind === "child" ? [user?.sub ?? "me"] : undefined });
          return `/locker?open=${encodeURIComponent(id)}`;
        },
        doneHref: "/locker",
      }}
    />
  );
}
