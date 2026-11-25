"use client";

/**
 * Client-side language helpers. UI text comes from next-intl's useTranslations;
 * core functions (sizes, dates, holidays…) take a `Tr` from useTr().
 */
import { createTr, LOCALE_TAGS, type Locale, type Tr } from "@mgl/core";
import { useLocale, useMessages } from "next-intl";
import { useMemo } from "react";
import { api, backendEnabled } from "./amplify";

/** A core translator for the visitor's language. */
export function useTr(): Tr {
  const locale = useLocale();
  const messages = useMessages();
  return useMemo(() => createTr(locale, messages), [locale, messages]);
}

/** Intl tag ("pt-BR") for dates and numbers. */
export function useIntlTag(): string {
  return LOCALE_TAGS[useLocale()];
}

export { currentTr, localizeError, setCurrentTr } from "./i18n-current";

const COOKIE = "NEXT_LOCALE";
const SYNCED = "mgl:localeSynced";

/** Remember the visitor's choice (a year), and tell the backend for reminder emails. */
export function chooseLocale(locale: Locale, signedIn: boolean): void {
  document.cookie = `${COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
  if (signedIn) void syncLocale(locale, true);
}

/** Tells the backend which language to email in; once per language per browser. */
export async function syncLocale(locale: Locale, force = false): Promise<void> {
  if (!backendEnabled) return;
  try {
    if (!force && localStorage.getItem(SYNCED) === locale) return;
    await api().mutations.setMyLocale({ locale });
    localStorage.setItem(SYNCED, locale);
  } catch {
    // Best effort: emails fall back to English.
  }
}
