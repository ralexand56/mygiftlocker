// Backend + polyfills first: Amplify needs crypto.getRandomValues before anything else loads.
import "@/lib/amplify";
import { Fraunces_600SemiBold } from "@expo-google-fonts/fraunces";
import { Nunito_400Regular, Nunito_700Bold, Nunito_800ExtraBold } from "@expo-google-fonts/nunito";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { loadLocale, useT } from "@/lib/i18n";
import { colors, fonts } from "@/lib/theme";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Fraunces_600SemiBold, Nunito_400Regular, Nunito_700Bold, Nunito_800ExtraBold });
  const [localeLoaded, setLocaleLoaded] = useState(false);
  const t = useT();
  // Side insets apply to every screen: the folded iPhone Duo's cover screen keeps its camera and
  // status icons in a strip down the right edge (84 pt), and landscape iPhones have side notches.
  const insets = useSafeAreaInsets();
  useEffect(() => {
    void loadLocale().finally(() => setLocaleLoaded(true));
  }, []);
  if (!fontsLoaded || !localeLoaded) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream, paddingLeft: insets.left, paddingRight: insets.right }}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.cream },
          headerTitleStyle: { fontFamily: fonts.display, color: colors.ink },
          headerBackButtonDisplayMode: "minimal",
          headerTintColor: colors.ink,
          contentStyle: { backgroundColor: colors.cream },
        }}
      >
        <Stack.Screen name="index" options={{ title: t("locker.title"), headerShown: false }} />
        <Stack.Screen name="person/[id]" options={{ title: "", headerTransparent: true, headerStyle: { backgroundColor: "transparent" } }} />
        <Stack.Screen name="person/edit" options={{ title: t("common.edit"), presentation: "modal" }} />
        <Stack.Screen name="me" options={{ title: t("myProfile.title"), presentation: "modal" }} />
        <Stack.Screen name="settings" options={{ title: t("app.settings.title") }} />
        <Stack.Screen name="sign-in" options={{ headerShown: false, presentation: "modal" }} />
        <Stack.Screen name="join" options={{ headerShown: false, presentation: "fullScreenModal" }} />
        <Stack.Screen name="exchange/index" options={{ title: t("common.giftExchange") }} />
        <Stack.Screen name="exchange/[id]" options={{ title: "" }} />
      </Stack>
    </View>
  );
}
