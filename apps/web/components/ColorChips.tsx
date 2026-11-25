"use client";

import { useTranslations } from "next-intl";

/** The favorite colors people can pick (stored by name). */
export const FAVORITE_COLORS: [string, string][] = [
  ["blush", "#F7C6D9"], ["coral", "#FF9F8A"], ["peach", "#FFC9A8"], ["butter", "#FFE7B8"],
  ["sage", "#C6DDB8"], ["mint", "#CDEFE3"], ["sky", "#BFDDFB"], ["navy", "#2F3E6B"],
  ["lavender", "#D9C8FF"], ["plum", "#7A5AA6"], ["cream", "#F6EEDC"], ["black", "#26222E"],
];
const HEX = new Map(FAVORITE_COLORS);

/** Favorite colors as little swatch chips: a dot of the color and its name. */
export function ColorChips({ colors, className = "" }: { colors: string[]; className?: string }) {
  const t = useTranslations("colors");
  const known = colors.filter((c) => HEX.has(c));
  if (!known.length) return null;
  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`} aria-label={t("label")}>
      {known.map((c) => (
        <li key={c} className="inline-flex items-center gap-1.5 rounded-full bg-cream py-1 pr-3 pl-1 text-sm font-bold text-ink ring-1 ring-lavender/50">
          <span className="h-5 w-5 rounded-full shadow-soft ring-1 ring-ink/10" style={{ background: HEX.get(c) }} aria-hidden />
          {t(c as "blush")}
        </li>
      ))}
    </ul>
  );
}
