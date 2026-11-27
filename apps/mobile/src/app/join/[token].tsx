/**
 * The invite flow: someone fills in their own sizes, dates and favorites, one friendly step at a
 * time, and the answers land in the inviter's locker. Opened from mygiftlocker://join/<id> (or a
 * demo invite). Same steps, wording and submission as the website's /join/<id>.
 */
import {
  ALPHA_SIZES,
  HAT_SIZES,
  KIDS_SIZES,
  MENS_INSEAM,
  MENS_WAIST,
  PAYMENT_APP_NAMES,
  RING_SIZES,
  SHOE_WIDTHS,
  SIZE_SYSTEMS,
  WOMENS_NUMERIC,
  cleanPayments,
  convertAlpha,
  convertRing,
  convertShoe,
  convertWaist,
  convertWomensNumeric,
  isCompleteAddress,
  newId,
  normalizePaymentHandle,
  pastelFor,
  shoeSizes,
  sizeValueLabel,
  stepText,
  stepsFor,
  summarizeSizes,
  type Address,
  type AlphaSize,
  type Favorites,
  type Fit,
  type PartialDate,
  type PaymentApp,
  type PaymentHandles,
  type Person,
  type PublicInvite,
  type SizeProfile,
  type SizeSystem,
  type StepId,
} from "@mgl/core";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { Easing, FadeIn, LinearTransition, SlideInLeft, SlideInRight, SlideOutLeft, SlideOutRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlyingBackdrop } from "@/components/FlyingBackdrop";
import { AddressEditor, DateField, FavoritesEditor } from "@/components/PersonForm";
import { Button, Chips, ErrorText, Field, Icon, Input, styles, tap } from "@/components/ui";
import { useUser } from "@/lib/auth";
import { useT, useTr } from "@/lib/i18n";
import { useLayout } from "@/lib/layout";
import { answerInvite, openInvite, saveSelf } from "@/lib/store";
import { colors, fonts, shadow } from "@/lib/theme";

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

type Kid = { id: string; name: string; top?: string; bottom?: string; shoe?: number; birthday?: PartialDate };
type Form = {
  name: string;
  sizes: SizeProfile;
  address?: Address;
  birthday?: PartialDate;
  anniversary?: PartialDate;
  favorites: Favorites;
  payments: PaymentHandles;
  kids: Kid[];
};

export default function JoinScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const tc = useT("common");
  const [invite, setInvite] = useState<PublicInvite | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    openInvite(token)
      .then(setInvite)
      .catch((e) => setError(e instanceof Error ? e.message : tc("somethingWrong")));
  }, [token, tc]);
  if (error)
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 30, backgroundColor: colors.cream }}>
        <Text style={[styles.h2, { textAlign: "center" }]}>{error}</Text>
        <Button title={tc("back")} variant="soft" style={{ marginTop: 16 }} onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} />
      </View>
    );
  if (!invite) return <ActivityIndicator style={{ flex: 1, backgroundColor: colors.cream }} color={colors.rose} />;
  return <Flow invite={invite} />;
}

