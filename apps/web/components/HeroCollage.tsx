"use client";

import { motion } from "motion/react";
import { CakeIllo, DressIllo, GiftIllo, HeartIllo, SneakerIllo, TeeIllo } from "./illustrations";

const ITEMS = [
  { I: GiftIllo, c: "#FBD3E3", a: "#E9779F", x: "36%", y: "30%", s: 190, r: -6, from: -1 },
  { I: TeeIllo, c: "#D9C8FF", a: "#9B7FD1", x: "4%", y: "4%", s: 140, r: -12, from: -1 },
  { I: SneakerIllo, c: "#CDEFE3", a: "#6DBE9F", x: "62%", y: "2%", s: 150, r: 10, from: 1 },
  { I: DressIllo, c: "#FFD8C9", a: "#F08C6C", x: "70%", y: "52%", s: 140, r: 8, from: 1 },
  { I: CakeIllo, c: "#FFE7B8", a: "#F0B04F", x: "2%", y: "58%", s: 140, r: 6, from: -1 },
  { I: HeartIllo, c: "#F9D5E5", a: "#E9779F", x: "42%", y: "78%", s: 90, r: -10, from: 1 },
];

export function HeroCollage() {
  return (
    <div className="relative aspect-square w-full max-w-[520px] justify-self-center">
      <div className="absolute inset-[12%] rounded-full bg-white/60 blur-2xl" />
      {ITEMS.map(({ I, c, a, x, y, s, r, from }, i) => (
        <motion.div
          key={i}
          className="absolute will-change-transform"
          style={{ left: x, top: y, width: s, height: s }}
          initial={{ x: from * 400, opacity: 0, rotate: r * 4 }}
          animate={{ x: 0, opacity: 1, rotate: r }}
          transition={{ type: "spring", stiffness: 60, damping: 14, delay: 0.15 + i * 0.09 }}
        >
          <motion.div
            className="h-full w-full drop-shadow-[0_20px_30px_rgba(122,90,166,0.22)]"
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4.5 + i * 0.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <I c={c} a={a} />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
