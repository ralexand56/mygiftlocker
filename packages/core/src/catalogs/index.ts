/**
 * Every language's shared catalog. Server-side only (the backend and the website's
 * request config); client code gets just the visitor's language through next-intl.
 */
import type { Locale } from "../i18n";
import en from "./core.en.json";
import es from "./core.es.json";
import fr from "./core.fr.json";
import pt from "./core.pt.json";
import ru from "./core.ru.json";

export const CORE_CATALOGS: Record<Locale, typeof en> = { en, es, fr, pt, ru };
