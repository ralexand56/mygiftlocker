import { describe, expect, it } from "vitest";
import { cleanGiftIdeas, giftContext, giftShopUrl, hasAffiliate, type Person } from "./index";

describe("gift ideas", () => {
  it("cleans model output", () => {
    const ideas = cleanGiftIdeas([
      { title: "Linen robe", why: "She loves slow mornings", priceMin: 60, priceMax: 40, category: "clothing", store: "etsy", searchQuery: "linen robe" },
      { title: "", why: "no title" },
      { title: "Mystery", category: "weird", store: "ebay", priceMin: -3 },
      "nope",
    ]);
    expect(ideas).toHaveLength(2);
    expect(ideas[0]).toMatchObject({ priceMin: 60, priceMax: 60, store: "etsy" });
    expect(ideas[1]).toMatchObject({ category: "other", store: "amazon", priceMin: 0, searchQuery: "Mystery" });
    expect(ideas[0]!.image).toBeUndefined();
  });

  it("keeps only credited Unsplash photos", () => {
    const base = { title: "Mug", searchQuery: "mug" };
    const good = { url: "https://images.unsplash.com/photo-1?w=400", by: "Ana", byUrl: "https://unsplash.com/@ana", color: "#a0b0c0" };
    expect(cleanGiftIdeas([{ ...base, image: good }])[0]!.image).toEqual({ ...good, alt: undefined });
    expect(cleanGiftIdeas([{ ...base, image: { ...good, url: "https://evil.example/x.jpg" } }])[0]!.image).toBeUndefined();
    expect(cleanGiftIdeas([{ ...base, image: { ...good, by: "" } }])[0]!.image).toBeUndefined();
  });

  it("builds shop links, tagged only when configured", () => {
    const amazon = { store: "amazon" as const, searchQuery: "wool socks & mittens" };
    expect(giftShopUrl(amazon)).toBe("https://www.amazon.com/s?k=wool%20socks%20%26%20mittens");
    expect(giftShopUrl(amazon, { amazonTag: "mgl-20" })).toBe("https://www.amazon.com/s?k=wool%20socks%20%26%20mittens&tag=mgl-20");
    const etsy = { store: "etsy" as const, searchQuery: "pottery mug" };
    expect(giftShopUrl(etsy, { amazonTag: "mgl-20" })).toBe("https://www.etsy.com/search?q=pottery%20mug");
    expect(giftShopUrl(etsy, { sovrnKey: "k1" })).toBe("https://redirect.viglink.com/?key=k1&u=https%3A%2F%2Fwww.etsy.com%2Fsearch%3Fq%3Dpottery%2520mug");
    expect(giftShopUrl(etsy, { skimlinksId: "123X" })).toContain("https://go.skimresources.com/?id=123X&url=");
    expect(hasAffiliate({})).toBe(false);
    expect(hasAffiliate({ skimlinksId: "1" })).toBe(true);
  });

  it("summarizes a person without their address", () => {
    const p: Person = {
      id: "1",
      name: "Maya Chen",
      kind: "adult",
      color: "#fff",
      relationship: "Sister",
      sizes: { fit: "womens", top: "S", shoe: 7.5 },
      address: { line1: "1 Secret St", city: "Portland", region: "OR", postalCode: "97201", country: "US" },
      birthday: { month: 12, day: 1, year: 1991 },
      favorites: { likes: "pottery", teams: "Portland Thorns", wishes: ["matcha set"], colors: ["sage"] },
      ownerNote: "Just moved",
      updatedAt: "",
    };
    const text = giftContext(p, new Date(2026, 10, 24));
    expect(text).toContain("Sizes (US): Top S · Shoe 7.5");
    expect(text).toContain("Birthday in 7 days (turning 35)");
    expect(text).toContain("My private notes about them: Just moved");
    expect(text).toContain("Favorite sports teams: Portland Thorns");
    expect(text).not.toContain("Secret St");
  });
});
