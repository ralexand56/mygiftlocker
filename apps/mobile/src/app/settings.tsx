import { LOCALES, LOCALE_NAMES } from "@mgl/core";
import { deleteMyAccount, setMyLocale } from "@mgl/data";
import { Stack, router } from "expo-router";
import { useState } from "react";
import { Linking, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Card, Chips, ErrorText, Field, Input, SectionTitle, styles } from "@/components/ui";
import { backendEnabled } from "@/lib/amplify";
import { reloadUser, saveDisplayName, signOut, useUser } from "@/lib/auth";
import { chooseLocale, useLocale, useT } from "@/lib/i18n";
import { loadLocker } from "@/lib/store";
import { colors } from "@/lib/theme";

/** Account and app settings: your name, language, sign out, privacy. */
export default function SettingsScreen() {
  const t = useT("app.settings");
  const tc = useT("common");
  const tn = useT("namePrompt");
  const user = useUser();
  const locale = useLocale();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(user?.hasName ? user.name : "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <Stack.Screen options={{ title: t("title") }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: insets.bottom + 30, maxWidth: 640, width: "100%", alignSelf: "center" }}>
        {user ? (
          <Card style={{ gap: 4 }}>
            <SectionTitle icon="person.crop.circle">{tc("account")}</SectionTitle>
            {user.email && <Text style={styles.body}>{t("signedInAs", { email: user.email })}</Text>}
            <Field label={tn("label")}>
              <Input
                value={name}
                onChangeText={(v) => {
                  setName(v);
                  setSaved(false);
                }}
                placeholder={tn("placeholder")}
                autoComplete="given-name"
              />
            </Field>
            <ErrorText>{error}</ErrorText>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
              <Button
                small
                title={saved ? tc("done") : busy ? tn("saving") : tn("save")}
                busy={busy}
                disabled={!name.trim() || name.trim() === user.name}
                onPress={async () => {
                  setBusy(true);
                  setError(null);
                  try {
                    await saveDisplayName(name);
                    setSaved(true);
                  } catch {
                    setError(tn("error"));
                  } finally {
                    setBusy(false);
                  }
                }}
              />
              <Button
                small
                variant="soft"
                icon="rectangle.portrait.and.arrow.right"
                title={tc("signOut")}
                onPress={async () => {
                  await signOut();
                  router.dismissAll();
                }}
              />
            </View>
          </Card>
        ) : (
          backendEnabled && <Button title={tc("signIn")} onPress={() => router.push("/sign-in")} />
        )}

        {user && backendEnabled && <DeleteAccount />}

        <Card>
          <SectionTitle icon="globe">{tc("language")}</SectionTitle>
          <Chips
            options={LOCALES}
            value={locale}
            required
            render={(l) => LOCALE_NAMES[l]}
            onChange={(l) => l && chooseLocale(l, (chosen) => user && backendEnabled && setMyLocale(chosen))}
          />
          <Text style={[styles.body, { fontSize: 13, marginTop: 10 }]}>{t("languageHint")}</Text>
        </Card>

        <Card style={{ gap: 10 }}>
          <Button small variant="soft" icon="hand.raised" title={tc("privacy")} style={{ alignSelf: "flex-start" }} onPress={() => Linking.openURL("https://www.mygiftlockers.com/privacy")} />
          <Button small variant="soft" icon="safari" title={t("website")} style={{ alignSelf: "flex-start" }} onPress={() => Linking.openURL("https://www.mygiftlockers.com")} />
          <Text style={{ color: colors.inkSoft, fontSize: 12 }}>My Gift Lockers 0.1.0</Text>
        </Card>
      </ScrollView>
    </>
  );
}

/** App Store rule 5.1.1(v): people who can make an account here can delete it here. */
function DeleteAccount() {
  const t = useT("account");
  const tc = useT("common");
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Card style={{ gap: 8 }}>
      <SectionTitle icon="trash">{t("section")}</SectionTitle>
      {!asking ? (
        <Button small variant="soft" icon="trash" title={t("delete")} style={{ alignSelf: "flex-start" }} onPress={() => setAsking(true)} />
      ) : (
        <View style={{ backgroundColor: "rgba(251,211,227,0.5)", borderRadius: 18, padding: 14, gap: 8 }}>
          <Text style={styles.strong}>{t("title")}</Text>
          <Text style={[styles.body, { fontSize: 14 }]}>{t("body")}</Text>
          <ErrorText>{error}</ErrorText>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <Button
              small
              variant="danger"
              icon="trash"
              busy={busy}
              title={busy ? t("deleting") : t("confirm")}
              onPress={async () => {
                setBusy(true);
                setError(null);
                try {
                  await deleteMyAccount();
                  await reloadUser();
                  await loadLocker(null);
                  router.dismissAll();
                } catch {
                  setError(t("failed"));
                  setBusy(false);
                }
              }}
            />
            <Button small variant="ghost" title={tc("cancel")} disabled={busy} onPress={() => setAsking(false)} />
          </View>
        </View>
      )}
    </Card>
  );
}
