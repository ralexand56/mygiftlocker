import { describe, expect, it } from "vitest";
import { addressFormat, cleanAddress, countryForLocale, countryOptions, formatAddress, shortPlace, validateAddress, type Address } from "./index";

const us: Address = { line1: "41 Willow Lane", city: "Portland", region: "OR", postalCode: "97205", country: "US" };
const mx: Address = { line1: "Av. Álvaro Obregón 120", line2: "Roma Norte", city: "Cuauhtémoc", region: "CDMX", postalCode: "06700", country: "MX" };
const br: Address = { line1: "Av. Paulista, 1000", line2: "Apto 52, Bela Vista", city: "São Paulo", region: "SP", postalCode: "01310-100", country: "BR" };
const co: Address = { line1: "Calle 93 #11-27", line2: "Chicó", city: "Bogotá", region: "DC", postalCode: "", country: "CO" };

describe("international addresses", () => {
  it("accepts well-formed addresses for each country", () => {
    for (const a of [us, mx, br, co]) expect(validateAddress(a), a.country).toEqual({});
  });

  it("applies each country's rules", () => {
    expect(validateAddress({ ...us, postalCode: "9720" }).postalCode).toBe("Use the format 94110");
    expect(validateAddress({ ...mx, line2: "" }).line2).toMatch(/Colonia/);
    expect(validateAddress({ ...br, postalCode: "01310100" }).postalCode).toBe("Use the format 01310-100");
    expect(validateAddress({ ...co, region: "Narnia" }).region).toBe("Choose a department");
    expect(validateAddress({ line1: "1 Rue", city: "Paris", region: "", postalCode: "", country: "FR" })).toEqual({});
  });

  it("formats in local order and names foreign countries", () => {
    expect(formatAddress(us)).toEqual(["41 Willow Lane", "Portland, OR 97205"]);
    expect(formatAddress(mx)).toEqual(["Av. Álvaro Obregón 120", "Roma Norte", "C.P. 06700 Cuauhtémoc, Ciudad de México", "Mexico"]);
    expect(formatAddress(br)).toEqual(["Av. Paulista, 1000", "Apto 52, Bela Vista", "São Paulo - SP", "CEP 01310-100", "Brazil"]);
    expect(formatAddress(br, "BR").at(-1)).toBe("CEP 01310-100");
    expect(shortPlace(co)).toBe("Bogotá, Bogotá D.C., Colombia");
  });

  it("normalizes postal codes when cleaning untrusted input", () => {
    expect(cleanAddress({ ...br, postalCode: "01310100" })?.postalCode).toBe("01310-100");
    expect(cleanAddress({ line1: "24 Sussex Dr", city: "Ottawa", region: "ON", postalCode: "k1m1m4", country: "ca" })?.postalCode).toBe("K1M 1M4");
    expect(cleanAddress({ line1: "10 Downing St", city: "London", postalCode: "sw1a2aa", country: "GB" })?.postalCode).toBe("SW1A 2AA");
    expect(cleanAddress({ line1: "x".repeat(500), city: "Portland", region: "OR", postalCode: "97205" })?.line1).toHaveLength(200);
    expect(cleanAddress({ line1: "", city: "Portland", region: "OR", postalCode: "97205" })).toBeUndefined();
    expect(cleanAddress("nope")).toBeUndefined();
  });

  it("lists priority countries first and reads the locale", () => {
    expect(countryOptions().slice(0, 6).map((c) => c.code)).toEqual(["US", "CA", "MX", "BR", "CO", "GB"]);
    expect(countryOptions().length).toBeGreaterThan(200);
    expect(countryForLocale("pt-BR")).toBe("BR");
    expect(countryForLocale("en")).toBeNull();
    expect(addressFormat("ZZ").regionRequired).toBe(false);
  });
});
