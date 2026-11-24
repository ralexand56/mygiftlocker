"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * The locker's padlock as a "gifted" toggle: open until you've bought the gift,
 * then the shackle snaps shut and the body fills in.
 */
export function GiftLock({
  locked,
  onToggle,
  label,
  size = 40,
  showText = false,
}: {
  locked: boolean;
  onToggle: () => void;
  /** e.g. "Maya's birthday" */
  label: string;
  size?: number;
  showText?: boolean;
}) {
  const reduce = useReducedMotion();
  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 520, damping: 22 };
  return (
    <button
      type="button"
      role="switch"
      aria-checked={locked}
      aria-label={locked ? `Gift bought for ${label}. Tap to reopen.` : `Mark gift bought for ${label}`}
      title={locked ? "Gift bought" : "Bought a gift? Lock it in"}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`group relative inline-flex shrink-0 items-center gap-1.5 rounded-full transition-colors ${
        showText ? `py-1.5 pr-3.5 pl-1.5 text-sm font-bold ${locked ? "bg-rose/15 text-rose-deep" : "bg-white/80 text-ink-soft ring-1 ring-lavender/50 hover:bg-white"}` : "p-1 hover:bg-white/70"
      }`}
    >
      <motion.svg
        viewBox="0 -4 40 44"
        width={size}
        height={size}
        aria-hidden
        animate={locked && !reduce ? { scale: [1, 1.18, 1] } : { scale: 1 }}
        transition={{ duration: 0.35, delay: 0.12 }}
      >
        {/* Shackle: lifted and swung open until locked. */}
        <motion.path
          d="M13 19 V13.5 a7 7 0 0 1 14 0 V19"
          fill="none"
          strokeWidth={3.6}
          strokeLinecap="round"
          className={locked ? "stroke-rose-deep" : "stroke-ink-soft"}
          style={{ originX: 1, originY: 1 }}
          initial={false}
          animate={locked ? { y: 0, rotate: 0 } : { y: -5, rotate: -22 }}
          transition={spring}
        />
        <motion.rect
          x={8}
          y={18}
          width={24}
          height={18}
          rx={6}
          initial={false}
          animate={{ fill: locked ? "#E9779F" : "#FFF7F3" }}
          strokeWidth={2.4}
          className={locked ? "stroke-rose-deep" : "stroke-ink-soft"}
          transition={{ duration: 0.25 }}
        />
        {locked ? (
          <motion.path
            d="M14.5 27 l3.6 3.4 l7.4 -7.4"
            fill="none"
            stroke="#fff"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: reduce ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          />
        ) : (
          <circle cx={20} cy={27} r={2.6} className="fill-ink-soft" />
        )}
      </motion.svg>
      {showText && <span>{locked ? "Gift bought" : "Mark bought"}</span>}
    </button>
  );
}
