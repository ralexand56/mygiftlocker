"use client";

import { DEFAULT_ASK, inviteShareLinks, newId, type InvitePayload, type InviteSection } from "@mgl/core";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, Mail, MessageCircle, MessageSquareText, QrCode, Share2, Send } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Button, Card, Field, Input, Textarea } from "@/components/ui";
import { useRouter } from "next/navigation";
import { authMode, useUser } from "@/lib/auth";
import { createInvite } from "@/lib/invites";

const SECTIONS: { id: InviteSection; label: string; desc: string }[] = [
  { id: "sizes", label: "Clothing & shoe sizes", desc: "Tops, bottoms, dresses, outerwear, shoes, rings" },
  { id: "address", label: "Shipping address", desc: "So gifts can go straight to them" },
  { id: "dates", label: "Birthday & anniversary", desc: "Year optional" },
  { id: "favorites", label: "Favorite things", desc: "Colors, hobbies, things to avoid" },
  { id: "kids", label: "Their kids' sizes", desc: "Great for parents of little ones" },
];

export function InviteBuilder() {
  const me = useUser();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [note, setNote] = useState("");
  const [ask, setAsk] = useState<InvitePayload["ask"]>(DEFAULT_ASK);
  const [url, setUrl] = useState<string | null>(null);

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
      setError(e instanceof Error ? e.message : "Couldn't create the invite");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-5 pb-24 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <Card className="p-7 md:p-9">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Invite someone</h1>
        <p className="mt-2 text-ink-soft">They'll fill in a quick, playful form — and their details land in your locker.</p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <Field label="Your name">
            <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Alex" />
          </Field>
          <Field label="Their name (optional)">
            <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Jordan" />
          </Field>
        </div>

        <p className="mt-8 mb-3 text-sm font-bold text-ink-soft">What should we ask for?</p>
        <div className="grid gap-2">
          {SECTIONS.map((s) => {
            const on = ask[s.id];
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setAsk((a) => ({ ...a, [s.id]: !a[s.id] }))}
                className={`flex items-center gap-4 rounded-2xl px-4 py-3 text-left transition-colors ${on ? "bg-white shadow-soft" : "bg-white/40 hover:bg-white/70"}`}
                aria-pressed={on}
              >
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full transition-colors ${on ? "bg-rose text-white" : "bg-white text-transparent ring-2 ring-lavender"}`}>
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
                <span>
                  <span className="block font-bold">{s.label}</span>
                  <span className="block text-sm text-ink-soft">{s.desc}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          <Field label="Personal note (optional)">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Holiday shopping is coming — help me get it right this year! 💝" />
          </Field>
        </div>

        <div className="mt-8">
          {error && <p className="mb-3 text-sm font-bold text-rose-deep">{error}</p>}
          <Button onClick={create} disabled={busy || !from.trim() || !Object.values(ask).some(Boolean)}>
            <Send className="h-4 w-4" /> {busy ? "Creating…" : authMode === "amplify" && me === null ? "Sign in & create invite" : "Create invite"}
          </Button>
        </div>
      </Card>

      <AnimatePresence mode="wait">
        {url ? (
          <motion.div key="share" className="min-w-0" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 120, damping: 18 }}>
            <SharePanel url={url} from={from} to={to} />
          </motion.div>
        ) : (
          <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="grid h-full min-h-72 place-items-center p-8 text-center text-ink-soft">
              <div>
                <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-blush">
                  <Share2 className="h-7 w-7 text-rose" />
                </div>
                Your invite link and sharing options will appear here.
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SharePanel({ url, from, to }: { url: string; from: string; to: string }) {
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState<string>("");
  const [canShare, setCanShare] = useState(false);
  const links = inviteShareLinks(url, from, to || undefined);

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
    { label: "Text message", href: links.sms, icon: MessageSquareText, tint: "bg-mint" },
    { label: "Email", href: links.email, icon: Mail, tint: "bg-blush" },
    { label: "WhatsApp", href: links.whatsapp, icon: MessageCircle, tint: "bg-butter" },
    { label: "Messenger", href: links.messenger, icon: Send, tint: "bg-sky" },
  ];

  return (
    <Card className="p-7 md:p-9">
      <h2 className="font-display text-2xl font-semibold">Send it your way</h2>
      <div className="mt-5 flex items-center gap-2 rounded-2xl bg-white/80 p-2 pl-4 shadow-soft">
        <span className="truncate text-sm text-ink-soft">{url}</span>
        <button onClick={copy} className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-ink px-3 py-2 text-sm font-bold text-white">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy"}
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
        <Button variant="soft" className="mt-3 w-full" onClick={() => navigator.share({ title: "My Gift Locker", text: `${from} invited you to My Gift Locker`, url }).catch(() => {})}>
          <Share2 className="h-4 w-4" /> More options…
        </Button>
      )}

      <div className="mt-6 flex items-center gap-5 rounded-2xl bg-white/60 p-4">
        <div className="h-28 w-28 shrink-0 rounded-xl bg-white p-2" dangerouslySetInnerHTML={{ __html: qr }} />
        <div className="text-sm text-ink-soft">
          <p className="flex items-center gap-1.5 font-bold text-ink">
            <QrCode className="h-4 w-4" /> In person?
          </p>
          Let them scan this at the dinner table, office party or school pickup.
        </div>
      </div>
    </Card>
  );
}
