/**
 * Editing someone's details (or your own profile): name, sizes, dates, favorites and address.
 * Labels come from the website's invite flow (join.*), so the wording matches everywhere.
 * Sizes are always stored in US sizing, like the website.
 */
import {
  ALPHA_SIZES,
  HAT_SIZES,
  KIDS_SIZES,
  MENS_INSEAM,
  MENS_WAIST,
  PRIORITY_COUNTRIES,
  RING_SIZES,
  SHOE_WIDTHS,
  WOMENS_NUMERIC,
  addressFormat,
  addressLabels,
  countryName,
  shoeSizes,
  sizeValueLabel,
  type Address,
  type Favorites,
  type Fit,
  type PartialDate,
  type Person,
  type SizeProfile,
} from "@mgl/core";
import { useState, type ReactNode } from "react";
import { Text, View } from "react-native";
import { useT, useTr } from "@/lib/i18n";
import { Chip, Chips, Field, Input, SectionTitle, styles } from "./ui";

export const FAVORITE_COLORS: [string, string][] = [
  ["blush", "#F7C6D9"], ["coral", "#FF9F8A"], ["peach", "#FFC9A8"], ["butter", "#FFE7B8"],
  ["sage", "#C6DDB8"], ["mint", "#CDEFE3"], ["sky", "#BFDDFB"], ["navy", "#2F3E6B"],
  ["lavender", "#D9C8FF"], ["plum", "#7A5AA6"], ["cream", "#F6EEDC"], ["black", "#26222E"],
];

export type FormValue = Pick<Person, "name" | "relationship" | "sizes" | "birthday" | "anniversary" | "favorites" | "address" | "kind">;

function Section({ icon, title, children }: { icon: Parameters<typeof SectionTitle>[0]["icon"]; title: string; children: ReactNode }) {
  return (
    <View style={{ backgroundColor: "#FFFDFB", borderRadius: 22, padding: 16, gap: 2 }}>
      <SectionTitle icon={icon}>{title}</SectionTitle>
      {children}
    </View>
  );
}

export function PersonForm({ value, onChange, self }: { value: FormValue; onChange: (v: FormValue) => void; self?: boolean }) {
  const t = useT("join.body");
  const tr = useTr();
  const td = useT("locker.detail");
  const set = <K extends keyof FormValue>(k: K, v: FormValue[K]) => onChange({ ...value, [k]: v });
  return (
    <View style={{ gap: 14 }}>
      <Section icon="person" title={t("nameEdit")}>
        <Field label={t("nameEdit")}>
          <Input value={value.name} onChangeText={(name) => set("name", name)} placeholder={t("namePlaceholder")} autoComplete="name" />
        </Field>
        {!self && (
          <Field label={t("relationship")}>
            <Input value={value.relationship ?? ""} onChangeText={(r) => set("relationship", r)} placeholder={t("relationshipPlaceholder")} />
          </Field>
        )}
      </Section>

      <Section icon="ruler" title={td("sizes")}>
        <SizeEditor sizes={value.sizes} kind={value.kind} onChange={(sizes) => set("sizes", sizes)} />
      </Section>

      <Section icon="calendar" title={td("dates")}>
        <DateField label={tr("core.events.birthday")} value={value.birthday} onChange={(d) => set("birthday", d)} />
        {value.kind !== "child" && <DateField label={tr("core.events.anniversary")} value={value.anniversary} onChange={(d) => set("anniversary", d)} />}
      </Section>

      <Section icon="heart" title={td("favorites")}>
        <FavoritesEditor value={value.favorites ?? {}} onChange={(f) => set("favorites", f)} self={self} />
      </Section>

      {value.kind !== "child" && (
        <Section icon="shippingbox" title={td("shipTo")}>
          <AddressEditor value={value.address} onChange={(a) => set("address", a)} />
        </Section>
      )}
    </View>
  );
}

