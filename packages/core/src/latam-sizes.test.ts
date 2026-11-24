import { describe, expect, it } from "vitest";
import { SIZE_SYSTEMS, convertAlpha, convertRing, convertShoe, convertWaist, convertWomensNumeric, summarizeSizes } from "./index";

describe("Latin American size systems", () => {
  it("matches Nike Brasil's official adult shoe chart", () => {
    // Rows from static.nike.com.br/web/prd/tabela-de-medidas.html
    expect([7, 8.5, 10, 12].map((us) => convertShoe(us, "mens")!.BR)).toEqual(["38", "40", "42", "44"]);
    expect([7, 8, 9, 11].map((us) => convertShoe(us, "womens")!.BR)).toEqual(["36", "37.5", "39", "41.5"]);
  });

  it("labels Mexican shoes by centimeters, like JP", () => {
    expect(convertShoe(9, "mens")!.MX).toBe("27");
    expect(convertShoe(8, "womens")!.MX).toBe("25");
  });

  it("uses the Colombian rule of thumb, marked approximate", () => {
    expect(convertShoe(9, "mens")!.CO).toBe("≈40");
    expect(convertShoe(7, "womens")!.CO).toBe("≈37");
  });

  it("estimates from EU where Nike Brasil has no row (kids, big sizes)", () => {
    expect([13, 14, 15].map((us) => convertShoe(us, "mens")!.BR)).toEqual(["46", "≈47", "≈48"]);
    expect(convertShoe(10, "kids")!.BR).toMatch(/^≈\d+/);
  });

  it("maps letters to PP/P/M/G/GG (BR) and XCH/CH/M/G/EG (MX)", () => {
    expect(["XS", "S", "M", "L", "XL", "XXL"].map((s) => convertAlpha(s as "M").BR)).toEqual(["PP", "P", "M", "G", "GG", "XG"]);
    expect(["XS", "S", "M", "L", "XL"].map((s) => convertAlpha(s as "M").MX)).toEqual(["XCH", "CH", "M", "G", "EG"]);
    expect(convertAlpha("L").CO).toBe("L");
  });

  it("converts women's numeric sizes", () => {
    expect(["2", "4", "6", "8", "10"].map((us) => convertWomensNumeric(us)!.BR)).toEqual(["36", "38", "40", "42", "44"]);
    expect(convertWomensNumeric("0")!.MX).toBe("≈24");
    expect(convertWomensNumeric("6")!.CO).toBe("≈8");
  });

  it("gives every system a value for every conversion", () => {
    for (const conv of [convertShoe(9, "mens")!, convertAlpha("M"), convertWaist(32), convertRing(7), convertWomensNumeric("8")!]) {
      for (const sys of SIZE_SYSTEMS) expect(conv[sys], sys).toBeTruthy();
    }
    expect(convertWaist(32).BR).toBe("≈42");
  });

  it("includes foot length in the summary", () => {
    expect(summarizeSizes({ shoe: 9, footLengthCm: 26.5 })).toBe("Shoe 9 · Foot 26.5 cm");
  });
});
