/**
 * The invite / connection form is data-driven so web (Next.js) and mobile (Expo)
 * render the same flow. Each step has a `scene` that drives the animated
 * backdrop (shirts fly in for tops, shoes for shoes, etc).
 */
import type { InvitePayload } from "./invite";
import type { Fit } from "./sizes";
import { defaultT, type Tr } from "./i18n";

/** A step's heading text in the translator's language. */
export function stepText(step: Pick<StepDef, "id" | "subtitle">, t: Tr = defaultT): { eyebrow: string; title: string; subtitle?: string } {
  const k = `core.steps.${step.id}`;
  return { eyebrow: t(`${k}.eyebrow`), title: t(`${k}.title`), subtitle: step.subtitle ? t(`${k}.subtitle`) : undefined };
}

export type Scene = "welcome" | "fit" | "tops" | "bottoms" | "dresses" | "outerwear" | "shoes" | "accessories" | "address" | "dates" | "favorites" | "kids" | "done";

export type StepId =
  | "welcome"
  | "fit"
  | "tops"
  | "bottoms"
  | "dresses"
  | "outerwear"
  | "shoes"
  | "accessories"
  | "address"
  | "dates"
  | "favorites"
  | "kids"
  | "review";

export interface StepDef {
  id: StepId;
  scene: Scene;
  eyebrow: string;
  title: string;
  subtitle?: string;
  optional: boolean;
}

export const STEP_DEFS: Record<StepId, StepDef> = {
  welcome: { id: "welcome", scene: "welcome", eyebrow: "Hello", title: "Let's get your gifts just right", optional: false },
  fit: { id: "fit", scene: "fit", eyebrow: "Sizing", title: "Which section do you usually shop?", subtitle: "We'll tailor the size options to match.", optional: false },
  tops: { id: "tops", scene: "tops", eyebrow: "Tops", title: "What size shirt do you wear?", subtitle: "Tees, sweaters, button-ups.", optional: true },
  bottoms: { id: "bottoms", scene: "bottoms", eyebrow: "Bottoms", title: "And your pants size?", optional: true },
  dresses: { id: "dresses", scene: "dresses", eyebrow: "Dresses", title: "Dresses & skirts", optional: true },
  outerwear: { id: "outerwear", scene: "outerwear", eyebrow: "Outerwear", title: "Jackets & coats", optional: true },
  shoes: { id: "shoes", scene: "shoes", eyebrow: "Shoes", title: "What's your shoe size?", optional: true },
  accessories: { id: "accessories", scene: "accessories", eyebrow: "Extras", title: "Hats, rings & little things", subtitle: "Totally optional — but great for surprise jewelry.", optional: true },
  address: { id: "address", scene: "address", eyebrow: "Shipping", title: "Where should gifts be sent?", subtitle: "Only shared with people you connect with.", optional: true },
  dates: { id: "dates", scene: "dates", eyebrow: "Celebrations", title: "Dates worth celebrating", subtitle: "The year is optional — we won't tell.", optional: true },
  favorites: { id: "favorites", scene: "favorites", eyebrow: "Favorites", title: "A few of your favorite things", optional: true },
  kids: { id: "kids", scene: "kids", eyebrow: "Little ones", title: "Shopping for your kids too?", subtitle: "Add children you manage — you stay in control of their info.", optional: true },
  review: { id: "review", scene: "done", eyebrow: "All set", title: "Look good?", optional: false },
};

/** Which steps to show for a given invite + chosen fit. */
export function stepsFor(ask: InvitePayload["ask"], fit?: Fit): StepDef[] {
  const ids: StepId[] = ["welcome"];
  if (ask.sizes) {
    ids.push("fit", "tops", "bottoms");
    if (fit !== "mens") ids.push("dresses");
    ids.push("outerwear", "shoes", "accessories");
  }
  if (ask.address) ids.push("address");
  if (ask.dates) ids.push("dates");
  if (ask.favorites) ids.push("favorites");
  if (ask.kids) ids.push("kids");
  ids.push("review");
  return ids.map((id) => STEP_DEFS[id]);
}
