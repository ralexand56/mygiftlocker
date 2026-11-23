import {
  ALPHA_SIZES,
  DEFAULT_ASK,
  FIT_LABELS,
  KIDS_SIZES,
  MENS_INSEAM,
  MENS_WAIST,
  MONTHS,
  RING_SIZES,
  SIZE_SYSTEMS,
  WOMENS_NUMERIC,
  convertAlpha,
  convertRing,
  convertShoe,
  convertWaist,
  convertWomensNumeric,
  decodeInvite,
  newId,
  pastelFor,
  shoeSizes,
  stepsFor,
  type AlphaSize,
  type Fit,
  type SizeProfile,
  type SizeSystem,
} from "@mgl/core";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native";
import Animated, { Easing, LinearTransition, SlideInLeft, SlideInRight, SlideOutLeft, SlideOutRight } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlyingBackdrop } from "@/components/FlyingBackdrop";
import { Button, Card, Chips, styles } from "@/components/ui";
import { addPerson } from "@/lib/store";
import { colors } from "@/lib/theme";

/**
 * The invite/connection flow on iPhone & iPad. Opened from a universal link
 * (mygiftlockers.com/join/<token> or mygiftlocker://join?token=…) or locally.
 */
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

export default function Join() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const invite = useMemo(() => (token ? decodeInvite(token) : null), [token]);
  const from = invite?.from.name ?? "A friend";

  const [name, setName] = useState(invite?.to?.name ?? "");
  const [sizes, setSizes] = useState<SizeProfile>({});
  const [birthday, setBirthday] = useState<{ month?: number; day?: number }>({});
  const [sys, setSys] = useState<SizeSystem>("US");
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);

  const steps = stepsFor({ ...(invite?.ask ?? DEFAULT_ASK), address: false, favorites: false, kids: false }, sizes.fit);
  const step = steps[Math.min(index, steps.length - 1)]!;
  const fit: Fit = sizes.fit ?? "womens";
  const set = <K extends keyof SizeProfile>(k: K, v: SizeProfile[K]) => setSizes((s) => ({ ...s, [k]: v }));
  const go = (d: number) => {
    setDir(d);
    setIndex((i) => Math.max(0, Math.min(steps.length - 1, i + d)));
  };

  const finish = () => {
    addPerson({
      id: newId("p_"),
      name: name.trim() || "New friend",
      kind: "adult",
      color: pastelFor(name),
      sizes,
      birthday: birthday.month && birthday.day ? { month: birthday.month, day: birthday.day } : undefined,
      updatedAt: new Date().toISOString(),
    });
    router.back();
  };

  const alpha = (k: "top" | "outerwear" | "bottomAlpha") =>
    fit === "kids" ? (
      <Chips options={KIDS_SIZES} value={sizes[k] as (typeof KIDS_SIZES)[number]} onChange={(v) => set(k, v)} />
    ) : (
      <Chips options={ALPHA_SIZES} value={sizes[k] as AlphaSize} onChange={(v) => set(k, v)} render={(v) => convertAlpha(v)[sys]} />
    );

  let body: React.ReactNode = null;
  switch (step.id) {
    case "welcome":
      body = <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" autoFocus textContentType="name" />;
      break;
    case "fit":
      body = <Chips options={Object.keys(FIT_LABELS) as Fit[]} value={sizes.fit} onChange={(v) => set("fit", v)} render={(f) => FIT_LABELS[f]} />;
      break;
    case "tops":
      body = alpha("top");
      break;
    case "bottoms":
      body =
        fit === "mens" ? (
          <>
            <Text style={styles.label}>Waist</Text>
            <Chips options={MENS_WAIST} value={sizes.waist} onChange={(v) => set("waist", v)} render={(v) => convertWaist(v)[sys]} />
            <Text style={styles.label}>Inseam</Text>
            <Chips options={MENS_INSEAM} value={sizes.inseam} onChange={(v) => set("inseam", v)} />
          </>
        ) : fit === "womens" ? (
          <Chips options={WOMENS_NUMERIC} value={sizes.womensNumeric as (typeof WOMENS_NUMERIC)[number]} onChange={(v) => set("womensNumeric", v)} render={(v) => convertWomensNumeric(v)?.[sys] ?? v} />
        ) : (
          alpha("bottomAlpha")
        );
      break;
    case "dresses":
      body = <Chips options={WOMENS_NUMERIC} value={sizes.dress as (typeof WOMENS_NUMERIC)[number]} onChange={(v) => set("dress", v)} render={(v) => convertWomensNumeric(v)?.[sys] ?? v} />;
      break;
    case "outerwear":
      body = alpha("outerwear");
      break;
    case "shoes":
      body = <Chips options={shoeSizes(fit)} value={sizes.shoe} onChange={(v) => set("shoe", v)} render={(v) => convertShoe(v, fit)?.[sys] ?? String(v)} />;
      break;
    case "accessories":
      body = <Chips options={RING_SIZES} value={sizes.ring} onChange={(v) => set("ring", v)} render={(v) => convertRing(v)[sys]} />;
      break;
    case "dates":
      body = (
        <>
          <Text style={styles.label}>Birthday month</Text>
          <Chips options={MONTHS.map((_, i) => i + 1)} value={birthday.month} onChange={(m) => setBirthday((b) => ({ ...b, month: m }))} render={(m) => MONTHS[m - 1]!.slice(0, 3)} />
          <Text style={styles.label}>Day</Text>
          <TextInput style={styles.input} keyboardType="number-pad" maxLength={2} value={birthday.day?.toString() ?? ""} onChangeText={(t) => setBirthday((b) => ({ ...b, day: Number(t) || undefined }))} placeholder="14" />
        </>
      );
      break;
    case "review":
      body = <Text style={styles.body}>Tap finish to share your sizes with {from}.</Text>;
      break;
  }

  const isSize = ["tops", "bottoms", "dresses", "outerwear", "shoes", "accessories"].includes(step.id);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <FlyingBackdrop scene={step.scene} />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <View style={{ height: 6, marginHorizontal: 24, marginTop: 8, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.8)", overflow: "hidden" }}>
            <Animated.View layout={LinearTransition.springify()} style={{ width: `${((index + 1) / steps.length) * 100}%`, height: 6, backgroundColor: colors.rose }} />
          </View>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 18, maxWidth: 560, width: "100%", alignSelf: "center" }} keyboardShouldPersistTaps="handled">
            <Animated.View key={step.id} entering={(dir > 0 ? SlideInRight : SlideInLeft).duration(700).easing(EASE_OUT)} exiting={(dir > 0 ? SlideOutLeft : SlideOutRight).duration(260).easing(Easing.in(Easing.cubic))}>
              <Card>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={styles.eyebrow}>{step.eyebrow}</Text>
                  {isSize && <Chips options={SIZE_SYSTEMS} value={sys} onChange={(v) => v && setSys(v)} />}
                </View>
                <Text style={[styles.h1, { marginTop: 6, marginBottom: 18 }]}>{step.id === "welcome" ? `${from} wants your gifts to be just right` : step.title}</Text>
                {body}
                <View style={{ flexDirection: "row", gap: 10, marginTop: 24 }}>
                  {index > 0 && <Button title="Back" variant="ghost" onPress={() => go(-1)} />}
                  <View style={{ flex: 1 }} />
                  {step.optional && <Button title="Skip" variant="ghost" onPress={() => go(1)} />}
                  {step.id === "review" ? (
                    <Button title="Finish" onPress={finish} />
                  ) : (
                    <Button title="Continue" onPress={() => go(1)} disabled={(step.id === "welcome" && !name.trim()) || (step.id === "fit" && !sizes.fit)} />
                  )}
                </View>
              </Card>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
