import type { ReactNode } from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Browser, Caption, Mark, Phone, Rise, type ScreenProps, Tap, Wordmark, useEnter, useExit, useVertical } from "./parts";
import { useCopy } from "./copy";
import { C, brandGradient, display, sans, shadowSoft } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ---------- 1. Hook: the yearly "what size are you?" text ---------- */

const CHAT_TIMING = [
  { me: true, at: 6 },
  { me: false, at: 42 },
  { me: false, at: 64 },
];

function Bubble({ text, me, at }: { text: string; me: boolean; at: number }) {
  const v = useVertical();
  const p = useEnter(at, 14);
  return (
    <div style={{ display: "flex", justifyContent: me ? "flex-end" : "flex-start" }}>
      <div
        style={{
          opacity: Math.min(1, p * 2),
          scale: String(0.6 + 0.4 * p),
          transformOrigin: me ? "100% 100%" : "0% 100%",
          fontFamily: sans,
          fontWeight: 700,
          fontSize: v ? 50 : 46,
          padding: v ? "26px 38px" : "24px 36px",
          borderRadius: 48,
          [me ? "borderBottomRightRadius" : "borderBottomLeftRadius"]: 12,
          background: me ? brandGradient : "rgba(255,255,255,0.92)",
          color: me ? "#fff" : C.ink,
          boxShadow: shadowSoft,
        }}
      >
        {text}
      </div>
    </div>
  );
}

function Typing({ from, to }: { from: number; to: number }) {
  const frame = useCurrentFrame();
  if (frame < from || frame >= to) return null;
  return (
    <div style={{ display: "flex" }}>
      <div style={{ display: "flex", gap: 12, padding: "30px 36px", borderRadius: 48, borderBottomLeftRadius: 12, background: "rgba(255,255,255,0.92)", boxShadow: shadowSoft }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 16, height: 16, borderRadius: 99, background: C.inkSoft, opacity: 0.35 + 0.65 * Math.max(0, Math.sin((frame - from) / 3 - i * 0.9)) }} />
        ))}
      </div>
    </div>
  );
}

export function Hook() {
  const { c } = useCopy();
  const v = useVertical();
  const frame = useCurrentFrame();
  const chatOut = interpolate(frame, [86, 100], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: v ? 900 : 1040, display: "flex", flexDirection: "column", gap: 26, opacity: chatOut, filter: `blur(${(1 - chatOut) * 14}px)`, scale: String(0.94 + 0.06 * chatOut) }}>
        {CHAT_TIMING.map((b, i) => (
          <Bubble key={i} text={c.chat[i]!} {...b} />
        ))}
        <Typing from={22} to={42} />
      </div>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: v ? 70 : 160 }}>
        <Rise delay={94} y={60}>
          <h1 style={{ margin: 0, textAlign: "center", fontFamily: display, fontWeight: 600, fontSize: v ? 132 : 140, lineHeight: 1.02, letterSpacing: "-0.03em", color: C.ink, textWrap: "balance" }}>
            {c.headline[0]}
            <span style={{ color: C.rose }}>{c.headline[1]}</span>
          </h1>
        </Rise>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

/* ---------- 2. Brand ---------- */

export function Brand() {
  const { c } = useCopy();
  const v = useVertical();
  const p = useEnter(0, 11);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30, padding: 80 }}>
      <div style={{ scale: String(p), rotate: `${(1 - p) * -12}deg` }}>
        <Mark size={v ? 260 : 220} />
      </div>
      <Rise delay={8}>
        <Wordmark size={v ? 108 : 120} />
      </Rise>
      <Rise delay={16}>
        <p style={{ margin: 0, maxWidth: v ? 860 : 1200, textAlign: "center", fontFamily: sans, fontWeight: 700, fontSize: v ? 46 : 42, lineHeight: 1.3, color: C.inkSoft, textWrap: "balance" }}>
          {c.tagline}
        </p>
      </Rise>
    </AbsoluteFill>
  );
}

/* ---------- 3–5, 7. App screens with a caption ---------- */

type Tapping = { x: number; y: number; at: number };

