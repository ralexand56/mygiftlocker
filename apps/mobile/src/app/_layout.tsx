import { Fraunces_600SemiBold } from "@expo-google-fonts/fraunces";
import { Nunito_400Regular, Nunito_700Bold, Nunito_800ExtraBold } from "@expo-google-fonts/nunito";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { colors, fonts } from "@/lib/theme";

export default function RootLayout() {
  const [loaded] = useFonts({ Fraunces_600SemiBold, Nunito_400Regular, Nunito_700Bold, Nunito_800ExtraBold });
  if (!loaded) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.cream },
          headerTitleStyle: { fontFamily: fonts.display, color: colors.ink },
          headerTintColor: colors.ink,
          contentStyle: { backgroundColor: colors.cream },
        }}
      >
        <Stack.Screen name="index" options={{ title: "My locker", headerShown: false }} />
        <Stack.Screen name="person/[id]" options={{ title: "", headerTransparent: true }} />
        <Stack.Screen name="join" options={{ headerShown: false, presentation: "fullScreenModal" }} />
        <Stack.Screen name="exchange/index" options={{ title: "My exchanges" }} />
        <Stack.Screen name="exchange/[id]" options={{ title: "" }} />
      </Stack>
    </>
  );
}