function Flow({ invite }: { invite: PublicInvite }) {
  const t = useT("join");
  const tb = useT("join.body");
  const tr = useTr();
  const user = useUser();
  const insets = useSafeAreaInsets();
  const { short } = useLayout();
  const from = invite.from.name;
  const [form, setForm] = useState<Form>({ name: invite.to?.name ?? "", sizes: {}, favorites: {}, payments: {}, kids: [] });
  const [sys, setSys] = useState<SizeSystem>("US");
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [done, setDone] = useState<Person | null>(null);

  const steps = useMemo(() => stepsFor(invite.ask, form.sizes.fit), [invite.ask, form.sizes.fit]);
  const step = steps[Math.min(index, steps.length - 1)]!;
  const fit: Fit = form.sizes.fit ?? "womens";
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));
  const setSize = (patch: Partial<SizeProfile>) => setForm((f) => ({ ...f, sizes: { ...f.sizes, ...patch } }));
  const go = (d: number) => {
    tap();
    setDir(d);
    setIndex((i) => Math.max(0, Math.min(steps.length - 1, i + d)));
  };
  const jump = (id: StepId) => {
    const i = steps.findIndex((s) => s.id === id);
    if (i >= 0) {
      setDir(-1);
      setIndex(i);
    }
  };

  const person = (): Person => {
    const now = new Date().toISOString();
    const f = form.favorites;
    return {
      id: newId("p_"),
      name: form.name.trim(),
      kind: "adult",
      color: pastelFor(form.name),
      sizes: form.sizes,
      address: form.address && isCompleteAddress(form.address) ? form.address : undefined,
      birthday: complete(form.birthday),
      anniversary: complete(form.anniversary),
      favorites: {
        colors: f.colors,
        likes: f.likes?.trim() || undefined,
        teams: f.teams?.trim() || undefined,
        avoid: f.avoid?.trim() || undefined,
        wishes: (f.wishes ?? []).map((w) => w.trim()).filter(Boolean),
      },
      payments: invite.ask.payments ? cleanPayments(form.payments) : undefined,
      updatedAt: now,
    };
  };

  const submit = async () => {
    const p = person();
    const kids: Person[] = form.kids
      .filter((k) => k.name.trim())
      .map((k) => ({
        id: newId("p_"),
        name: k.name.trim(),
        kind: "child" as const,
        relationship: t("childOf", { name: p.name.split(" ")[0]! }),
        color: pastelFor(k.name),
        sizes: { fit: "kids" as const, top: k.top, bottomAlpha: k.bottom, shoe: k.shoe },
        birthday: complete(k.birthday),
        guardians: [p.id],
        updatedAt: p.updatedAt,
      }));
    setSending(true);
    setSendError(null);
    try {
      await answerInvite(invite, p, kids);
      setDone(p);
    } catch (e) {
      setSendError(e instanceof Error ? e.message : t("sendFailed"));
    } finally {
      setSending(false);
    }
  };

  if (done) return <Success person={done} from={from} signedIn={!!user} onSaveMine={(p) => saveSelf(user!.sub, { ...p, id: "self" })} />;

  const isSize = ["tops", "bottoms", "dresses", "outerwear", "shoes", "accessories"].includes(step.id);
  const head = step.id === "welcome" ? { eyebrow: tr("core.steps.welcome.eyebrow"), title: t("wantsGifts", { name: from }), subtitle: undefined } : stepText(step, tr);
  const alpha = (value: string | undefined, onChange: (v: string | undefined) => void) =>
    fit === "kids" ? (
      <Chips options={KIDS_SIZES} value={value as (typeof KIDS_SIZES)[number]} onChange={onChange} render={(v) => sizeValueLabel(v, tr)} />
    ) : (
      <Chips options={ALPHA_SIZES} value={value as AlphaSize} onChange={onChange} render={(v) => convertAlpha(v)[sys]} />
    );

  let body: ReactNode = null;
  switch (step.id) {
    case "welcome":
      body = (
        <>
          {!!invite.note && (
            <View style={{ backgroundColor: colors.blush, borderRadius: 16, padding: 14, marginBottom: 6 }}>
              <Text style={[styles.body, { color: colors.ink }]}>“{invite.note}” — {from}</Text>
            </View>
          )}
          <Field label={tb("name")} hint={tb("nameHint", { name: from })}>
            <Input value={form.name} onChangeText={(name) => set({ name })} placeholder={tb("namePlaceholder")} textContentType="name" autoComplete="name" />
          </Field>
        </>
      );
      break;
    case "fit":
      body = <Chips options={["mens", "womens", "kids"] as Fit[]} value={form.sizes.fit} onChange={(f) => setSize({ fit: f })} render={(f) => tr(`core.fit.${f}`)} />;
      break;
    case "tops":
      body = alpha(form.sizes.top, (top) => setSize({ top }));
      break;
    case "bottoms":
      body =
        fit === "mens" ? (
          <>
            <Field label={tb("waist")}>
              <Chips options={MENS_WAIST} value={form.sizes.waist} onChange={(waist) => setSize({ waist })} render={(v) => convertWaist(v)[sys]} />
            </Field>
            <Field label={tb("inseam")}>
              <Chips options={MENS_INSEAM} value={form.sizes.inseam} onChange={(inseam) => setSize({ inseam })} />
            </Field>
          </>
        ) : fit === "womens" ? (
          <>
            <Field label={tb("numeric")}>
              <Chips options={WOMENS_NUMERIC} value={form.sizes.womensNumeric as (typeof WOMENS_NUMERIC)[number]} onChange={(womensNumeric) => setSize({ womensNumeric })} render={(v) => convertWomensNumeric(v)?.[sys] ?? v} />
            </Field>
            <Field label={tb("letter")}>{alpha(form.sizes.bottomAlpha, (bottomAlpha) => setSize({ bottomAlpha }))}</Field>
          </>
        ) : (
          alpha(form.sizes.bottomAlpha, (bottomAlpha) => setSize({ bottomAlpha }))
        );
      break;
    case "dresses":
      body = <Chips options={WOMENS_NUMERIC} value={form.sizes.dress as (typeof WOMENS_NUMERIC)[number]} onChange={(dress) => setSize({ dress })} render={(v) => convertWomensNumeric(v)?.[sys] ?? v} />;
      break;
    case "outerwear":
      body = alpha(form.sizes.outerwear, (outerwear) => setSize({ outerwear }));
      break;
    case "shoes":
      body = (
        <>
          <Chips options={shoeSizes(fit)} value={form.sizes.shoe} onChange={(shoe) => setSize({ shoe })} render={(v) => convertShoe(v, fit)?.[sys] ?? String(v)} />
          {fit !== "kids" && (
            <Field label={tb("width")}>
              <Chips options={SHOE_WIDTHS} value={form.sizes.shoeWidth} onChange={(shoeWidth) => setSize({ shoeWidth })} render={(w) => tr(`core.shoeWidth.${w}`)} />
            </Field>
          )}
          <Field label={tb("foot")} hint={tb("footHint")}>
            <Input
              keyboardType="decimal-pad"
              placeholder={t("footPlaceholder")}
              defaultValue={form.sizes.footLengthCm?.toString()}
              onChangeText={(v) => {
                const n = Number(v.replace(",", "."));
                setSize({ footLengthCm: v && n > 5 && n < 40 ? n : undefined });
              }}
            />
          </Field>
        </>
      );
      break;
    case "accessories":
      body = (
        <>
          {fit !== "kids" && (
            <Field label={tb("ringSize")}>
              <Chips options={RING_SIZES} value={form.sizes.ring} onChange={(ring) => setSize({ ring })} render={(v) => convertRing(v)[sys]} />
            </Field>
          )}
          <Field label={tb("hatSize")}>
            <Chips options={HAT_SIZES} value={form.sizes.hat as (typeof HAT_SIZES)[number]} onChange={(hat) => setSize({ hat })} render={(v) => sizeValueLabel(v, tr)} />
          </Field>
          <Field label={tb("else")}>
            <Input value={form.sizes.notes ?? ""} onChangeText={(notes) => setSize({ notes: notes || undefined })} placeholder={tb("elsePlaceholder")} />
          </Field>
        </>
      );
      break;
    case "address":
      body = <AddressEditor value={form.address} onChange={(address) => set({ address })} />;
      break;
    case "dates":
      body = (
        <>
          <DateField label={tr("core.events.birthday")} value={form.birthday} onChange={(birthday) => set({ birthday })} />
          <DateField label={tr("core.events.anniversary")} value={form.anniversary} onChange={(anniversary) => set({ anniversary })} />
        </>
      );
      break;
    case "favorites":
      body = <FavoritesEditor value={form.favorites} onChange={(favorites) => set({ favorites })} self />;
      break;
    case "payments":
      body = <Payments value={form.payments} onChange={(payments) => set({ payments })} />;
      break;
    case "kids":
      body = <Kids kids={form.kids} onChange={(kids) => set({ kids })} />;
      break;
    case "review":
      body = <Review form={form} jump={jump} ask={invite.ask} />;
      break;
  }

  const canContinue = (step.id !== "welcome" || !!form.name.trim()) && (step.id !== "fit" || !!form.sizes.fit);
  return (
    <View style={{ flex: 1, backgroundColor: colors.cream, paddingLeft: insets.left, paddingRight: insets.right }}>
      <FlyingBackdrop scene={step.scene} />
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1, paddingTop: insets.top }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingTop: 8 }}>
          <Pressable accessibilityLabel={tr("common.cancel")} hitSlop={10} onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}>
            <Icon name="xmark" size={18} color={colors.inkSoft} />
          </Pressable>
          <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.8)", overflow: "hidden" }}>
            <Animated.View layout={LinearTransition.springify()} style={{ width: `${((index + 1) / steps.length) * 100}%`, height: 6, backgroundColor: colors.rose }} />
          </View>
          <Text style={{ fontFamily: fonts.black, fontSize: 12, color: colors.inkSoft }}>
            {index + 1}/{steps.length}
          </Text>
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, justifyContent: short ? "flex-start" : "center", padding: 16, paddingBottom: insets.bottom + 16, maxWidth: 580, width: "100%", alignSelf: "center" }}
        >
          <Animated.View
            key={step.id}
            entering={(dir > 0 ? SlideInRight : SlideInLeft).duration(600).easing(EASE_OUT)}
            exiting={(dir > 0 ? SlideOutLeft : SlideOutRight).duration(220).easing(Easing.in(Easing.cubic))}
            style={[{ backgroundColor: "rgba(255,253,251,0.97)", borderRadius: 28, padding: short ? 18 : 22 }, shadow]}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <Text style={styles.eyebrow}>{head.eyebrow}</Text>
              {isSize && fit !== "kids" && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, maxWidth: "70%" }}>
                  <Chips options={SIZE_SYSTEMS} value={sys} required onChange={(v) => v && setSys(v)} />
                </ScrollView>
              )}
            </View>
            <Text style={[styles.h1, { fontSize: short ? 26 : 30, lineHeight: short ? 30 : 34, marginTop: 8 }]}>{head.title}</Text>
            {!!head.subtitle && <Text style={[styles.body, { marginTop: 6 }]}>{head.subtitle}</Text>}
            <View style={{ marginTop: 16 }}>{body}</View>
            <ErrorText>{sendError}</ErrorText>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 22 }}>
              {index > 0 && <Button small variant="ghost" icon="chevron.left" title={t("back")} onPress={() => go(-1)} />}
              <View style={{ flex: 1 }} />
              {step.optional && <Button small variant="ghost" title={t("skip")} onPress={() => go(1)} />}
              {step.id === "review" ? (
                <Button title={sending ? t("sending") : t("shareWith", { name: from })} busy={sending} onPress={submit} />
              ) : (
                <Button title={t("continue")} disabled={!canContinue} onPress={() => go(1)} />
              )}
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function complete(d?: PartialDate): PartialDate | undefined {
  return d && d.month && d.day ? { month: d.month, day: d.day, year: d.year && d.year >= 1900 ? d.year : undefined } : undefined;
}

