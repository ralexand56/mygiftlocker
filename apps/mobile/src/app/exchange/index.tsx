import { formatBudget, pastelFor } from "@mgl/core";
import { Link } from "expo-router";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Card, styles } from "@/components/ui";
import { me, useMyExchanges } from "@/lib/store";
import { colors, fonts, shadow } from "@/lib/theme";

/**
 * "My exchanges": every exchange you're in. Creating a new exchange happens on
 * the website; the app is for managing the ones you've joined or organize.
 */
export default function MyExchanges() {
  const exchanges = useMyExchanges();

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 14, maxWidth: 680, width: "100%", alignSelf: "center" }}>
      {exchanges.map((ex, i) => {
        const mine = ex.participants.find((p) => p.id === me.id);
        const isAdmin = ex.adminId === me.id;
        const needsWishes = !!mine && mine.wishlist.length === 0;
        const status = ex.status === "drawn" ? (ex.assignments?.[me.id] ? "Your match is ready 🎁" : "Names drawn") : needsWishes ? "Add your wishes" : "Collecting wishes";
        return (
          <Animated.View key={ex.id} entering={FadeInDown.delay(i * 70).springify().damping(18)}>
            <Link href={{ pathname: "/exchange/[id]", params: { id: ex.id } }} asChild>
              <Pressable>
                <View style={StyleSheet.flatten([{ backgroundColor: colors.white, borderRadius: 26, padding: 20 }, shadow])}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={[styles.eyebrow, ex.status === "drawn" && { color: colors.plum }]}>{status}</Text>
                    {isAdmin && (
                      <View style={{ backgroundColor: colors.lavender, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
                        <Text style={{ fontFamily: fonts.black, fontSize: 11, color: colors.ink }}>Organizer</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.h2, { marginTop: 6 }]}>{ex.name}</Text>
                  <Text style={[styles.body, { fontSize: 14, marginTop: 2 }]}>
                    {[ex.date && new Date(ex.date + "T00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }), formatBudget(ex.budget), `${ex.participants.length} people`]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                  <View style={{ flexDirection: "row", marginTop: 14 }}>
                    {ex.participants.slice(0, 6).map((p, j) => (
                      <View key={p.id} style={{ marginLeft: j ? -10 : 0, width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: colors.white, backgroundColor: pastelFor(p.name), alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontFamily: fonts.display, fontSize: 13, color: colors.ink }}>{p.name[0]}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Pressable>
            </Link>
          </Animated.View>
        );
      })}

      <Card style={{ alignItems: "center", backgroundColor: colors.cream }}>
        <Text style={[styles.body, { textAlign: "center", fontSize: 14 }]}>Starting a new gift exchange? Create it on the website, then manage it here.</Text>
        <Pressable onPress={() => Linking.openURL("https://mygiftlockers.com/exchange")} hitSlop={8}>
          <Text style={{ fontFamily: fonts.black, color: colors.rose, marginTop: 8 }}>mygiftlockers.com/exchange ↗</Text>
        </Pressable>
      </Card>
    </ScrollView>
  );
}
