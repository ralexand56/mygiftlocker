import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadNunito } from "@remotion/google-fonts/Nunito";

/** Same typefaces and palette as the website (apps/web/app/globals.css). */
export const display = loadFraunces("normal", { weights: ["600", "700"], subsets: ["latin"] }).fontFamily;
export const sans = loadNunito("normal", { weights: ["600", "700", "800"], subsets: ["latin", "cyrillic"] }).fontFamily;

export const C = {
  cream: "#fef5ec",
  ink: "#4a3b66",
  inkSoft: "#7d7096",
  rose: "#e9779f",
  roseDeep: "#d45c86",
  plum: "#7a5aa6",
  blush: "#fbd3e3",
  lavender: "#d9c8ff",
  mint: "#cdefe3",
  butter: "#ffe7b8",
  sky: "#d4e9ff",
  peach: "#ffc9a8",
  powder: "#a8c4da",
  apricot: "#f2b9a0",
};

export const shadowLift = "0 2px 6px rgba(120,90,90,0.06), 0 50px 100px -30px rgba(120,90,110,0.45)";
export const shadowSoft = "0 1px 2px rgba(120,90,90,0.05), 0 20px 40px -14px rgba(120,90,90,0.18)";
export const brandGradient = `linear-gradient(135deg, ${C.rose}, ${C.plum})`;
