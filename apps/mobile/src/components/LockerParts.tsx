import {
  describeDays,
  eventLabel,
  eventsInMonth,
  isGifted,
  isStale,
  nextEvent,
  occasionName,
  summarizeSizes,
  withGifted,
  type Person,
} from "@mgl/core";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useIntlTag, useT, useTr } from "@/lib/i18n";
import { saveOwner } from "@/lib/store";
import { colors, fonts, shadow } from "@/lib/theme";
import { GiftLock } from "./GiftLock";
import { Avatar, Button, Icon, Tag, styles, tap } from "./ui";

/** One person in the list. `selected` highlights it in the two-pane layout. */
export function PersonRow({ person: p, selected, onOpen, compact }: { person: Person; selected?: boolean; onOpen: () => void; compact?: boolean }) {
  const t = useT("locker");
  const tr = useTr();
  const tag = useIntlTag();
  const next = nextEvent(p);
  const sizes = summarizeSizes(p.sizes, tr);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("open", { name: p.name })}
      onPress={() => {
        tap();
        onOpen();
      }}
      style={({ pressed }) => [
        { backgroundColor: selected ? "#FFF4F8" : colors.white, borderRadius: 22, borderWidth: 2, borderColor: selected ? colors.rose : "transparent" },
        shadow,
        { shadowOpacity: 0.08 },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={{ borderRadius: 20, overflow: "hidden", padding: compact ? 12 : 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 110, backgroundColor: p.color, opacity: 0.55 }} />
        <Avatar name={p.name} color={p.color} size={compact ? 44 : 50} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 19, color: colors.ink }} numberOfLines={1}>
            {p.name}
          </Text>
          <Text style={[styles.body, { fontSize: 14 }]} numberOfLines={1}>
            {p.relationship ?? (p.kind === "child" ? t("child") : t("connection"))}
            {sizes ? ` · ${sizes}` : ""}
          </Text>
          {next ? (
            <Text style={{ fontFamily: next.days <= 7 ? fonts.black : fonts.body, fontSize: 13, color: next.days <= 7 ? colors.roseDeep : colors.inkSoft, marginTop: 2 }} numberOfLines={1}>
              {eventLabel(next, tr)} · {next.date.toLocaleDateString(tag, { month: "short", day: "numeric" })} · {describeDays(next.days, tr)}
            </Text>
          ) : (
            <Text style={[styles.body, { fontSize: 13 }]}>{t("noDates")}</Text>
          )}
          {(isStale(p) || (p.linked && !p.linked.ended)) && (
            <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
              {isStale(p) && <Tag bg={colors.butter}>{t("outgrown")}</Tag>}
              {p.linked && !p.linked.ended && <Tag bg={colors.mint}>{t("live")}</Tag>}
            </View>
          )}
        </View>
        {next && <GiftLock locked={isGifted(p, next)} onToggle={() => saveOwner(p.id, { gifted: withGifted(p, next, !isGifted(p, next)) }).catch(() => {})} label={occasionName(p.name, next, tr)} />}
      </View>
    </Pressable>
  );
}

