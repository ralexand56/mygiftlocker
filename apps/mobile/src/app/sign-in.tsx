import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlyingBackdrop } from "@/components/FlyingBackdrop";
import { Button, ErrorText, Icon, Input, styles } from "@/components/ui";
import { backendEnabled } from "@/lib/amplify";
import { confirmEmailCode, signInWithApple, signInWithGoogle, startEmailSignIn, useUser } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { useLayout } from "@/lib/layout";
import { colors, fonts, shadow } from "@/lib/theme";
import { LogoMark } from "@/components/LogoMark";

/** Same sign-in as the website: Google, or a one-time code by email. No passwords. */
export default function SignInScreen() {
  const t = useT("signIn");
  const user = useUser();
  const insets = useSafeAreaInsets();
  const { short } = useLayout();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState<null | "apple" | "google" | "email" | "code">(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) router.back();
  }, [user]);

  const attempt = async (which: "apple" | "google" | "email" | "code", fn: () => Promise<void>) => {
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
            <View style={{ alignItems: "center" }}>
              <LogoMark size={short ? 50 : 64} />
            </View>
            <Text style={[styles.h1, { textAlign: "center", fontSize: short ? 28 : 32 }]}>{t("title")}</Text>
            <Text style={[styles.body, { textAlign: "center" }]}>{t("subtitle")}</Text>
            {/* Apple's guidelines: black button with the Apple logo, listed first. */}
            <Pressable
              accessibilityRole="button"
              disabled={!!busy}
              onPress={() => attempt("apple", signInWithApple)}
              style={{ marginTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#000", borderRadius: 999, paddingVertical: 14, opacity: busy && busy !== "apple" ? 0.5 : 1 }}
            >
              {busy === "apple" ? <ActivityIndicator color="#fff" /> : <Icon name="apple.logo" size={18} color="#fff" />}
              <Text style={{ fontFamily: fonts.black, fontSize: 16, color: "#fff" }}>{t("apple")}</Text>
            </Pressable>
            <Button title={t("google")} variant="soft" icon="globe" busy={busy === "google"} onPress={() => attempt("google", signInWithGoogle)} />
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
