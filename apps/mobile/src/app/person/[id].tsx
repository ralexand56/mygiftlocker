import { useHeaderHeight } from "@react-navigation/elements";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PersonDetail } from "@/components/PersonDetail";
import { styles } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { useLayout } from "@/lib/layout";
import { usePerson } from "@/lib/store";

/** A person, full screen. When the window becomes wide (Duo unfolded), hand over to the two-pane locker. */
export default function PersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const p = usePerson(id);
  const { split, width } = useLayout();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const t = useT("editPerson");

  useEffect(() => {
    if (split && id) router.dismissTo({ pathname: "/", params: { id } });
  }, [split, id]);

  return (
    <>
      <Stack.Screen options={{ title: "" }} />
      <ScrollView contentInsetAdjustmentBehavior="never" contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}>
        {p ? (
          <PersonDetail person={p} paneWidth={Math.min(width, 640)} topInset={headerHeight} onRemoved={() => router.back()} />
        ) : (
          <View style={{ padding: 30 }}>
            <Text style={styles.body}>{t("notFound")}</Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}
