/**
 * The iPhone Duo's hinge, from iOS 27.1's UIHingeInteraction (modules/hinge). Other devices report
 * "unknown" and nothing changes.
 *
 * foldProgress follows the hinge angle continuously on the UI thread (0 = flat, 1 = folded to about
 * 110°), so the layout can part at the fold while the phone is being folded, not after.
 */
import { useSyncExternalStore } from "react";
import { Easing, makeMutable, withTiming } from "react-native-reanimated";
import Hinge, { type HingeState } from "../../modules/hinge";

const NONE: HingeState = { status: "unknown", angle: null };
const FLAT = 180;
const FULLY_PARTED = 110;

/** 0 flat … 1 folded enough to fully separate the panes. */
export function foldAmount(h: HingeState): number {
  if (h.angle === null) return h.status === "partial" ? 1 : 0;
  if (h.status === "closed") return 0;
  return Math.max(0, Math.min(1, (FLAT - h.angle) / (FLAT - FULLY_PARTED)));
}

let state: HingeState = Hinge?.current() ?? NONE;
export const foldProgress = makeMutable(foldAmount(state));
const listeners = new Set<() => void>();

// Always listening (cheap; only the Duo ever sends updates).
Hinge?.addListener("onChange", (next) => {
  const wasParted = foldAmount(state) >= 0.5;
  state = next;
  foldProgress.value = withTiming(foldAmount(next), { duration: 140, easing: Easing.out(Easing.quad) });
  if ((foldAmount(next) >= 0.5) !== wasParted) listeners.forEach((f) => f());
});

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Re-renders only when the panes cross between joined and parted. */
export function useParted(): boolean {
  return useSyncExternalStore(subscribe, () => foldAmount(state) >= 0.5, () => false);
}
