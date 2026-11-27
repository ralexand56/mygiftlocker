import { MAX_PERSON_PHOTOS, type Person } from "@mgl/core";
import { photoUrl } from "@mgl/data";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useUser } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { addPhoto, deletePhoto } from "@/lib/store";
import { colors } from "@/lib/theme";
import { ErrorText, Icon, styles, tap } from "./ui";

/** Up to 5 private photos of an adult, used to pick gifts that match their style. */
export function PersonPhotos({ person: p }: { person: Person }) {
  const t = useT("photos");
  const user = useUser();
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const photos = p.photos ?? [];

  useEffect(() => {
    let live = true;
    Promise.all(photos.map(async (path) => [path, await photoUrl(path).catch(() => "")] as const)).then((pairs) => live && setUrls(Object.fromEntries(pairs)));
    return () => {
      live = false;
    };
  }, [photos.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null;
  const first = p.name.split(" ")[0]!;
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={[styles.strong, { fontSize: 14, marginBottom: 8 }]}>{t("title", { name: first })}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {photos.map((path) => (
          <View key={path} style={{ width: 84, height: 84, borderRadius: 16, overflow: "hidden", backgroundColor: colors.shell }}>
            {urls[path] && <Image source={{ uri: urls[path] }} style={{ flex: 1 }} contentFit="cover" accessibilityLabel={t("alt", { name: first })} />}
            <Pressable
              accessibilityLabel={t("remove")}
              hitSlop={6}
              onPress={() => {
                tap();
                setError(null);
                deletePhoto(user.sub, p, path).catch(() => setError(t("removeFailed")));
              }}
              style={{ position: "absolute", top: 4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center" }}
            >
              <Icon name="xmark" size={11} />
            </Pressable>
          </View>
        ))}
        {photos.length < MAX_PERSON_PHOTOS && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("add")}
            disabled={busy}
            onPress={async () => {
              tap();
              setBusy(true);
              setError(null);
              try {
                await addPhoto(user.sub, p);
              } catch {
                setError(t("uploadFailed"));
              } finally {
                setBusy(false);
              }
            }}
            style={{ width: 84, height: 84, borderRadius: 16, borderWidth: 2, borderStyle: "dashed", borderColor: colors.lavender, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.6)" }}
          >
            {busy ? <ActivityIndicator color={colors.rose} /> : <Icon name="photo.badge.plus" size={22} color={colors.plum} />}
          </Pressable>
        )}
      </ScrollView>
      <Text style={[styles.body, { fontSize: 12, marginTop: 6 }]}>{t("hint", { max: MAX_PERSON_PHOTOS })}</Text>
      <ErrorText>{error}</ErrorText>
    </View>
  );
}
