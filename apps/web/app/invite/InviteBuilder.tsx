"use client";

import { DEFAULT_ASK, LOCALES, LOCALE_NAMES, createTr, inviteShareLinks, newId, withInviteLang, type InvitePayload, type InviteSection, type Locale } from "@mgl/core";
import { CORE_CATALOGS } from "@mgl/core/catalogs";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, Mail, MessageCircle, MessageSquareText, QrCode, Share2, Send, UserPlus } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { Button, Card, Field, Input, Textarea, inputCls } from "@/components/ui";
import { useRouter } from "next/navigation";
import { authMode, useUser } from "@/lib/auth";
import { createInvite } from "@/lib/invites";
import { useTranslations } from "next-intl";
import { useTr } from "@/lib/i18n";

const SECTIONS: InviteSection[] = ["sizes", "address", "dates", "favorites", "payments", "kids"];

export function InviteBuilder() {
  const me = useUser();
  const router = useRouter();
  const t = useTranslations("inviteBuilder");
  const ta = useTranslations("addPerson");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [note, setNote] = useState("");
  /** "" = automatic: the page follows their own device or choice. */
  const [lang, setLang] = useState<Locale | "">("");
  const [ask, setAsk] = useState<InvitePayload["ask"]>(DEFAULT_ASK);
  const [url, setUrl] = useState<string | null>(null);
  const theirName = useRef<HTMLInputElement>(null);
  /** Start a new invite for someone else: their own link, greeting and note. */
  const another = () => {
    setUrl(null);
    setTo("");
    setNote("");
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => theirName.current?.focus({ preventScroll: true }), 350);
  };

  useEffect(() => {
    if (me?.name && !from) setFrom(me.name);
  }, [me, from]);

  const create = async () => {
    // With the backend, invites belong to an account so answers land in *your* locker.
    if (authMode === "amplify" && !me) return router.push("/sign-in?next=/invite");
    const payload: InvitePayload = {
      v: 1,
      id: newId("inv_"),
      from: { name: from.trim() },
      to: to.trim() ? { name: to.trim() } : undefined,
      ask,
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    setBusy(true);
    setError(null);
    try {
      const segment = await createInvite(payload, me?.sub);
      setUrl(`${window.location.origin}/join/${segment}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-5 pb-24 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <Card className="p-7 md:p-9">
        <h1 className="font-display text-4xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-ink-soft">{t("lede")}</p>
        <a href="/locker/add" className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-plum underline">
          <UserPlus className="h-4 w-4" /> {ta("orAdd")}
        </a>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <Field label={t("yourName")}>
            <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder={t("yourNamePlaceholder")} />
          </Field>
          <Field label={t("theirName")}>
            <Input ref={theirName} value={to} onChange={(e) => setTo(e.target.value)} placeholder={t("theirNamePlaceholder")} />
          </Field>
          <div className="sm:col-span-2">
            <Field label={t("theirLanguage")} hint={t("languageHint")}>
              <select value={lang} onChange={(e) => setLang(e.target.value as Locale | "")} className={inputCls}>
                <option value="">{t("automatic")}</option>
                {LOCALES.map((l) => (
                  <option key={l} value={l} lang={l}>
                    {LOCALE_NAMES[l]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <p className="mt-8 mb-3 text-sm font-bold text-ink-soft">{t("askFor")}</p>
        <div className="grid gap-2">
          {SECTIONS.map((id) => {
            const on = ask[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => setAsk((a) => ({ ...a, [id]: !a[id] }))}
                className={`flex items-center gap-4 rounded-2xl px-4 py-3 text-left transition-colors ${on ? "bg-white shadow-soft" : "bg-white/40 hover:bg-white/70"}`}
                aria-pressed={on}
              >
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full transition-colors ${on ? "bg-rose text-white" : "bg-white text-transparent ring-2 ring-lavender"}`}>
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
                <span>
                  <span className="block font-bold">{t(`sections.${id}.label`)}</span>
                  <span className="block text-sm text-ink-soft">{t(`sections.${id}.desc`)}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          <Field label={t("note")}>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("notePlaceholder")} />
          </Field>
        </div>

        <div className="mt-8">
          {error && <p className="mb-3 text-sm font-bold text-rose-deep">{error}</p>}
          <Button onClick={create} disabled={busy || !from.trim() || !Object.values(ask).some(Boolean)}>
            <Send className="h-4 w-4" /> {busy ? t("creating") : authMode === "amplify" && me === null ? t("signInCreate") : t("create")}
          </Button>
        </div>
      </Card>

      <AnimatePresence mode="wait">
        {url ? (
          <motion.div key="share" className="min-w-0" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 120, damping: 18 }}>
            <SharePanel url={withInviteLang(url, lang)} lang={lang || undefined} from={from} to={to} onAnother={another} />
          </motion.div>
        ) : (
          <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="grid h-full min-h-72 place-items-center p-8 text-center text-ink-soft">
              <div>
                <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-blush">
                  <Share2 className="h-7 w-7 text-rose" />
                </div>
                {t("hint")}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SharePanel({ url, lang, from, to, onAnother }: { url: string; lang?: Locale; from: string; to: string; onAnother: () => void }) {
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState<string>("");
  const [canShare, setCanShare] = useState(false);
  const t = useTranslations("inviteBuilder");
  const mine = useTr();
  // The message goes out in their language when one is chosen.
  const tr = lang ? createTr(lang, CORE_CATALOGS[lang]) : mine;
  const links = inviteShareLinks(url, from, to || undefined, tr);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && "share" in navigator);
    QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#4A3B66", light: "#FFFFFF00" } }).then(setQr);
  }, [url]);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const channels = [
    { label: t("textMessage"), href: links.sms, icon: MessageSquareText, tint: "bg-mint" },
    { label: t("email"), href: links.email, icon: Mail, tint: "bg-blush" },
    { label: "WhatsApp", href: links.whatsapp, icon: MessageCircle, tint: "bg-butter" },
    { label: "Messenger", href: links.messenger, icon: Send, tint: "bg-sky" },
  ];

  return (
    <Card className="p-7 md:p-9">
      <h2 className="font-display text-2xl font-semibold">{t("sendTitle")}</h2>
      <div className="mt-5 flex items-center gap-2 rounded-2xl bg-white/80 p-2 pl-4 shadow-soft">
        <span className="truncate text-sm text-ink-soft">{url}</span>
        <button onClick={copy} className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-ink px-3 py-2 text-sm font-bold text-white">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? t("copied") : t("copy")}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {channels.map((c, i) => (
          <motion.a
            key={c.label}
            href={c.href}
            target={c.href.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            whileHover={{ y: -3 }}
            className="flex items-center gap-3 rounded-2xl bg-white/80 p-3 font-bold shadow-soft"
          >
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${c.tint}`}>
              <c.icon className="h-5 w-5" />
            </span>
            {c.label}
          </motion.a>
        ))}
      </div>

      {canShare && (
        <Button variant="soft" className="mt-3 w-full" onClick={() => navigator.share({ title: "My Gift Lockers", text: lang ? tr("core.share.inviteSubject", { from }) : t("shareText", { name: from }), url }).catch(() => {})}>
          <Share2 className="h-4 w-4" /> {t("more")}
        </Button>
      )}

      <div className="mt-6 flex items-center gap-5 rounded-2xl bg-white/60 p-4">
        <div className="h-28 w-28 shrink-0 rounded-xl bg-white p-2" dangerouslySetInnerHTML={{ __html: qr }} />
        <div className="text-sm text-ink-soft">
          <p className="flex items-center gap-1.5 font-bold text-ink">
            <QrCode className="h-4 w-4" /> {t("inPerson")}
          </p>
          {t("inPersonBody")}
        </div>
      </div>

      <div className="mt-6 border-t border-white pt-5 text-center">
        <Button variant="soft" onClick={onAnother}>
          <UserPlus className="h-4 w-4" /> {t("another")}
        </Button>
        <p className="mt-2 text-xs text-ink-soft">{t("anotherHint")}</p>
      </div>
    </Card>
  );
}
