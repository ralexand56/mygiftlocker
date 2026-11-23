"use client";

import type { Scene } from "@mgl/core";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { SCENE_ILLOS, paletteAt } from "./illustrations";

type Slot = { side: "left" | "right"; x: number; y: number; size: number; r: number };

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
 * staggered, then gently float. Transform/opacity only → GPU composited.
 */
export function FlyingBackdrop({ scene }: { scene: Scene }) {
  const reduce = useReducedMotion();
  const illos = SCENE_ILLOS[scene];

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
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
                className="absolute will-change-transform"
                style={{
                  top: `${slot.y}%`,
                  [slot.side]: `${slot.x}%`,
                  width: slot.size,
                  height: slot.size,
                }}
                initial={reduce ? { opacity: 0 } : { x: from, rotate: slot.r * 4, opacity: 0, scale: 0.8 }}
                animate={{
                  x: 0,
                  rotate: slot.r,
                  opacity: 1,
                  scale: 1,
                  transition: reduce
                    ? { duration: 0.3 }
                    : { type: "spring", stiffness: 70, damping: 15, mass: 0.9, delay: 0.12 + order * 0.055 },
                }}
                exit={
                  reduce
                    ? { opacity: 0, transition: { duration: 0.2 } }
                    : {
                        x: from,
                        rotate: slot.r * -3,
                        opacity: 0,
                        transition: { duration: 0.5, ease: [0.6, 0, 0.9, 0.4], delay: order * 0.02 },
                      }
                }
              >
                <motion.div
                  className="h-full w-full drop-shadow-[0_18px_24px_rgba(122,90,166,0.18)] max-sm:opacity-50"
                  animate={reduce ? undefined : { y: [0, -14, 0], rotate: [0, slot.r > 0 ? 3 : -3, 0] }}
                  transition={{ duration: 5 + (i % 4), repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
                >
                  <Illo {...colors} />
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
