import { initials } from "@mgl/core";
import * as Haptics from "expo-haptics";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { Fragment, type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type TextStyle, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { colors, fonts, shadow, springs } from "@/lib/theme";

export const tap = () => Haptics.selectionAsync().catch(() => {}); // no haptics on simulators

export function Icon({ name, size = 18, color = colors.ink, style }: { name: SymbolViewProps["name"]; size?: number; color?: string; style?: ViewStyle }) {
  return <SymbolView name={name} size={size} tintColor={color} style={[{ width: size, height: size }, style]} />;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
  busy,
  icon,
  style,
  small,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "soft" | "ghost" | "gradient" | "danger";
  disabled?: boolean;
  busy?: boolean;
  icon?: SymbolViewProps["name"];
  style?: ViewStyle;
  small?: boolean;
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const bg = { primary: colors.ink, soft: colors.white, ghost: "transparent", gradient: colors.plum, danger: colors.roseDeep }[variant];
  const fg = variant === "soft" || variant === "ghost" ? colors.ink : colors.white;
  return (
    <Animated.View style={[anim, style, (disabled || busy) && { opacity: 0.5 }]}>
      <Pressable
        accessibilityRole="button"
        disabled={disabled || busy}
        onPressIn={() => (scale.value = withSpring(0.96, springs.snappy))}
        onPressOut={() => (scale.value = withSpring(1, springs.snappy))}
        onPress={() => {
          tap();
          onPress();
        }}
        style={[styles.btn, small && styles.btnSmall, { backgroundColor: bg }, variant !== "ghost" && shadow]}
      >
        {busy ? <ActivityIndicator color={fg} size="small" /> : icon ? <Icon name={icon} size={small ? 14 : 16} color={fg} /> : null}
        <Text style={[styles.btnText, small && { fontSize: 14 }, { color: fg }]} numberOfLines={1}>
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

/** Pill selector; the selected chip springs up in rose. */
export function Chips<T extends string | number>({
  options,
  value,
  onChange,
  render,
  required,
}: {
  options: readonly T[];
  value?: T;
  onChange: (v: T | undefined) => void;
  render?: (v: T) => string;
  /** Tapping the selected chip keeps it selected. */
  required?: boolean;
}) {
  return (
    <View style={styles.chips}>
      {options.map((o) => (
        <Chip key={String(o)} label={render ? render(o) : String(o)} active={o === value} onPress={() => onChange(o === value && !required ? undefined : o)} />
      ))}
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const style = useAnimatedStyle(() => ({
    backgroundColor: withSpring(active ? colors.rose : "rgba(255,255,255,0.9)", springs.snappy),
    transform: [{ scale: withSpring(active ? 1.04 : 1, springs.snappy) }],
  }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={() => {
        tap();
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

export function Tag({ bg, children }: { bg: string; children: ReactNode }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ fontFamily: fonts.black, fontSize: 12, color: colors.inkSoft }}>{children}</Text>
    </View>
  );
}

export function SectionTitle({ icon, children }: { icon: SymbolViewProps["name"]; children: ReactNode }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <Icon name={icon} size={15} color={colors.rose} />
      <Text style={styles.eyebrow}>{children}</Text>
    </View>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      {children}
      {hint && <Text style={[styles.body, { fontSize: 13, marginTop: 6 }]}>{hint}</Text>}
    </View>
  );
}

export function Input(props: TextInputProps) {
  return <TextInput placeholderTextColor="#A99FBD" {...props} style={[styles.input, props.multiline && { minHeight: 96, textAlignVertical: "top" }, props.style]} />;
}

/** Renders a message with <b>…</b> (or other) tags from the shared catalogs. */
export function Rich({ text, style, tags = {} }: { text: string; style?: TextStyle; tags?: Record<string, TextStyle> }) {
  const parts = text.split(/(<\/?\w+>)/);
  const out: ReactNode[] = [];
  let active: string | null = null;
  parts.forEach((part, i) => {
    const open = part.match(/^<(\w+)>$/);
    const close = part.match(/^<\/(\w+)>$/);
    if (open) active = open[1]!;
    else if (close) active = null;
    else if (part)
      out.push(
        active ? (
          <Text key={i} style={tags[active] ?? { fontFamily: fonts.black, color: colors.ink }}>
            {part}
          </Text>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      );
  });
  return <Text style={style}>{out}</Text>;
}

export function ErrorText({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <Text style={{ fontFamily: fonts.bold, color: colors.roseDeep, fontSize: 14, marginTop: 8 }}>{children}</Text>;
}

export const styles = StyleSheet.create({
  btn: { borderRadius: 999, paddingHorizontal: 22, paddingVertical: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  btnSmall: { paddingHorizontal: 14, paddingVertical: 9 },
  btnText: { fontFamily: fonts.black, fontSize: 16 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, minWidth: 48, alignItems: "center" },
  chipText: { fontFamily: fonts.black, fontSize: 15 },
  // Solid (not translucent) so iOS can compute the shadow path cheaply.
  card: { backgroundColor: "#FFFDFB", borderRadius: 24, padding: 18 },
  tile: { backgroundColor: colors.white, borderRadius: 16, padding: 12, ...shadow, shadowOpacity: 0.06 },
  eyebrow: { fontFamily: fonts.black, fontSize: 12, letterSpacing: 1.2, color: colors.rose, textTransform: "uppercase" },
  h1: { fontFamily: fonts.display, fontSize: 34, lineHeight: 38, color: colors.ink },
  h2: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  h3: { fontFamily: fonts.display, fontSize: 19, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 16, color: colors.inkSoft, lineHeight: 22 },
  strong: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  label: { fontFamily: fonts.bold, fontSize: 13, color: colors.inkSoft, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: colors.white, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontFamily: fonts.body, fontSize: 16, color: colors.ink },
});
