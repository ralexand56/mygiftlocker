"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useId, type ComponentProps, type ReactNode } from "react";

const spring = { type: "spring", stiffness: 500, damping: 34 } as const;

type Variant = "primary" | "soft" | "ghost";
const variants: Record<Variant, string> = {
  primary: "bg-ink text-white shadow-lift hover:bg-plum",
  soft: "bg-white/80 text-ink shadow-soft hover:bg-white",
  ghost: "text-ink-soft hover:text-ink hover:bg-white/60",
};

export function Button({
  variant = "primary",
  className = "",
  href,
  children,
  ...props
}: { variant?: Variant; href?: string } & ComponentProps<"button">) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-bold transition-colors disabled:opacity-40 disabled:pointer-events-none ${variants[variant]} ${className}`;
  if (href)
    return (
      <motion.span whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} transition={spring} className="inline-flex">
        <Link href={href} className={cls}>
          {children}
        </Link>
      </motion.span>
    );
  return (
    <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} transition={spring} className={cls} {...(props as object)}>
      {children}
    </motion.button>
  );
}

/**
 * Pill selector. The active highlight glides between options using a shared
 * layoutId — the same primitive that drives hero transitions.
 */
export function ChipGroup<T extends string | number>({
  options,
  value,
  onChange,
  label,
  render,
  columns,
}: {
  options: readonly T[];
  value: T | undefined;
  onChange: (v: T | undefined) => void;
  label: string;
  render?: (v: T) => ReactNode;
  columns?: number;
}) {
  const id = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={columns ? "grid gap-2" : "flex flex-wrap gap-2"}
      style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
    >
      {options.map((o) => {
        const active = o === value;
        return (
          <button
            key={String(o)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(active ? undefined : o)}
            className={`relative min-w-14 rounded-full px-4 py-2.5 text-[15px] font-bold transition-colors ${
              active ? "text-white" : "bg-white/70 text-ink ring-1 ring-lavender/50 hover:bg-white"
            }`}
          >
            {active && (
              <motion.span
                layoutId={`chip-${id}`}
                transition={spring}
                className="absolute inset-0 rounded-full bg-gradient-to-br from-rose to-plum shadow-lift"
              />
            )}
            <span className="relative">{render ? render(o) : String(o)}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-ink-soft">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-2xl border border-white bg-white/80 px-4 py-3 text-[16px] text-ink shadow-soft outline-none transition focus:border-lavender focus:ring-4 focus:ring-lavender/40 placeholder:text-ink-soft/50";

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function Textarea(props: ComponentProps<"textarea">) {
  return <textarea rows={3} {...props} className={`${inputCls} resize-none ${props.className ?? ""}`} />;
}

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`glass rounded-[28px] shadow-soft ${className}`}>{children}</div>;
}

export function Avatar({ name, color, size = 48 }: { name: string; color: string; size?: number }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter((w) => /^\p{L}/u.test(w))
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-full font-display font-semibold text-ink"
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
    >
      {initials || "?"}
    </span>
  );
}
