import { DrawError, drawNames, formatBudget, newId, pastelFor, type Exchange, type Participant, type WishItem } from "@mgl/core";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, Share, Text, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeInDown, ZoomIn, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { GiftIllo } from "@/components/Illos";
import { Avatar, Button, Card, Chips, styles } from "@/components/ui";
import { me, patchExchange, setWishlist, useExchange } from "@/lib/store";
import { colors, fonts } from "@/lib/theme";

const SITE = "https://mygiftlockers.com";

export default function ExchangeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ex = useExchange(id);
  if (!ex) return null;

  // People whose wishlist + match I manage: me, plus kids I'm the guardian of.
  const managed = ex.participants.filter((p) => p.id === me.id || p.managedBy === me.id);
  const isAdmin = ex.adminId === me.id;

  return (
    <>
      <Stack.Screen options={{ title: ex.name }} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, maxWidth: 680, width: "100%", alignSelf: "center" }} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.springify().damping(18)}>
          <Summary ex={ex} />
        </Animated.View>

        {ex.status === "drawn" &&
          managed.map((p) => {
            const receiverId = ex.assignments?.[p.id];
            const receiver = ex.participants.find((x) => x.id === receiverId);
            return receiver ? <Reveal key={p.id} giver={p} receiver={receiver} /> : null;
          })}

        <WishlistEditor ex={ex} managed={managed} />
        <People ex={ex} />
        {isAdmin && <OrganizerTools ex={ex} />}
      </ScrollView>
    </>
  );
}

function Summary({ ex }: { ex: Exchange }) {
  const facts = [
    ex.date && `📅 ${new Date(ex.date + "T00:00").toLocaleDateString(undefined, { weekday: "short", month: "long", day: "numeric" })}`,
    ex.budget && `💸 ${formatBudget(ex.budget)} budget`,
    `🎁 Top ${ex.wishCount} wishes`,
    ex.singleLoop && "⭕ One big circle",
  ].filter(Boolean) as string[];
  return (
    <Card>
      <Text style={[styles.eyebrow, ex.status === "drawn" && { color: colors.plum }]}>{ex.status === "drawn" ? "Names drawn" : "Collecting wishes"}</Text>
      <Text style={[styles.h1, { marginTop: 4 }]}>{ex.name}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
        {facts.map((f) => (
          <View key={f} style={{ backgroundColor: colors.cream, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: colors.ink }}>{f}</Text>
          </View>
        ))}
      </View>
      {ex.message && <Text style={[styles.body, { marginTop: 12, fontStyle: "italic" }]}>“{ex.message}”</Text>}
    </Card>
  );
}

/** Tap the wobbling gift to unwrap who you're gifting, then see their wishlist. */
function Reveal({ giver, receiver }: { giver: Participant; receiver: Participant }) {
  const [open, setOpen] = useState(false);
  const wobble = useSharedValue(0);
  useEffect(() => {
    wobble.value = withRepeat(withSequence(withTiming(-5, { duration: 160 }), withTiming(5, { duration: 160 }), withTiming(0, { duration: 160 }), withTiming(0, { duration: 900 })), -1);
  }, [wobble]);
  const wobbleStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${wobble.value}deg` }] }));
  const who = giver.id === me.id ? "You're" : `${giver.name.split(" ")[0]} is`;

  return (
    <Card style={{ alignItems: "center" }}>
      {!open ? (
        <Pressable
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            setOpen(true);
          }}
          style={{ alignItems: "center" }}
        >
          <Animated.View style={wobbleStyle}>
            <GiftIllo c="#FBD3E3" a="#E9779F" size={130} />
          </Animated.View>
          <Text style={[styles.h2, { marginTop: 6, textAlign: "center" }]}>{giver.id === me.id ? "Tap to see who you're gifting" : `Tap to see who ${giver.name.split(" ")[0]} is gifting`}</Text>
        </Pressable>
      ) : (
        <Animated.View entering={ZoomIn.springify().damping(13)} style={{ alignItems: "center", width: "100%" }}>
          <Text style={styles.eyebrow}>{who} gifting</Text>
          <View style={{ marginTop: 10 }}>
            <Avatar name={receiver.name} color={pastelFor(receiver.name)} size={84} />
          </View>
          <Text style={[styles.h1, { marginTop: 8 }]}>{receiver.name}</Text>
          <View style={{ alignSelf: "stretch", gap: 8, marginTop: 14 }}>
            {receiver.wishlist.length ? (
              receiver.wishlist.map((w, i) => (
                <Animated.View key={w.id} entering={FadeInDown.delay(200 + i * 80)} style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.cream, borderRadius: 16, padding: 12 }}>
                  <Text style={{ fontFamily: fonts.display, fontSize: 20, color: colors.rose }}>{w.rank}</Text>
                  <Text style={{ flex: 1, fontFamily: fonts.bold, fontSize: 16, color: colors.ink }}>{w.title}</Text>
                  {w.url && (
                    <Pressable onPress={() => Linking.openURL(w.url!)} hitSlop={10}>
                      <Text style={{ fontFamily: fonts.black, color: colors.plum }}>Open ↗</Text>
                    </Pressable>
                  )}
                </Animated.View>
              ))
            ) : (
              <Text style={[styles.body, { textAlign: "center" }]}>No wishes yet. We'll let you know when they add some.</Text>
            )}
          </View>
        </Animated.View>
      )}
    </Card>
  );
}

type Draft = { title: string; url: string };
const toDraft = (p: Participant, n: number): Draft[] => Array.from({ length: n }, (_, i) => ({ title: p.wishlist[i]?.title ?? "", url: p.wishlist[i]?.url ?? "" }));

function WishlistEditor({ ex, managed }: { ex: Exchange; managed: Participant[] }) {
  const [whoId, setWhoId] = useState(managed[0]?.id);
  const who = managed.find((p) => p.id === whoId) ?? managed[0];
  const [items, setItems] = useState<Draft[]>(() => (who ? toDraft(who, ex.wishCount) : []));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (who) setItems(toDraft(who, ex.wishCount));
    // Reload only when switching whose list is shown.
  }, [whoId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!who) return null;

  const save = () => {
    const list: WishItem[] = items
      .filter((w) => w.title.trim())
      .map((w, i) => ({ id: newId("w_"), title: w.title.trim(), url: w.url.trim() || undefined, rank: i + 1 }));
    setWishlist(ex.id, who.id, list);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const label = (id: string) => (id === me.id ? "Me" : (managed.find((p) => p.id === id)?.name.split(" ")[0] ?? ""));

  return (
    <Card>
      <Text style={styles.h2}>{who.id === me.id ? "My wishlist" : `${who.name.split(" ")[0]}'s wishlist`}</Text>
      <Text style={[styles.body, { fontSize: 14 }]}>Ranked: #1 is the one {who.id === me.id ? "you'd" : "they'd"} love most.</Text>
      {managed.length > 1 && (
        <View style={{ marginTop: 12 }}>
          <Chips options={managed.map((p) => p.id)} value={who.id} onChange={(v) => v && setWhoId(v)} render={label} />
        </View>
      )}
      <View style={{ gap: 12, marginTop: 14 }}>
        {items.map((w, i) => (
          <View key={i} style={{ flexDirection: "row", gap: 10 }}>
            <Text style={{ width: 22, paddingTop: 12, fontFamily: fonts.display, fontSize: 22, color: colors.rose }}>{i + 1}</Text>
            <View style={{ flex: 1, gap: 6 }}>
              <TextInput style={styles.input} value={w.title} placeholder="What would make you smile?" placeholderTextColor={colors.inkSoft} onChangeText={(t) => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, title: t } : x)))} />
              {!!w.title && (
                <TextInput
                  style={[styles.input, { paddingVertical: 10, fontSize: 14 }]}
                  value={w.url}
                  placeholder="Link (optional)"
                  placeholderTextColor={colors.inkSoft}
                  autoCapitalize="none"
                  keyboardType="url"
                  onChangeText={(t) => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, url: t } : x)))}
                />
              )}
            </View>
          </View>
        ))}
      </View>
      <Button title={saved ? "Saved ✓" : "Save wishes"} onPress={save} style={{ marginTop: 16 }} />
    </Card>
  );
}

