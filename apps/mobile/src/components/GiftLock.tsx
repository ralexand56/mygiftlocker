import { Pressable, Text, View } from "react-native";
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated";
import { useT } from "@/lib/i18n";
import { colors, fonts, springs } from "@/lib/theme";
import { Icon, tap } from "./ui";

/** "Gift bought" lock for one occasion. Locked occasions skip their reminder emails. */
export function GiftLock({ locked, onToggle, label, showText, size = 34 }: { locked: boolean; onToggle: () => void; label: string; showText?: boolean; size?: number }) {
  const t = useT("giftLock");
  const bubble = useAnimatedStyle(() => ({
    backgroundColor: withSpring(locked ? colors.mint : "rgba(255,255,255,0.9)", springs.snappy),
    transform: [{ scale: withSpring(locked ? 1.06 : 1, springs.snappy) }],
  }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ checked: locked }}
      accessibilityLabel={locked ? t("boughtFor", { label }) : t("markFor", { label })}
      hitSlop={8}
      onPress={() => {
        tap();
        onToggle();
      }}
      style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
    >
      <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, alignItems: "center", justifyContent: "center" }, bubble]}>
        <Icon name={locked ? "lock.fill" : "lock.open"} size={size * 0.5} color={locked ? "#2F7D62" : colors.inkSoft} />
      </Animated.View>
      {showText && (
        <View>
          <Text style={{ fontFamily: fonts.black, fontSize: 13, color: locked ? "#2F7D62" : colors.inkSoft }}>{locked ? t("bought") : t("mark")}</Text>
        </View>
      )}
    </Pressable>
  );
}
