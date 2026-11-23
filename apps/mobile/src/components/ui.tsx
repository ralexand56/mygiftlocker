import { initials } from "@mgl/core";
import * as Haptics from "expo-haptics";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { colors, fonts, shadow, springs } from "@/lib/theme";

export function Button({ title, onPress, variant = "primary", disabled, style }: { title: string; onPress: () => void; variant?: "primary" | "soft" | "ghost"; disabled?: boolean; style?: ViewStyle }) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const bg = variant === "primary" ? colors.ink : variant === "soft" ? colors.white : "transparent";
  return (
    <Animated.View style={[anim, style, disabled && { opacity: 0.4 }]}>
      <Pressable
        disabled={disabled}
        onPressIn={() => (scale.value = withSpring(0.96, springs.snappy))}
        onPressOut={() => (scale.value = withSpring(1, springs.snappy))}
        onPress={() => {
          Haptics.selectionAsync().catch(() => {}); // no haptics on simulators
          onPress();
        }}
        style={[styles.btn, { backgroundColor: bg }, variant !== "ghost" && shadow]}
      >
        <Text style={[styles.btnText, { color: variant === "primary" ? colors.white : colors.ink }]}>{title}</Text>
      </Pressable>
    </Animated.View>
  );
}

/** Pill selector; the selected chip springs up with the brand gradient color. */
export function Chips<T extends string | number>({ options, value, onChange, render }: { options: readonly T[]; value?: T; onChange: (v: T | undefined) => void; render?: (v: T) => string }) {
  return (
    <View style={styles.chips}>
      {options.map((o) => (
        <Chip key={String(o)} label={render ? render(o) : String(o)} active={o === value} onPress={() => onChange(o === value ? undefined : o)} />
      ))}
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const style = useAnimatedStyle(() => ({
    backgroundColor: withSpring(active ? colors.rose : "rgba(255,255,255,0.85)", springs.snappy),
    transform: [{ scale: withSpring(active ? 1.06 : 1, springs.snappy) }],
  }));
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {}); // no haptics on simulators
        onPress();
      }}
    >
      <Animated.View style={[styles.chip, style]}>
        <Text style={[styles.chipText, { color: active ? colors.white : colors.ink }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, shadow, style]}>{children}</View>;
}

export function Avatar({ name, color, size = 48 }: { name: string; color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontFamily: fonts.display, fontSize: size * 0.38, color: colors.ink }}>{initials(name)}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  btn: { borderRadius: 999, paddingHorizontal: 22, paddingVertical: 14, alignItems: "center" },
  btnText: { fontFamily: fonts.black, fontSize: 16 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, minWidth: 48, alignItems: "center" },
  chipText: { fontFamily: fonts.black, fontSize: 15 },
  // Solid (not translucent) so iOS can compute the shadow path cheaply.
  card: { backgroundColor: "#FFFDFB", borderRadius: 28, padding: 22 },
  eyebrow: { fontFamily: fonts.black, fontSize: 12, letterSpacing: 1.2, color: colors.rose, textTransform: "uppercase" },
  h1: { fontFamily: fonts.display, fontSize: 30, lineHeight: 34, color: colors.ink },
  h2: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 16, color: colors.inkSoft },
  label: { fontFamily: fonts.bold, fontSize: 13, color: colors.inkSoft, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: colors.white, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontFamily: fonts.body, fontSize: 16, color: colors.ink },
});
