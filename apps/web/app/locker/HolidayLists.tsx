"use client";

import { HOLIDAYS, holidayName, nextHoliday, type HolidayId, type Person } from "@mgl/core";
import { AnimatePresence, motion } from "motion/react";
import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui";
import { useTranslations } from "next-intl";
import { useIntlTag, useTr } from "@/lib/i18n";

type Save = (id: string, changes: { holidays: HolidayId[] }) => Promise<void>;

const withTag = (p: Person, id: HolidayId, on: boolean): HolidayId[] => {
  const set = new Set(p.holidays ?? []);
  if (on) set.add(id);
  else set.delete(id);
  return HOLIDAYS.map((h) => h.id).filter((h) => set.has(h));
};

/** Everyone × holidays checklist, with "all" per holiday (e.g. tag everyone for Christmas). */
export function HolidayLists({ open, people, onClose, onSave }: { open: boolean; people: Person[]; onClose: () => void; onSave: Save }) {
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("holidayLists");
  const tr = useTr();
  const tag = useIntlTag();
  const sorted = [...people].sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const save = async (updates: [Person, HolidayId[]][]) => {
    setError(null);
    const results = await Promise.allSettled(updates.map(([p, holidays]) => onSave(p.id, { holidays })));
    if (results.some((r) => r.status === "rejected")) setError(t("error"));
  };
  const toggle = (p: Person, id: HolidayId) => save([[p, withTag(p, id, !(p.holidays ?? []).includes(id))]]);
  const toggleAll = (id: HolidayId, on: boolean) =>
    save(sorted.filter((p) => (p.holidays ?? []).includes(id) !== on).map((p) => [p, withTag(p, id, on)]));

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-ink/25 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
            <motion.div
              role="dialog"
              aria-modal
              aria-label={t("title")}
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              className="pointer-events-auto relative max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-[32px] bg-cream p-6 shadow-lift sm:p-8"
            >
              <button onClick={onClose} className="absolute top-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-white/80 shadow-soft" aria-label={t("close")}>
                <X className="h-5 w-5" />
              </button>
              <h2 className="font-display text-3xl font-semibold">{t("title")}</h2>
              <p className="mt-1 text-ink-soft">{t("lede")}</p>
              {error && <p className="mt-3 text-sm font-bold text-rose-deep">{error}</p>}

              <div className="mt-6 overflow-x-auto">
                <table className="w-full border-separate border-spacing-y-1.5 text-sm">
                  <thead>
                    <tr>
                      <th className="text-left font-bold text-ink-soft">{t("person")}</th>
                      {HOLIDAYS.map((h) => {
                        const all = sorted.length > 0 && sorted.every((p) => (p.holidays ?? []).includes(h.id));
                        return (
                          <th key={h.id} className="px-2 text-center align-bottom font-bold">
                            <div className="text-lg" aria-hidden>
                              {h.emoji}
                            </div>
                            <div className="text-xs leading-tight">{holidayName(h.id, tr)}</div>
                            <div className="text-[11px] font-semibold text-ink-soft">
                              {nextHoliday(h.id).toLocaleDateString(tag, { month: "short", day: "numeric" })}
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleAll(h.id, !all)}
                              className="mt-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-plum shadow-soft hover:bg-blush/60"
                              aria-label={all ? t("untagAll", { holiday: holidayName(h.id, tr) }) : t("tagAll", { holiday: holidayName(h.id, tr) })}
                            >
                              {all ? t("none") : t("all")}
                            </button>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((p) => (
                      <tr key={p.id} className="bg-white/80">
                        <td className="rounded-l-2xl py-2 pr-2 pl-3">
                          <span className="flex items-center gap-2.5">
                            <Avatar name={p.name} color={p.color} size={32} />
                            <span className="truncate font-bold">{p.name}</span>
                          </span>
                        </td>
                        {HOLIDAYS.map((h, i) => {
                          const on = (p.holidays ?? []).includes(h.id);
                          return (
                            <td key={h.id} className={`px-2 text-center ${i === HOLIDAYS.length - 1 ? "rounded-r-2xl" : ""}`}>
                              <button
                                type="button"
                                role="checkbox"
                                aria-checked={on}
                                aria-label={t("for", { holiday: holidayName(h.id, tr), name: p.name })}
                                onClick={() => toggle(p, h.id)}
                                className={`grid h-8 w-8 place-items-center rounded-xl transition-colors ${
                                  on ? "bg-gradient-to-br from-rose to-plum text-white shadow-lift" : "bg-cream ring-1 ring-lavender/60 hover:bg-blush/40"
                                }`}
                              >
                                {on && <Check className="h-4 w-4" strokeWidth={3} />}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
