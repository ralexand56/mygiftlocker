/**
 * The app's language. Same text as the website (@mgl/messages + core catalogs), chosen from the
 * phone's language until the person picks one in Settings. Signed-in users' choice is sent to the
 * backend so reminder and code emails come in it too.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LOCALE_TAGS, createTr, isLocale, pickLocale, type Locale, type Tr } from "@mgl/core";
import { CORE_CATALOGS } from "@mgl/core/catalogs";
import { MESSAGES } from "@mgl/messages";
import { getLocales } from "expo-localization";
import { useMemo, useSyncExternalStore } from "react";

const KEY = "mgl:locale";

function deviceLocale(): Locale {
  const tags = getLocales().map((l) => l.languageTag);
  return pickLocale(tags.join(","));
}

let locale: Locale = deviceLocale();
const listeners = new Set<() => void>();
const trs = new Map<Locale, Tr>();

function trFor(l: Locale): Tr {
  let t = trs.get(l);
  if (!t) {
    t = createTr(l, { ...MESSAGES[l], ...CORE_CATALOGS[l] }, { ...MESSAGES.en, ...CORE_CATALOGS.en });
    trs.set(l, t);
  }
  return t;
}

/** Restores the saved choice (call once at start-up). */
export async function loadLocale(): Promise<void> {
  const saved = await AsyncStorage.getItem(KEY).catch(() => null);
  if (isLocale(saved) && saved !== locale) {
    locale = saved;
    listeners.forEach((l) => l());
  }
}

export async function chooseLocale(next: Locale, onChosen?: (l: Locale) => void): Promise<void> {
  locale = next;
  listeners.forEach((l) => l());
  await AsyncStorage.setItem(KEY, next).catch(() => {});
  onChosen?.(next);
}

export const currentLocale = () => locale;
/** Translator for code outside React (data errors). */
export const currentTr = (): Tr => trFor(locale);

export function useLocale(): Locale {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => locale,
  );
}

/** Full translator (all namespaces). */
export function useTr(): Tr {
  const l = useLocale();
  return trFor(l);
}

/** Translator scoped to a namespace, like next-intl's useTranslations("locker"). */
export function useT(ns?: string): (key: string, values?: Record<string, string | number | undefined | null>) => string {
  const tr = useTr();
  return useMemo(() => (key, values) => tr(ns ? `${ns}.${key}` : key, values), [tr, ns]);
}

export const useIntlTag = () => LOCALE_TAGS[useLocale()];
