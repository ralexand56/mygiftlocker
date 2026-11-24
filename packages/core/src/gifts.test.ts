import { describe, expect, it } from "vitest";
import { cleanGifted, cleanShared, dueReminders, giftKey, isGifted, nextEvent, sharedFromPerson, withGifted, type Person } from "./index";

const TODAY = new Date(2026, 10, 24); // Nov 24, 2026
const maya: Person = { id: "m", name: "Maya", kind: "adult", color: "#fff", sizes: { top: "M", shoe: 8 }, birthday: { month: 12, day: 1 }, updatedAt: "" };

describe("gifted locks", () => {
  it("keys one occurrence, so next year's date is unlocked", () => {
    const e = nextEvent(maya, TODAY)!;
    expect(giftKey(e)).toBe("birthday:Birthday:2026-12-01");
    const locked = { ...maya, gifted: withGifted(maya, e, true, TODAY) };
    expect(isGifted(locked, e)).toBe(true);
    const nextYear = nextEvent(locked, new Date(2026, 11, 2))!;
    expect(isGifted(locked, nextYear)).toBe(false);
    expect(withGifted(locked, e, false, TODAY)).toEqual([]);
  });

  it("drops invalid and long-past keys", () => {
    expect(cleanGifted(["birthday:Birthday:2026-12-01", "birthday:Birthday:2025-01-01", "nope", 4, "birthday:Birthday:2026-12-01"], TODAY)).toEqual([
      "birthday:Birthday:2026-12-01",
    ]);
  });

  it("skips reminders for gifted occasions", () => {
    const week = new Date(2026, 10, 24); // Dec 1 is 7 days out
    expect(dueReminders([maya], week)).toHaveLength(1);
    const e = nextEvent(maya, week)!;
    expect(dueReminders([{ ...maya, gifted: [giftKey(e)] }], week)).toHaveLength(0);
  });
});

describe("shared profiles", () => {
  it("keeps sizes and favorites, never address or dates", () => {
    const s = sharedFromPerson({ ...maya, favorites: { likes: "tea", colors: ["green"], wishes: ["x"] }, address: { line1: "1", city: "c", region: "r", postalCode: "1", country: "US" } } as Person);
    expect(s).toEqual({ sizes: { top: "M", shoe: 8 }, favorites: { colors: ["green"], likes: "tea", avoid: undefined, wishlists: undefined } });
  });

  it("rejects junk", () => {
    expect(cleanShared({ sizes: { shoe: 999, top: { evil: 1 } }, favorites: {} })).toBeUndefined();
    expect(cleanShared("x")).toBeUndefined();
  });
});

import { cleanWishlistLinks, linkLabel, normalizeLink } from "./index";

describe("wish list links", () => {
  it("accepts web links, adds https, rejects the rest", () => {
    expect(normalizeLink("amazon.com/hz/wishlist/ls/ABC")).toBe("https://amazon.com/hz/wishlist/ls/ABC");
    expect(normalizeLink("javascript:alert(1)")).toBeNull();
    expect(normalizeLink("not a link")).toBeNull();
    expect(cleanWishlistLinks(["https://etsy.com/x", "https://etsy.com/x", "ftp://a.b", 3])).toEqual(["https://etsy.com/x"]);
  });
  it("names common stores", () => {
    expect(linkLabel("https://www.amazon.com/hz/wishlist/ls/ABC")).toBe("Amazon");
    expect(linkLabel("https://www.target.com/gift-registry/x")).toBe("Target");
    expect(linkLabel("https://shop.example.org/list")).toBe("shop.example.org");
  });
});