function Payments({ value, onChange }: { value: PaymentHandles; onChange: (v: PaymentHandles) => void }) {
  const t = useT("join.payments");
  const [touched, setTouched] = useState<Partial<Record<PaymentApp, boolean>>>({});
  const field = (app: PaymentApp) => {
    const bad = !!value[app] && normalizePaymentHandle(app, value[app]) === null;
    return (
      <View key={app}>
        <Text style={styles.label}>{PAYMENT_APP_NAMES[app]}</Text>
        <Input
          value={value[app] ?? ""}
          onChangeText={(v) => onChange({ ...value, [app]: v })}
          onBlur={() => setTouched((x) => ({ ...x, [app]: true }))}
          placeholder={t(`placeholders.${app}`)}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={100}
        />
        <ErrorText>{bad && touched[app] && t("bad")}</ErrorText>
      </View>
    );
  };
  return (
    <View>
      <Text style={[styles.strong, { marginTop: 4 }]}>{t("usernames")}</Text>
      {(["paypal", "venmo", "cashapp", "wise", "revolut"] as const).map(field)}
      <Text style={[styles.strong, { marginTop: 18 }]}>{t("contacts")}</Text>
      {(["zelle", "applecash", "pix", "mercadopago"] as const).map(field)}
      <Text style={[styles.body, { fontSize: 13, marginTop: 8 }]}>{t("contactsHint")}</Text>
    </View>
  );
}