/** Your own profile: shared into gift exchanges, never part of your reminders. */
/** `stacked`: button under the text, for narrow panes. */
export function SelfCard({ self, stacked }: { self: Person | null; stacked?: boolean }) {
  const t = useT("locker.self");
  const tg = useT("gifts");
  const tr = useTr();
  const sizes = self ? summarizeSizes(self.sizes, tr) : "";
  return (
    <View style={{ backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 22, padding: 14, borderWidth: 1, borderColor: "rgba(217,200,255,0.6)", gap: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Avatar name={self?.name ?? "Me"} color={colors.lavender} size={42} />
        <View style={{ flex: 1 }}>
          <Text style={styles.strong}>{self ? t("title") : t("addTitle")}</Text>
          <Text style={[styles.body, { fontSize: 13 }]} numberOfLines={stacked ? 3 : 2}>
            {self ? sizes || t("noSizes") : t("addBody")}
          </Text>
        </View>
        {!stacked && <Button small variant="soft" title={self ? t("edit") : t("add")} onPress={() => router.push("/me")} />}
      </View>
      {(stacked || self) && (
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {stacked && <Button small variant="soft" title={self ? t("edit") : t("add")} onPress={() => router.push("/me")} />}
          {self && <Button small variant="gradient" icon="sparkles" title={tg("forMe")} onPress={() => router.push({ pathname: "/gifts/[id]", params: { id: "self" } })} />}
        </View>
      )}
    </View>
  );
}

/** Month calendar of everyone's dates; tap a day to see who, tap a person to open them. */
export function LockerCalendar({ people, onOpen }: { people: Person[]; onOpen: (id: string) => void }) {
  const t = useT("calendar");
  const tr = useTr();
  const tag = useIntlTag();
  const today = new Date();
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() + 1 });
  const [day, setDay] = useState<number | null>(null);
  const events = useMemo(() => eventsInMonth(people, cursor.y, cursor.m), [people, cursor]);
  const first = new Date(cursor.y, cursor.m - 1, 1);
  const days = new Date(cursor.y, cursor.m, 0).getDate();
  const lead = first.getDay();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2026, 1, 1 + i).toLocaleDateString(tag, { weekday: "narrow" }));
  const isThisMonth = cursor.y === today.getFullYear() && cursor.m === today.getMonth() + 1;
  const move = (d: number) => {
    tap();
    setDay(null);
    setCursor((c) => {
      const m = c.m + d;
      return m < 1 ? { y: c.y - 1, m: 12 } : m > 12 ? { y: c.y + 1, m: 1 } : { y: c.y, m };
    });
  };
  const listed = day ? events.filter((e) => e.day === day) : events;
  const monthName = first.toLocaleDateString(tag, { month: "long", year: "numeric" });

  return (
    <View style={[{ backgroundColor: "#FFFDFB", borderRadius: 24, padding: 16 }, shadow, { shadowOpacity: 0.06 }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Icon name="calendar" size={18} color={colors.rose} />
        <Text style={[styles.h3, { flex: 1 }]}>{t("title")}</Text>
        {!isThisMonth && <Button small variant="soft" title={t("today")} onPress={() => setCursor({ y: today.getFullYear(), m: today.getMonth() + 1 })} />}
        <Pressable accessibilityLabel={t("prev")} hitSlop={8} onPress={() => move(-1)} style={{ padding: 6 }}>
          <Icon name="chevron.left" size={16} />
        </Pressable>
        <Pressable accessibilityLabel={t("next")} hitSlop={8} onPress={() => move(1)} style={{ padding: 6 }}>
          <Icon name="chevron.right" size={16} />
        </Pressable>
      </View>
      <Text style={[styles.strong, { marginTop: 4, textTransform: "capitalize" }]}>{monthName}</Text>
      <View style={{ flexDirection: "row", marginTop: 10 }}>
        {weekdays.map((w, i) => (
          <Text key={i} style={{ flex: 1, textAlign: "center", fontFamily: fonts.black, fontSize: 11, color: colors.inkSoft }}>
            {w}
          </Text>
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 4 }}>
        {cells.map((d, i) => {
          const has = d ? events.filter((e) => e.day === d) : [];
          const isToday = isThisMonth && d === today.getDate();
          return (
            <Pressable
              key={i}
              disabled={!d}
              onPress={() => {
                tap();
                setDay(day === d ? null : d);
              }}
              style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 2 }}
            >
              {d && (
                <View
                  style={{
                    flex: 1,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: day === d ? colors.blush : has.length ? colors.white : "transparent",
                    borderWidth: isToday ? 2 : 0,
                    borderColor: colors.rose,
                  }}
                >
                  <Text style={{ fontFamily: has.length ? fonts.black : fonts.body, fontSize: 14, color: colors.ink }}>{d}</Text>
                  {has.length > 0 && (
                    <View style={{ flexDirection: "row", gap: 2, marginTop: 1 }}>
                      {has.slice(0, 3).map((e, j) => (
                        <View key={j} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: e.holidayId ? colors.plum : colors.rose }} />
                      ))}
                    </View>
                  )}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
      <View style={{ gap: 6, marginTop: 8 }}>
        {listed.length === 0 ? (
          <Text style={[styles.body, { fontSize: 14 }]}>{t("none", { month: first.toLocaleDateString(tag, { month: "long" }) })}</Text>
        ) : (
          listed.map((e, i) => (
            <Pressable key={i} onPress={() => onOpen(e.personId)} style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.white, borderRadius: 14, padding: 10 }}>
              <View style={{ width: 34, alignItems: "center" }}>
                <Text style={{ fontFamily: fonts.display, fontSize: 18, color: colors.ink }}>{e.day}</Text>
              </View>
              <Avatar name={e.personName} color={e.color} size={30} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.strong, { fontSize: 15 }]} numberOfLines={1}>
                  {e.personName}
                </Text>
                <Text style={[styles.body, { fontSize: 13 }]}>
                  {eventLabel(e, tr)}
                  {e.milestone ? ` · ${e.milestone}` : ""}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </View>
    </View>
  );
}
