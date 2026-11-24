"use client";

import type { Scene } from "@mgl/core";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { SCENE_ILLOS, paletteAt } from "./illustrations";

type Slot = { side: "left" | "right"; x: number; y: number; size: number; r: number };

/** Slots also shown on phones (the rest are hidden there to keep animation cheap). */
const PHONE_SLOTS = new Set([0, 2, 4, 5, 7, 9]);

/** Hand-placed so items frame the centered form without crowding it. */
const SLOTS: Slot[] = [
  { side: "left", x: 2, y: 6, size: 150, r: -12 },
  { side: "left", x: 15, y: 28, size: 112, r: 9 },
  { side: "left", x: -2, y: 46, size: 176, r: 6 },
  { side: "left", x: 13, y: 70, size: 124, r: -8 },
  { side: "left", x: 1, y: 86, size: 104, r: 14 },
  { side: "right", x: 3, y: 4, size: 128, r: 10 },
  { side: "right", x: 16, y: 22, size: 160, r: -7 },
  { side: "right", x: 0, y: 48, size: 118, r: -14 },
  { side: "right", x: 14, y: 64, size: 168, r: 8 },
  { side: "right", x: 2, y: 86, size: 120, r: -5 },
];

/**
 * Category-themed backdrop: on each step change the current illustrations slide
 * back out to their side while a fresh set flies in from the left and right,
 * staggered, then gently float. Motion drives the fly in/out; the endless float is a
 * CSS animation (`.float`) so it runs on the compositor without JavaScript per frame,
 * and the drop shadow sits on a static child so it's rasterized once, not every frame.
 */
export function FlyingBackdrop({ scene }: { scene: Scene }) {
  const reduce = useReducedMotion();
  const illos = SCENE_ILLOS[scene];

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <ClaySpheres />
      <AnimatePresence>
        <motion.div key={scene} className="absolute inset-0">
          {SLOTS.map((slot, i) => {
            const Illo = illos[(i * 7 + slot.side.length) % illos.length]!;
            const colors = paletteAt(i + scene.length);
            const from = slot.side === "left" ? "-70vw" : "70vw";
            // Alternate stagger left/right so they arrive like a zipper.
            const order = slot.side === "left" ? i * 2 : (i - 5) * 2 + 1;
            return (
              <motion.div
                key={i}
                className={`absolute will-change-transform ${PHONE_SLOTS.has(i) ? "" : "max-sm:hidden"}`}
                style={{
                  top: `${slot.y}%`,
                  [slot.side]: `${slot.x}%`,
                  width: slot.size,
                  height: slot.size,
                }}
                initial={reduce ? { opacity: 0 } : { x: from, rotate: slot.r * 3, opacity: 0, scale: 0.9 }}
                animate={{
                  x: 0,
                  rotate: slot.r,
                  opacity: 1,
                  scale: 1,
                  transition: reduce
                    ? { duration: 0.3 }
                    : { duration: 0.95, ease: [0.16, 1, 0.3, 1], delay: 0.18 + order * 0.06 },
                }}
                exit={
                  reduce
                    ? { opacity: 0, transition: { duration: 0.2 } }
                    : {
                        x: from,
                        rotate: slot.r * -3,
                        opacity: 0,
                        transition: { duration: 0.45, ease: [0.7, 0, 0.84, 0], delay: order * 0.02 },
                      }
                }
              >
                <div
                  className="float h-full w-full"
                  style={floatVars({ y: -14, r: slot.r > 0 ? 3 : -3, dur: 5 + (i % 4), delay: i * 0.3 })}
                >
                  <div className="h-full w-full drop-shadow-[0_18px_24px_rgba(122,90,166,0.18)] max-sm:opacity-50">
                    <Illo {...colors} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const SPHERES = [
  { x: "22%", y: "12%", s: 34, c: "#f3c9c9", d: 9 },
  { x: "76%", y: "18%", s: 22, c: "#a8c4da", d: 11 },
  { x: "30%", y: "82%", s: 26, c: "#f2b9a0", d: 10 },
  { x: "70%", y: "88%", s: 40, c: "#fef5ec", d: 12 },
  { x: "88%", y: "46%", s: 18, c: "#f5d98a", d: 8 },
  { x: "9%", y: "40%", s: 20, c: "#d6e8f3", d: 13 },
];

/** CSS custom properties for the `.float` keyframes in globals.css. */
export function floatVars(v: { x?: number; y?: number; r?: number; dur?: number; delay?: number }): React.CSSProperties {
  return {
    ["--float-x" as string]: `${v.x ?? 0}px`,
    ["--float-y" as string]: `${v.y ?? -12}px`,
    ["--float-r" as string]: `${v.r ?? 0}deg`,
    ["--float-dur" as string]: `${v.dur ?? 6}s`,
    ["--float-delay" as string]: `${v.delay ?? 0}s`,
  };
}

/** Soft clay spheres drifting behind everything — depth without noise. */
function ClaySpheres() {
  return (
    <>
      {SPHERES.map((b, i) => (
        <motion.span
          key={i}
          className="absolute"
          style={{ left: b.x, top: b.y, width: b.s, height: b.s }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
        >
          <span className="clay float block h-full w-full" style={{ ["--clay" as string]: b.c, ...floatVars({ x: i % 2 ? 10 : -10, y: -18, dur: b.d }) }} />
        </motion.span>
      ))}
    </>
  );
}
