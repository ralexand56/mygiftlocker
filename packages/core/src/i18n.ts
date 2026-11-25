/**
 * Languages and message formatting shared by web, mobile and the backend.
 *
 * Messages use ICU syntax ({name}, {n, plural, one {…} few {…} other {…}},
 * {x, select, …}), the same as next-intl, so one catalog serves the website
 * (through next-intl) and the reminder emails (through createTr here).
 *
 * Shared text lives in catalogs/core.<locale>.json under "core" and "email".
 * Core functions that produce text take an optional `t`; without one they speak English.
 */
import coreEn from "./catalogs/core.en.json";

export const LOCALES = ["en", "es", "fr", "pt", "ru"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/** Each language in its own words, for the language picker. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  pt: "Português (Brasil)",
  ru: "Русский",
};

/** BCP 47 tags for Intl (dates, lists, country names). */
export const LOCALE_TAGS: Record<Locale, string> = { en: "en-US", es: "es", fr: "fr", pt: "pt-BR", ru: "ru" };

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

/** Best supported language for an Accept-Language header ("pt-PT,pt;q=0.9,en;q=0.8" → "pt"). */
export function pickLocale(acceptLanguage: string | null | undefined): Locale {
  const ranked = (acceptLanguage ?? "")
    .split(",")
    .map((part, i) => {
      const [tag, ...params] = part.trim().split(";");
      const q = Number(params.find((p) => p.trim().startsWith("q="))?.split("=")[1] ?? 1);
      return { lang: tag!.trim().toLowerCase().split("-")[0]!, q: Number.isFinite(q) ? q : 0, i };
    })
    .filter((x) => x.lang && x.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i);
  return ranked.map((x) => x.lang).find(isLocale) ?? DEFAULT_LOCALE;
}

export type MessageValues = Record<string, string | number | undefined | null>;

/** A translate function bound to one language. */
export interface Tr {
  (key: string, values?: MessageValues): string;
  locale: Locale;
}

type Catalog = { [key: string]: string | Catalog };

function lookup(messages: Catalog | undefined, key: string): string | undefined {
  let node: string | Catalog | undefined = messages;
  for (const part of key.split(".")) {
    if (!node || typeof node === "string") return undefined;
    node = node[part];
  }
  return typeof node === "string" ? node : undefined;
}

/** Translator over a catalog, falling back to English, then to the key itself. */
export function createTr(locale: Locale, messages: object, fallback: object = coreEn): Tr {
  const t = ((key: string, values?: MessageValues) => {
    const msg = lookup(messages as Catalog, key) ?? lookup(fallback as Catalog, key);
    return msg === undefined ? key : formatMessage(msg, values, locale);
  }) as Tr;
  t.locale = locale;
  return t;
}

/** English, for callers that don't pass a translator (mobile, tests). */
export const defaultT: Tr = createTr("en", coreEn);

/** Intl tag for a translator's language. */
export const intlTag = (t: Pick<Tr, "locale">) => LOCALE_TAGS[t.locale];

/** "a, b and c" in the translator's language. */
export function listJoin(items: string[], t: Tr = defaultT): string {
  try {
    return new Intl.ListFormat(intlTag(t), { type: "conjunction" }).format(items);
  } catch {
    return items.join(", ");
  }
}

/**
 * ICU message formatting: simple arguments, plural (with =N, #) and select.
 * Enough for our catalogs; anything richer belongs in next-intl on the web.
 */
export function formatMessage(msg: string, values: MessageValues = {}, locale: Locale = DEFAULT_LOCALE): string {
  const tag = LOCALE_TAGS[locale];
  let i = 0;
  const ws = () => {
    while (i < msg.length && /\s/.test(msg[i]!)) i++;
  };

  // Reads text up to an unmatched "}" (left unconsumed) or the end. `num` is the value "#" stands for.
  const text = (num?: number): string => {
    let out = "";
    while (i < msg.length) {
      const c = msg[i]!;
      if (c === "}") return out;
      if (c === "{") {
        i++;
        out += arg(num);
      } else if (c === "#" && num !== undefined) {
        out += new Intl.NumberFormat(tag).format(num);
        i++;
      } else if (c === "'" && msg[i + 1] === "'") {
        out += "'";
        i += 2;
      } else if (c === "'" && (msg[i + 1] === "{" || msg[i + 1] === "}" || msg[i + 1] === "#")) {
        const end = msg.indexOf("'", i + 1);
        out += msg.slice(i + 1, end < 0 ? undefined : end);
        i = end < 0 ? msg.length : end + 1;
      } else {
        out += c;
        i++;
      }
    }
    return out;
  };

  const until = (stops: string) => {
    const start = i;
    while (i < msg.length && !stops.includes(msg[i]!)) i++;
    return msg.slice(start, i).trim();
  };

  // After "{": name [, type [, branches]] "}"
  const arg = (outerNum?: number): string => {
    const name = until(",}");
    const v = values[name];
    if (msg[i] === "}") {
      i++;
      return v === undefined || v === null ? `{${name}}` : String(v);
    }
    i++; // ","
    const type = until(",}");
    if (msg[i] === "}") {
      i++;
      return typeof v === "number" && type === "number" ? new Intl.NumberFormat(tag).format(v) : String(v ?? "");
    }
    i++; // ","
    const n = typeof v === "number" ? v : Number(v);
    const branches = new Map<string, string>();
    for (;;) {
      ws();
      if (i >= msg.length) break;
      if (msg[i] === "}") {
        i++;
        break;
      }
      const key = until("{ \t\n");
      ws();
      if (msg[i] !== "{") break;
      i++;
      branches.set(key, text(type === "plural" ? n : outerNum));
      i++; // "}"
    }
    if (type === "plural") {
      const exact = branches.get(`=${n}`);
      if (exact !== undefined) return exact;
      const cat = Number.isFinite(n) ? new Intl.PluralRules(tag).select(n) : "other";
      return branches.get(cat) ?? branches.get("other") ?? "";
    }
    return branches.get(String(v)) ?? branches.get("other") ?? "";
  };

  return text();
}

/** Keys of the server's user-facing errors (core.server.*). */
export type ServerErrorKey = keyof (typeof coreEn)["core"]["server"];

let reverse: Map<string, string> | undefined;
/**
 * A server or draw error (sent in English) in the translator's language.
 * Unknown messages come back unchanged.
 */
export function translateError(message: string, t: Tr): string {
  if (t.locale === "en") return message;
  if (!reverse) {
    reverse = new Map();
    for (const [k, v] of Object.entries(coreEn.core.server)) reverse.set(v, `core.server.${k}`);
    for (const [k, v] of Object.entries(coreEn.core.draw)) reverse.set(v, `core.draw.${k}`);
  }
  const key = reverse.get(message);
  return key ? t(key) : message;
}

/** Shape of a shared catalog (every language has the same keys as English). */
export type CoreCatalog = typeof coreEn;