export function SizeEditor({ sizes: s, kind, onChange }: { sizes: SizeProfile; kind: Person["kind"]; onChange: (s: SizeProfile) => void }) {
  const t = useT("join.body");
  const tr = useTr();
  const td = useT("locker.detail");
  const fit: Fit | undefined = kind === "child" ? "kids" : s.fit;
  const set = (patch: Partial<SizeProfile>) => onChange({ ...s, ...patch });
  const letters = fit === "kids" ? KIDS_SIZES : ALPHA_SIZES;
  return (
    <View>
      {kind !== "child" && (
        <Field label={td("size.section")}>
          <Chips<Fit> options={["mens", "womens"]} value={s.fit} onChange={(f) => set({ fit: f })} render={(f) => tr(`core.fit.${f}`)} />
        </Field>
      )}
      <Field label={kind === "child" ? tr("join.kids.clothing") : t("shirtSize")}>
        <Chips options={letters} value={s.top} onChange={(top) => set({ top })} render={(v) => sizeValueLabel(v, tr)} />
      </Field>
      {fit === "mens" && (
        <>
          <Field label={t("waist")}>
            <Chips options={MENS_WAIST} value={s.waist} onChange={(waist) => set({ waist })} />
          </Field>
          <Field label={t("inseam")}>
            <Chips options={MENS_INSEAM} value={s.inseam} onChange={(inseam) => set({ inseam })} />
          </Field>
        </>
      )}
      {fit === "womens" && (
        <>
          <Field label={t("pantsSize")}>
            <Chips options={WOMENS_NUMERIC} value={s.womensNumeric} onChange={(womensNumeric) => set({ womensNumeric })} />
          </Field>
          <Field label={t("dressSize")}>
            <Chips options={WOMENS_NUMERIC} value={s.dress} onChange={(dress) => set({ dress })} />
          </Field>
        </>
      )}
      {fit === "kids" && (
        <Field label={t("letterShort")}>
          <Chips options={KIDS_SIZES} value={s.bottomAlpha} onChange={(bottomAlpha) => set({ bottomAlpha })} />
        </Field>
      )}
      {fit !== "kids" && (
        <Field label={t("jacketSize")}>
          <Chips options={ALPHA_SIZES} value={s.outerwear} onChange={(outerwear) => set({ outerwear })} />
        </Field>
      )}
      {fit && (
        <>
          <Field label={kind === "child" ? tr("join.kids.shoe") : t("shoeSize")} hint={fit !== "kids" && s.shoe ? t("savedAsUs", { v: s.shoe }) : undefined}>
            <Chips options={shoeSizes(fit)} value={s.shoe} onChange={(shoe) => set({ shoe })} />
          </Field>
          {fit !== "kids" && (
            <Field label={t("width")}>
              <Chips options={SHOE_WIDTHS} value={s.shoeWidth} onChange={(shoeWidth) => set({ shoeWidth })} render={(w) => tr(`core.shoeWidth.${w}`)} />
            </Field>
          )}
        </>
      )}
      <Field label={t("foot")}>
        <Input
          keyboardType="decimal-pad"
          value={s.footLengthCm?.toString() ?? ""}
          placeholder={tr("join.footPlaceholder")}
          onChangeText={(v) => {
            const n = Number(v.replace(",", "."));
            set({ footLengthCm: v && Number.isFinite(n) && n > 5 && n < 40 ? n : undefined });
          }}
        />
      </Field>
      {kind !== "child" && (
        <Field label={t("ringSize")}>
          <Chips options={RING_SIZES} value={s.ring} onChange={(ring) => set({ ring })} />
        </Field>
      )}
      <Field label={t("hatSize")}>
        <Chips options={HAT_SIZES} value={s.hat} onChange={(hat) => set({ hat })} render={(h) => sizeValueLabel(h, tr)} />
      </Field>
      <Field label={t("else")}>
        <Input value={s.notes ?? ""} onChangeText={(notes) => set({ notes: notes || undefined })} placeholder={t("elsePlaceholder")} />
      </Field>
    </View>
  );
}

export function DateField({ label, value, onChange }: { label: string; value?: PartialDate; onChange: (d: PartialDate | undefined) => void }) {
  const t = useT("join.date");
  const tr = useTr();
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const monthName = (m: number) => new Date(2026, m - 1, 1).toLocaleDateString(tr.locale === "pt" ? "pt-BR" : tr.locale, { month: "short" });
  const update = (patch: Partial<PartialDate>) => {
    const next = { month: value?.month ?? 0, day: value?.day ?? 0, year: value?.year, ...patch };
    onChange(next.month && next.day ? (next as PartialDate) : next.month || next.day ? (next as PartialDate) : undefined);
  };
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Chips options={months} value={value?.month || undefined} onChange={(m) => update({ month: m ?? 0 })} render={monthName} />
      <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
        <Input
          style={{ flex: 1 }}
          keyboardType="number-pad"
          maxLength={2}
          placeholder={t("day")}
          accessibilityLabel={t("dayOf", { label })}
          value={value?.day ? String(value.day) : ""}
          onChangeText={(v) => {
            const d = Math.min(31, Math.max(0, Number(v) || 0));
            update({ day: d });
          }}
        />
        <Input
          style={{ flex: 1.3 }}
          keyboardType="number-pad"
          maxLength={4}
          placeholder={t("year")}
          accessibilityLabel={t("yearOf", { label })}
          value={value?.year ? String(value.year) : ""}
          onChangeText={(v) => update({ year: v.length === 4 ? Number(v) : undefined })}
        />
      </View>
    </View>
  );
}