export function ScreenScene({
  kicker,
  title,
  sub,
  chips,
  desktop,
  mobile,
  desktopTap,
  mobileTap,
  desktopExtra,
  mobileExtra,
  aside,
  enter = true,
  continues = false,
}: {
  kicker: string;
  title: string;
  sub?: string;
  chips?: string[];
  desktop: ScreenProps;
  mobile: ScreenProps;
  desktopTap?: Tapping;
  mobileTap?: Tapping;
  /** Drawn on top of the desktop / phone screenshot (e.g. a notification). */
  desktopExtra?: ReactNode;
  mobileExtra?: ReactNode;
  /** Floats beside the browser window (landscape only). */
  aside?: ReactNode;
  /** Landscape: slide the browser in. Off when the previous scene already shows it in place. */
  enter?: boolean;
  /** Landscape: the next scene shows the browser in the same place, so keep it during the transition. */
  continues?: boolean;
}) {
  const v = useVertical();
  const exit = useExit();
  const slide = useEnter(6, 20);
  const p = v || enter ? slide : 1;
  const caption = <Caption kicker={kicker} title={title} sub={sub} chips={chips} delay={9} />;
  if (v)
    return (
      <AbsoluteFill>
        <div style={{ position: "absolute", top: 150, left: 70, right: 70 }}>{caption}</div>
        <div style={{ position: "absolute", top: 630, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: Math.min(1, p * 2), transform: `translateY(${(1 - p) * 600}px)` }}>
          <Phone width={600} {...mobile}>
            {mobileExtra}
            {mobileTap && <Tap {...mobileTap} size={64} />}
          </Phone>
        </div>
      </AbsoluteFill>
    );
  return (
    <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", padding: "0 90px 0 110px", gap: 70 }}>
      <div style={{ width: 520, flexShrink: 0 }}>{caption}</div>
      <div style={{ perspective: 2600 }}>
        <div style={{ position: "relative", opacity: Math.min(1, p * 2) * (continues ? 1 : exit), transform: `translateX(${(1 - p) * 420}px) rotateY(${-7 - (1 - p) * 12}deg) rotateX(2deg)` }}>
          <Browser width={1130} {...desktop}>
            {desktopExtra}
            {desktopTap && <Tap {...desktopTap} size={58} />}
          </Browser>
          {aside && <div style={{ opacity: exit }}>{aside}</div>}
        </div>
      </div>
    </AbsoluteFill>
  );
}

/* ---------- 6. Size conversion ---------- */

/** US women's 7.5 in each system; names come from the copy. */
const CONVERSIONS = [
  { flag: "🇬🇧", value: "5.5" },
  { flag: "🇪🇺", value: "38" },
  { flag: "🇯🇵", value: "24.5 cm" },
  { flag: "🇧🇷", value: "37" },
  { flag: "🇲🇽", value: "24.5" },
  { flag: "🇨🇴", value: "≈37.5" },
];

function SizeCard({ flag, code, value, delay, big, note }: { flag: string; code: string; value: string; delay: number; big?: boolean; note?: string }) {
  const v = useVertical();
  const p = useEnter(delay, 13);
  return (
    <div
      style={{
        opacity: Math.min(1, p * 2),
        scale: String(0.7 + 0.3 * p),
        background: big ? brandGradient : "rgba(255,255,255,0.9)",
        color: big ? "#fff" : C.ink,
        borderRadius: 32,
        boxShadow: shadowSoft,
        padding: big ? (v ? "34px 60px" : "40px 56px") : v ? "24px 30px" : "24px 30px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minWidth: big ? (v ? 560 : 330) : v ? 410 : 290,
      }}
    >
      <span style={{ fontFamily: sans, fontWeight: 800, fontSize: big ? 34 : 28, opacity: big ? 0.95 : 0.75, whiteSpace: "nowrap" }}>
        {flag} {code}
      </span>
      <span style={{ fontFamily: display, fontWeight: 600, fontSize: big ? (v ? 150 : 170) : v ? 76 : 68, lineHeight: 1.05, whiteSpace: "nowrap" }}>{value}</span>
      {note && <span style={{ fontFamily: sans, fontWeight: 700, fontSize: 28, opacity: 0.9 }}>{note}</span>}
    </div>
  );
}

