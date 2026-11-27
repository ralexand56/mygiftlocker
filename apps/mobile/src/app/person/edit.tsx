import { type Person } from "@mgl/core";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";
import { PersonForm, cleanForm, type FormValue } from "@/components/PersonForm";
import { Sheet } from "@/components/Sheet";
import { Button, ErrorText, styles } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { savePerson, usePerson } from "@/lib/store";

/** Edit someone's details. On a linked card, what they share stays theirs (shown as a note). */
export default function EditPersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const p = usePerson(id);
  const t = useT("editPerson");
  if (!p) return <Text style={[styles.body, { padding: 24 }]}>{t("notFound")}</Text>;
  return (
    <>
      <Stack.Screen options={{ title: p.name }} />
      <Editor person={p} />
    </>
  );
}

function Editor({ person: p }: { person: Person }) {
  const t = useT("editPerson");
  const tc = useT("common");
  const [value, setValue] = useState<FormValue>({
    name: p.name,
    relationship: p.relationship,
    kind: p.kind,
    sizes: p.sizes,
    birthday: p.birthday,
    anniversary: p.anniversary,
    favorites: p.favorites,
    address: p.address,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const live = p.linked && !p.linked.ended;
  const save = async () => {
    const v = cleanForm(value);
    if (!v.name) return setError(tc("somethingWrong"));
    setBusy(true);
    setError(null);
    try {
      await savePerson(p.id, {
        name: v.name,
        relationship: v.relationship,
        sizes: v.sizes,
        birthday: v.birthday,
        anniversary: v.anniversary,
        favorites: v.favorites,
        address: v.address,
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : tc("somethingWrong"));
      setBusy(false);
    }
  };
  return (
    <Sheet
      footer={
        <>
          <ErrorText>{error}</ErrorText>
          <Button title={tc("save")} busy={busy} onPress={save} />
        </>
      }
    >
      {live && <Text style={[styles.body, { marginBottom: 12 }]}>{t("live", { name: p.name })}</Text>}
      <PersonForm value={value} onChange={setValue} />
    </Sheet>
  );
}