export function FavoritesEditor({ value: f, onChange, self }: { value: Favorites; onChange: (f: Favorites) => void; self?: boolean }) {
  const t = useT("join.body");
  const tc = useT("colors");
  const set = (patch: Partial<Favorites>) => onChange({ ...f, ...patch });
  const wishes = [...(f.wishes ?? []), "", "", ""].slice(0, 3);
  const colorsOn = new Set(f.colors ?? []);
  return (
    <View>
      <Field label={self ? t("loves") : t("lovesEdit")}>
        <Input multiline value={f.likes ?? ""} onChangeText={(likes) => set({ likes: likes || undefined })} placeholder={t("lovesPlaceholder")} />
      </Field>
      <Field label={t("colors")}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {FAVORITE_COLORS.map(([id, hex]) => (
            <Chip
              key={id}
              swatch={hex}
              label={tc(id)}
              active={colorsOn.has(id)}
              onPress={() => {
                const next = new Set(colorsOn);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                set({ colors: [...next] });
              }}
            />
          ))}
        </View>
      </Field>
      <Field label={t("avoid")}>
        <Input value={f.avoid ?? ""} onChangeText={(avoid) => set({ avoid: avoid || undefined })} placeholder={t("avoidPlaceholder")} />
      </Field>
      <Text style={styles.label}>{t("wishes")}</Text>
      <View style={{ gap: 8 }}>
        {wishes.map((w, i) => (
          <Input
            key={i}
            value={w}
            placeholder={t("wish", { n: i + 1 })}
            onChangeText={(v) => {
              const next = [...wishes];
              next[i] = v;
              set({ wishes: next });
            }}
          />
        ))}
      </View>
      <Field label={t("teams")}>
        <Input value={f.teams ?? ""} onChangeText={(teams) => set({ teams: teams || undefined })} placeholder={t("teamsPlaceholder")} />
      </Field>
    </View>
  );
}

export function AddressEditor({ value, onChange }: { value?: Address; onChange: (a: Address | undefined) => void }) {
  const t = useT("join.address");
  const tr = useTr();
  const a: Address = value ?? { line1: "", city: "", region: "", postalCode: "", country: "US" };
  const fmt = addressFormat(a.country);
  const labels = addressLabels(a.country, tr);
  const set = (patch: Partial<Address>) => {
    const next = { ...a, ...patch };
    onChange(next.line1 || next.city || next.postalCode ? next : undefined);
  };
  const [showAll, setShowAll] = useState(!PRIORITY_COUNTRIES.includes(a.country as (typeof PRIORITY_COUNTRIES)[number]));
  return (
    <View>
      <Field label={t("country")}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {PRIORITY_COUNTRIES.map((c) => (
            <Chip key={c} label={countryName(c, tr)} active={a.country === c} onPress={() => set({ country: c, region: "" })} />
          ))}
          {!showAll && <Chip label="…" active={false} onPress={() => setShowAll(true)} />}
        </View>
        {showAll && (
          <Input style={{ marginTop: 8 }} autoCapitalize="characters" maxLength={2} value={a.country} onChangeText={(c) => set({ country: c.toUpperCase() })} placeholder="US" />
        )}
      </Field>
      <Field label={t("street")}>
        <Input value={a.line1} onChangeText={(line1) => set({ line1 })} autoComplete="street-address" />
      </Field>
      <Field label={fmt.line2Required ? labels.line2 : t("optional", { label: labels.line2 })}>
        <Input value={a.line2 ?? ""} onChangeText={(line2) => set({ line2: line2 || undefined })} />
      </Field>
      <Field label={t("city")}>
        <Input value={a.city} onChangeText={(city) => set({ city })} autoComplete="postal-address-locality" />
      </Field>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field label={fmt.regionRequired ? labels.region : t("optional", { label: labels.region })}>
            {fmt.regions ? (
              <Input value={a.region} onChangeText={(region) => set({ region: region.toUpperCase() })} autoCapitalize="characters" placeholder={fmt.regions[0]?.code} />
            ) : (
              <Input value={a.region} onChangeText={(region) => set({ region })} />
            )}
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label={fmt.postalRequired ? labels.postal : t("optional", { label: labels.postal })}>
            <Input
              value={a.postalCode}
              onChangeText={(postalCode) => set({ postalCode: fmt.postalFormat ? fmt.postalFormat(postalCode) : postalCode })}
              placeholder={fmt.postalExample}
              autoComplete="postal-code"
            />
          </Field>
        </View>
      </View>
    </View>
  );
}

/** Tidies a form value before saving: trims text, drops empty wishes and empty sections. */
export function cleanForm(v: FormValue): FormValue {
  const f = v.favorites ?? {};
  const wishes = (f.wishes ?? []).map((w) => w.trim()).filter(Boolean);
  const favorites: Favorites = {
    ...(f.likes?.trim() && { likes: f.likes.trim() }),
    ...(f.avoid?.trim() && { avoid: f.avoid.trim() }),
    ...(f.teams?.trim() && { teams: f.teams.trim() }),
    ...(f.colors?.length && { colors: f.colors }),
    ...(f.wishlists?.length && { wishlists: f.wishlists }),
    ...(wishes.length && { wishes }),
  };
  const date = (d?: PartialDate) => (d && d.month && d.day ? { month: d.month, day: d.day, ...(d.year && { year: d.year }) } : undefined);
  return {
    ...v,
    name: v.name.trim(),
    relationship: v.relationship?.trim() || undefined,
    birthday: date(v.birthday),
    anniversary: date(v.anniversary),
    favorites: Object.keys(favorites).length ? favorites : undefined,
    address: v.address && v.address.line1.trim() ? { ...v.address, line1: v.address.line1.trim(), city: v.address.city.trim() } : undefined,
  };
}
