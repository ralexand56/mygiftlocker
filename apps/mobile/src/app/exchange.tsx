import { DrawError, drawNames, pastelFor } from "@mgl/core";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeInDown, LinearTransition, ZoomIn } from "react-native-reanimated";
import { Avatar, Button, Card, styles } from "@/components/ui";
import { colors, fonts } from "@/lib/theme";

/** Quick in-person draw: pass the phone around and each person taps to reveal. */
export default function Exchange() {
  const [names, setNames] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState<Record<string, string> | null>(null);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const add = () => {
    const n = draft.trim();
    if (n && !names.includes(n)) setNames((x) => [...x, n]);
    setDraft("");
  };

  const draw = () => {
    try {
      setResult(drawNames(names));
      setError(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) {
      setError(e instanceof DrawError ? e.message : "Something went wrong");
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16, maxWidth: 640, width: "100%", alignSelf: "center" }}>
      <Card>
        <Text style={styles.h2}>Who's playing?</Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
          <TextInput style={[styles.input, { flex: 1 }]} value={draft} onChangeText={setDraft} onSubmitEditing={add} placeholder="Add a name" returnKeyType="done" editable={!result} />
          <Button title="Add" variant="soft" onPress={add} disabled={!!result} />
        </View>
        <Animated.View layout={LinearTransition} style={{ marginTop: 12, gap: 8 }}>
          {names.map((n) => (
            <Animated.View key={n} entering={FadeInDown.springify()} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Avatar name={n} color={pastelFor(n)} size={36} />
              <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: colors.ink }}>{n}</Text>
            </Animated.View>
          ))}
        </Animated.View>
        {error && <Text style={{ color: colors.rose, fontFamily: fonts.bold, marginTop: 10 }}>{error}</Text>}
        {!result && <Button title="Draw names" onPress={draw} disabled={names.length < 3} style={{ marginTop: 16 }} />}
      </Card>

      {result && (
        <Animated.View entering={FadeIn}>
          <Card>
            <Text style={styles.h2}>Tap your name to reveal</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
              {names.map((n) => (
                <Pressable key={n} onPress={() => setRevealed(revealed === n ? null : n)} style={{ backgroundColor: pastelFor(n), borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 }}>
                  <Text style={{ fontFamily: fonts.black, color: colors.ink }}>{n}</Text>
                </Pressable>
              ))}
            </View>
            {revealed && (
              <Animated.View key={revealed} entering={ZoomIn.springify().damping(12)} style={{ alignItems: "center", marginTop: 22 }}>
                <Text style={styles.eyebrow}>{revealed}, you're gifting</Text>
                <Text style={[styles.h1, { fontSize: 40, lineHeight: 46, marginTop: 6 }]}>{result[revealed]}</Text>
                <Text style={[styles.body, { fontSize: 13, marginTop: 6 }]}>Tap your name again to hide it before passing the phone.</Text>
              </Animated.View>
            )}
          </Card>
        </Animated.View>
      )}
    </ScrollView>
  );
}
