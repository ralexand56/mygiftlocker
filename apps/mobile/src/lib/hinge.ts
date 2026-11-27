/**
 * The iPhone Duo's hinge, from iOS 27.1's UIHingeInteraction (modules/hinge). Other devices report
 * "unknown" and nothing changes. Changes animate the layout (the list sliding to the fold).
 */
import { useSyncExternalStore } from "react";
import { LayoutAnimation } from "react-native";
import Hinge, { type HingeState } from "../../modules/hinge";

const NONE: HingeState = { status: "unknown", angle: null };
let state: HingeState = Hinge?.current() ?? NONE;
const listeners = new Set<() => void>();
let sub: { remove: () => void } | null = null;

function subscribe(l: () => void) {
  listeners.add(l);
  if (Hinge && !sub)
    sub = Hinge.addListener("onChange", (next) => {
      const before = isTented(state);
      state = next;
      if (isTented(next) !== before) LayoutAnimation.configureNext(LayoutAnimation.create(260, "easeInEaseOut", "opacity"));
      listeners.forEach((f) => f());
    });
  return () => {
    listeners.delete(l);
    if (!listeners.size && sub) {
      sub.remove();
      sub = null;
    }
  };
}

/** Partly folded: between about 30° and 160°, like a half-open book. */
export function isTented(h: HingeState): boolean {
  if (h.status === "partial") return h.angle === null || h.angle < 160;
  return h.angle !== null && h.angle >= 30 && h.angle < 160;
}

export function useHinge(): HingeState {
  return useSyncExternalStore(subscribe, () => state, () => NONE);
}
