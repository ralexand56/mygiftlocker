import type { Scene } from "@mgl/core";
import { useEffect } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  FadeOut,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { PALETTE, SCENE_ILLOS } from "./Illos";

const SLOTS = [
  { side: -1, x: 0.02, y: 0.08, size: 96, r: -12 },
  { side: -1, x: 0.1, y: 0.3, size: 72, r: 9 },
  { side: -1, x: 0.0, y: 0.62, size: 104, r: 6 },
  { side: -1, x: 0.08, y: 0.86, size: 80, r: -8 },
  { side: 1, x: 0.02, y: 0.04, size: 84, r: 10 },
  { side: 1, x: 0.1, y: 0.24, size: 100, r: -7 },
  { side: 1, x: 0.0, y: 0.54, size: 76, r: -14 },
  { side: 1, x: 0.06, y: 0.8, size: 104, r: 8 },
] as const;

/**
 * Mobile version of the step backdrop. Keyed by scene, so each step change
 * unmounts the old set (fading out) and springs a new set in from both
 * sides with a zipper stagger. Runs entirely on the UI thread.
 */
export function FlyingBackdrop({ scene }: { scene: Scene }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View key={scene} exiting={FadeOut.duration(250)} style={StyleSheet.absoluteFill}>
        {SLOTS.map((slot, i) => (
          <Flyer key={i} index={i} slot={slot} scene={scene} />
        ))}
      </Animated.View>
    </View>
  );
}

function Flyer({ index, slot, scene }: { index: number; slot: (typeof SLOTS)[number]; scene: Scene }) {
  const { width, height } = useWindowDimensions();
  const illos = SCENE_ILLOS[scene];
  const Illo = illos[(index * 7) % illos.length]!;
  const colors = PALETTE[(index + scene.length) % PALETTE.length]!;

  const x = useSharedValue(slot.side * width * 0.8);
  const rotate = useSharedValue(slot.r * 4);
  const float = useSharedValue(0);
  const order = slot.side < 0 ? index * 2 : (index - 4) * 2 + 1;

  useEffect(() => {
    const delay = 80 + order * 55;
    // Same curve as web: long ease-out, no bounce (matches the reference motion).
    const t = { duration: 950, easing: Easing.bezier(0.16, 1, 0.3, 1), reduceMotion: ReduceMotion.System };
    x.value = withDelay(delay, withTiming(0, t));
    rotate.value = withDelay(delay, withTiming(slot.r, t));
    float.value = withDelay(
      900 + index * 200,
      withRepeat(withSequence(withTiming(-10, { duration: 2400, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.sin) })), -1),
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: float.value }, { rotate: `${rotate.value}deg` }],
  }));

  const pos = slot.side < 0 ? { left: slot.x * width } : { right: slot.x * width };
  return (
    <Animated.View style={[{ position: "absolute", top: slot.y * height, opacity: 0.85 }, pos, style]}>
      <Illo c={colors.c} a={colors.a} size={slot.size} />
    </Animated.View>
  );
}
