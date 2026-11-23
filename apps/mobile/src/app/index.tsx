import { daysUntil, isStale, summarizeSizes } from "@mgl/core";
import { Link, router } from "expo-router";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Avatar, Button, styles } from "@/components/ui";
import { usePeople } from "@/lib/store";
import { colors, fonts, shadow } from "@/lib/theme";

/**
 * Locker grid. Each card is the source of an iOS 18 zoom transition into the
 * person's detail screen (Link.AppleZoom ↔ Link.AppleZoomTarget). On iPad the
 * grid widens to 2–3 columns.
 */
export default function Locker() {
  const people = usePeople();
  const { width } = useWindowDimensions();
  const cols = width >= 1000 ? 3 : width >= 700 ? 2 : 1;
  const gap = 14;
  const cardW = (Math.min(width, 1100) - 40 - gap * (cols - 1)) / cols;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 20, gap: 18 }}>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Button title="Invite someone" onPress={() => router.push("/join")} style={{ flex: 1 }} />
        <Button title="Gift exchange" variant="soft" onPress={() => router.push("/exchange")} style={{ flex: 1 }} />
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap }}>
        {people.map((p, i) => (
          <Animated.View key={p.id} entering={FadeInDown.delay(i * 60).springify().damping(16)} style={{ width: cardW }}>
            <Link href={{ pathname: "/person/[id]", params: { id: p.id } }} asChild>
              <Pressable>
                <Link.AppleZoom>
                  <View style={[{ backgroundColor: colors.white, borderRadius: 26, padding: 18, overflow: "hidden" }, shadow]}>
                    <View style={{ position: "absolute", left: 0, right: 0, top: 0, height: 70, backgroundColor: p.color, opacity: 0.6 }} />
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                      <Avatar name={p.name} color={p.color} size={54} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: fonts.display, fontSize: 20, color: colors.ink }} numberOfLines={1}>
                          {p.name}
                        </Text>
                        <Text style={styles.body}>{p.relationship ?? "Connection"}</Text>
                      </View>
                    </View>
                    <Text style={{ fontFamily: fonts.bold, color: colors.ink, marginTop: 16 }}>{summarizeSizes(p.sizes) || "No sizes yet"}</Text>
                    <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
                      {p.birthday && <Tag bg={colors.cream}>🎂 {daysUntil(p.birthday)}d</Tag>}
                      {p.kind === "child" && <Tag bg={colors.mint}>Managed</Tag>}
                      {isStale(p) && <Tag bg={colors.butter}>Sizes may be outgrown</Tag>}
                    </View>
                  </View>
                </Link.AppleZoom>
              </Pressable>
            </Link>
          </Animated.View>
        ))}
      </View>
    </ScrollView>
  );
}

function Tag({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ fontFamily: fonts.black, fontSize: 12, color: colors.inkSoft }}>{children}</Text>
    </View>
  );
}
