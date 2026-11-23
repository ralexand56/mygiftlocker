/**
 * Soft, flat pastel illustrations used by the flying backdrop.
 * Each takes a base color `c` and an accent `a` so the same shape can be
 * re-tinted many times without new assets.
 */
import type { Scene } from "@mgl/core";
import type { ReactElement } from "react";

type P = { c: string; a: string };
type Illo = (p: P) => ReactElement;

const S = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden>
    {children}
  </svg>
);

// ---- tops -----------------------------------------------------------------
const Tee: Illo = ({ c, a }) => (
  <S>
    <path d="M40 18 L20 27 L6 50 L24 60 L32 49 L32 106 Q32 110 36 110 L84 110 Q88 110 88 106 L88 49 L96 60 L114 50 L100 27 L80 18 Q72 30 60 30 Q48 30 40 18 Z" fill={c} />
    <path d="M40 18 Q48 30 60 30 Q72 30 80 18 Q70 24 60 24 Q50 24 40 18 Z" fill={a} />
    <path d="M24 60 L32 49 M96 60 L88 49" stroke={a} strokeWidth="3" strokeLinecap="round" />
  </S>
);
const Sweater: Illo = ({ c, a }) => (
  <S>
    <path d="M40 16 L22 24 Q14 28 12 38 L4 94 L22 98 L32 50 L32 104 L88 104 L88 50 L98 98 L116 94 L108 38 Q106 28 98 24 L80 16 Q70 28 60 28 Q50 28 40 16 Z" fill={c} />
    <rect x="32" y="98" width="56" height="10" rx="3" fill={a} />
    <rect x="3" y="90" width="20" height="9" rx="3" transform="rotate(8 13 94)" fill={a} />
    <rect x="97" y="90" width="20" height="9" rx="3" transform="rotate(-8 107 94)" fill={a} />
    <path d="M40 16 Q50 28 60 28 Q70 28 80 16" stroke={a} strokeWidth="5" fill="none" />
    <path d="M46 60 l7 7 l7 -7 l7 7 l7 -7" stroke={a} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </S>
);
const ButtonUp: Illo = ({ c, a }) => (
  <S>
    <path d="M42 16 L22 24 L8 92 L24 96 L32 52 L32 108 L88 108 L88 52 L96 96 L112 92 L98 24 L78 16 L60 30 Z" fill={c} />
    <path d="M42 16 L60 30 L50 40 Z M78 16 L60 30 L70 40 Z" fill={a} />
    <path d="M60 30 L60 108" stroke={a} strokeWidth="2" />
    {[44, 58, 72, 86, 100].map((y) => (
      <circle key={y} cx="64" cy={y} r="2.4" fill={a} />
    ))}
    <rect x="38" y="54" width="14" height="12" rx="2" fill="none" stroke={a} strokeWidth="2" />
  </S>
);
const Polo: Illo = ({ c, a }) => (
  <S>
    <path d="M42 18 L22 27 L8 50 L26 60 L33 49 L33 106 L87 106 L87 49 L94 60 L112 50 L98 27 L78 18 L60 28 Z" fill={c} />
    <path d="M42 18 L52 34 L60 28 L68 34 L78 18 L60 26 Z" fill={a} />
    <path d="M60 28 L60 50" stroke={a} strokeWidth="3" />
    <circle cx="60" cy="38" r="2" fill="#fff" />
    <circle cx="60" cy="46" r="2" fill="#fff" />
  </S>
);

// ---- bottoms --------------------------------------------------------------
const Jeans: Illo = ({ c, a }) => (
  <S>
    <path d="M30 12 H90 L98 110 H70 L60 46 L50 110 H22 Z" fill={c} />
    <rect x="30" y="12" width="60" height="9" fill={a} />
    <path d="M36 21 Q40 34 52 34 M84 21 Q80 34 68 34" stroke={a} strokeWidth="2.5" fill="none" />
    <path d="M60 21 V46" stroke={a} strokeWidth="2.5" />
    <path d="M24 100 H50 M70 100 H96" stroke={a} strokeWidth="2.5" />
  </S>
);
const Shorts: Illo = ({ c, a }) => (
  <S>
    <path d="M26 28 H94 L104 88 H68 L60 60 L52 88 H16 Z" fill={c} />
    <rect x="26" y="28" width="68" height="10" rx="3" fill={a} />
    <path d="M56 38 l-3 12 M64 38 l3 12" stroke={a} strokeWidth="2.5" strokeLinecap="round" />
  </S>
);
const Skirt: Illo = ({ c, a }) => (
  <S>
    <path d="M38 22 H82 L104 100 Q60 110 16 100 Z" fill={c} />
    <rect x="38" y="20" width="44" height="10" rx="3" fill={a} />
    {[30, 46, 60, 74, 90].map((x) => (
      <path key={x} d={`M${60 + (x - 60) * 0.35} 30 L${x} 102`} stroke={a} strokeWidth="2" opacity=".7" />
    ))}
  </S>
);

