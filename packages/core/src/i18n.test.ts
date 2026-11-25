import { describe, expect, it } from "vitest";
import webEn from "../../../apps/web/messages/en.json";
import webEs from "../../../apps/web/messages/es.json";
import webFr from "../../../apps/web/messages/fr.json";
import webPt from "../../../apps/web/messages/pt.json";
import webRu from "../../../apps/web/messages/ru.json";
import { CORE_CATALOGS } from "./catalogs";
import { createTr, formatMessage, LOCALES, pickLocale, translateError } from "./i18n";
import { describeDays, formatPartialDate, occasionName, summarizeSizes } from "./index";

type Tree = { [k: string]: string | Tree };
const flat = (o: Tree, pre = ""): Record<string, string> =>
  Object.fromEntries(Object.entries(o).flatMap(([k, v]) => (typeof v === "string" ? [[pre + k, v]] : Object.entries(flat(v, `${pre}${k}.`)))));
/** {name}-style arguments and <tag>s a message uses (plural/select keywords aside). */
const args = (m: string) => [...new Set([...m.matchAll(/(?<!(?:=\d+|zero|one|two|few|many|other)\s?)\{(\w+)[,}]/g)].map((x) => x[1]!).concat([...m.matchAll(/<(\w+)>/g)].map((x) => `<${x[1]}>`)))].sort();

const PROVIDED: Record<string, string[]> = { "core.address.errors.choose": ["field", "fieldLower"] };

// The website's own catalogs, checked here so one test run covers every language.
const web: Record<string, Tree> = { en: webEn, es: webEs, fr: webFr, pt: webPt, ru: webRu };

describe("catalogs", () => {
  for (const [name, catalogs] of [
    ["core", CORE_CATALOGS as unknown as Record<string, Tree>],
    ["web", web],
  ] as const) {
    const en = flat(catalogs.en!);
    for (const l of LOCALES.filter((l) => l !== "en")) {
      it(`${name} ${l}: same keys and arguments as English`, () => {
        const other = flat(catalogs[l]!);
        expect(Object.keys(other).sort()).toEqual(Object.keys(en).sort());
        for (const [k, v] of Object.entries(en)) {
          // Keys where the code passes extra values a language may use instead.
          const alternatives = PROVIDED[k];
          if (alternatives) expect(args(other[k]!).every((x) => alternatives.includes(x)), `${l} ${k}`).toBe(true);
          else expect(args(other[k]!), `${l} ${k}`).toEqual(args(v));
        }
        // No apostrophe right before an argument: ICU would treat it as a quote.
        for (const [k, v] of Object.entries(other)) expect(v, `${l} ${k}`).not.toMatch(/'\{/);
      });
    }
  }
});

describe("formatMessage", () => {
  it("handles plurals with exact matches and Russian categories", () => {
    const m = "{n, plural, =0 {сегодня} one {# день} few {# дня} many {# дней} other {# дня}}";
    expect([0, 1, 2, 5, 21].map((n) => formatMessage(m, { n }, "ru"))).toEqual(["сегодня", "1 день", "2 дня", "5 дней", "21 день"]);
    expect(formatMessage("{a} and {b}", { a: "x", b: "y" })).toBe("x and y");
    expect(formatMessage("Rico's {v}", { v: "gift" })).toBe("Rico's gift");
  });
  it("speaks each language through core helpers", () => {
    const es = createTr("es", CORE_CATALOGS.es);
    const ru = createTr("ru", CORE_CATALOGS.ru);
    expect(describeDays(5, es)).toBe("en 5 días");
    expect(describeDays(3, ru)).toBe("через 3 дня");
    expect(summarizeSizes({ top: "M", shoe: 9 }, es)).toBe("Camisa M · Zapato 9");
    expect(formatPartialDate({ month: 11, day: 24 }, es)).toBe("24 de noviembre");
    expect(occasionName("Maya Chen", { kind: "birthday", label: "Birthday" }, es)).toBe("cumpleaños de Maya");
    expect(occasionName("Maya Chen", { kind: "holiday", label: "Christmas", holidayId: "christmas" }, es)).toBe("navidad de Maya".replace("navidad", "Navidad"));
  });
  it("translates server errors sent in English", () => {
    const fr = createTr("fr", CORE_CATALOGS.fr);
    expect(translateError("Please sign in.", fr)).toBe("Veuillez vous connecter.");
    expect(translateError("Something unexpected", fr)).toBe("Something unexpected");
  });
});

describe("pickLocale", () => {
  it("follows the browser's preferences", () => {
    expect(pickLocale("pt-BR,pt;q=0.9,en;q=0.8")).toBe("pt");
    expect(pickLocale("de-DE,fr;q=0.7")).toBe("fr");
    expect(pickLocale("de-DE")).toBe("en");
    expect(pickLocale(undefined)).toBe("en");
  });
});

describe("step headings about someone else", () => {
  it("names the person when the owner edits their card", async () => {
    const { STEP_DEFS, stepText } = await import("./steps");
    const en = createTr("en", CORE_CATALOGS.en);
    expect(stepText(STEP_DEFS.shoes, en).title).toBe("What's your shoe size?");
    expect(stepText(STEP_DEFS.shoes, en, "Maya").title).toBe("What's Maya's shoe size?");
    expect(stepText(STEP_DEFS.address, en, "Maya").subtitle).toBe("Only you see it in your locker.");
    for (const l of LOCALES) {
      const t = createTr(l, CORE_CATALOGS[l]);
      for (const step of Object.values(STEP_DEFS)) {
        const s = stepText(step, t, "Maya");
        expect(s.title).not.toContain("core.");
        if (step.subtitle) expect(s.subtitle).not.toContain("core.");
      }
    }
  });
});
