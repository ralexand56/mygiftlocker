import type { Person } from "./people";

/** Sample people so the locker is never empty in demo mode (web + mobile). */
export const DEMO_PEOPLE: Person[] = [
  {
    id: "seed-maya",
    name: "Maya Chen",
    kind: "adult",
    relationship: "Sister",
    color: "#FBD3E3",
    sizes: { fit: "womens", top: "S", womensNumeric: "4", dress: "4", outerwear: "S", shoe: 7.5, ring: 6 },
    birthday: { month: 3, day: 14 },
    favorites: { colors: ["sage", "cream"], likes: "Pottery, matcha, anything linen", avoid: "No scented candles please" },
    address: { line1: "41 Willow Lane", city: "Portland", region: "OR", postalCode: "97205", country: "US" },
    updatedAt: new Date().toISOString(),
  },
  {
    id: "seed-james",
    name: "James Okafor",
    kind: "adult",
    relationship: "Best friend",
    color: "#D4E9FF",
    sizes: { fit: "mens", top: "L", waist: 34, inseam: 32, outerwear: "L", shoe: 11, shoeWidth: "Wide" },
    birthday: { month: 8, day: 2, year: 1991 },
    anniversary: { month: 6, day: 21 },
    favorites: { likes: "Cycling, single-origin coffee, vinyl", wishes: ["Rapha cycling cap", "Hario V60 kettle"] },
    updatedAt: new Date().toISOString(),
  },
  {
    id: "seed-lily",
    name: "Lily (age 6)",
    kind: "child",
    relationship: "Daughter",
    color: "#CDEFE3",
    sizes: { fit: "kids", top: "S (6-7)", bottomAlpha: "S (6-7)", shoe: 12 },
    birthday: { month: 12, day: 9, year: 2020 },
    favorites: { likes: "Dinosaurs, glitter, LEGO Friends", colors: ["purple"] },
    guardians: ["me"],
    updatedAt: new Date(Date.now() - 150 * 86_400_000).toISOString(),
  },
];