function Kids({ kids, onChange }: { kids: Kid[]; onChange: (k: Kid[]) => void }) {
  const t = useT("join.kids");
  const tr = useTr();
  const up = (id: string, patch: Partial<Kid>) => onChange(kids.map((k) => (k.id === id ? { ...k, ...patch } : k)));
  return (
    <View style={{ gap: 12 }}>
      {kids.map((k) => (
        <View key={k.id} style={{ backgroundColor: colors.white, borderRadius: 18, padding: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Input style={{ flex: 1 }} value={k.name} onChangeText={(name) => up(k.id, { name })} placeholder={t("name")} />
            <Pressable accessibilityLabel={t("remove")} hitSlop={8} onPress={() => onChange(kids.filter((x) => x.id !== k.id))}>
              <Icon name="trash" size={16} color={colors.roseDeep} />
            </Pressable>
          </View>
          <Field label={t("clothing")}>
            <Chips options={KIDS_SIZES} value={k.top as (typeof KIDS_SIZES)[number]} onChange={(top) => up(k.id, { top, bottom: top })} render={(v) => sizeValueLabel(v, tr)} />
          </Field>
          <Field label={t("shoe")}>
            <Chips options={shoeSizes("kids")} value={k.shoe} onChange={(shoe) => up(k.id, { shoe })} />
          </Field>
          <DateField label={tr("core.events.birthday")} value={k.birthday} onChange={(birthday) => up(k.id, { birthday })} />
        </View>
      ))}
      <Button variant="soft" icon="plus" title={t("add")} onPress={() => onChange([...kids, { id: newId("k_"), name: "" }])} />
      <Text style={[styles.body, { fontSize: 13 }]}>{t("note")}</Text>
    </View>
  );
}

function Review({ form, jump, ask }: { form: Form; jump: (id: StepId) => void; ask: PublicInvite["ask"] }) {
  const t = useT("join.review");
  const tr = useTr();
  const f = form.favorites;
  const rows: [string, string | undefined, StepId][] = [
    [t("name"), form.name, "welcome"],
    ...(ask.sizes ? ([[t("sizes"), summarizeSizes(form.sizes, tr) || undefined, "fit"]] as [string, string | undefined, StepId][]) : []),
    ...(ask.address ? ([[t("address"), form.address?.city ? `${form.address.city}, ${form.address.country}` : undefined, "address"]] as [string, string | undefined, StepId][]) : []),
    ...(ask.favorites ? ([[t("loves"), [f.likes, ...(f.wishes ?? [])].filter(Boolean).join(" · ") || undefined, "favorites"]] as [string, string | undefined, StepId][]) : []),
    ...(ask.payments ? ([[t("payments"), Object.keys(cleanPayments(form.payments) ?? {}).map((a) => PAYMENT_APP_NAMES[a as PaymentApp]).join(", ") || undefined, "payments"]] as [string, string | undefined, StepId][]) : []),
    ...(ask.kids ? ([[t("kids"), form.kids.map((k) => k.name).filter(Boolean).join(", ") || undefined, "kids"]] as [string, string | undefined, StepId][]) : []),
  ];
  return (
    <View style={{ gap: 8 }}>
      {rows.map(([label, value, id]) => (
        <Pressable key={label} accessibilityLabel={t("edit", { label })} onPress={() => jump(id)} style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.white, borderRadius: 14, padding: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: colors.inkSoft }}>{label}</Text>
            <Text style={[styles.strong, !value && { color: colors.inkSoft, fontFamily: fonts.body }]} numberOfLines={2}>
              {value ?? t("skipped")}
            </Text>
          </View>
          <Icon name="pencil" size={14} color={colors.inkSoft} />
        </Pressable>
      ))}
    </View>
  );
}

