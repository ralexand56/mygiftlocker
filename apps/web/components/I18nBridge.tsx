"use client";

import { useLocale } from "next-intl";
import { useEffect } from "react";
import { useUser } from "@/lib/auth";
import { setCurrentTr, syncLocale, useTr } from "@/lib/i18n";

/** Makes the visitor's language available outside React and to the backend (reminder emails). */
export function I18nBridge() {
  const t = useTr();
  setCurrentTr(t);
  const locale = useLocale();
  const user = useUser();
  useEffect(() => {
    if (user) void syncLocale(locale);
  }, [user, locale]);
  return null;
}
