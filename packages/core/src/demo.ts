import type { Exchange } from "./exchange";
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

/** The signed-in user in demo mode. */
export const DEMO_ME = { id: "me", name: "You" };

const wish = (id: string, rank: number, title: string, url?: string) => ({ id, rank, title, url });

/**
 * Sample exchanges for demo mode: one you organize (still collecting wishes)
 * and one you joined that has already been drawn.
 */
export const DEMO_EXCHANGES: Exchange[] = [
  {
    id: "ex_demo_family",
    name: "Family Christmas 2026",
    date: "2026-12-24",
    budget: { amount: 50, currency: "USD" },
    message: "Dinner at our place at 6. Bring a dessert!",
    adminId: "me",
    wishCount: 3,
    singleLoop: true,
    status: "open",
    participants: [
      { id: "me", name: "You", token: "t_me_family", joinedAt: "2026-11-20T10:00:00Z", wishlist: [wish("w1", 1, "Cozy wool socks"), wish("w2", 2, "Le Creuset mug")] },
      { id: "pt_maya", name: "Maya Chen", token: "t_maya", joinedAt: "2026-11-20T12:00:00Z", wishlist: [wish("w3", 1, "Matcha whisk set"), wish("w4", 2, "Linen apron"), wish("w5", 3, "Pottery class voucher")] },
      { id: "pt_james", name: "James Okafor", token: "t_james", joinedAt: "2026-11-21T09:00:00Z", wishlist: [wish("w6", 1, "Rapha cycling cap"), wish("w7", 2, "Hario V60 kettle")] },
      { id: "pt_lily", name: "Lily (age 6)", token: "t_lily", managedBy: "me", joinedAt: "2026-11-21T09:30:00Z", wishlist: [wish("w8", 1, "LEGO Friends treehouse"), wish("w9", 2, "Dinosaur nightlight")] },
      { id: "pt_dana", name: "Dana Ruiz", token: "t_dana", joinedAt: "2026-11-22T18:00:00Z", wishlist: [] },
    ],
    exclusions: [["me", "pt_lily"]],
    createdAt: "2026-11-20T10:00:00Z",
  },
  {
    id: "ex_demo_office",
    name: "Office Secret Santa",
    date: "2026-12-18",
    budget: { amount: 25, currency: "USD" },
    adminId: "pt_priya",
    wishCount: 3,
    singleLoop: false,
    status: "drawn",
    participants: [
      { id: "pt_priya", name: "Priya Shah", token: "t_priya", joinedAt: "2026-11-10T10:00:00Z", wishlist: [wish("w10", 1, "Desk plant"), wish("w11", 2, "Fancy hot sauce trio")] },
      { id: "me", name: "You", token: "t_me_office", joinedAt: "2026-11-11T10:00:00Z", wishlist: [wish("w12", 1, "AirTag 4-pack")] },
      { id: "pt_sam", name: "Sam Lee", token: "t_sam", joinedAt: "2026-11-11T11:00:00Z", wishlist: [wish("w13", 1, "Aeropress"), wish("w14", 2, "Notebook — dot grid", "https://www.leuchtturm1917.us")] },
      { id: "pt_noor", name: "Noor Haddad", token: "t_noor", joinedAt: "2026-11-12T08:00:00Z", wishlist: [wish("w15", 1, "Puzzle (1000 pc)")] },
    ],
    exclusions: [],
    assignments: { pt_priya: "pt_noor", me: "pt_sam", pt_sam: "pt_priya", pt_noor: "me" },
    createdAt: "2026-11-10T10:00:00Z",
    drawnAt: "2026-11-20T17:00:00Z",
  },
];