function People({ ex }: { ex: Exchange }) {
  return (
    <Card>
      <Text style={styles.h2}>Who's in ({ex.participants.length})</Text>
      <View style={{ gap: 10, marginTop: 12 }}>
        {ex.participants.map((p) => (
          <View key={p.id} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Avatar name={p.name} color={pastelFor(p.name)} size={38} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: colors.ink }}>
                {p.id === me.id ? "You" : p.name}
                {p.id === ex.adminId ? "  ·  organizer" : ""}
              </Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: p.wishlist.length ? colors.inkSoft : colors.rose }}>
                {p.wishlist.length ? `${p.wishlist.length} wish${p.wishlist.length > 1 ? "es" : ""}` : "No wishes yet"}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

function OrganizerTools({ ex }: { ex: Exchange }) {
  const [error, setError] = useState<string | null>(null);
  const joinUrl = `${SITE}/exchange/${ex.id}/join`;
  const missing = ex.participants.filter((p) => !p.wishlist.length);

  const draw = () => {
    try {
      const assignments = drawNames(
        ex.participants.map((p) => p.id),
        { exclusions: ex.exclusions, singleLoop: ex.singleLoop, previous: ex.previous },
      );
      patchExchange(ex.id, (x) => ({ ...x, status: "drawn", assignments, drawnAt: new Date().toISOString() }));
      setError(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) {
      setError(e instanceof DrawError ? e.message : "Something went wrong");
    }
  };

  const confirmDraw = () => {
    const warn = missing.length ? `${missing.length} ${missing.length === 1 ? "person hasn't" : "people haven't"} added wishes yet. ` : "";
    Alert.alert(ex.status === "drawn" ? "Redo the draw?" : "Draw names?", `${warn}Everyone will be able to reveal their match.`, [
      { text: "Cancel", style: "cancel" },
      { text: ex.status === "drawn" ? "Redo" : "Draw", onPress: draw },
    ]);
  };

  return (
    <Animated.View entering={FadeIn}>
      <Card style={{ backgroundColor: "#F6F0FF" }}>
        <Text style={styles.eyebrow}>Organizer</Text>
        <Text style={[styles.h2, { marginTop: 4 }]}>Invite & draw</Text>
        <Text style={[styles.body, { fontSize: 14, marginTop: 4 }]}>
          {ex.exclusions.length} exclusion{ex.exclusions.length === 1 ? "" : "s"}
          {ex.singleLoop ? " · one big circle" : ""}. Change the rules on the website.
        </Text>
        <Button title="Share invite link" variant="soft" onPress={() => Share.share({ message: `Join "${ex.name}" on My Gift Lockers and add your wishes: ${joinUrl}`, url: joinUrl })} style={{ marginTop: 14 }} />
        <Button title={ex.status === "drawn" ? "Redo the draw" : "Draw names"} onPress={confirmDraw} disabled={ex.participants.length < 3} style={{ marginTop: 10 }} />
        {error && <Text style={{ color: colors.rose, fontFamily: fonts.bold, marginTop: 10 }}>{error}</Text>}
      </Card>
    </Animated.View>
  );
}
