"use client";

import { formatBudget, pastelFor, sharedFromPerson, sizeValueLabel, summarizeSizes, type MyExchangeView, type SharedProfile, type WishItem } from "@mgl/core";
import { AnimatePresence, motion } from "motion/react";
import { ExternalLink, Ruler } from "lucide-react";
import { useState } from "react";
import { Avatar, Button, Card, Input } from "@/components/ui";
import { SiteHeader } from "@/components/SiteHeader";
import { getMyExchange, saveShared, saveWishlist, useAsync } from "@/lib/exchanges";
import { useUser } from "@/lib/auth";
import { getSelfProfile } from "@/lib/self";
import { WishlistLinkList } from "@/app/locker/Locker";
import { useTranslations } from "next-intl";
import { useIntlTag, useTr } from "@/lib/i18n";

export function MyExchange({ id, token }: { id: string; token: string }) {
  const { data: view, error, loading, reload } = useAsync(() => getMyExchange(id, token), [id, token]);
  const t = useTranslations("myExchange");
  return (
    <main className="pastel-wash min-h-dvh">
      <SiteHeader />
      {loading && !view ? (
        <p className="py-20 text-center text-ink-soft">{t("loading")}</p>
      ) : !view ? (
        <Card className="mx-auto max-w-md p-10 text-center">
          <h1 className="font-display text-3xl font-semibold">{t("notRecognized")}</h1>
          <p className="mt-2 text-ink-soft">{error ?? t("askOrganizer")}</p>
        </Card>
      ) : (
        <View view={view} token={token} onSaved={reload} />
      )}
    </main>
  );
}

function View({ view, token, onSaved }: { view: MyExchangeView; token: string; onSaved: () => void }) {
  const { exchange: ex, me, match } = view;
  const t = useTranslations("myExchange");
  const tr = useTr();
  const tag = useIntlTag();
  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-5 pb-24 md:grid-cols-2">
      <div>
        <p className="text-sm font-extrabold tracking-wide text-rose uppercase">{ex.name}</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight">{t("hi", { name: me.name.split(" ")[0]! })}</h1>
        <p className="mt-1 text-ink-soft">
          {[ex.budget && t("budget", { v: formatBudget(ex.budget, tr)! }), ex.date && new Date(ex.date + "T00:00").toLocaleDateString(tag, { month: "long", day: "numeric" })].filter(Boolean).join(" · ")}
        </p>
        <div className="mt-6">{match ? <Reveal match={match} /> : <Waiting />}</div>
        <p className="mt-4 text-xs text-ink-soft">{t("bookmark")}</p>
      </div>
      <div className="grid content-start gap-6">
        <WishlistEditor exchangeId={ex.id} wishCount={ex.wishCount} wishlist={me.wishlist} token={token} onSaved={onSaved} />
        <ShareCard exchangeId={ex.id} token={token} shared={me.shared} onSaved={onSaved} />
      </div>
    </div>
  );
}

function Waiting() {
  const t = useTranslations("myExchange");
  return (
    <Card className="p-8 text-center">
      <motion.div className="mx-auto mb-4 w-fit text-6xl" animate={{ rotate: [-6, 6, -6] }} transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}>
        🎁
      </motion.div>
      <h2 className="font-display text-2xl font-semibold">{t("waitingTitle")}</h2>
      <p className="mt-1 text-ink-soft">{t("waitingBody")}</p>
    </Card>
  );
}