// ---- dresses --------------------------------------------------------------
const Dress: Illo = ({ c, a }) => (
  <S>
    <path d="M46 10 L52 10 Q60 22 68 10 L74 10 L76 34 Q72 44 78 52 L104 108 Q60 116 16 108 L42 52 Q48 44 44 34 Z" fill={c} />
    <path d="M44 46 Q60 52 76 46 L78 52 Q60 58 42 52 Z" fill={a} />
    <circle cx="60" cy="50" r="4" fill={a} />
  </S>
);
const Gown: Illo = ({ c, a }) => (
  <S>
    <path d="M50 8 L50 30 Q44 42 48 50 Q30 80 22 112 L98 112 Q90 80 72 50 Q76 42 70 30 L70 8 Q60 16 50 8 Z" fill={c} />
    <path d="M48 50 Q60 56 72 50" stroke={a} strokeWidth="4" fill="none" />
    <path d="M40 80 Q60 90 80 80 M32 98 Q60 108 88 98" stroke={a} strokeWidth="2" fill="none" opacity=".7" />
  </S>
);

// ---- outerwear ------------------------------------------------------------
const Puffer: Illo = ({ c, a }) => (
  <S>
    <path d="M40 12 Q60 22 80 12 L100 22 Q110 28 110 40 L114 96 L96 98 L92 54 L92 108 L28 108 L28 54 L24 98 L6 96 L10 40 Q10 28 20 22 Z" fill={c} />
    {[38, 56, 74, 92].map((y) => (
      <path key={y} d={`M28 ${y} Q60 ${y + 6} 92 ${y}`} stroke={a} strokeWidth="2.5" fill="none" />
    ))}
    <path d="M60 20 V108" stroke={a} strokeWidth="3" />
    <path d="M40 12 Q60 22 80 12 L76 6 Q60 14 44 6 Z" fill={a} />
  </S>
);
const Blazer: Illo = ({ c, a }) => (
  <S>
    <path d="M40 14 L20 22 Q12 26 12 36 L8 98 L26 100 L30 54 L30 110 L90 110 L90 54 L94 100 L112 98 L108 36 Q108 26 100 22 L80 14 L60 70 Z" fill={c} />
    <path d="M40 14 L48 40 L42 46 L56 64 L60 70 Z M80 14 L72 40 L78 46 L64 64 L60 70 Z" fill={a} />
    <circle cx="60" cy="82" r="2.6" fill={a} />
    <circle cx="60" cy="94" r="2.6" fill={a} />
    <path d="M38 80 H50 M70 80 H82" stroke={a} strokeWidth="2.5" />
  </S>
);
const Beanie: Illo = ({ c, a }) => (
  <S>
    <circle cx="60" cy="22" r="11" fill={a} />
    <path d="M20 84 Q20 32 60 30 Q100 32 100 84 Z" fill={c} />
    <rect x="16" y="78" width="88" height="20" rx="8" fill={a} />
    {[30, 44, 58, 72, 86].map((x) => (
      <path key={x} d={`M${x} 80 V96`} stroke={c} strokeWidth="3" opacity=".6" />
    ))}
  </S>
);

// ---- shoes ----------------------------------------------------------------
const Sneaker: Illo = ({ c, a }) => (
  <S>
    <path d="M8 76 Q8 54 20 50 L42 42 Q52 56 68 58 L96 64 Q114 68 114 84 L114 88 H8 Z" fill={c} />
    <rect x="6" y="84" width="110" height="12" rx="6" fill={a} />
    <path d="M44 48 L52 60 M52 46 L60 58 M60 50 L66 58" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    <path d="M70 70 Q86 64 100 74" stroke={a} strokeWidth="3" fill="none" strokeLinecap="round" />
  </S>
);
const Heel: Illo = ({ c, a }) => (
  <S>
    <path d="M14 46 Q22 40 30 48 L58 80 Q70 88 90 86 L108 86 Q114 86 114 92 L114 96 H66 Q46 96 30 78 L22 70 L22 104 L14 104 Z" fill={c} />
    <path d="M14 46 Q22 40 30 48 L36 54 L18 60 Z" fill={a} />
    <rect x="13" y="96" width="10" height="10" rx="2" fill={a} />
    <path d="M66 96 H114" stroke={a} strokeWidth="4" strokeLinecap="round" />
  </S>
);
const Boot: Illo = ({ c, a }) => (
  <S>
    <path d="M30 10 H66 L66 64 Q68 72 82 74 L100 78 Q112 82 112 94 L112 98 H30 Z" fill={c} />
    <rect x="28" y="96" width="86" height="12" rx="4" fill={a} />
    <rect x="30" y="10" width="36" height="12" fill={a} />
    <path d="M66 30 h-10 M66 40 h-10 M66 50 h-10" stroke={a} strokeWidth="3" strokeLinecap="round" />
  </S>
);

