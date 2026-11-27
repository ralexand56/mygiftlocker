/**
 * The locker. One column on iPhones (and the folded iPhone Duo); when the window is wide
 * (unfolded Duo, iPad) the list sits on the left and the selected person on the right.
 * Folding and unfolding keeps your place: see the effects below and person/[id].tsx.
 */
import { describeDays, filterPeopleByName, occasionName, sortPeople, upcomingEvents, type PeopleSort } from "@mgl/core";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LockerCalendar, PersonRow, SelfCard } from "@/components/LockerParts";
import { PersonDetail } from "@/components/PersonDetail";
import { Button, Chips, Icon, Input, Rich, styles, tap } from "@/components/ui";
import { backendEnabled } from "@/lib/amplify";
import { useUser } from "@/lib/auth";
import { useT, useTr } from "@/lib/i18n";
import { useLayout } from "@/lib/layout";
import { loadLocker, useLocker } from "@/lib/store";
import { colors, fonts } from "@/lib/theme";

export default function LockerScreen() {
  const t = useT("locker");
  const tr = useTr();
  const user = useUser();
  const { people: loaded, self, error } = useLocker();
  const people = loaded ?? [];
  const insets = useSafeAreaInsets();
  const layout = useLayout();
  const { split, listWidth, width } = layout;
  const { id: selectedId } = useLocalSearchParams<{ id?: string }>();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<PeopleSort>("next");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user !== undefined) void loadLocker(user?.sub ?? null);
  }, [user]);

  // Folded with someone selected: show them full screen, as on any iPhone.
  useEffect(() => {
    if (!split && selectedId) {
      router.setParams({ id: undefined });
      router.push({ pathname: "/person/[id]", params: { id: selectedId } });
    }
  }, [split, selectedId]);

  const shown = useMemo(() => sortPeople(filterPeopleByName(people, query), sort), [people, query, sort]);
  const upcoming = useMemo(() => upcomingEvents(people)[0], [people]);
  const selected = split ? people.find((p) => p.id === selectedId) : undefined;
  const open = (id: string) => (split ? router.setParams({ id }) : router.push({ pathname: "/person/[id]", params: { id } }));

  if (backendEnabled && user === null) return <SignedOut />;
  const loading = backendEnabled && (user === undefined || loaded === undefined);

  const header = (
    <Animated.View entering={FadeInDown.springify().damping(18)} style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.display, fontSize: layout.short ? 32 : 38, color: colors.ink }}>{t("title")}</Text>
        {upcoming && (
          <Rich
            style={styles.body}
            text={t("nextUp", { occasion: occasionName(upcoming.personName, upcoming, tr), when: upcoming.days === 0 ? t("isToday") : describeDays(upcoming.days, tr) })}
          />
        )}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={tr("common.account")} onPress={() => router.push("/settings")} hitSlop={10} style={{ padding: 8, marginTop: 4 }}>
        <Icon name="person.crop.circle" size={26} color={colors.inkSoft} />
      </Pressable>
    </Animated.View>
  );

  const list = (
    <View style={{ gap: 12 }}>
      {header}
      <View style={{ flexDirection: split ? "column" : "row", gap: 10 }}>
        <Button title={t("invite")} icon="plus" onPress={() => router.push("/invite")} style={{ flex: split ? undefined : 1 }} />
        {/* Secret Santa is still demo data in the app (phase 4). */}
        {!backendEnabled && <Button title={tr("common.giftExchange")} variant="soft" onPress={() => router.push("/exchange")} style={{ flex: split ? undefined : 1 }} />}
      </View>
      {error && <Text style={{ fontFamily: fonts.bold, color: colors.roseDeep }}>{tr("common.somethingWrong")}</Text>}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.rose} />
      ) : (
        <>
          {people.length > 0 && (
            <>
              <Input value={query} onChangeText={setQuery} placeholder={t("search")} accessibilityLabel={t("search")} clearButtonMode="while-editing" returnKeyType="search" />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ fontFamily: fonts.bold, color: colors.inkSoft, fontSize: 13 }}>{t("sort")}</Text>
                <Chips<PeopleSort> options={["next", "name"]} value={sort} required onChange={(v) => v && setSort(v)} render={(v) => (v === "next" ? t("sortNext") : t("sortName"))} />
              </View>
            </>
          )}
          {(user || !backendEnabled) && <SelfCard self={self} stacked={split || width < 360} />}
          {people.length === 0 && (
            <View style={{ backgroundColor: "rgba(255,255,255,0.75)", borderRadius: 24, padding: 22, alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 40 }}>🎁</Text>
              <Text style={[styles.h2, { textAlign: "center" }]}>{t("emptyTitle")}</Text>
              <Text style={[styles.body, { textAlign: "center" }]}>{t("emptyBody")}</Text>
            </View>
          )}
          {people.length > 0 && shown.length === 0 && <Text style={[styles.body, { textAlign: "center", padding: 20 }]}>{t("noMatch", { query: query.trim() })}</Text>}
          {shown.map((p, i) => (
            <Animated.View key={p.id} entering={FadeInDown.delay(Math.min(i, 8) * 50).springify().damping(16)}>
              <PersonRow person={p} selected={selected?.id === p.id} onOpen={() => open(p.id)} compact={split} />
            </Animated.View>
          ))}
          {!split && people.length > 0 && <LockerCalendar people={people} onOpen={open} />}
        </>
      )}
    </View>
  );

  const refresh = (
    <RefreshControl
      refreshing={refreshing}
      tintColor={colors.rose}
      onRefresh={async () => {
        setRefreshing(true);
        await loadLocker(user?.sub ?? null, true);
        setRefreshing(false);
      }}
    />
  );

  if (!split)
    return (
      <ScrollView
        keyboardShouldPersistTaps="handled"
        refreshControl={backendEnabled ? refresh : undefined}
        contentContainerStyle={{ padding: 20, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 30, maxWidth: layout.contentMax, width: "100%", alignSelf: "center" }}
      >
        {list}
      </ScrollView>
    );

  // Two panes: list | person (or the calendar when no one is selected).
  const detailWidth = width - listWidth;
  return (
    <View style={{ flex: 1, flexDirection: "row", backgroundColor: colors.cream }}>
      <ScrollView
        style={{ width: listWidth, flexGrow: 0, borderRightWidth: 1, borderRightColor: "rgba(74,59,102,0.08)" }}
        keyboardShouldPersistTaps="handled"
        refreshControl={backendEnabled ? refresh : undefined}
        contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 30 }}
      >
        {list}
      </ScrollView>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: selected ? 0 : insets.top + 20, paddingBottom: insets.bottom + 30 }}>
        {selected ? (
          <Animated.View key={selected.id} entering={FadeIn.duration(220)}>
            <PersonDetail person={selected} paneWidth={detailWidth} topInset={insets.top} onRemoved={() => router.setParams({ id: undefined })} />
          </Animated.View>
        ) : (
          <View style={{ paddingHorizontal: 20, gap: 16 }}>
            {people.length > 0 ? (
              <>
                <Text style={[styles.body, { textAlign: "center" }]}>{t("pickSomeone")}</Text>
                <LockerCalendar people={people} onOpen={open} />
              </>
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function SignedOut() {
  const t = useT("locker");
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 28, paddingTop: insets.top, gap: 10 }}>
      <Text style={{ fontSize: 56 }}>🎁</Text>
      <Text style={[styles.h1, { textAlign: "center" }]}>{t("signedOutTitle")}</Text>
      <Text style={[styles.body, { textAlign: "center", maxWidth: 360 }]}>{t("signedOutBody")}</Text>
      <Button
        title={t("signIn")}
        style={{ marginTop: 14, minWidth: 220 }}
        onPress={() => {
          tap();
          router.push("/sign-in");
        }}
      />
    </View>
  );
}