export function Convert() {
  const { c: copy } = useCopy();
  const v = useVertical();
  const frame = useCurrentFrame();
  const arrow = interpolate(frame, [26, 38], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: v ? 56 : 60, padding: v ? "0 60px" : "0 120px" }}>
      <Caption kicker={copy.convert.kicker} title={copy.convert.title} center />
      <div style={{ display: "flex", flexDirection: v ? "column" : "row", alignItems: "center", gap: v ? 34 : 50 }}>
        <SizeCard flag="🇺🇸" code={copy.convert.source.code} note={copy.convert.source.note} value="7.5" delay={14} big />
        <span style={{ fontFamily: sans, fontWeight: 800, fontSize: 72, color: C.rose, opacity: arrow, transform: `${v ? "rotate(90deg) " : ""}translateX(${(1 - arrow) * -30}px)` }}>→</span>
        <div style={{ display: "grid", gridTemplateColumns: v ? "repeat(2, auto)" : "repeat(3, auto)", gap: v ? 22 : 24 }}>
          {CONVERSIONS.map((c, i) => (
            <SizeCard key={c.flag} {...c} code={copy.convert.places[i]!} delay={34 + i * 7} />
          ))}
        </div>
      </div>
      <Rise delay={84}>
        <p style={{ margin: 0, textAlign: "center", fontFamily: sans, fontWeight: 700, fontSize: v ? 40 : 36, color: C.inkSoft }}>{copy.convert.footer}</p>
      </Rise>
    </AbsoluteFill>
  );
}

/* ---------- 8. Call to action ---------- */

export function Cta() {
  const { c: copy } = useCopy();
  const v = useVertical();
  const frame = useCurrentFrame();
  const p = useEnter(0, 12);
  const pulse = 1 + Math.max(0, Math.sin((frame - 55) / 9)) * 0.03 * (frame > 55 ? 1 : 0);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: v ? 34 : 26, padding: 70 }}>
      <div style={{ scale: String(p) }}>
        <Mark size={v ? 220 : 170} />
      </div>
      <Rise delay={6}>
        <Wordmark size={v ? 104 : 110} />
      </Rise>
      <Rise delay={14}>
        <p style={{ margin: 0, textAlign: "center", fontFamily: display, fontWeight: 600, fontSize: v ? 64 : 58, color: C.ink }}>{copy.cta.line}</p>
      </Rise>
      <Rise delay={20}>
        <p style={{ margin: 0, textAlign: "center", fontFamily: sans, fontWeight: 700, fontSize: v ? 36 : 32, color: C.inkSoft, maxWidth: v ? 860 : undefined }}>
          English · Español · Français · Português · Русский
        </p>
      </Rise>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14, maxWidth: v ? 900 : 1400 }}>
        {copy.cta.pills.map((c, i) => (
          <Rise key={c} delay={22 + i * 4} y={20}>
            <span style={{ display: "inline-block", fontFamily: sans, fontWeight: 800, fontSize: v ? 34 : 30, color: C.ink, background: "rgba(255,255,255,0.85)", borderRadius: 999, padding: "10px 24px", boxShadow: "0 10px 24px -12px rgba(120,90,90,0.35)" }}>
              {c}
            </span>
          </Rise>
        ))}
      </div>
      <Rise delay={40}>
        <div style={{ marginTop: 14, scale: String(pulse), background: brandGradient, color: "#fff", fontFamily: sans, fontWeight: 800, fontSize: v ? 58 : 54, padding: v ? "28px 64px" : "24px 60px", borderRadius: 999, boxShadow: "0 30px 60px -20px rgba(122,90,166,0.6)" }}>
          {copy.cta.url}
        </div>
      </Rise>
    </AbsoluteFill>
  );
}

/** The reminder email card that slides in beside the browser (landscape dates scene). */
export function EmailCard({ at }: { at: number }) {
  const { screen } = useCopy();
  const p = useEnter(at, 18);
  return (
    <div style={{ position: "absolute", right: -40, bottom: -70, width: 560, opacity: Math.min(1, p * 2), transform: `translateX(${(1 - p) * 260}px) rotate(${-3 + (1 - p) * 4}deg)`, borderRadius: 26, overflow: "hidden", boxShadow: "0 40px 90px -24px rgba(74,59,102,0.55)", border: "2px solid rgba(255,255,255,0.95)" }}>
      <Img src={staticFile(screen("desktop-email"))} style={{ width: "100%", display: "block" }} />
    </div>
  );
}