// ---- accessories ----------------------------------------------------------
const Ring: Illo = ({ c, a }) => (
  <S>
    <circle cx="60" cy="72" r="32" fill="none" stroke={c} strokeWidth="10" />
    <path d="M44 30 L52 18 H68 L76 30 L60 48 Z" fill={a} />
    <path d="M44 30 H76 M52 18 L56 30 L60 48 L64 30 L68 18" stroke="#fff" strokeWidth="1.6" fill="none" opacity=".8" />
  </S>
);
const Cap: Illo = ({ c, a }) => (
  <S>
    <path d="M18 76 Q18 34 60 32 Q98 34 100 72 Z" fill={c} />
    <path d="M60 72 Q90 66 116 80 Q90 90 60 82 Z" fill={a} />
    <circle cx="58" cy="32" r="5" fill={a} />
    <path d="M58 34 Q44 50 42 74 M58 34 Q72 50 76 72" stroke={a} strokeWidth="2" fill="none" opacity=".6" />
  </S>
);
const Scarf: Illo = ({ c, a }) => (
  <S>
    <path d="M24 30 Q60 50 96 30 L96 46 Q60 66 24 46 Z" fill={c} />
    <path d="M70 52 L84 108 L66 110 L56 56 Z" fill={c} />
    {[74, 78, 82].map((x, i) => (
      <path key={x} d={`M${x - 8 + i * 2} 108 v8`} stroke={a} strokeWidth="3" strokeLinecap="round" />
    ))}
    <path d="M60 62 L78 82 M64 78 L80 96" stroke={a} strokeWidth="4" />
  </S>
);

// ---- address --------------------------------------------------------------
const House: Illo = ({ c, a }) => (
  <S>
    <path d="M20 58 L60 22 L100 58 V104 H20 Z" fill={c} />
    <path d="M12 60 L60 16 L108 60" stroke={a} strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="50" y="72" width="20" height="32" rx="4" fill={a} />
    <circle cx="80" cy="74" r="8" fill="#fff" opacity=".8" />
  </S>
);
const Envelope: Illo = ({ c, a }) => (
  <S>
    <rect x="12" y="30" width="96" height="66" rx="10" fill={c} />
    <path d="M14 36 L60 70 L106 36" stroke={a} strokeWidth="5" fill="none" strokeLinejoin="round" />
    <path d="M60 58 C 56 50, 46 52, 48 60 C 50 66, 60 70, 60 70 C 60 70, 70 66, 72 60 C 74 52, 64 50, 60 58 Z" fill={a} />
  </S>
);
const Parcel: Illo = ({ c, a }) => (
  <S>
    <path d="M60 14 L106 36 L106 88 L60 110 L14 88 L14 36 Z" fill={c} />
    <path d="M14 36 L60 58 L106 36 M60 58 V110" stroke={a} strokeWidth="3" fill="none" />
    <path d="M36 25 L82 47 V62" stroke={a} strokeWidth="7" fill="none" strokeLinejoin="round" />
  </S>
);

// ---- dates ----------------------------------------------------------------
const Cake: Illo = ({ c, a }) => (
  <S>
    <rect x="18" y="62" width="84" height="42" rx="8" fill={c} />
    <rect x="28" y="40" width="64" height="26" rx="6" fill={c} opacity=".85" />
    <path d="M18 74 Q28 84 38 74 Q48 84 58 74 Q68 84 78 74 Q88 84 102 74" stroke={a} strokeWidth="4" fill="none" />
    {[44, 60, 76].map((x) => (
      <g key={x}>
        <rect x={x - 2.5} y="24" width="5" height="16" rx="2" fill={a} />
        <path d={`M${x} 14 Q${x + 5} 20 ${x} 23 Q${x - 5} 20 ${x} 14 Z`} fill="#FFC36B" />
      </g>
    ))}
  </S>
);
const Balloon: Illo = ({ c, a }) => (
  <S>
    <ellipse cx="60" cy="46" rx="28" ry="34" fill={c} />
    <path d="M56 80 L64 80 L60 86 Z" fill={c} />
    <path d="M60 86 Q52 98 62 106 Q70 112 60 118" stroke={a} strokeWidth="2" fill="none" />
    <ellipse cx="50" cy="34" rx="6" ry="10" fill="#fff" opacity=".5" />
  </S>
);
const Heart: Illo = ({ c, a }) => (
  <S>
    <path d="M60 104 C 20 78, 8 56, 18 36 C 28 18, 52 20, 60 40 C 68 20, 92 18, 102 36 C 112 56, 100 78, 60 104 Z" fill={c} />
    <path d="M30 40 Q34 32 42 32" stroke={a} strokeWidth="5" strokeLinecap="round" fill="none" />
  </S>
);
const Calendar: Illo = ({ c, a }) => (
  <S>
    <rect x="16" y="22" width="88" height="84" rx="12" fill={c} />
    <path d="M16 34 Q16 22 28 22 H92 Q104 22 104 34 V44 H16 Z" fill={a} />
    <rect x="34" y="12" width="7" height="20" rx="3" fill={a} />
    <rect x="79" y="12" width="7" height="20" rx="3" fill={a} />
    <path d="M60 92 C 44 82, 40 74, 44 66 C 48 60, 56 61, 60 68 C 64 61, 72 60, 76 66 C 80 74, 76 82, 60 92 Z" fill={a} />
  </S>
);

