/**
 * Add someone to your locker by hand: adult or child, then what you know (name, sizes, dates,
 * favorites, address). Nothing is sent to them; invite them later to fill in the rest.
 */
import { newId, pastelFor, type Person } from "@mgl/core";
import { Stack, router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { PersonForm, cleanForm, type FormValue } from "@/components/PersonForm";
import { Sheet } from "@/components/Sheet";
import { Button, ErrorText, Icon, styles, tap } from "@/components/ui";
import { useUser } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { addPerson } from "@/lib/store";
import { colors, shadow } from "@/lib/theme";

export default function NewPersonScreen() {
  const t = useT("addPerson");
  const user = useUser();
  const [kind, setKind] = useState<Person["kind"] | null>(null);
  const [value, setValue] = useState<FormValue>({ name: "", kind: "adult", sizes: {} });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choose = (k: Person["kind"]) => {
    tap();
    setKind(k);
    setValue({ name: "", kind: k, sizes: k === "child" ? { fit: "kids" } : {} });
  };

  const save = async () => {
    const v = cleanForm(value);
    if (!v.name) return setError(t("nameRequired"));
    setBusy(true);
    setError(null);
    try {
      const id = await addPerson(user?.sub, {
        id: newId("p_"),
        ...v,
        kind: kind!,
        color: pastelFor(v.name),
        guardians: kind === "child" ? [user?.sub ?? "me"] : undefined,
        updatedAt: new Date().toISOString(),
      });
      router.replace({ pathname: "/person/[id]", params: { id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failed"));
      setBusy(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: t("title") }} />
      <Sheet
        footer={
          kind ? (
            <>
              <ErrorText>{error}</ErrorText>
              <Button title={busy ? t("saving") : t("save")} busy={busy} onPress={save} />
            </>
          ) : undefined
        }
      >
        <Text style={[styles.body, { marginBottom: 8 }]}>{t("lede")}</Text>
        <Pressable onPress={() => router.replace("/invite")}>
          <Text style={[styles.strong, { color: colors.plum, fontSize: 14, textDecorationLine: "underline", marginBottom: 16 }]}>{t("orInvite")}</Text>
        </Pressable>
        {!kind ? (
          <View style={{ gap: 12 }}>
            <Text style={[styles.label, { marginTop: 0 }]}>{t("who")}</Text>
            {(
              [
                ["adult", "person", colors.blush, t("adult"), t("adultBody")],
                ["child", "figure.child", colors.mint, t("child"), t("childBody")],
              ] as const
            ).map(([k, icon, tint, label, body]) => (
              <Pressable key={k} accessibilityRole="button" onPress={() => choose(k)} style={[{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#FFFDFB", borderRadius: 22, padding: 16 }, shadow, { shadowOpacity: 0.06 }]}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: tint, alignItems: "center", justifyContent: "center" }}>
                  <Icon name={icon} size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.h3}>{label}</Text>
                  <Text style={[styles.body, { fontSize: 14 }]}>{body}</Text>
                </View>
                <Icon name="chevron.right" size={14} color={colors.inkSoft} />
              </Pressable>
            ))}
          </View>
        ) : (
          <PersonForm value={value} onChange={setValue} />
        )}
      </Sheet>
    </>
  );
}
