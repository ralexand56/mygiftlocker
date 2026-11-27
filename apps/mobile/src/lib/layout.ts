/**
 * Adaptive layout from the window size, not the device model, so it follows the iPhone Duo as it
 * folds and unfolds (and iPad split view, rotation, larger text):
 *
 *   folded Duo   466 × 678 pt  → compact width, SHORT height: tighter heroes, side-by-side headers
 *   regular iPhone ~402 × 874  → compact
 *   unfolded Duo 669 × 951 pt  → EXPANDED: locker list + person side by side
 *   iPad                        → expanded
 *
 * Partly folded (hinge angle about 30–160°, read from iOS 27.1's hinge API in hinge.ts), the list
 * pane ends exactly at the fold so it sits on the left half and the person on the right, with
 * nothing on the crease. iOS reports the angle but not where the hinge is; on the Duo it runs down
 * the middle of the inner screen when held upright.
 *
 * Widths are what's usable after side insets: the folded Duo keeps an 84 pt camera/status strip
 * on its right edge, so its 466 pt screen leaves 382 pt for content.
 */
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { isTented, useHinge } from "./hinge";

/** Below this the app is one column with pushed screens; at or above it, list + detail panes. */
export const SPLIT_MIN_WIDTH = 600;

export interface Layout {
  width: number;
  height: number;
  /** List and detail side by side. */
  split: boolean;
  /** Little vertical room (folded Duo, landscape phones): shrink heroes and stack less. */
  short: boolean;
  /** Width of the list pane in split mode. */
  listWidth: number;
  /** Partly folded with the list on one half: keep content a little away from the crease. */
  atFold: boolean;
  /** Comfortable reading width for single-column content. */
  contentMax: number;
  /** Columns for small tiles (size chips etc.) inside a pane of the given width. */
  tileCols: (paneWidth: number) => number;
}

export function useLayout(): Layout {
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const width = window.width - insets.left - insets.right;
  const height = window.height;
  const split = width >= SPLIT_MIN_WIDTH;
  // The fold is vertical (book-style) only when the inner screen is upright.
  const atFold = split && isTented(useHinge()) && window.height > window.width;
  return {
    width,
    height,
    split,
    short: height < 760,
    listWidth: atFold ? Math.round(window.width / 2 - insets.left) : split ? Math.round(Math.min(400, Math.max(300, width * 0.46))) : width,
    atFold,
    contentMax: 640,
    tileCols: (w) => (w >= 520 ? 4 : w >= 340 ? 3 : 2),
  };
}
