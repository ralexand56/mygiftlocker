import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, display, sans, shadowLift } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** True for the 9:16 cut. */
export function useVertical() {
  const { width, height } = useVideoConfig();
  return height > width;
}

/** Eased 0→1 progress starting at `delay` frames. */
export function useEnter(delay = 0, damping = 200) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping } });
}

/** Cross-fade length between scenes, in frames. */
export const TRANSITION = 15;

/**
 * 1 → 0 over the first half of the outgoing transition. The fade transition draws the new scene
 * over the old one, which stays fully visible, so anything that shouldn't overlap fades itself out.
 */
export function useExit() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return interpolate(frame, [durationInFrames - TRANSITION, durationInFrames - TRANSITION + 7], [1, 0], clamp);
}

/** Fades its children out at the start of the scene's outgoing transition. */
export function Exit({ children }: { children: ReactNode }) {
  return <AbsoluteFill style={{ opacity: useExit() }}>{children}</AbsoluteFill>;
}

/** Fade + rise in. */
export function Rise({ delay = 0, y = 40, children, style }: { delay?: number; y?: number; children: ReactNode; style?: CSSProperties }) {
  const p = useEnter(delay);
  return <div style={{ opacity: p, transform: `translateY(${(1 - p) * y}px)`, ...style }}>{children}</div>;
}

/** The site's pastel wash with slowly drifting clay spheres. */
export function Wash() {
  const frame = useCurrentFrame();
  const spheres = [
    { x: 6, y: 14, r: 70, c: C.blush },
    { x: 90, y: 10, r: 44, c: C.sky },
    { x: 86, y: 80, r: 90, c: C.lavender },
    { x: 12, y: 84, r: 54, c: C.butter },
    { x: 50, y: 4, r: 26, c: C.mint },
  ];
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(55% 45% at 8% 0%, rgba(242,185,160,0.45), transparent 70%), radial-gradient(50% 45% at 100% 8%, rgba(168,196,218,0.5), transparent 70%), radial-gradient(60% 50% at 50% 105%, rgba(251,211,227,0.7), transparent 70%), linear-gradient(180deg, #f6ebe6 0%, #efe0de 100%)",
      }}
    >
      {spheres.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.r * 2,
            height: s.r * 2,
            borderRadius: 9999,
            background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.95), ${s.c} 55%, color-mix(in oklab, ${s.c}, #6b4f5a 18%) 100%)`,
            boxShadow: "0 24px 40px -18px rgba(120,90,90,0.35)",
            transform: `translate(-50%, -50%) translateY(${Math.sin(frame / 45 + i * 1.7) * 14}px)`,
            opacity: 0.85,
          }}
        />
      ))}
    </AbsoluteFill>
  );
}

/** The brand mark (packages/brand/mark.svg). */
export function Mark({ size }: { size: number }) {
  return <Img src={staticFile("mark.svg")} style={{ width: size, height: size }} />;
}

export function Wordmark({ size }: { size: number }) {
  return (
    <span style={{ fontFamily: display, fontWeight: 600, fontSize: size, letterSpacing: "-0.02em", color: C.ink, whiteSpace: "nowrap" }}>
      <span style={{ color: C.rose }}>My</span> Gift Lockers
    </span>
  );
}

/** A screenshot that cross-fades to a second one at `swapAt`, with a slow push-in toward `focus`. */
function Screen({
  src,
  swapTo,
  swapAt = 0,
  swapFrames = 6,
  zoom: zoomTo = 1.07,
  focus = [0.5, 0.4],
  children,
}: ScreenProps) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const zoom = interpolate(frame, [0, durationInFrames], [1, zoomTo]);
  const swap = swapTo ? interpolate(frame, [swapAt, swapAt + swapFrames], [0, 1], clamp) : 0;
  return (
    <div style={{ position: "relative", transform: `scale(${zoom})`, transformOrigin: `${focus[0] * 100}% ${focus[1] * 100}%` }}>
      <Img src={staticFile(src)} style={{ width: "100%", display: "block" }} />
      {swapTo && <Img src={staticFile(swapTo)} style={{ position: "absolute", inset: 0, width: "100%", display: "block", opacity: swap }} />}
      {children}
    </div>
  );
}

export type ScreenProps = { src: string; swapTo?: string; swapAt?: number; swapFrames?: number; /** End scale of the slow push-in. */ zoom?: number; focus?: [number, number]; children?: ReactNode };

/** Desktop browser window around a 1440×860 screenshot. */
export function Browser({ width, ...screen }: ScreenProps & { width: number }) {
  const bar = width * 0.034;
  return (
    <div style={{ width, borderRadius: width * 0.016, overflow: "hidden", background: "#fff", boxShadow: shadowLift, border: "2px solid rgba(255,255,255,0.9)" }}>
      <div style={{ height: bar, background: "#fbf3ee", display: "flex", alignItems: "center", gap: bar * 0.22, padding: `0 ${bar * 0.5}px`, borderBottom: "1px solid rgba(74,59,102,0.08)" }}>
        {["#f2a7a0", "#f5d39a", "#b6dcc2"].map((c) => (
          <div key={c} style={{ width: bar * 0.3, height: bar * 0.3, borderRadius: 99, background: c }} />
        ))}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", marginRight: bar * 1.2 }}>
          <div style={{ background: "#fff", borderRadius: 99, padding: `${bar * 0.08}px ${bar * 0.7}px`, fontFamily: sans, fontWeight: 700, fontSize: bar * 0.38, color: C.inkSoft }}>
            mygiftlockers.com
          </div>
        </div>
      </div>
      <div style={{ height: (width * 860) / 1440, overflow: "hidden" }}>
        <Screen {...screen} />
      </div>
    </div>
  );
}

