/**
 * Everything about one person: sizes (with conversions), dates, the gift checklist, your private
 * holiday tags and note, where to ship, money gifts, favorites. Used full-screen on narrow
 * windows and as the right-hand pane when the iPhone Duo is unfolded (or on iPad).
 */
import {
  HOLIDAYS,
  PAYMENT_APP_NAMES,
  convertShoe,
  daysUntil,
  describeDays,
  eventLabel,
  formatAddress,
  formatPartialDate,
  isGifted,
  isStale,
  occasionName,
  paymentHandleLabel,
  paymentLink,
  sizeValueLabel,
  upcomingEventsFor,
  upcomingMilestone,
  withGifted,
  type HolidayId,
  type PaymentApp,
  type Person,
} from "@mgl/core";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useIntlTag, useT, useTr } from "@/lib/i18n";
import { useLayout } from "@/lib/layout";
import { removePerson, saveOwner } from "@/lib/store";
import { colors, fonts } from "@/lib/theme";
import { GiftLock } from "./GiftLock";
import { Avatar, Button, Card, Chip, ErrorText, Icon, Input, SectionTitle, styles, tap } from "./ui";

/** `topInset`: room for a transparent navigation bar; the hero color runs underneath it. */
export function PersonDetail({ person: p, paneWidth, onRemoved, topInset = 0 }: { person: Person; paneWidth: number; onRemoved?: () => void; topInset?: number }) {
  const t = useT("locker.detail");
  const tr = useTr();
  const tag = useIntlTag();
  const { short, tileCols } = useLayout();
  const cols = tileCols(paneWidth - 40);
  const comingUp = upcomingEventsFor(p).slice(0, 5);
  const shoe = p.sizes.shoe && p.sizes.fit ? convertShoe(p.sizes.shoe, p.sizes.fit) : null;
  const v = (x: string | undefined) => (x ? sizeValueLabel(x, tr) : undefined);
  const sizes: [string, string | undefined][] = [
    [t("size.section"), p.sizes.fit ? tr(`core.fit.${p.sizes.fit}`) : undefined],
    [t("size.top"), v(p.sizes.top)],
    [t("size.pants"), p.sizes.waist ? `${p.sizes.waist} × ${p.sizes.inseam ?? "?"}` : v(p.sizes.womensNumeric ?? p.sizes.bottomAlpha)],
    [t("size.dress"), v(p.sizes.dress)],
    [t("size.outerwear"), v(p.sizes.outerwear)],
    [t("size.shoe"), p.sizes.shoe ? `${p.sizes.shoe}${p.sizes.shoeWidth && p.sizes.shoeWidth !== "Regular" ? ` ${tr(`core.shoeWidth.${p.sizes.shoeWidth}`)}` : ""}` : undefined],
    [t("size.foot"), p.sizes.footLengthCm ? `${p.sizes.footLengthCm} cm` : undefined],
    [t("size.ring"), p.sizes.ring?.toString()],
    [t("size.hat"), v(p.sizes.hat)],
  ];
  const shown = sizes.filter(([, x]) => x);
  const tileW = (paneWidth - 40 - 8 * (cols - 1)) / cols;
  const enter = (i: number) => FadeInDown.delay(80 + i * 50).springify().damping(18);
  const toggle = (e: (typeof comingUp)[number]) => saveOwner(p.id, { gifted: withGifted(p, e, !isGifted(p, e)) }).catch(() => {});

  return (
    <View>
      {/* Hero: smaller and side by side when there's little height (folded iPhone Duo, landscape). */}
      <View
        style={{
          backgroundColor: p.color,
          paddingTop: topInset + (short ? 2 : 12),
          paddingBottom: short ? 18 : 26,
          paddingHorizontal: 20,
          alignItems: "center",
          flexDirection: short ? "row" : "column",
          gap: short ? 16 : 0,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
        }}
      >
        <Avatar name={p.name} color={colors.cream} size={short ? 72 : 104} />
        <View style={{ alignItems: short ? "flex-start" : "center", flex: short ? 1 : undefined }}>
          <Text style={[styles.h1, { marginTop: short ? 0 : 12, textAlign: short ? "left" : "center" }]} numberOfLines={2}>
            {p.name}
          </Text>
          {!!p.relationship && <Text style={styles.body}>{p.relationship}</Text>}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            <Button small variant="soft" icon="pencil" title={t("edit")} onPress={() => router.push({ pathname: "/person/edit", params: { id: p.id } })} />
          </View>
        </View>
      </View>

      <View style={{ padding: 20, gap: 22 }}>
        {isStale(p) && (
          <View style={{ backgroundColor: colors.butter, borderRadius: 16, padding: 14, flexDirection: "row", gap: 10, alignItems: "center" }}>
            <Icon name="figure.and.child.holdinghands" size={18} />
            <Text style={[styles.body, { color: colors.ink, flex: 1, fontSize: 14 }]}>{t("stale")}</Text>
          </View>
        )}

        {shown.length > 0 && (
          <Animated.View entering={enter(0)}>
            <SectionTitle icon="ruler">{t("sizes")}</SectionTitle>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {shown.map(([k, x]) => (
                <View key={k} style={[styles.tile, { width: tileW }]}>
                  <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: colors.inkSoft }}>{k}</Text>
                  <Text style={{ fontFamily: fonts.display, fontSize: 19, color: colors.ink }} numberOfLines={1} adjustsFontSizeToFit>
                    {x}
                  </Text>
                </View>
              ))}
            </View>
            {shoe && (
              <Text style={[styles.body, { marginTop: 8, fontSize: 14 }]}>
                {t("shoeApprox")} ≈ UK {shoe.UK} · EU {shoe.EU} · BR {shoe.BR} · MX {shoe.MX} · CO {shoe.CO} · JP {shoe.JP}
              </Text>
            )}
          </Animated.View>
        )}

        {(p.birthday || p.anniversary) && (
          <Animated.View entering={enter(1)}>
            <SectionTitle icon="calendar">{t("dates")}</SectionTitle>
            <View style={{ flexDirection: paneWidth >= 420 ? "row" : "column", gap: 8 }}>
              {(
                [
                  [tr("core.events.birthday"), p.birthday, "turns"],
                  [tr("core.events.anniversary"), p.anniversary, "years"],
                ] as const
              ).map(([label, d, verb]) =>
                d ? (
                  <View key={label} style={[styles.tile, { flex: 1, padding: 14 }]}>
                    <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: colors.inkSoft }}>{label}</Text>
                    <Text style={styles.h3}>{formatPartialDate(d, tr)}</Text>
                    <Text style={[styles.body, { fontSize: 14 }]}>
                      {describeDays(daysUntil(d), tr)}
                      {upcomingMilestone(d) ? ` · ${t(verb, { n: upcomingMilestone(d)! })}` : ""}
                    </Text>
                  </View>
                ) : null,
              )}
            </View>
          </Animated.View>
        )}

        {comingUp.length > 0 && (
          <Animated.View entering={enter(2)}>
            <SectionTitle icon="gift">{t("checklist")}</SectionTitle>
            <View style={{ gap: 8 }}>
              {comingUp.map((e) => {
                const done = isGifted(p, e);
                return (
                  <View key={`${e.kind}-${e.label}`} style={[styles.tile, { flexDirection: "row", alignItems: "center", gap: 12 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.strong, done && { color: colors.inkSoft, textDecorationLine: "line-through" }]}>{eventLabel(e, tr)}</Text>
                      <Text style={[styles.body, { fontSize: 14 }]}>
                        {e.date.toLocaleDateString(tag, { month: "short", day: "numeric" })} · {describeDays(e.days, tr)}
                      </Text>
                    </View>
                    <GiftLock locked={done} onToggle={() => toggle(e)} label={occasionName(p.name, e, tr)} showText size={30} />
                  </View>
                );
              })}
            </View>
            <Text style={[styles.body, { fontSize: 12, marginTop: 6 }]}>{t("lockedSkip")}</Text>
          </Animated.View>
        )}

        <Animated.View entering={enter(3)}>
          <OwnerSection person={p} />
        </Animated.View>

        {p.address && (
          <Animated.View entering={enter(4)}>
            <SectionTitle icon="shippingbox">{t("shipTo")}</SectionTitle>
            <Card>
              {[p.address.name?.trim() || p.name, ...formatAddress({ ...p.address, name: undefined }, "US", tr)].map((line, i) => (
                <Text key={i} style={[styles.body, { color: colors.ink }]}>
                  {line}
                </Text>
              ))}
              <CopyButton
                label={t("copyAddress")}
                done={t("copied")}
                text={[p.address.name?.trim() || p.name, ...formatAddress({ ...p.address, name: undefined }, "", tr)].join("\n")}
              />
            </Card>
          </Animated.View>
        )}

        {p.payments && Object.keys(p.payments).length > 0 && (
          <Animated.View entering={enter(5)}>
            <SectionTitle icon="dollarsign.circle">{t("money")}</SectionTitle>
            <View style={{ gap: 8 }}>
              {(Object.entries(p.payments) as [PaymentApp, string][]).map(([app, handle]) => {
                const link = paymentLink(app, handle);
                return (
                  <View key={app} style={[styles.tile, { flexDirection: "row", alignItems: "center", gap: 10 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: colors.inkSoft }}>{PAYMENT_APP_NAMES[app]}</Text>
                      <Text style={styles.strong} selectable>
                        {paymentHandleLabel(app, handle)}
                      </Text>
                    </View>
                    {link ? (
                      <Button small variant="soft" title={t("send")} onPress={() => Linking.openURL(link)} />
                    ) : (
                      <CopyButton label={t("copy")} done={t("copied")} text={handle} small />
                    )}
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {p.favorites && (
          <Animated.View entering={enter(6)}>
            <SectionTitle icon="heart">{t("favorites")}</SectionTitle>
            <Card style={{ gap: 6 }}>
              {!!p.favorites.likes && <Text style={[styles.body, { color: colors.ink }]}>{p.favorites.likes}</Text>}
              {!!p.favorites.teams && <Text style={[styles.body, { fontSize: 14 }]}>🏟️ {t("teams", { v: p.favorites.teams })}</Text>}
              {!!p.favorites.colors?.length && (
                <Text style={[styles.body, { fontSize: 14 }]}>{t("colors", { v: p.favorites.colors.map((c) => tr(`colors.${c}`)).join(", ") })}</Text>
              )}
              {!!p.favorites.avoid && <Text style={[styles.body, { fontSize: 14, color: colors.roseDeep }]}>{t("avoid", { v: p.favorites.avoid })}</Text>}
              {p.favorites.wishlists?.map((url) => (
                <Pressable key={url} onPress={() => Linking.openURL(url)}>
                  <Text style={[styles.strong, { color: colors.plum, fontSize: 14 }]} numberOfLines={1}>
                    🔗 {url.replace(/^https?:\/\/(www\.)?/, "")}
                  </Text>
                </Pressable>
              ))}
              {p.favorites.wishes?.filter(Boolean).map((w, i) => (
                <Text key={w} style={[styles.body, { color: colors.ink, fontSize: 15 }]}>
                  {i + 1}. {w}
                </Text>
              ))}
            </Card>
          </Animated.View>
        )}

        <RemovePerson person={p} onRemoved={onRemoved} />
      </View>
    </View>
  );
}

function CopyButton({ label, done, text, small = true }: { label: string; done: string; text: string; small?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      small={small}
      variant="soft"
      icon={copied ? "checkmark" : "doc.on.doc"}
      title={copied ? done : label}
      style={{ alignSelf: "flex-start", marginTop: small ? 0 : 10 }}
      onPress={async () => {
        await Clipboard.setStringAsync(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
    />
  );
}

/** Holiday tags and a private note: the owner's own info, never shown to the person. */
function OwnerSection({ person: p }: { person: Person }) {
  const t = useT("locker.owner");
  const tr = useTr();
  const [note, setNote] = useState(p.ownerNote ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  useEffect(() => setNote(p.ownerNote ?? ""), [p.id, p.ownerNote]);
  const tags = new Set(p.holidays ?? []);
  const toggle = (id: HolidayId) => {
    const next = new Set(tags);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    saveOwner(p.id, { holidays: [...next] }).catch(() => setStatus("error"));
  };
  const saveNote = async () => {
    if ((p.ownerNote ?? "") === note) return;
    setStatus("saving");
    try {
      await saveOwner(p.id, { ownerNote: note });
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  };
  return (
    <View>
      <SectionTitle icon="lock">{t("title")}</SectionTitle>
      <Card style={{ gap: 4 }}>
        <Text style={[styles.strong, { fontSize: 14 }]}>{t("holidaysFor", { name: p.name.split(" ")[0]! })}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
          {HOLIDAYS.map((h) => (
            <Chip key={h.id} label={`${h.emoji} ${tr(`core.holidays.${h.id}.name`)}`} active={tags.has(h.id)} onPress={() => toggle(h.id)} />
          ))}
        </View>
        <Text style={[styles.label, { marginTop: 14 }]}>{t("note")}</Text>
        <Input multiline value={note} onChangeText={setNote} onBlur={saveNote} placeholder={t("notePlaceholder")} style={{ backgroundColor: colors.cream }} />
        <Text style={[styles.body, { fontSize: 12, marginTop: 4 }]}>
          {status === "saving" ? t("saving") : status === "saved" ? t("saved") : p.kind === "child" ? t("onlyYouKids") : t("onlyYou")}
        </Text>
        <ErrorText>{status === "error" && t("error")}</ErrorText>
      </Card>
    </View>
  );
}

/** "Remove from locker", confirmed in place. */
function RemovePerson({ person: p, onRemoved }: { person: Person; onRemoved?: () => void }) {
  const t = useT("locker.detail");
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  if (!asking)
    return (
      <Pressable
        onPress={() => {
          tap();
          setAsking(true);
        }}
        style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", padding: 8 }}
      >
        <Icon name="trash" size={15} color={colors.roseDeep} />
        <Text style={{ fontFamily: fonts.black, color: colors.roseDeep }}>{t("remove")}</Text>
      </Pressable>
    );
  return (
    <View style={{ backgroundColor: "rgba(251,211,227,0.5)", borderRadius: 18, padding: 16, gap: 6 }}>
      <Text style={styles.strong}>{t("removeTitle", { name: p.name })}</Text>
      <Text style={[styles.body, { fontSize: 14 }]}>
        {t("removeBody")}
        {p.linked && !p.linked.ended ? ` ${t("removeLinked")}` : ""}
      </Text>
      <ErrorText>{error && t("removeFailed")}</ErrorText>
      <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
        <Button
          small
          variant="danger"
          icon="trash"
          busy={busy}
          title={busy ? t("removing") : t("removeYes")}
          onPress={async () => {
            setBusy(true);
            setError(false);
            try {
              await removePerson(p);
              onRemoved?.();
            } catch {
              setError(true);
              setBusy(false);
            }
          }}
        />
        <Button small variant="ghost" title={t("cancel")} onPress={() => setAsking(false)} disabled={busy} />
      </View>
    </View>
  );
}
