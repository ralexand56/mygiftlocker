import { router } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlyingBackdrop } from "@/components/FlyingBackdrop";
import { Button, ErrorText, Input, styles } from "@/components/ui";
import { backendEnabled } from "@/lib/amplify";
import { confirmEmailCode, signInWithGoogle, startEmailSignIn, useUser } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { useLayout } from "@/lib/layout";
import { colors, fonts, shadow } from "@/lib/theme";

/** Same sign-in as the website: Google, or a one-time code by email. No passwords. */
export default function SignInScreen() {
  const t = useT("signIn");
  const user = useUser();
  const insets = useSafeAreaInsets();
  const { short } = useLayout();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState<null | "google" | "email" | "code">(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) router.back();
  }, [user]);

  const attempt = async (which: "google" | "email" | "code", fn: () => Promise<void>) => {
    setBusy(which);
    setError(null);
    try {
      await fn();
    } catch (e) {
      const name = (e as { name?: string }).name;
      // Closing the Google sheet isn't an error.
      if (name !== "UserCancelledException" && name !== "OAuthSignInException") setError(e instanceof Error ? e.message : t("somethingWrong"));
      else if (name === "OAuthSignInException") setError(t("somethingWrong"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream, paddingLeft: insets.left, paddingRight: insets.right }}>
      <FlyingBackdrop scene="welcome" />
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20, paddingTop: insets.top + (short ? 8 : 40) }}>
          <View style={[{ backgroundColor: "rgba(255,253,251,0.96)", borderRadius: 30, padding: short ? 20 : 26, width: "100%", maxWidth: 420, alignSelf: "center", gap: 12 }, shadow]}>
            <Text style={{ fontSize: short ? 40 : 52, textAlign: "center" }}>🎁</Text>
            <Text style={[styles.h1, { textAlign: "center", fontSize: short ? 28 : 32 }]}>{t("title")}</Text>
            <Text style={[styles.body, { textAlign: "center" }]}>{t("subtitle")}</Text>
            <Button title={t("google")} variant="soft" icon="globe" busy={busy === "google"} onPress={() => attempt("google", signInWithGoogle)} style={{ marginTop: 8 }} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: "rgba(74,59,102,0.1)" }} />
              <Text style={{ fontFamily: fonts.bold, color: colors.inkSoft, fontSize: 12 }}>{t("or")}</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: "rgba(74,59,102,0.1)" }} />
            </View>
            {sent ? (
              <>
                <Text style={[styles.body, { textAlign: "center", color: colors.ink }]}>{t("sent", { email: email.trim() })}</Text>
                <Input
                  value={code}
                  onChangeText={setCode}
                  placeholder={t("codePlaceholder")}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete="one-time-code"
                  maxLength={8}
                  autoFocus
                  style={{ textAlign: "center", fontSize: 22, letterSpacing: 6 }}
                />
                <Button title={busy === "code" ? t("checking") : t("signIn")} busy={busy === "code"} disabled={code.trim().length < 6} onPress={() => attempt("code", () => confirmEmailCode(code))} />
                <Button
                  title={t("differentEmail")}
                  variant="ghost"
                  small
                  onPress={() => {
                    setSent(false);
                    setCode("");
                  }}
                />
              </>
            ) : (
              <>
                <Input value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
                <Button
                  title={busy === "email" ? t("sending") : t("email")}
                  icon="envelope"
                  busy={busy === "email"}
                  disabled={!/\S+@\S+\.\S+/.test(email)}
                  onPress={() =>
                    attempt("email", async () => {
                      const step = await startEmailSignIn(email);
                      if (step === "code-sent") setSent(true);
                    })
                  }
                />
              </>
            )}
            <ErrorText>{error}</ErrorText>
            {!backendEnabled && <Text style={[styles.body, { fontSize: 12, textAlign: "center" }]}>{t("demo")}</Text>}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
