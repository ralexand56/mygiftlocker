/** The My Gift Lockers mark (same drawing as the website's LogoMark): a gift-locker whose bow forms the "M". */
import { useEffect, useId } from "react";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";

export function LogoMark({ size = 48 }: { size?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" accessibilityElementsHidden importantForAccessibility="no">
      <Defs>
        <LinearGradient id={`${id}b`} x1="8" y1="22" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#FBD3E3" />
          <Stop offset="1" stopColor="#D9C8FF" />
        </LinearGradient>
        <LinearGradient id={`${id}r`} x1="32" y1="4" x2="32" y2="60" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#FFC9A8" />
          <Stop offset="1" stopColor="#FF9FBF" />
        </LinearGradient>
      </Defs>
      <Rect x="7" y="24" width="50" height="35" rx="11" fill={`url(#${id}b)`} />
      <Path d="M7 33.5h50" stroke="#fff" strokeOpacity={0.7} strokeWidth={1.6} />
      <Path d="M14 40h9M14 45h9M14 50h9" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeOpacity={0.9} />
      <Circle cx="45" cy="43" r="3" fill="#7A5AA6" />
      <Path d="M43.6 44.5h2.8l.9 5.5h-4.6z" fill="#7A5AA6" />
      <Rect x="28.5" y="24" width="7" height="35" fill={`url(#${id}r)`} />
      <Path d="M15 24 L19.5 9.5 Q21 6 23.6 8.6 L32 19 L40.4 8.6 Q43 6 44.5 9.5 L49 24" stroke="#E9779F" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15 24 L19.5 9.5 Q21 6 23.6 8.6 L32 19 L40.4 8.6 Q43 6 44.5 9.5 L49 24" stroke={`url(#${id}r)`} strokeWidth={4.6} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="32" cy="21" r="4.2" fill="#E9779F" />
    </Svg>
  );
}

/** The mark with a gentle wiggle and bob, for loading states. */
export function BusyMark({ size = 56 }: { size?: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withSequence(withTiming(1, { duration: 800, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 800, easing: Easing.inOut(Easing.quad) })), -1);
  }, [t]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -5 * t.value }, { rotate: `${8 * Math.sin(t.value * Math.PI * 2)}deg` }, { scale: 1 + 0.06 * t.value }],
  }));
  return (
    <Animated.View style={style}>
      <LogoMark size={size} />
    </Animated.View>
  );
}
