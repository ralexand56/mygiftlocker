import { describe, expect, it } from "vitest";
import { cleanShares, DEFAULT_SHARES, describeShares, likelyCardFor, sharesFromAsk, syncedFields } from "./index";

const self = {
  sizes: { top: "M" },
  favorites: { likes: "tea", wishlists: ["amazon.com/hz/wishlist/ls/A", "javascript:x"] },
  birthday: { month: 3, day: 4 },
  address: { line1: "1 Main St", city: "Austin", region: "TX", postalCode: "78701", country: "US" },
};

describe("connections", () => {
  it("copies only shared sections", () => {
    const f = syncedFields(self, { sizes: true, favorites: false, dates: true, address: false });
    expect(f).toEqual({ sizes: { top: "M" }, birthday: { month: 3, day: 4 }, anniversary: null });
  });
  it("cleans wish list links and address", () => {
    const f = syncedFields(self, { sizes: false, favorites: true, dates: false, address: true });
    expect(f.favorites?.wishlists).toEqual(["https://amazon.com/hz/wishlist/ls/A"]);
    expect(f.address?.city).toBe("Austin");
  });
  it("defaults and cleans shares", () => {
    expect(cleanShares({ sizes: false, address: "yes" })).toEqual({ ...DEFAULT_SHARES, sizes: false });
    expect(sharesFromAsk({ sizes: true, address: true, dates: false, favorites: true })).toEqual({ sizes: true, favorites: true, dates: false, address: true });
    expect(describeShares({ sizes: true, favorites: true, dates: false, address: false })).toBe("sizes and favorites & wishes");
  });
});

describe("likelyCardFor", () => {
  const people = [
    { id: "1", name: "Rico Alexander", kind: "adult" as const },
    { id: "2", name: "Maya Lopez", kind: "adult" as const },
    { id: "3", name: "Maya Jr", kind: "child" as const },
  ];
  it("prefers an exact name, then a unique first name; never kids", () => {
    expect(likelyCardFor(people, "rico  alexander")?.id).toBe("1");
    expect(likelyCardFor(people, "Rico A.")?.id).toBe("1");
    expect(likelyCardFor(people, "Maya")?.id).toBe("2");
    expect(likelyCardFor(people, "Sam")).toBeUndefined();
    expect(likelyCardFor([...people, { id: "4", name: "Rico Suave", kind: "adult" as const }], "Rico B")).toBeUndefined();
  });
});
