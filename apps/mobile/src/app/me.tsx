import { pastelFor } from "@mgl/core";
import { Stack, router } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";
import { PersonForm, cleanForm, type FormValue } from "@/components/PersonForm";
import { Sheet } from "@/components/Sheet";
import { Button, ErrorText, styles } from "@/components/ui";
import { useUser } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { saveSelf, useLocker } from "@/lib/store";

/** Your own sizes, dates and wishes: shared into gift exchanges and with connections you choose. */
export default function MeScreen() {
  const t = useT("myProfile");
  const tc = useT("common");
  const user = useUser();
  const { self } = useLocker();
  const ts = useT("locker.self");
  const [value, setValue] = useState<FormValue>({
    name: self?.name ?? (user?.hasName ? user.name : ""),
    kind: "adult",
    sizes: self?.sizes ?? {},
    birthday: self?.birthday,
    anniversary: self?.anniversary,
    favorites: self?.favorites,
    address: self?.address,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    const v = cleanForm(value);
    setBusy(true);
    setError(null);
    try {
      await saveSelf(user?.sub ?? "me", {
        ...self,
        ...v,
        id: "self",
        kind: "adult",
        color: pastelFor(v.name || "Me"),
        payments: self?.payments,
        updatedAt: new Date().toISOString(),
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : tc("somethingWrong"));
      setBusy(false);
    }
  };
  return (
    <>
      <Stack.Screen options={{ title: t("title") }} />
      <Sheet
        footer={
          <>
            <ErrorText>{error}</ErrorText>
            <Button title={tc("save")} busy={busy} onPress={save} />
          </>
        }
      >
        <Text style={[styles.body, { marginBottom: 12 }]}>{ts("addBody")}</Text>
        <PersonForm value={value} onChange={setValue} self />
      </Sheet>
    </>
  );
}