// ---- gifts / favorites ----------------------------------------------------
const Gift: Illo = ({ c, a }) => (
  <S>
    <rect x="16" y="48" width="88" height="60" rx="8" fill={c} />
    <rect x="10" y="36" width="100" height="18" rx="6" fill={c} />
    <rect x="53" y="36" width="14" height="72" fill={a} />
    <path d="M60 36 C 50 18, 30 18, 34 30 C 37 38, 52 38, 60 36 C 68 38, 83 38, 86 30 C 90 18, 70 18, 60 36 Z" fill={a} />
  </S>
);
const Star: Illo = ({ c, a }) => (
  <S>
    <path d="M60 10 L74 42 L108 46 L82 70 L90 104 L60 86 L30 104 L38 70 L12 46 L46 42 Z" fill={c} stroke={a} strokeWidth="4" strokeLinejoin="round" />
  </S>
);
const Teddy: Illo = ({ c, a }) => (
  <S>
    <circle cx="34" cy="30" r="13" fill={c} />
    <circle cx="86" cy="30" r="13" fill={c} />
    <circle cx="34" cy="30" r="6" fill={a} />
    <circle cx="86" cy="30" r="6" fill={a} />
    <circle cx="60" cy="50" r="30" fill={c} />
    <ellipse cx="60" cy="98" rx="30" ry="20" fill={c} />
    <ellipse cx="60" cy="60" rx="12" ry="9" fill={a} />
    <circle cx="60" cy="56" r="3.5" fill="#4A3B66" />
    <circle cx="48" cy="44" r="3" fill="#4A3B66" />
    <circle cx="72" cy="44" r="3" fill="#4A3B66" />
  </S>
);
const Onesie: Illo = ({ c, a }) => (
  <S>
    <path d="M44 14 L22 26 L12 46 L28 54 L34 46 L34 84 L46 108 L74 108 L86 84 L86 46 L92 54 L108 46 L98 26 L76 14 Q60 28 44 14 Z" fill={c} />
    <path d="M46 108 L52 92 H68 L74 108" fill={a} />
    <circle cx="60" cy="62" r="9" fill={a} />
  </S>
);

const PALETTE: P[] = [
  { c: "#FBD3E3", a: "#E9779F" },
  { c: "#D9C8FF", a: "#9B7FD1" },
  { c: "#CDEFE3", a: "#6DBE9F" },
  { c: "#FFE7B8", a: "#F0B04F" },
  { c: "#FFD8C9", a: "#F08C6C" },
  { c: "#D4E9FF", a: "#6FA3DA" },
];

export const SCENE_ILLOS: Record<Scene, Illo[]> = {
  welcome: [Gift, Heart, Star, Balloon, Tee, Sneaker],
  fit: [Tee, Dress, Jeans, Sneaker, Blazer, Skirt],
  tops: [Tee, Sweater, ButtonUp, Polo],
  bottoms: [Jeans, Shorts, Skirt],
  dresses: [Dress, Gown, Skirt],
  outerwear: [Puffer, Blazer, Beanie, Scarf],
  shoes: [Sneaker, Heel, Boot],
  accessories: [Ring, Cap, Beanie, Scarf],
  address: [House, Envelope, Parcel],
  dates: [Cake, Balloon, Calendar, Heart],
  favorites: [Gift, Star, Heart, Balloon],
  kids: [Teddy, Onesie, Balloon, Star],
  done: [Gift, Heart, Star, Balloon, Cake],
};

export function paletteAt(i: number): P {
  return PALETTE[i % PALETTE.length]!;
}

export { Gift as GiftIllo, Tee as TeeIllo, Sneaker as SneakerIllo, Dress as DressIllo, Cake as CakeIllo, House as HouseIllo, Star as StarIllo, Heart as HeartIllo };