function Reveal({ match }: { match: MyExchangeView["match"] & {} }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("myExchange");
  return (
    <Card className="relative overflow-hidden p-8 text-center">
      <AnimatePresence mode="wait">
        {!open ? (
          <motion.button key="box" onClick={() => setOpen(true)} className="mx-auto block" exit={{ scale: 1.15, opacity: 0, transition: { duration: 0.35 } }} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}>
            <motion.svg viewBox="0 0 120 120" className="mx-auto h-44 w-44" animate={{ rotate: [0, -4, 4, -2, 0] }} transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}>
              <rect x="18" y="52" width="84" height="56" rx="8" fill="#FBD3E3" />
              <rect x="12" y="38" width="96" height="18" rx="6" fill="#F7B9CF" />
              <rect x="53" y="38" width="14" height="70" fill="#E9779F" />
              <path d="M60 38 C 50 20, 30 20, 34 32 C 37 40, 52 40, 60 38 C 68 40, 83 40, 86 32 C 90 20, 70 20, 60 38 Z" fill="#E9779F" />
            </motion.svg>
            <p className="mt-3 font-display text-2xl font-semibold">{t("tap")}</p>
          </motion.button>
        ) : (
          <motion.div key="match" initial={{ y: 40, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 160, damping: 14 }}>
            <p className="text-sm font-extrabold tracking-wide text-rose uppercase">{t("gifting")}</p>
            <div className="mt-4 flex flex-col items-center gap-3">
              <motion.div initial={{ rotate: -20, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", delay: 0.15 }}>
                <Avatar name={match.name} color={pastelFor(match.name)} size={96} />
              </motion.div>
              <h2 className="font-display text-4xl font-semibold">{match.name}</h2>
            </div>
            <div className="mt-6 grid gap-2 text-left">
              {match.wishlist.length ? (
                match.wishlist.map((w, i) => (
                  <motion.div key={w.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.08 }} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-soft">
                    <span className="font-display text-xl font-semibold text-rose">{w.rank}</span>
                    <span className="flex-1 font-bold">{w.title}</span>
                    {w.url && (
                      <a href={w.url} target="_blank" rel="noreferrer noopener" className="rounded-full p-2 text-ink-soft hover:bg-blush" aria-label={t("openLink", { title: w.title })}>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </motion.div>
                ))
              ) : (
                <p className="text-center text-ink-soft">{t("noWishes")}</p>
              )}
            </div>
            {match.shared && <SharedDetails name={match.name} shared={match.shared} />}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function WishlistEditor({ exchangeId, wishCount, wishlist, token, onSaved }: { exchangeId: string; wishCount: number; wishlist: WishItem[]; token: string; onSaved: () => void }) {
  const [items, setItems] = useState(() => Array.from({ length: wishCount }, (_, i) => ({ title: wishlist[i]?.title ?? "", url: wishlist[i]?.url ?? "" })));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("myExchange");
  const save = async () => {
    setError(null);
    try {
      await saveWishlist(
        exchangeId,
        token,
        items.filter((w) => w.title.trim()).map((w) => ({ title: w.title.trim(), url: w.url.trim() || undefined })),
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("saveFailed"));
    }
  };
  return (
    <Card className="p-7">
      <h2 className="font-display text-2xl font-semibold">{t("myTop", { n: wishCount })}</h2>
      <p className="mt-1 text-sm text-ink-soft">{t("ranked")}</p>
      <div className="mt-5 grid gap-3">
        {items.map((w, i) => (
          <div key={i} className="flex gap-2">
            <span className="grid h-12 w-8 shrink-0 place-items-center font-display text-xl font-semibold text-rose">{i + 1}</span>
            <div className="grid flex-1 gap-1.5">
              <Input value={w.title} placeholder={t("wishPlaceholder")} onChange={(e) => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
              <Input value={w.url} placeholder={t("linkPlaceholder")} className="py-2! text-sm!" onChange={(e) => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
            </div>
          </div>
        ))}
      </div>
      {error && <p className="mt-3 text-sm font-bold text-rose-deep">{error}</p>}
      <Button className="mt-5 w-full" onClick={save}>
        {saved ? t("saved") : t("saveWishes")}
      </Button>
    </Card>
  );
}

/** Sizes and favorites the match chose to share. */
function SharedDetails({ name, shared }: { name: string; shared: SharedProfile }) {
  const t = useTranslations("myExchange");
  const ts = useTranslations("locker.detail.size");
  const tc = useTranslations("colors");
  const tr = useTr();
  const s = shared.sizes ?? {};
  const f = shared.favorites ?? {};
  const v = (x: string | undefined) => (x ? sizeValueLabel(x, tr) : undefined);
  const rows: [string, string | undefined][] = [
    [ts("section"), s.fit ? tr(`core.fit.${s.fit}`) : undefined],
    [ts("top"), v(s.top)],
    [ts("pants"), s.waist ? `${s.waist} × ${s.inseam ?? "?"}` : v(s.womensNumeric ?? s.bottomAlpha)],
    [ts("dress"), v(s.dress)],
    [ts("outerwear"), v(s.outerwear)],
    [t("shoeUs"), s.shoe ? `${s.shoe}${s.shoeWidth && s.shoeWidth !== "Regular" ? ` ${tr(`core.shoeWidth.${s.shoeWidth}`)}` : ""}` : undefined],
    [ts("foot"), s.footLengthCm ? `${s.footLengthCm} cm` : undefined],
    [ts("ring"), s.ring?.toString()],
    [ts("hat"), v(s.hat)],
  ];
  const shown = rows.filter(([, v]) => v);
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-6 text-left">
      <p className="mb-2 flex items-center gap-2 text-sm font-extrabold tracking-wide text-ink-soft uppercase">
        <Ruler className="h-4 w-4" /> {t("shared", { name: name.split(" ")[0]! })}
      </p>
      {shown.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {shown.map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-white p-3 shadow-soft">
              <p className="text-xs font-bold text-ink-soft">{k}</p>
              <p className="font-display text-lg font-semibold">{v}</p>
            </div>
          ))}
        </div>
      )}
      {!!f.wishlists?.length && <WishlistLinkList links={f.wishlists} />}
      {(f.likes || f.teams || f.colors?.length || f.avoid) && (
        <div className="mt-2 rounded-2xl bg-white p-4 shadow-soft">
          {f.likes && <p>{t("lovesColon", { v: f.likes })}</p>}
          {f.teams && <p className="mt-1 text-sm">🏟️ {t("teams", { v: f.teams })}</p>}
          {!!f.colors?.length && <p className="mt-1 text-sm text-ink-soft">{t("colors", { v: f.colors.map((c) => tc(c as "blush")).join(", ") })}</p>}
          {f.avoid && <p className="mt-1 text-sm text-rose-deep">{t("avoid", { v: f.avoid })}</p>}
        </div>
      )}
    </motion.div>
  );
}

/** Share your own sizes with your Santa (signed in), update them, or stop sharing. */
function ShareCard({ exchangeId, token, shared, onSaved }: { exchangeId: string; token: string; shared?: SharedProfile; onSaved: () => void }) {
  const user = useUser();
  const t = useTranslations("myExchange.share");
  const tr = useTr();
  const { data: self } = useAsync(async () => (user ? getSelfProfile(user.sub) : null), [user?.sub]);
  const fromProfile = self ? sharedFromPerson(self) : undefined;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (value: SharedProfile | null) => {
    setBusy(true);
    setError(null);
    try {
      await saveShared(exchangeId, token, value);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("saveFailed"));
    } finally {
      setBusy(false);
    }
  };
  if (!shared && user === null)
    return (
      <Card className="p-6">
        <h2 className="font-display text-xl font-semibold">{t("helpTitle")}</h2>
        <p className="mt-1 text-sm text-ink-soft">
          {t.rich("signedOut", {
            link: (c) => (
              <a href={`/sign-in?next=${encodeURIComponent(`/exchange/${exchangeId}/me/${token}`)}`} className="font-bold text-plum underline">
                {c}
              </a>
            ),
          })}
        </p>
      </Card>
    );
  if (!shared && !fromProfile) {
    if (!user) return null;
    return (
      <Card className="p-6">
        <h2 className="font-display text-xl font-semibold">{t("helpTitle")}</h2>
        <p className="mt-1 text-sm text-ink-soft">{t("noProfile")}</p>
        <Button href="/locker/me" variant="soft" className="mt-4">
          {t("addSizes")}
        </Button>
      </Card>
    );
  }
  return (
    <Card className="p-6">
      <h2 className="font-display text-xl font-semibold">{shared ? t("sharedTitle") : t("askTitle")}</h2>
      <p className="mt-1 text-sm text-ink-soft">
        {[shared?.sizes && summarizeSizes(shared.sizes, tr), shared?.favorites?.likes && t("loves", { v: shared.favorites.likes })].filter(Boolean).join(" · ") ||
          (shared ? t("yourFavorites") : t("fromProfile"))}
      </p>
      {error && <p className="mt-2 text-sm font-bold text-rose-deep">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {fromProfile && (
          <Button onClick={() => run(fromProfile)} disabled={busy} variant={shared ? "soft" : undefined}>
            {shared ? t("update") : t("shareThem")}
          </Button>
        )}
        {shared && (
          <Button variant="ghost" onClick={() => run(null)} disabled={busy}>
            {t("stop")}
          </Button>
        )}
      </div>
    </Card>
  );
}