/** Phone around a 390×844 screenshot. */
export function Phone({ width, ...screen }: ScreenProps & { width: number }) {
  const bezel = width * 0.032;
  const inner = width - bezel * 2;
  return (
    <div style={{ width, padding: bezel, borderRadius: width * 0.15, background: C.ink, boxShadow: shadowLift }}>
      <div style={{ position: "relative", width: inner, height: (inner * 844) / 390, borderRadius: width * 0.12, overflow: "hidden", background: C.cream }}>
        <Screen {...screen} />
      </div>
    </div>
  );
}

/** A finger tap: a dot that presses at `at`, then a ring ripples out. Position is a fraction of the screenshot. */
export function Tap({ x, y, at, size = 70 }: { x: number; y: number; at: number; size?: number }) {
  const t = useCurrentFrame() - at;
  if (t < -14 || t > 30) return null;
  const dot = interpolate(t, [-14, -2, 0, 16, 26], [0, 0.85, 0.85, 0.6, 0], clamp);
  const press = interpolate(t, [-14, -2, 0, 4], [1.3, 1, 0.82, 1], clamp);
  const ring = interpolate(t, [0, 22], [0.7, 2.6], clamp);
  const ringO = interpolate(t, [0, 22], [0.7, 0], clamp);
  const base: CSSProperties = { position: "absolute", left: `${x * 100}%`, top: `${y * 100}%`, width: size, height: size, borderRadius: 999, translate: "-50% -50%" };
  return (
    <>
      <div style={{ ...base, border: `${size * 0.06}px solid ${C.plum}`, opacity: ringO, scale: String(ring) }} />
      <div style={{ ...base, background: "rgba(255,255,255,0.9)", boxShadow: `0 0 0 ${size * 0.06}px rgba(122,90,166,0.55), 0 10px 24px rgba(74,59,102,0.35)`, opacity: dot, scale: String(press) }} />
    </>
  );
}

/** Kicker + headline + optional sub line and chips, animated in one after another. */
export function Caption({
  kicker,
  title,
  sub,
  chips,
  delay = 0,
  center,
}: {
  kicker: string;
  title: string;
  sub?: string;
  chips?: string[];
  delay?: number;
  center?: boolean;
}) {
  const v = useVertical();
  const exit = useExit();
  const align = center || v ? "center" : "left";
  return (
    <div style={{ opacity: exit, textAlign: align, display: "flex", flexDirection: "column", alignItems: align === "center" ? "center" : "flex-start" }}>
      <Rise delay={delay}>
        <p style={{ margin: 0, fontFamily: sans, fontWeight: 800, fontSize: v ? 32 : 26, letterSpacing: "0.14em", textTransform: "uppercase", color: C.rose }}>{kicker}</p>
      </Rise>
      <Rise delay={delay + 5}>
        <h1 style={{ margin: "14px 0 0", fontFamily: display, fontWeight: 600, fontSize: v ? 82 : 74, lineHeight: 1.04, letterSpacing: "-0.02em", color: C.ink, textWrap: "balance" }}>
          {title}
        </h1>
      </Rise>
      {sub && (
        <Rise delay={delay + 11}>
          <p style={{ margin: "22px 0 0", fontFamily: sans, fontWeight: 600, fontSize: v ? 38 : 31, lineHeight: 1.35, color: C.inkSoft, textWrap: "balance" }}>{sub}</p>
        </Rise>
      )}
      {chips && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 28, justifyContent: align === "center" ? "center" : "flex-start", maxWidth: v ? 900 : 560 }}>
          {chips.map((c, i) => (
            <Rise key={c} delay={delay + 14 + i * 4} y={20}>
              <span style={{ display: "inline-block", fontFamily: sans, fontWeight: 800, fontSize: v ? 32 : 26, color: C.ink, background: "rgba(255,255,255,0.85)", borderRadius: 999, padding: v ? "12px 26px" : "10px 22px", boxShadow: "0 10px 24px -12px rgba(120,90,90,0.35)" }}>
                {c}
              </span>
            </Rise>
          ))}
        </div>
      )}
    </div>
  );
}

/** A phone-style notification banner that drops in at `at` and leaves at `hideAt`. Sized in screenshot pixels via `scale`. */
export function Notification({ at, hideAt, title, body, now = "now", scale = 1 }: { at: number; hideAt: number; title: string; body: string; now?: string; scale?: number }) {
  const frame = useCurrentFrame();
  const inP = useEnter(at, 16);
  const out = interpolate(frame, [hideAt, hideAt + 8], [0, 1], clamp);
  const shown = inP * (1 - out);
  if (shown <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: 14 * scale,
        left: "3.5%",
        right: "3.5%",
        zIndex: 5,
        opacity: Math.min(1, shown * 1.5),
        transform: `translateY(${(1 - inP) * -140 + out * -40}%) scale(${1 - out * 0.06})`,
        display: "flex",
        gap: 14 * scale,
        alignItems: "center",
        padding: `${14 * scale}px ${16 * scale}px`,
        borderRadius: 26 * scale,
        background: "rgba(255,255,255,0.94)",
        boxShadow: "0 18px 44px -12px rgba(74,59,102,0.45)",
        fontFamily: sans,
      }}
    >
      <Img src={staticFile("mark.svg")} style={{ width: 44 * scale, height: 44 * scale, flexShrink: 0 }} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 * scale, fontWeight: 800, color: C.inkSoft, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          <span>My Gift Lockers</span>
          <span style={{ textTransform: "none", fontWeight: 700 }}>{now}</span>
        </div>
        <div style={{ fontSize: 17 * scale, fontWeight: 800, color: C.ink, marginTop: 2 * scale, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
        <div style={{ fontSize: 15 * scale, fontWeight: 600, color: C.inkSoft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{body}</div>
      </div>
    </div>
  );
}
