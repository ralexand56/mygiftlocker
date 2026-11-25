"use client";

import { SHARE_SECTIONS, shareSectionText, type ConnectionShares, type ShareSection } from "@mgl/core";
import { useTr } from "@/lib/i18n";

/** One switch per shareable part of a profile. */
export function ShareToggles({ value, onChange, disabled }: { value: ConnectionShares; onChange: (v: ConnectionShares) => void; disabled?: boolean }) {
  const t = useTr();
  return (
    <div className="grid gap-2">
      {SHARE_SECTIONS.map((s) => (
        <label key={s.id} className={`flex items-center gap-3 rounded-2xl bg-white/80 p-3 shadow-soft ${disabled ? "opacity-60" : "cursor-pointer"}`}>
          <span className="min-w-0 flex-1">
            <b className="block text-[15px]">{shareSectionText(s.id, t).label}</b>
            <span className="text-sm text-ink-soft">{shareSectionText(s.id, t).hint}</span>
          </span>
          <Switch on={value[s.id]} disabled={disabled} onToggle={() => onChange({ ...value, [s.id as ShareSection]: !value[s.id] })} label={shareSectionText(s.id, t).label} />
        </label>
      ))}
    </div>
  );
}

function Switch({ on, onToggle, label, disabled }: { on: boolean; onToggle: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-rose" : "bg-lavender/60"}`}
    >
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-[left] ${on ? "left-6" : "left-1"}`} />
    </button>
  );
}
