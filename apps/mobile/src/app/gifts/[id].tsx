/**
 * "Find the perfect gift" for one person (or "Ideas for me", id "self"): AI ideas made from their
 * card, refined with quick chips or in plain words, each with a store link. Same as the website's
 * gift finder; the list is saved on the card so reopening it is free.
 */
import { DAILY_GIFT_RUNS, LOCALE_TAGS, giftShopUrl, hasAffiliate, unsplashLink, type GiftIdea } from "@mgl/core";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Linking, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown, LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar, Button, Chip, ErrorText, Icon, Input, Rich, styles, tap } from "@/components/ui";
import { GiftRunError } from "@mgl/data";
import { useUser } from "@/lib/auth";
import { useLocale, useT } from "@/lib/i18n";
import { useLayout } from "@/lib/layout";
import { giftAffiliate, runGiftIdeas, useLocker } from "@/lib/store";
import { colors, fonts, shadow } from "@/lib/theme";

const CHIPS = ["under50", "experience", "handmade", "lastMinute", "splurge"] as const;

export default function GiftsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { people, self } = useLocker();
  const p = id === "self" ? self : people?.find((x) => x.id === id);
  const t = useT("gifts");
  const user = useUser();
  const locale = useLocale();
  const insets = useSafeAreaInsets();
  const { width } = useLayout();
  const forSelf = id === "self";
  const first = p?.name.split(" ")[0] ?? "";
  const [ideas, setIdeas] = useState<GiftIdea[]>(p?.giftIdeas?.ideas ?? []);
  const [shown, setShown] = useState(p?.giftIdeas?.request ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState("");
  const [step, setStep] = useState(0);
  const started = useRef(false);
  const cols = width >= 560 ? 2 : 1;

  const money = (n: number) => new Intl.NumberFormat(LOCALE_TAGS[locale], { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  const price = (i: GiftIdea) => (i.priceMax > i.priceMin ? `${money(i.priceMin)}–${money(i.priceMax)}` : money(i.priceMin));

  const run = async (ask: string) => {
    if (loading || !p) return;
    setLoading(true);
    setError(null);
    setStep(0);
    try {
      const next = await runGiftIdeas(user?.sub, p, ask, locale);
      setIdeas(next);
      setShown(ask);
      setRequest("");
    } catch (e) {
      const key = e instanceof GiftRunError ? e.key : "failed";
      setError(t(`errors.${key}`, { n: DAILY_GIFT_RUNS }));
    } finally {
      setLoading(false);
    }
  };

  // First visit starts right away; later visits show the saved list.
  useEffect(() => {
    if (started.current || !p) return;
    started.current = true;
    if (!ideas.length) void run("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p]);
  useEffect(() => {
    if (!loading) return;
    const timer = setInterval(() => setStep((s) => (s + 1) % 4), 2600);
    return () => clearInterval(timer);
  }, [loading]);

  if (!p) return <ActivityIndicator style={{ flex: 1 }} color={colors.rose} />;
  const tileW = cols === 2 ? (width - 16 * 2 - 10) / 2 : undefined;

  return (
    <>
      <Stack.Screen options={{ title: forSelf ? t("titleSelf") : t("title", { name: first }) }} />
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: colors.cream, paddingLeft: insets.left, paddingRight: insets.right }}>
        <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Avatar name={p.name} color={p.color} size={48} />
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>✨ {t("eyebrow")}</Text>
              {!loading && !!shown && (
                <Text style={[styles.body, { fontSize: 14 }]} numberOfLines={1}>
                  “{shown}”
                </Text>
              )}
            </View>
          </View>

          {loading ? (
            <Animated.View entering={FadeIn} style={{ alignItems: "center", paddingVertical: 50, gap: 14 }}>
              <ActivityIndicator color={colors.rose} size="large" />
              <Animated.Text key={step} entering={FadeIn.duration(400)} style={[styles.strong, { textAlign: "center" }]}>
                🎁 {forSelf ? t(`thinkingSelf.${step}`) : t(`thinking.${step}`, { name: first })}
              </Animated.Text>
            </Animated.View>
          ) : error ? (
            <View style={{ alignItems: "center", paddingVertical: 30, gap: 12 }}>
              <ErrorText>{error}</ErrorText>
              <Button small variant="soft" icon="arrow.clockwise" title={t("retry")} onPress={() => run(shown)} />
            </View>
          ) : ideas.length === 0 ? (
            <Text style={[styles.body, { textAlign: "center", padding: 24 }]}>{t("allHidden")}</Text>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {ideas.map((idea, i) => (
                <Animated.View key={idea.id} entering={FadeInDown.delay(i * 60).springify().damping(18)} layout={LinearTransition.springify()} style={{ width: tileW ?? "100%" }}>
                  <IdeaCard idea={idea} price={price(idea)} onHide={() => setIdeas((xs) => xs.filter((x) => x.id !== idea.id))} />
                </Animated.View>
              ))}
            </View>
          )}
          {hasAffiliate(giftAffiliate) && ideas.length > 0 && !loading && <Text style={[styles.body, { fontSize: 12, textAlign: "center" }]}>{t("disclosure")}</Text>}
        </ScrollView>

        {/* Ask for something else: quick chips or plain words. */}
        <View style={{ borderTopWidth: 1, borderTopColor: "rgba(74,59,102,0.08)", backgroundColor: "rgba(255,250,247,0.97)", paddingTop: 10, paddingBottom: insets.bottom + 8, gap: 8 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }} keyboardShouldPersistTaps="handled">
            {CHIPS.map((c) => (
              <Chip key={c} label={t(`chips.${c}`)} active={false} onPress={() => run(t(`chips.${c}`))} />
            ))}
          </ScrollView>
          <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, alignItems: "center" }}>
            <Input
              style={{ flex: 1 }}
              value={request}
              onChangeText={setRequest}
              placeholder={forSelf ? t("placeholderSelf") : t("placeholder", { name: first })}
              accessibilityLabel={t("askLabel")}
              returnKeyType="send"
              onSubmitEditing={() => request.trim() && run(request)}
              editable={!loading}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("send")}
              disabled={!request.trim() || loading}
              onPress={() => {
                tap();
                void run(request);
              }}
              style={{ width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", backgroundColor: request.trim() && !loading ? colors.plum : "#CFC6DB" }}
            >
              <Icon name="arrow.up" size={18} color={colors.white} />
            </Pressable>
          </View>
          <Text style={[styles.body, { fontSize: 11, textAlign: "center", paddingHorizontal: 16 }]}>{t("aiNote")}</Text>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

function IdeaCard({ idea, price, onHide }: { idea: GiftIdea; price: string; onHide: () => void }) {
  const t = useT("gifts");
  const store = t(`stores.${idea.store}`);
  return (
    <View style={[{ backgroundColor: colors.white, borderRadius: 22, overflow: "hidden" }, shadow, { shadowOpacity: 0.08 }]}>
      {idea.image && (
        <View style={{ aspectRatio: 16 / 9, backgroundColor: idea.image.color ?? "#f6eedc" }}>
          <Image source={{ uri: idea.image.url }} style={{ flex: 1 }} contentFit="cover" accessibilityLabel={idea.image.alt ?? idea.title} transition={200} />
          <Pressable onPress={() => Linking.openURL(unsplashLink(idea.image!.byUrl))} style={{ position: "absolute", left: 8, bottom: 6, backgroundColor: "rgba(0,0,0,0.35)", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
            <Rich text={t("photoBy", { name: idea.image.by })} style={{ color: colors.white, fontSize: 10, fontFamily: fonts.bold }} tags={{ who: { textDecorationLine: "underline" }, site: { textDecorationLine: "underline" } }} />
          </Pressable>
        </View>
      )}
      <View style={{ padding: 14, gap: 4 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Text style={[styles.h3, { flex: 1 }]}>{idea.title}</Text>
          <Pressable accessibilityLabel={t("notThis", { title: idea.title })} hitSlop={10} onPress={onHide}>
            <Icon name="xmark" size={14} color={colors.inkSoft} />
          </Pressable>
        </View>
        <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: colors.inkSoft }}>
          {price} · {store}
        </Text>
        {!!idea.why && <Text style={[styles.body, { fontSize: 14 }]}>{idea.why}</Text>}
        <Button
          small
          variant="gradient"
          icon="arrow.up.right.square"
          title={t("shop", { store })}
          style={{ alignSelf: "flex-start", marginTop: 6 }}
          onPress={() => Linking.openURL(giftShopUrl(idea, giftAffiliate))}
        />
      </View>
    </View>
  );
}
