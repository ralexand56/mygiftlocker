/**
 * React Native ports of the web illustrations (apps/web/components/illustrations.tsx).
 * Same 120×120 artboards and path data, rendered with react-native-svg.
 */
import type { Scene } from "@mgl/core";
import type { ReactElement } from "react";
import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";

type P = { c: string; a: string; size: number };
type Illo = (p: P) => ReactElement;

const Tee: Illo = ({ c, a, size }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120">
    <Path d="M40 18 L20 27 L6 50 L24 60 L32 49 L32 106 Q32 110 36 110 L84 110 Q88 110 88 106 L88 49 L96 60 L114 50 L100 27 L80 18 Q72 30 60 30 Q48 30 40 18 Z" fill={c} />
    <Path d="M40 18 Q48 30 60 30 Q72 30 80 18 Q70 24 60 24 Q50 24 40 18 Z" fill={a} />
  </Svg>
);
const Sweater: Illo = ({ c, a, size }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120">
    <Path d="M40 16 L22 24 Q14 28 12 38 L4 94 L22 98 L32 50 L32 104 L88 104 L88 50 L98 98 L116 94 L108 38 Q106 28 98 24 L80 16 Q70 28 60 28 Q50 28 40 16 Z" fill={c} />
    <Rect x="32" y="98" width="56" height="10" rx="3" fill={a} />
    <Path d="M46 60 l7 7 l7 -7 l7 7 l7 -7" stroke={a} strokeWidth="3" fill="none" strokeLinecap="round" />
  </Svg>
);
const Jeans: Illo = ({ c, a, size }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120">
    <Path d="M30 12 H90 L98 110 H70 L60 46 L50 110 H22 Z" fill={c} />
    <Rect x="30" y="12" width="60" height="9" fill={a} />
    <Path d="M60 21 V46" stroke={a} strokeWidth="2.5" />
  </Svg>
);
const Dress: Illo = ({ c, a, size }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120">
    <Path d="M46 10 L52 10 Q60 22 68 10 L74 10 L76 34 Q72 44 78 52 L104 108 Q60 116 16 108 L42 52 Q48 44 44 34 Z" fill={c} />
    <Path d="M44 46 Q60 52 76 46 L78 52 Q60 58 42 52 Z" fill={a} />
  </Svg>
);
const Puffer: Illo = ({ c, a, size }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120">
    <Path d="M40 12 Q60 22 80 12 L100 22 Q110 28 110 40 L114 96 L96 98 L92 54 L92 108 L28 108 L28 54 L24 98 L6 96 L10 40 Q10 28 20 22 Z" fill={c} />
    {[38, 56, 74, 92].map((y) => (
      <Path key={y} d={`M28 ${y} Q60 ${y + 6} 92 ${y}`} stroke={a} strokeWidth="2.5" fill="none" />
    ))}
    <Path d="M60 20 V108" stroke={a} strokeWidth="3" />
  </Svg>
);
const Sneaker: Illo = ({ c, a, size }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120">
    <Path d="M8 76 Q8 54 20 50 L42 42 Q52 56 68 58 L96 64 Q114 68 114 84 L114 88 H8 Z" fill={c} />
    <Rect x="6" y="84" width="110" height="12" rx="6" fill={a} />
  </Svg>
);
const Boot: Illo = ({ c, a, size }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120">
    <Path d="M30 10 H66 L66 64 Q68 72 82 74 L100 78 Q112 82 112 94 L112 98 H30 Z" fill={c} />
    <Rect x="28" y="96" width="86" height="12" rx="4" fill={a} />
  </Svg>
);
const Ring: Illo = ({ c, a, size }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120">
    <Circle cx="60" cy="72" r="32" fill="none" stroke={c} strokeWidth="10" />
    <Path d="M44 30 L52 18 H68 L76 30 L60 48 Z" fill={a} />
  </Svg>
);
const House: Illo = ({ c, a, size }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120">
    <Path d="M20 58 L60 22 L100 58 V104 H20 Z" fill={c} />
    <Path d="M12 60 L60 16 L108 60" stroke={a} strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <Rect x="50" y="72" width="20" height="32" rx="4" fill={a} />
  </Svg>
);
const Cake: Illo = ({ c, a, size }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120">
    <Rect x="18" y="62" width="84" height="42" rx="8" fill={c} />
    <Rect x="28" y="40" width="64" height="26" rx="6" fill={c} opacity={0.85} />
    <Path d="M18 74 Q28 84 38 74 Q48 84 58 74 Q68 84 78 74 Q88 84 102 74" stroke={a} strokeWidth="4" fill="none" />
    {[44, 60, 76].map((x) => (
      <Rect key={x} x={x - 2.5} y="24" width="5" height="16" rx="2" fill={a} />
    ))}
  </Svg>
);
const Balloon: Illo = ({ c, a, size }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120">
    <Ellipse cx="60" cy="46" rx="28" ry="34" fill={c} />
    <Path d="M60 86 Q52 98 62 106 Q70 112 60 118" stroke={a} strokeWidth="2" fill="none" />
  </Svg>
);
const Heart: Illo = ({ c, size }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120">
    <Path d="M60 104 C 20 78, 8 56, 18 36 C 28 18, 52 20, 60 40 C 68 20, 92 18, 102 36 C 112 56, 100 78, 60 104 Z" fill={c} />
  </Svg>
);
const Gift: Illo = ({ c, a, size }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120">
    <Rect x="16" y="48" width="88" height="60" rx="8" fill={c} />
    <Rect x="10" y="36" width="100" height="18" rx="6" fill={c} />
    <Rect x="53" y="36" width="14" height="72" fill={a} />
    <Path d="M60 36 C 50 18, 30 18, 34 30 C 37 38, 52 38, 60 36 C 68 38, 83 38, 86 30 C 90 18, 70 18, 60 36 Z" fill={a} />
  </Svg>
);
const Star: Illo = ({ c, a, size }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120">
    <Path d="M60 10 L74 42 L108 46 L82 70 L90 104 L60 86 L30 104 L38 70 L12 46 L46 42 Z" fill={c} stroke={a} strokeWidth="4" strokeLinejoin="round" />
  </Svg>
);

export const SCENE_ILLOS: Record<Scene, Illo[]> = {
  welcome: [Gift, Heart, Star, Balloon],
  fit: [Tee, Dress, Jeans, Sneaker],
  tops: [Tee, Sweater],
  bottoms: [Jeans],
  dresses: [Dress],
  outerwear: [Puffer, Sweater],
  shoes: [Sneaker, Boot],
  accessories: [Ring, Star],
  address: [House, Gift],
  dates: [Cake, Balloon, Heart],
  favorites: [Gift, Star, Heart],
  kids: [Balloon, Star, Gift],
  done: [Gift, Heart, Star, Balloon, Cake],
};

export const PALETTE = [
  { c: "#FBD3E3", a: "#E9779F" },
  { c: "#D9C8FF", a: "#9B7FD1" },
  { c: "#CDEFE3", a: "#6DBE9F" },
  { c: "#FFE7B8", a: "#F0B04F" },
  { c: "#FFD8C9", a: "#F08C6C" },
  { c: "#D4E9FF", a: "#6FA3DA" },
];

export { Gift as GiftIllo };
