"use client";

import { LOCALES, LOCALE_NAMES, type Locale } from "@mgl/core";
import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useUser } from "@/lib/auth";
import { chooseLocale } from "@/lib/i18n";

/** Compact language switcher; the choice is remembered and URLs don't change. */
export function LanguagePicker({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const user = useUser();
  const [pending, start] = useTransition();
  return (
    <label className={`relative inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-ink-soft hover:bg-white/70 hover:text-ink ${pending ? "opacity-60" : ""} ${className}`}>
      <Globe className="h-4 w-4 shrink-0" aria-hidden />
      <span className="font-bold uppercase" aria-hidden>
        {locale}
      </span>
      <select
        aria-label={t("language")}
        value={locale}
        onChange={(e) => {
          chooseLocale(e.target.value as Locale, !!user);
          start(() => router.refresh());
        }}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l} lang={l}>
            {LOCALE_NAMES[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
