import { FIT_LABELS, convertShoe, daysUntil, formatPartialDate, upcomingMilestone } from "@mgl/core";
import { Link, useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Avatar, Card, styles } from "@/components/ui";
import { usePeople } from "@/lib/store";
import { colors, fonts } from "@/lib/theme";

export default function PersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const p = usePeople().find((x) => x.id === id);
  if (!p) return null;
  const s = p.sizes;
  const shoe = s.shoe && s.fit ? convertShoe(s.shoe, s.fit) : null;
  const sizes: [string, string | undefined][] = [
    ["Section", s.fit ? FIT_LABELS[s.fit] : undefined],
    ["Top", s.top],
    ["Pants", s.waist ? `${s.waist}×${s.inseam ?? "?"}` : (s.womensNumeric ?? s.bottomAlpha)],
    ["Dress", s.dress],
    ["Outerwear", s.outerwear],
    ["Shoe", s.shoe?.toString()],
    ["Ring", s.ring?.toString()],
  ];

  return (
    <ScrollView contentInsetAdjustmentBehavior="never" contentContainerStyle={{ paddingBottom: 40 }}>
      <Link.AppleZoomTarget>
        <View collapsable={false} style={{ backgroundColor: p.color, paddingTop: 110, paddingBottom: 28, paddingHorizontal: 22, alignItems: "center", borderBottomLeftRadius: 36, borderBottomRightRadius: 36 }}>
          <Avatar name={p.name} color={colors.white} size={104} />
          <Text style={[styles.h1, { marginTop: 14, textAlign: "center" }]}>{p.name}</Text>
          <Text style={styles.body}>{p.relationship}</Text>
        </View>
      </Link.AppleZoomTarget>

      <View style={{ padding: 20, gap: 16 }}>
        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <Card>
            <Text style={styles.eyebrow}>Sizes</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
              {sizes
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <View key={k} style={{ backgroundColor: colors.cream, borderRadius: 16, padding: 12, minWidth: 92 }}>
                    <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: colors.inkSoft }}>{k}</Text>
                    <Text style={{ fontFamily: fonts.display, fontSize: 20, color: colors.ink }}>{v}</Text>
                  </View>
                ))}
            </View>
            {shoe && <Text style={[styles.body, { marginTop: 10, fontSize: 14 }]}>Shoe ≈ UK {shoe.UK} · EU {shoe.EU} · JP {shoe.JP}</Text>}
          </Card>
        </Animated.View>

        {p.birthday && (
          <Animated.View entering={FadeInDown.delay(230).springify()}>
            <Card>
              <Text style={styles.eyebrow}>Birthday</Text>
              <Text style={[styles.h2, { marginTop: 6 }]}>{formatPartialDate(p.birthday)}</Text>
              <Text style={styles.body}>
                in {daysUntil(p.birthday)} days{upcomingMilestone(p.birthday) ? ` · turns ${upcomingMilestone(p.birthday)}` : ""}
              </Text>
            </Card>
          </Animated.View>
        )}

        {p.favorites?.likes && (
          <Animated.View entering={FadeInDown.delay(310).springify()}>
            <Card>
              <Text style={styles.eyebrow}>Loves</Text>
              <Text style={[styles.body, { color: colors.ink, marginTop: 6 }]}>{p.favorites.likes}</Text>
              {p.favorites.avoid && <Text style={[styles.body, { color: colors.rose, marginTop: 6 }]}>Avoid: {p.favorites.avoid}</Text>}
            </Card>
          </Animated.View>
        )}
      </View>
    </ScrollView>
  );
}
