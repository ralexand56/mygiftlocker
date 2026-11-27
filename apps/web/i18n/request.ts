/**
 * The visitor's language: the address's language (/es/… on public pages, via proxy.ts), else
 * their choice (NEXT_LOCALE cookie, set by the language picker), else the browser's
 * Accept-Language, else English. Private URLs stay the same in every language, so invite
 * and exchange links work for whoever opens them, in their own language.
 */
import { isLocale, pickLocale, type Locale } from "@mgl/core";
import { CORE_CATALOGS } from "@mgl/core/catalogs";
import { getRequestConfig } from "next-intl/server";
import { LOCALE_HEADER } from "@/lib/site";
import { LOCALE_COOKIE } from "./cookie";
import { cookies, headers } from "next/headers";
import en from "@mgl/messages/en.json";
import es from "@mgl/messages/es.json";
import fr from "@mgl/messages/fr.json";
import pt from "@mgl/messages/pt.json";
import ru from "@mgl/messages/ru.json";

export { LOCALE_COOKIE };
const WEB: Record<Locale, typeof en> = { en, es, fr, pt, ru };

export async function requestLocale(): Promise<Locale> {
  // A language address (/es/…) wins; proxy.ts passes it on in this header.
  const fromPath = (await headers()).get(LOCALE_HEADER);
  if (isLocale(fromPath)) return fromPath;
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(chosen) ? chosen : pickLocale((await headers()).get("accept-language"));
}

export default getRequestConfig(async () => {
  const locale = await requestLocale();
  return { locale, messages: { ...WEB[locale], ...CORE_CATALOGS[locale] } };
});