function Success({ person, from, signedIn, onSaveMine }: { person: Person; from: string; signedIn: boolean; onSaveMine: (p: Person) => Promise<void> }) {
  const t = useT("join.success");
  const insets = useSafeAreaInsets();
  const [saved, setSaved] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const perks = ["sizes", "reminders", "locks", "exchanges"] as const;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream }} contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 22, paddingTop: insets.top + 20, paddingLeft: insets.left + 22, paddingRight: insets.right + 22, gap: 12, maxWidth: 560, width: "100%", alignSelf: "center" }}>
      <Animated.View entering={FadeIn.duration(400)} style={{ alignItems: "center", gap: 8 }}>
        <Text style={{ fontSize: 64 }}>🎉</Text>
        <Text style={[styles.h1, { textAlign: "center" }]}>{t("title", { name: person.name.split(" ")[0]! })}</Text>
        <Text style={[styles.body, { textAlign: "center" }]}>{t("body", { name: from })}</Text>
      </Animated.View>
      {signedIn ? (
        <View style={{ gap: 10, marginTop: 10 }}>
          <Button
            icon={saved === "saved" ? "checkmark" : "person.crop.circle.badge.checkmark"}
            variant={saved === "saved" ? "soft" : "primary"}
            busy={saved === "saving"}
            disabled={saved === "saved"}
            title={saved === "saved" ? t("saved") : saved === "saving" ? t("saving") : t("save")}
            onPress={async () => {
              setSaved("saving");
              try {
                await onSaveMine(person);
                setSaved("saved");
              } catch {
                setSaved("error");
              }
            }}
          />
          <ErrorText>{saved === "error" && t("error")}</ErrorText>
          <Button variant="soft" title={t("openLocker")} onPress={() => router.replace("/")} />
        </View>
      ) : (
        <View style={[{ backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 24, padding: 18, gap: 8, marginTop: 10 }, shadow]}>
          <Text style={styles.h2}>{t("pitch")}</Text>
          {perks.map((p) => (
            <Text key={p} style={[styles.body, { color: colors.ink }]}>
              ✓ {t(`perks.${p}`)}
            </Text>
          ))}
          <Button style={{ marginTop: 8 }} title={t("create")} onPress={() => router.replace("/sign-in")} />
        </View>
      )}
    </ScrollView>
  );
}
