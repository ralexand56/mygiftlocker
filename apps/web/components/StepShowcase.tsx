"use client";

import type { Scene, StepDef } from "@mgl/core";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { SCENE_ILLOS, paletteAt } from "./illustrations";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Each category gets its own soft tint, like the per-drink photo backgrounds in the reference. */
export const SCENE_TINT: Record<Scene, string> = {
  welcome: "#F6DCE4",
  fit: "#ECE3F6",
  tops: "#F7DDD1",
  bottoms: "#D9E7F1",
  dresses: "#F5DEE7",
  outerwear: "#DDE5EE",
  shoes: "#DDEFE5",
  accessories: "#F8EBCD",
  address: "#E4E8F6",
  dates: "#FAE2D6",
  favorites: "#EFE2F6",
  kids: "#DCF0E7",
  done: "#F6DCE4",
};

/**
 * The left "photo" panel. On every step the whole panel (tint + composition)
 * pushes in from the travel direction while the previous one is pushed out —
 * the hero item lands first and the props trail ~100ms behind for parallax.
 */
export function StepShowcase({ scene, dir }: { scene: Scene; dir: number }) {
  const reduce = useReducedMotion();
  const illos = SCENE_ILLOS[scene];
  const [Hero, PropA = Hero, PropB = PropA] = [illos[0]!, illos[1], illos[2]];
  const push = {
    enter: (d: number) => (reduce ? { opacity: 0 } : { x: `${d * 100}%` }),
    center: { x: "0%", opacity: 1, transition: { duration: 0.85, ease: EASE } },
    exit: (d: number) => (reduce ? { opacity: 0 } : { x: `${d * -100}%`, transition: { duration: 0.85, ease: EASE } }),
  };
  const lag = (delay: number, from: number) => ({
    initial: reduce ? {} : { x: from * dir, rotate: from > 0 ? 8 : -8 },
    animate: { x: 0, rotate: 0, transition: { duration: 1.05, ease: EASE, delay } },
  });

  return (
    <div className="relative h-44 overflow-hidden md:h-auto md:min-h-full" aria-hidden>
      <AnimatePresence initial={false} custom={dir}>
        <motion.div
          key={scene}
          custom={dir}
          variants={push}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0"
          style={{ background: `radial-gradient(120% 90% at 30% 20%, #fffaf6 0%, ${SCENE_TINT[scene]} 55%, ${SCENE_TINT[scene]} 100%)` }}
        >
          {/* soft floor shadow + clay spheres for depth */}
          <div className="absolute bottom-[14%] left-1/2 h-8 w-1/2 -translate-x-1/2 rounded-[50%] bg-[#6b4f5a]/10 blur-xl" />
          <span className="clay absolute top-[12%] right-[14%] h-6 w-6 md:h-9 md:w-9" style={{ ["--clay" as string]: "#fef5ec" }} />
          <span className="clay absolute bottom-[18%] left-[10%] h-4 w-4 md:h-6 md:w-6" style={{ ["--clay" as string]: "#a8c4da" }} />

          <motion.div {...lag(0, 60)} className="absolute top-1/2 left-1/2 h-[62%] w-[62%] max-w-[340px] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_30px_30px_rgba(120,90,90,0.22)] md:h-auto md:aspect-square">
            <Hero {...paletteAt(scene.length)} />
          </motion.div>
          <motion.div {...lag(0.1, 120)} className="absolute top-[8%] left-[8%] w-[22%] max-w-[120px] drop-shadow-[0_16px_18px_rgba(120,90,90,0.18)]">
            <PropA {...paletteAt(scene.length + 2)} />
          </motion.div>
          <motion.div {...lag(0.16, 160)} className="absolute right-[7%] bottom-[9%] w-[24%] max-w-[130px] drop-shadow-[0_16px_18px_rgba(120,90,90,0.18)]">
            <PropB {...paletteAt(scene.length + 4)} />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/**
 * Round thumbnails stacked on the seam between the panels — a step indicator
 * that doubles as navigation back to completed steps (desktop only).
 */
export function StepRail({ steps, index, onJump }: { steps: StepDef[]; index: number; onJump: (i: number) => void }) {
  return (
    <nav aria-label="Steps" className="absolute top-1/2 left-[calc(45.9%)] z-10 hidden -translate-x-1/2 -translate-y-1/2 flex-col gap-2 md:flex">
      {steps.map((s, i) => {
        const Illo = SCENE_ILLOS[s.scene][0]!;
        const active = i === index;
        const done = i < index;
        return (
          <motion.button
            key={s.id}
            type="button"
            onClick={() => onJump(i)}
            disabled={!done}
            aria-label={`${s.eyebrow}${active ? " (current)" : done ? " (done)" : ""}`}
            aria-current={active ? "step" : undefined}
            animate={{ scale: active ? 1.18 : 1 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="relative grid h-9 w-9 place-items-center rounded-full p-1.5 shadow-soft"
            style={{ background: SCENE_TINT[s.scene] }}
          >
            <Illo {...paletteAt(s.scene.length)} />
            {active && <motion.span layoutId="rail-ring" className="absolute -inset-1 rounded-full ring-2 ring-ink" transition={{ duration: 0.6, ease: EASE }} />}
            {done && (
              <span className="absolute -right-1 -bottom-1 grid h-4 w-4 place-items-center rounded-full bg-ink text-white">
                <Check className="h-2.5 w-2.5" strokeWidth={4} />
              </span>
            )}
          </motion.button>
        );
      })}
    </nav>
  );
}
