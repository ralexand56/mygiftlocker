/**
 * Invite someone: they fill in their own sizes from a link (on the website, or in the app), and
 * their answers land in your locker. Same options as the website's invite page; sharing uses the
 * iPhone share sheet, Messages, WhatsApp, email, a copy button and a QR code.
 */
import { DEFAULT_ASK, LOCALES, LOCALE_NAMES, createTr, inviteShareLinks, newId, withInviteLang, type InvitePayload, type InviteSection, type Locale } from "@mgl/core";
import { CORE_CATALOGS } from "@mgl/core/catalogs";
import * as Clipboard from "expo-clipboard";
import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, Share, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QrCode } from "@/components/QrCode";
import { Button, Card, Chips, ErrorText, Field, Icon, Input, styles, tap } from "@/components/ui";
import { backendEnabled } from "@/lib/amplify";
import { useUser } from "@/lib/auth";
import { useT, useTr } from "@/lib/i18n";
import { useLayout } from "@/lib/layout";
import { makeInvite } from "@/lib/store";
import { colors, fonts, shadow } from "@/lib/theme";

const SECTIONS: InviteSection[] = ["sizes", "address", "dates", "favorites", "payments", "kids"];

export default function InviteScreen() {
  const t = useT("inviteBuilder");
  const tr = useTr();
  const user = useUser();
  const insets = useSafeAreaInsets();
  const { split, width } = useLayout();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [note, setNote] = useState("");
  /** "auto" = the page follows their own device or choice. */
  const [lang, setLang] = useState<Locale | "auto">("auto");
  const [ask, setAsk] = useState<InvitePayload["ask"]>(DEFAULT_ASK);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.hasName && !from) setFrom(user.name.split(" ")[0]!);
  }, [user, from]);

  const create = async () => {
    if (backendEnabled && !user) return router.push("/sign-in");
    setBusy(true);
    setError(null);
    try {
      const payload: InvitePayload = {
        v: 1,
        id: newId("inv_"),
        from: { name: from.trim() },
        to: to.trim() ? { name: to.trim() } : undefined,
        ask,
        note: note.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      setUrl(await makeInvite(user?.sub, payload));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failed"));
    } finally {
      setBusy(false);
    }
  };

  const form = (
    <Card style={{ gap: 4 }}>
      <Text style={styles.h1}>{t("title")}</Text>
      <Text style={styles.body}>{t("lede")}</Text>
      <Pressable onPress={() => router.replace("/person/new")}>
        <Text style={[styles.strong, { color: colors.plum, fontSize: 14, textDecorationLine: "underline", marginTop: 6 }]}>{tr("addPerson.orAdd")}</Text>
      </Pressable>
      <View style={{ flexDirection: width >= 460 ? "row" : "column", gap: width >= 460 ? 12 : 0 }}>
        <View style={{ flex: 1 }}>
          <Field label={t("yourName")}>
            <Input value={from} onChangeText={setFrom} placeholder={t("yourNamePlaceholder")} autoComplete="given-name" />
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label={t("theirName")}>
            <Input value={to} onChangeText={setTo} placeholder={t("theirNamePlaceholder")} />
          </Field>
        </View>
      </View>
      <Field label={t("theirLanguage")}>
        <Chips<Locale | "auto">
          options={["auto", ...LOCALES]}
          value={lang}
          required
          onChange={(v) => v && setLang(v)}
          render={(v) => (v === "auto" ? t("automatic").split(" (")[0]! : LOCALE_NAMES[v])}
        />
        <Text style={[styles.body, { fontSize: 13, marginTop: 6 }]}>{t("languageHint")}</Text>
      </Field>
      <Text style={styles.label}>{t("askFor")}</Text>
      <View style={{ gap: 8 }}>
        {SECTIONS.map((id) => {
          const on = ask[id];
          return (
            <Pressable
              key={id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              onPress={() => {
                tap();
                setAsk((a) => ({ ...a, [id]: !a[id] }));
              }}
              style={[{ flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 12, backgroundColor: on ? colors.white : "rgba(255,255,255,0.45)" }, on && shadow, on && { shadowOpacity: 0.06 }]}
            >
              <View style={{ width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: on ? colors.rose : colors.white, borderWidth: on ? 0 : 2, borderColor: colors.lavender }}>
                {on && <Icon name="checkmark" size={13} color={colors.white} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.strong}>{t(`sections.${id}.label`)}</Text>
                <Text style={[styles.body, { fontSize: 13 }]}>{t(`sections.${id}.desc`)}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <Field label={t("note")}>
        <Input multiline value={note} onChangeText={setNote} placeholder={t("notePlaceholder")} />
      </Field>
      <ErrorText>{error}</ErrorText>
      <Button
        style={{ marginTop: 14 }}
        icon="paperplane"
        busy={busy}
        title={busy ? t("creating") : backendEnabled && !user ? t("signInCreate") : t("create")}
        disabled={!from.trim() || !Object.values(ask).some(Boolean)}
        onPress={create}
      />
    </Card>
  );

  return (
    <>
      <Stack.Screen options={{ title: t("title") }} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 30, maxWidth: split ? 1000 : 640, width: "100%", alignSelf: "center" }}
      >
        {/* Side by side when there's room (unfolded iPhone Duo, iPad); stacked otherwise. */}
        <View style={{ flexDirection: split ? "row" : "column", gap: 16, alignItems: "flex-start" }}>
          <View style={{ flex: split ? 1.1 : undefined, width: split ? undefined : "100%" }}>{url && !split ? null : form}</View>
          {url && (
            <Animated.View entering={FadeInDown.springify().damping(18)} style={{ flex: split ? 1 : undefined, width: split ? undefined : "100%" }}>
              <SharePanel
                url={withInviteLang(url, lang === "auto" ? null : lang)}
                lang={lang === "auto" ? undefined : lang}
                from={from}
                to={to}
                onAnother={() => {
                  setUrl(null);
                  setTo("");
                  setNote("");
                }}
              />
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

function SharePanel({ url, lang, from, to, onAnother }: { url: string; lang?: Locale; from: string; to: string; onAnother: () => void }) {
  const t = useT("inviteBuilder");
  const mine = useTr();
  // The message goes out in their language when one is chosen.
  const tr = lang ? createTr(lang, CORE_CATALOGS[lang]) : mine;
  const [copied, setCopied] = useState(false);
  const links = inviteShareLinks(url, from, to || undefined, tr);
  const message = decodeURIComponent(links.whatsapp.split("text=")[1] ?? url);
  const channels = [
    { label: t("textMessage"), href: links.sms, icon: "message" as const, tint: colors.mint },
    { label: t("email"), href: links.email, icon: "envelope" as const, tint: colors.blush },
    { label: "WhatsApp", href: links.whatsapp, icon: "bubble.left.and.bubble.right" as const, tint: colors.butter },
  ];
  return (
    <Card style={{ gap: 12 }}>
      <Text style={styles.h2}>{t("sendTitle")}</Text>
      <Button icon="square.and.arrow.up" title={mine("common.share")} onPress={() => Share.share({ message })} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.white, borderRadius: 16, padding: 8, paddingLeft: 14 }}>
        <Text style={[styles.body, { flex: 1, fontSize: 13 }]} numberOfLines={1}>
          {url.replace(/^https:\/\//, "")}
        </Text>
        <Button
          small
          icon={copied ? "checkmark" : "doc.on.doc"}
          title={copied ? t("copied") : t("copy")}
          onPress={async () => {
            await Clipboard.setStringAsync(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          }}
        />
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {channels.map((c) => (
          <Pressable
            key={c.label}
            onPress={() => Linking.openURL(c.href).catch(() => {})}
            style={{ flexGrow: 1, flexBasis: 140, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.white, borderRadius: 16, padding: 10 }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: c.tint, alignItems: "center", justifyContent: "center" }}>
              <Icon name={c.icon} size={17} />
            </View>
            <Text style={{ fontFamily: fonts.black, color: colors.ink }}>{c.label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 18, padding: 12 }}>
        <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: 6 }}>
          <QrCode value={url} size={112} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.strong}>{t("inPerson")}</Text>
          <Text style={[styles.body, { fontSize: 13 }]}>{t("inPersonBody")}</Text>
        </View>
      </View>
      <Button variant="soft" icon="person.badge.plus" title={t("another")} onPress={onAnother} />
      <Text style={[styles.body, { fontSize: 12, textAlign: "center" }]}>{t("anotherHint")}</Text>
    </Card>
  );
}
