/**
 * The visitor's language: their choice (NEXT_LOCALE cookie, set by the language picker),
 * else the browser's Accept-Language, else English. URLs stay the same in every language,
 * so invite and exchange links work for whoever opens them, in their own language.
 */
import { isLocale, pickLocale, type Locale } from "@mgl/core";
import { CORE_CATALOGS } from "@mgl/core/catalogs";
import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import en from "../messages/en.json";
import es from "../messages/es.json";
import fr from "../messages/fr.json";
import pt from "../messages/pt.json";
import ru from "../messages/ru.json";

export const LOCALE_COOKIE = "NEXT_LOCALE";
const WEB: Record<Locale, typeof en> = { en, es, fr, pt, ru };

export async function requestLocale(): Promise<Locale> {
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(chosen) ? chosen : pickLocale((await headers()).get("accept-language"));
}

export default getRequestConfig(async () => {
  const locale = await requestLocale();
  return { locale, messages: { ...WEB[locale], ...CORE_CATALOGS[locale] } };
});
