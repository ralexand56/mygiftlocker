import { describe, expect, it } from "vitest";
import {
  exchangeJoinMessage,
  smsHref,
  cleanWishlist,
  isPlausibleToken,
  DrawError,
  convertShoe,
  convertWomensNumeric,
  daysUntil,
  decodeInvite,
  drawNames,
  encodeInvite,
  isValidPartialDate,
  stepsFor,
  upcomingMilestone,
  validateDraw,
  DEFAULT_ASK,
} from "./index";

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

const people = ["ana", "ben", "cara", "dev", "eli", "fay"];

describe("drawNames", () => {
  it("never assigns anyone to themselves", () => {
    for (let s = 1; s < 200; s++) {
      const a = drawNames(people, { random: seeded(s) });
      expect(validateDraw(people, a)).toBe(true);
    }
  });

  it("respects exclusions symmetrically", () => {
    const exclusions: [string, string][] = [["ana", "ben"], ["cara", "dev"], ["eli", "fay"]];
    for (let s = 1; s < 200; s++) {
      const a = drawNames(people, { exclusions, random: seeded(s) });
      expect(a.ana).not.toBe("ben");
      expect(a.ben).not.toBe("ana");
      expect(a.cara).not.toBe("dev");
      expect(validateDraw(people, a, { exclusions })).toBe(true);
    }
  });

  it("avoids repeating last year's match", () => {
    const previous = [drawNames(people, { random: seeded(7) })];
    const a = drawNames(people, { previous, random: seeded(8) });
    for (const g of people) expect(a[g]).not.toBe(previous[0]![g]);
  });

  it("builds a single loop when asked", () => {
    const a = drawNames(people, { singleLoop: true, random: seeded(3) });
    const seen = new Set<string>();
    let cur = "ana";
    for (let i = 0; i < people.length; i++) {
      seen.add(cur);
      cur = a[cur]!;
    }
    expect(cur).toBe("ana");
    expect(seen.size).toBe(people.length);
  });

  it("errors on impossible constraints", () => {
    expect(() => drawNames(["a", "b"])).toThrow(DrawError);
    const ex: [string, string][] = [["a", "b"], ["a", "c"]];
    expect(() => drawNames(["a", "b", "c"], { exclusions: ex })).toThrow(/impossible|available/i);
  });

  it("is roughly uniform", () => {
    const counts: Record<string, number> = {};
    const r = seeded(42);
    for (let i = 0; i < 3000; i++) {
      const a = drawNames(people, { random: r });
      counts[a.ana!] = (counts[a.ana!] ?? 0) + 1;
    }
    for (const p of people.slice(1)) expect(counts[p]).toBeGreaterThan(450);
  });
});

describe("sizes", () => {
  it("converts shoes", () => {
    expect(convertShoe(10, "mens")).toEqual({ US: "10", UK: "9.5", EU: "44", JP: "28 cm" });
    expect(convertShoe(8, "womens")?.EU).toBe("38.5");
    expect(convertShoe(99, "mens")).toBeNull();
  });
  it("converts women's numeric", () => {
    expect(convertWomensNumeric("4")).toMatchObject({ UK: "8", EU: "36" });
  });
});

describe("dates", () => {
  it("validates", () => {
    expect(isValidPartialDate({ month: 2, day: 29 })).toBe(true);
    expect(isValidPartialDate({ month: 2, day: 29, year: 2023 })).toBe(false);
    expect(isValidPartialDate({ month: 4, day: 31 })).toBe(false);
  });
  it("counts days until next occurrence", () => {
    const from = new Date(2026, 11, 20); // Dec 20
    expect(daysUntil({ month: 12, day: 25 }, from)).toBe(5);
    expect(daysUntil({ month: 1, day: 1 }, from)).toBe(12);
    expect(upcomingMilestone({ month: 1, day: 1, year: 2000 }, from)).toBe(27);
  });
});

describe("invites", () => {
  it("builds sms links with an encoded body", () => {
    const href = smsHref(exchangeJoinMessage("Family & Friends", "https://mygiftlockers.com/exchange/abc/join"));
    expect(href.startsWith("sms:?&body=")).toBe(true);
    expect(decodeURIComponent(href.slice("sms:?&body=".length))).toContain("Family & Friends");
    expect(href).not.toContain(" ");
  });
  it("round-trips unicode", () => {
    const p = { v: 1 as const, id: "x", from: { name: "Zoë 🎁" }, ask: DEFAULT_ASK, createdAt: "2026-01-01" };
    expect(decodeInvite(encodeInvite(p))).toEqual(p);
    expect(decodeInvite("garbage")).toBeNull();
  });
  it("skips dresses for men's fit", () => {
    expect(stepsFor(DEFAULT_ASK, "mens").map((s) => s.id)).not.toContain("dresses");
    expect(stepsFor({ ...DEFAULT_ASK, sizes: false, address: false }).map((s) => s.id)).toEqual(["welcome", "dates", "favorites", "review"]);
  });
});


describe("api helpers", () => {
  it("cleans wishlists", () => {
    const out = cleanWishlist(
      [{ title: "  Socks " }, { title: "" }, { title: "Kettle", url: "javascript:alert(1)" }, { title: "Mug", url: "https://x.com/m" }, { title: "Extra" }],
      3,
    );
    expect(out.map((w) => [w.title, w.url, w.rank])).toEqual([
      ["Socks", undefined, 1],
      ["Kettle", undefined, 2],
      ["Mug", "https://x.com/m", 3],
    ]);
    expect(cleanWishlist("nope", 3)).toEqual([]);
  });
  it("validates tokens", () => {
    expect(isPlausibleToken("abcDEF123_-abcDEF123_-xy")).toBe(true);
    expect(isPlausibleToken("short")).toBe(false);
    expect(isPlausibleToken({})).toBe(false);
  });
});
