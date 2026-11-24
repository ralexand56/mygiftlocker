"use client";

import {
  ALPHA_SIZES,
  FIT_LABELS,
  HAT_SIZES,
  KIDS_SIZES,
  MENS_CHEST_IN,
  MENS_INSEAM,
  MENS_WAIST,
  MONTHS,
  RING_SIZES,
  SHIRT_NECK,
  SHIRT_SLEEVE,
  SHOE_WIDTHS,
  SIZE_SYSTEMS,
  PRIORITY_COUNTRIES,
  addressFormat,
  MAX_WISHLIST_LINKS,
  cleanWishlistLinks,
  linkLabel,
  normalizeLink,
  countryForLocale,
  countryOptions,
  formatAddress,
  isCompleteAddress,
  validateAddress,
  SIZE_SYSTEM_LABELS,
  WOMENS_NUMERIC,
  convertAlpha,
  convertRing,
  convertShoe,
  convertWaist,
  convertWomensNumeric,
  daysInMonth,
  formatPartialDate,
  newId,
  pastelFor,
  shoeSizes,
  stepsFor,
  summarizeSizes,
  type Address,
  type AlphaSize,
  type Fit,
  type PublicInvite,
  type PartialDate,
  type Person,
  type SizeProfile,
  type SizeSystem,
  type StepDef,
  type StepId,
} from "@mgl/core";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { ArrowLeft, ArrowRight, BellRing, Check, Gift, Pencil, Plus, Ruler, Sparkles, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { FlyingBackdrop } from "@/components/FlyingBackdrop";
import { StepRail, StepShowcase } from "@/components/StepShowcase";
import { LogoMark } from "@/components/Logo";
import { Button, ChipGroup, Field, Input, Textarea, inputCls } from "@/components/ui";
import { submitInvite } from "@/lib/invites";
import { useUser } from "@/lib/auth";
import { rememberPendingSelf, saveSelfProfile } from "@/lib/self";

type PD = Partial<PartialDate>;
interface Kid {
  id: string;
  name: string;
  birthday: PD;
  top?: string;
  bottom?: string;
  shoe?: number;
}
interface FormState {
  name: string;
  sizes: SizeProfile;
  address: Partial<Address>;
  birthday: PD;
  anniversary: PD;
  colors: string[];
  likes: string;
  avoid: string;
  wishes: string[];
  wishlists: string[];
  kids: Kid[];
}

const initial: FormState = {
  name: "",
  sizes: {},
  address: { country: "US" },
  birthday: {},
  anniversary: {},
  colors: [],
  likes: "",
  avoid: "",
  wishes: ["", "", ""],
  wishlists: [""],
  kids: [],
};

const EASE = [0.16, 1, 0.3, 1] as const;

/** Content lines leave upward with a blur and new ones rise in, ~90ms apart. */
const EASE_IN = [0.7, 0, 0.84, 0] as const;
const column: Variants = {
  enter: {},
  center: { transition: { staggerChildren: 0.09, delayChildren: 0.12 } },
  exit: { transition: { staggerChildren: 0.035 } },
};
// Opacity + transform only: these stay on the GPU. (Animating `filter: blur()` here made
// iOS Safari repaint the whole column every frame.)
const line: Variants = {
  enter: (dir: number) => ({ opacity: 0, y: 22 * dir }),
  center: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
  exit: (dir: number) => ({ opacity: 0, y: -18 * dir, transition: { duration: 0.24, ease: EASE_IN } }),
};

/** Prefill the form from a saved profile (editing "My profile"). */
function formFrom(p: Person): FormState {
  const wishes = [...(p.favorites?.wishes ?? [])];
  while (wishes.length < 3) wishes.push("");
  return {
    ...initial,
    name: p.name,
    sizes: p.sizes ?? {},
    address: p.address ?? initial.address,
    birthday: p.birthday ?? {},
    anniversary: p.anniversary ?? {},
    colors: p.favorites?.colors ?? [],
    likes: p.favorites?.likes ?? "",
    avoid: p.favorites?.avoid ?? "",
    wishes,
    wishlists: p.favorites?.wishlists?.length ? [...p.favorites.wishlists] : [""],
  };
}

/** The same questions, for the signed-in user's own profile. */
export const SELF_INVITE: PublicInvite = { id: "self", from: { name: "you" }, ask: { sizes: true, address: true, dates: true, favorites: true, kids: false } };

export function JoinFlow({ invite, self }: { invite: PublicInvite; self?: { initial: Person | null; onSave: (p: Person) => Promise<void> } }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => (self?.initial ? formFrom(self.initial) : { ...initial, name: invite.to?.name ?? "" }));
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [sys, setSys] = useState<SizeSystem>("US");
  // Start in the visitor's own system when their browser language says so (pt-BR, es-MX, es-CO…).
  useEffect(() => {
    const locale = navigator.languages?.[0] ?? navigator.language;
    const guess = systemForLocale(locale);
    if (guess) setSys(guess);
    const country = countryForLocale(locale);
    if (country && !self?.initial?.address) setForm((f) => (f.address.line1 ? f : { ...f, address: { ...f.address, country } }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [done, setDone] = useState(false);
  const [submitted, setSubmitted] = useState<Person | null>(null);

  const steps = useMemo(() => stepsFor(invite.ask, form.sizes.fit), [invite.ask, form.sizes.fit]);
  const step = steps[Math.min(index, steps.length - 1)]!;
  const progress = (index + 1) / steps.length;

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setSize = <K extends keyof SizeProfile>(k: K, v: SizeProfile[K]) => setForm((f) => ({ ...f, sizes: { ...f.sizes, [k]: v } }));

  const addressStarted = !!(form.address.line1 || form.address.line2 || form.address.city || form.address.region || form.address.postalCode);
  const canContinue =
    step.id === "welcome"
      ? form.name.trim().length > 0
      : step.id === "fit"
        ? !!form.sizes.fit
        : step.id === "address"
          ? !addressStarted || isCompleteAddress(form.address) // optional, but complete if started
          : step.id === "favorites"
            ? form.wishlists.every((l) => !l.trim() || normalizeLink(l))
            : true;

  const go = (delta: number) => {
    setDir(delta);
    setIndex((i) => Math.max(0, Math.min(steps.length - 1, i + delta)));
  };
  const jump = (id: StepId) => {
    const target = steps.findIndex((s) => s.id === id);
    if (target >= 0) {
      setDir(target < index ? -1 : 1);
      setIndex(target);
    }
  };

  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submit = async () => {
    const now = new Date().toISOString();
    const complete = (d: PD): PartialDate | undefined =>
      d.month && d.day ? { month: d.month, day: d.day, year: d.year && d.year >= 1900 ? d.year : undefined } : undefined;
    const a = form.address;
    const person: Person = {
      id: newId("p_"),
      name: form.name.trim(),
      kind: "adult",
      color: pastelFor(form.name),
      sizes: form.sizes,
      address: isCompleteAddress(a) ? a : undefined,
      birthday: complete(form.birthday),
      anniversary: complete(form.anniversary),
      favorites: {
        colors: form.colors,
        likes: form.likes || undefined,
        avoid: form.avoid || undefined,
        wishes: form.wishes.filter(Boolean),
        wishlists: cleanWishlistLinks(form.wishlists),
      },
      updatedAt: now,
    };
    const kids: Person[] = [];
    for (const k of form.kids.filter((k) => k.name.trim())) {
      kids.push({
        id: newId("p_"),
        name: k.name.trim(),
        kind: "child",
        relationship: `${form.name.split(" ")[0]}'s child`,
        color: pastelFor(k.name),
        sizes: { fit: "kids", top: k.top, bottomAlpha: k.bottom, shoe: k.shoe },
        birthday: complete(k.birthday),
        guardians: [person.id],
        updatedAt: now,
      });
    }
    // Lands in the inviter's locker (backend) or this browser's locker (demo mode).
    setSending(true);
    setSubmitError(null);
    try {
      if (self) {
        await self.onSave(person);
        router.push("/locker");
        return;
      }
      await submitInvite(invite, person, kids);
      // Kept in this browser so these answers become their own profile if they sign up.
      rememberPendingSelf(person);
      setSubmitted(person);
      setDone(true);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Couldn't send. Try again.");
    } finally {
      setSending(false);
    }
  };

  const counter = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="pastel-wash relative min-h-dvh overflow-x-clip">
      <FlyingBackdrop scene={done ? "done" : step.scene} />

      <div className="relative z-10 mx-auto flex min-h-dvh max-w-5xl flex-col px-4 py-6">
        <header className="mb-6 flex items-center gap-3">
          <LogoMark size={34} />
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/70 md:hidden">
            <motion.div
              className="h-full w-full origin-left bg-gradient-to-r from-apricot via-rose to-dusk"
              initial={false}
              animate={{ scaleX: done ? 1 : progress }}
              transition={{ duration: 0.8, ease: EASE }}
            />
          </div>
        </header>

        <div className="relative flex flex-1 items-center">
          {done ? (
            <Success name={form.name} from={invite.from.name} person={submitted} />
          ) : (
            <section
              className="glass relative grid w-full overflow-hidden rounded-[36px] shadow-lift md:min-h-[620px] md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !(e.target instanceof HTMLTextAreaElement) && canContinue && step.id !== "review") {
                  e.preventDefault();
                  go(1);
                }
              }}
            >
              <StepShowcase scene={step.scene} dir={dir} />
              <StepRail steps={steps} index={index} onJump={(i) => i < index && jump(steps[i]!.id)} />

              <div className="relative flex flex-col p-6 md:py-10 md:pr-10 md:pl-14">
                <AnimatePresence mode="wait" custom={dir} initial={false}>
                  <motion.div key={step.id} custom={dir} variants={column} initial="enter" animate="center" exit="exit" className="flex flex-1 flex-col">
                    <motion.div custom={dir} variants={line} className="mb-3 flex items-center justify-between gap-3">
                      <p className="font-display text-sm tabular-nums text-ink-soft">
                        <span className="text-2xl font-semibold text-ink">{counter(index + 1)}</span> / {counter(steps.length)}
                      </p>
                      {isSizeStep(step.id) && <SystemToggle value={sys} onChange={setSys} />}
                    </motion.div>
                    <motion.p custom={dir} variants={line} className="text-sm font-extrabold tracking-wide text-rose uppercase">
                      {step.eyebrow}
                    </motion.p>
                    <motion.h1 custom={dir} variants={line} className="font-display text-3xl leading-tight font-semibold tracking-tight text-balance md:text-[2.6rem]">
                      {step.id === "welcome" ? (self ? "Your own profile" : `${invite.from.name} wants your gifts to be just right`) : step.title}
                    </motion.h1>
                    {step.subtitle && (
                      <motion.p custom={dir} variants={line} className="mt-2 text-ink-soft">
                        {step.subtitle}
                      </motion.p>
                    )}

                    <motion.div custom={dir} variants={line} className="mt-7">
                      <StepBody step={step} invite={invite} form={form} set={set} setSize={setSize} sys={sys} jump={jump} />
                    </motion.div>

                    {submitError && step.id === "review" && <p className="mt-6 text-sm font-bold text-rose-deep">{submitError}</p>}
                    <motion.footer custom={dir} variants={line} className="mt-auto flex items-center gap-2 pt-9">
                      {index > 0 && (
                        <Button variant="ghost" onClick={() => go(-1)} aria-label="Back" className="px-4!">
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                      )}
                      <div className="ml-auto flex items-center gap-2">
                        {step.optional && (
                          <Button variant="ghost" onClick={() => go(1)}>
                            Skip
                          </Button>
                        )}
                        {step.id === "review" ? (
                          <Button onClick={submit} disabled={sending}>
                            <Sparkles className="h-4 w-4" /> {sending ? (self ? "Saving…" : "Sending…") : self ? "Save my profile" : `Share with ${invite.from.name}`}
                          </Button>
                        ) : (
                          <Button onClick={() => go(1)} disabled={!canContinue}>
                            Continue <ArrowRight className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </motion.footer>
                  </motion.div>
                </AnimatePresence>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

const isSizeStep = (id: StepId) => ["tops", "bottoms", "dresses", "outerwear", "shoes", "accessories"].includes(id);

/** Size system implied by a browser locale, if it's one we convert to. */
function systemForLocale(locale: string | undefined): SizeSystem | null {
  const region = locale?.split(/[-_]/)[1]?.toUpperCase();
  const byRegion: Record<string, SizeSystem> = { BR: "BR", MX: "MX", CO: "CO", GB: "UK", JP: "JP" };
  if (region && byRegion[region]) return byRegion[region]!;
  if (locale?.toLowerCase().startsWith("pt")) return "BR";
  return null;
}

function SystemToggle({ value, onChange }: { value: SizeSystem; onChange: (s: SizeSystem) => void }) {
  return (
    <div className="flex max-w-full overflow-x-auto rounded-full bg-white/70 p-1 text-xs font-extrabold" role="radiogroup" aria-label="Size system">
      {SIZE_SYSTEMS.map((s) => (
        <button
          key={s}
          type="button"
          role="radio"
          aria-checked={s === value}
          aria-label={SIZE_SYSTEM_LABELS[s]}
          title={SIZE_SYSTEM_LABELS[s]}
          onClick={() => onChange(s)}
          className={`relative shrink-0 rounded-full px-2.5 py-1 ${s === value ? "text-white" : "text-ink-soft"}`}
        >
          {s === value && <motion.span layoutId="sys" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 500, damping: 35 }} />}
          <span className="relative">{s}</span>
        </button>
      ))}
    </div>
  );
}

/** Country-aware shipping address: labels, region pick-lists and postal rules follow the country. */
function AddressStep({ value: a, onChange }: { value: Partial<Address>; onChange: (a: Partial<Address>) => void }) {
  const [touched, setTouched] = useState<Partial<Record<keyof Address, boolean>>>({});
  const f = addressFormat(a.country);
  const errors = validateAddress(a);
  const countries = useMemo(() => countryOptions(), []);
  const up = (k: keyof Address, v: string) => onChange({ ...a, [k]: v });
  const blur = (k: keyof Address) => () => setTouched((t) => ({ ...t, [k]: true }));
  const err = (k: keyof Address) => (touched[k] ? errors[k] : undefined);
  const errHint = (k: keyof Address) => (err(k) ? <span className="font-bold text-rose-deep">{err(k)}</span> : undefined);
  const numericPostal = ["US", "MX", "BR", "CO"].includes((a.country ?? "US").toUpperCase());
  const opt = (label: string, required?: boolean) => (required ? label : label.includes("optional") ? label : `${label} (optional)`);

  return (
    <div className="grid gap-4">
      <Field label="Country">
        <select
          className={inputCls}
          value={a.country ?? "US"}
          autoComplete="country"
          onChange={(e) => {
            // Region and postal formats differ by country, so start those fresh.
            onChange({ ...a, country: e.target.value, region: "", postalCode: "" });
            setTouched({});
          }}
        >
          {countries.map((c, i) => [
            <option key={c.code} value={c.code}>
              {c.name}
            </option>,
            i === PRIORITY_COUNTRIES.length - 1 ? (
              <option key="divider" disabled>
                ──────────
              </option>
            ) : null,
          ])}
        </select>
      </Field>
      <Field label="Street and number" hint={errHint("line1")}>
        <Input value={a.line1 ?? ""} onChange={(e) => up("line1", e.target.value)} onBlur={blur("line1")} autoComplete="address-line1" aria-invalid={!!err("line1")} />
      </Field>
      <Field label={opt(f.line2Label, f.line2Required)} hint={errHint("line2")}>
        <Input value={a.line2 ?? ""} onChange={(e) => up("line2", e.target.value)} onBlur={blur("line2")} autoComplete="address-line2" aria-invalid={!!err("line2")} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-[1.3fr_1fr_1fr]">
        <Field label="City" hint={errHint("city")}>
          <Input value={a.city ?? ""} onChange={(e) => up("city", e.target.value)} onBlur={blur("city")} autoComplete="address-level2" aria-invalid={!!err("city")} />
        </Field>
        <Field label={f.regionRequired ? f.regionLabel : opt(f.regionLabel)} hint={errHint("region")}>
          {f.regions ? (
            <select className={inputCls} value={a.region ?? ""} onChange={(e) => up("region", e.target.value)} onBlur={blur("region")} autoComplete="address-level1" aria-invalid={!!err("region")}>
              <option value="">Choose…</option>
              {f.regions.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
            </select>
          ) : (
            <Input value={a.region ?? ""} onChange={(e) => up("region", e.target.value)} onBlur={blur("region")} autoComplete="address-level1" />
          )}
        </Field>
        <Field label={f.postalRequired ? f.postalLabel : opt(f.postalLabel)} hint={errHint("postalCode")}>
          <Input
            value={a.postalCode ?? ""}
            onChange={(e) => up("postalCode", f.postalFormat ? f.postalFormat(e.target.value) : e.target.value)}
            onBlur={blur("postalCode")}
            autoComplete="postal-code"
            inputMode={numericPostal ? "numeric" : "text"}
            placeholder={f.postalExample}
            aria-invalid={!!err("postalCode")}
          />
        </Field>
      </div>
    </div>
  );
}

/** Keeps the typed text (so "25." can become "25.5") and stores a rounded cm value when valid. */
function FootLengthInput({ value, onChange }: { value?: number; onChange: (cm: number | undefined) => void }) {
  const [text, setText] = useState(value?.toString() ?? "");
  return (
    <Input
      type="text"
      inputMode="decimal"
      placeholder="e.g. 25.5"
      value={text}
      aria-label="Foot length in centimeters"
      onChange={(e) => {
        const t = e.target.value.replace(",", ".").replace(/[^\d.]/g, "");
        setText(t);
        const n = Number.parseFloat(t);
        onChange(Number.isFinite(n) && n >= 8 && n <= 35 ? Math.round(n * 10) / 10 : undefined);
      }}
    />
  );
}

function Hint({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-sm text-ink-soft">{children}</p>;
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-6 first:mt-0">
      <p className="mb-2.5 text-sm font-bold text-ink-soft">{label}</p>
      {children}
    </div>
  );
}

function StepBody({
  step,
  invite,
  form,
  set,
  setSize,
  sys,
  jump,
}: {
  step: StepDef;
  invite: PublicInvite;
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  setSize: <K extends keyof SizeProfile>(k: K, v: SizeProfile[K]) => void;
  sys: SizeSystem;
  jump: (id: StepId) => void;
}) {
  const s = form.sizes;
  const fit: Fit = s.fit ?? "womens";
  const alpha = (v: AlphaSize) => convertAlpha(v)[sys];
  const kidsOrAlpha = (key: "top" | "outerwear" | "bottomAlpha", label: string) =>
    fit === "kids" ? (
      <ChipGroup label={label} options={KIDS_SIZES} value={s[key] as (typeof KIDS_SIZES)[number]} onChange={(v) => setSize(key, v)} />
    ) : (
      <ChipGroup label={label} options={ALPHA_SIZES} value={s[key] as AlphaSize} onChange={(v) => setSize(key, v)} render={alpha} />
    );

  switch (step.id) {
    case "welcome":
      return (
        <>
          {invite.note && <blockquote className="mb-6 rounded-2xl bg-white/70 p-4 text-ink-soft italic">“{invite.note}”</blockquote>}
          <Field
            label="What's your name?"
            hint={
              invite.id === "self"
                ? "Only you see this. You choose when to share it, like with your Secret Santa in a gift exchange."
                : `Only ${invite.from.name} (and people you choose) will see what you share.`
            }
          >
            <Input autoFocus value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name" autoComplete="name" />
          </Field>
        </>
      );

    case "fit":
      return (
        <>
          <div className="grid grid-cols-3 gap-3">
            {(Object.keys(FIT_LABELS) as Fit[]).map((f) => {
              const on = s.fit === f;
              return (
                <motion.button
                  key={f}
                  type="button"
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSize("fit", f)}
                  className={`relative rounded-3xl px-2 py-4 text-center font-display text-lg font-semibold transition-colors md:p-5 md:text-xl ${on ? "text-white" : "bg-white/70"}`}
                >
                  {on && <motion.span layoutId="fit" className="absolute inset-0 rounded-3xl bg-gradient-to-br from-rose to-plum shadow-lift" />}
                  <span className="relative">{FIT_LABELS[f]}</span>
                </motion.button>
              );
            })}
          </div>
          <Group label="Preferred cut">
            <ChipGroup label="Preferred cut" options={["slim", "regular", "relaxed"] as const} value={s.cut} onChange={(v) => setSize("cut", v)} render={(v) => v[0]!.toUpperCase() + v.slice(1)} />
          </Group>
        </>
      );

    case "tops":
      return (
        <>
          {kidsOrAlpha("top", "Shirt size")}
          {fit === "mens" && s.top && MENS_CHEST_IN[s.top as AlphaSize] && <Hint>Usually fits a {MENS_CHEST_IN[s.top as AlphaSize]} chest.</Hint>}
          {fit === "mens" && (
            <>
              <Group label="Dress shirt — neck (in)">
                <ChipGroup label="Neck" options={SHIRT_NECK} value={s.dressShirt?.neck} onChange={(v) => setSize("dressShirt", { ...s.dressShirt, neck: v })} render={(v) => (sys === "US" || sys === "UK" ? String(v) : `${Math.round(v * 2.54)}`)} />
              </Group>
              <Group label="Dress shirt — sleeve (in)">
                <ChipGroup label="Sleeve" options={SHIRT_SLEEVE} value={s.dressShirt?.sleeve as (typeof SHIRT_SLEEVE)[number]} onChange={(v) => setSize("dressShirt", { ...s.dressShirt, sleeve: v })} />
              </Group>
            </>
          )}
        </>
      );

    case "bottoms":
      if (fit === "mens")
        return (
          <>
            <Group label={`Waist ${sys === "JP" ? "(cm)" : sys === "EU" ? "(EU)" : sys === "BR" ? "(BR)" : "(in)"}`}>
              <ChipGroup label="Waist" options={MENS_WAIST} value={s.waist} onChange={(v) => setSize("waist", v)} render={(v) => convertWaist(v)[sys]} />
            </Group>
            <Group label="Inseam (in)">
              <ChipGroup label="Inseam" options={MENS_INSEAM} value={s.inseam} onChange={(v) => setSize("inseam", v)} />
            </Group>
          </>
        );
      if (fit === "womens")
        return (
          <>
            <Group label="Numeric size">
              <ChipGroup label="Pants size" options={WOMENS_NUMERIC} value={s.womensNumeric as (typeof WOMENS_NUMERIC)[number]} onChange={(v) => setSize("womensNumeric", v)} render={(v) => convertWomensNumeric(v)?.[sys] ?? v} />
            </Group>
            <Group label="Or letter size (leggings, joggers)">{kidsOrAlpha("bottomAlpha", "Letter size")}</Group>
          </>
        );
      return kidsOrAlpha("bottomAlpha", "Pants size");

    case "dresses":
      return fit === "kids" ? (
        <ChipGroup label="Dress size" options={KIDS_SIZES} value={s.dress as (typeof KIDS_SIZES)[number]} onChange={(v) => setSize("dress", v)} />
      ) : (
        <>
          <ChipGroup label="Dress size" options={WOMENS_NUMERIC} value={s.dress as (typeof WOMENS_NUMERIC)[number]} onChange={(v) => setSize("dress", v)} render={(v) => convertWomensNumeric(v)?.[sys] ?? v} />
          {s.dress && sys !== "US" && <Hint>Saved as US {s.dress}.</Hint>}
        </>
      );

    case "outerwear":
      return kidsOrAlpha("outerwear", "Jacket size");

    case "shoes": {
      const conv = s.shoe ? convertShoe(s.shoe, fit) : null;
      return (
        <>
          <ChipGroup label="Shoe size" options={shoeSizes(fit)} value={s.shoe} onChange={(v) => setSize("shoe", v)} render={(v) => convertShoe(v, fit)?.[sys] ?? String(v)} />
          {conv && (
            <Hint>
              {SIZE_SYSTEMS.filter((k) => k !== sys)
                .map((k) => `${k} ${conv[k]}`)
                .join(" · ")}
              {sys !== "US" && ` · saved as US ${conv.US}`}
            </Hint>
          )}
          <Group label="Foot length in cm (optional)">
            <FootLengthInput value={s.footLengthCm} onChange={(v) => setSize("footLengthCm", v)} />
            <Hint>Heel to longest toe, standing. It's the one shoe measure that converts reliably between countries.</Hint>
          </Group>
          <Group label="Width">
            <ChipGroup label="Width" options={SHOE_WIDTHS} value={s.shoeWidth} onChange={(v) => setSize("shoeWidth", v)} />
          </Group>
        </>
      );
    }

    case "accessories":
      return (
        <>
          <Group label="Hat">
            <ChipGroup label="Hat size" options={HAT_SIZES} value={s.hat as (typeof HAT_SIZES)[number]} onChange={(v) => setSize("hat", v)} />
          </Group>
          <Group label={`Ring size (${sys})`}>
            <ChipGroup label="Ring size" options={RING_SIZES} value={s.ring} onChange={(v) => setSize("ring", v)} render={(v) => convertRing(v)[sys]} />
          </Group>
          <Group label="Anything else? (gloves, bra, belt…)">
            <Textarea value={s.notes ?? ""} onChange={(e) => setSize("notes", e.target.value)} placeholder="Belt 34, gloves M" />
          </Group>
        </>
      );

    case "address":
      return <AddressStep value={form.address} onChange={(v) => set("address", v)} />;

    case "dates":
      return (
        <div className="grid gap-6">
          <DateField label="Birthday 🎂" value={form.birthday} onChange={(v) => set("birthday", v)} />
          <DateField label="Anniversary 💍" value={form.anniversary} onChange={(v) => set("anniversary", v)} />
        </div>
      );

    case "favorites":
      return (
        <>
          <Group label="Favorite colors">
            <ColorPicker value={form.colors} onChange={(v) => set("colors", v)} />
          </Group>
          <Group label="Things you love">
            <Textarea value={form.likes} onChange={(e) => set("likes", e.target.value)} placeholder="Hiking, mystery novels, dark chocolate…" />
          </Group>
          <Group label="Please avoid">
            <Input value={form.avoid} onChange={(e) => set("avoid", e.target.value)} placeholder="Allergies, dislikes, 'no more mugs!'" />
          </Group>
          <Group label="Top 3 wishes">
            <div className="grid gap-2">
              {form.wishes.map((w, i) => (
                <Input key={i} value={w} onChange={(e) => set("wishes", form.wishes.map((x, j) => (j === i ? e.target.value : x)))} placeholder={`Wish #${i + 1}`} />
              ))}
            </div>
          </Group>
          <Group label="Wish list links (optional)">
            <WishlistLinks value={form.wishlists} onChange={(v) => set("wishlists", v)} />
          </Group>
        </>
      );

    case "kids":
      return <KidsEditor kids={form.kids} onChange={(k) => set("kids", k)} />;

    case "review":
      return <Review form={form} invite={invite} jump={jump} />;
  }
}

/** Links to lists kept elsewhere: Amazon, Target, Etsy… */
function WishlistLinks({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [touched, setTouched] = useState<Record<number, boolean>>({});
  return (
    <div className="grid gap-2">
      {value.map((l, i) => {
        const ok = normalizeLink(l);
        const bad = !!l.trim() && !ok;
        return (
          <div key={i}>
            <div className="flex gap-2">
              <Input
                type="url"
                inputMode="url"
                value={l}
                onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value : x)))}
                onBlur={() => setTouched((t) => ({ ...t, [i]: true }))}
                placeholder="Paste a link to your Amazon, Target or Etsy wish list"
                aria-invalid={bad && touched[i]}
              />
              {value.length > 1 && (
                <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="rounded-2xl px-3 text-ink-soft hover:bg-white" aria-label="Remove link">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            {bad && touched[i] ? (
              <p className="mt-1 text-xs font-bold text-rose-deep">That doesn't look like a web link.</p>
            ) : ok ? (
              <p className="mt-1 text-xs text-ink-soft">{linkLabel(ok)} ✓</p>
            ) : null}
          </div>
        );
      })}
      {value.length < MAX_WISHLIST_LINKS && value[value.length - 1]?.trim() && (
        <button type="button" onClick={() => onChange([...value, ""])} className="flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-plum hover:bg-white/70">
          <Plus className="h-4 w-4" /> Add another list
        </button>
      )}
    </div>
  );
}

function DateField({ label, value, onChange }: { label: string; value: PD; onChange: (v: PD) => void }) {
  const days = value.month ? daysInMonth(value.month, value.year) : 31;
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-ink-soft">{label}</p>
      <div className="grid grid-cols-[1.6fr_1fr_1.1fr] gap-2">
        <select aria-label={`${label} month`} className={inputCls} value={value.month ?? ""} onChange={(e) => onChange({ ...value, month: e.target.value ? Number(e.target.value) : undefined })}>
          <option value="">Month</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <select aria-label={`${label} day`} className={inputCls} value={value.day ?? ""} onChange={(e) => onChange({ ...value, day: e.target.value ? Number(e.target.value) : undefined })}>
          <option value="">Day</option>
          {Array.from({ length: days }, (_, i) => (
            <option key={i} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
        <input
          aria-label={`${label} year (optional)`}
          className={inputCls}
          inputMode="numeric"
          placeholder="Year (opt.)"
          maxLength={4}
          value={value.year ?? ""}
          onChange={(e) => {
            const y = e.target.value.replace(/\D/g, "");
            onChange({ ...value, year: y ? Number(y) : undefined });
          }}
        />
      </div>
    </div>
  );
}

const COLORS: [string, string][] = [
  ["blush", "#F7C6D9"], ["coral", "#FF9F8A"], ["peach", "#FFC9A8"], ["butter", "#FFE7B8"],
  ["sage", "#C6DDB8"], ["mint", "#CDEFE3"], ["sky", "#BFDDFB"], ["navy", "#2F3E6B"],
  ["lavender", "#D9C8FF"], ["plum", "#7A5AA6"], ["cream", "#F6EEDC"], ["black", "#26222E"],
];

function ColorPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {COLORS.map(([name, hex]) => {
        const on = value.includes(name);
        return (
          <motion.button
            key={name}
            type="button"
            title={name}
            aria-label={name}
            aria-pressed={on}
            whileTap={{ scale: 0.85 }}
            animate={{ scale: on ? 1.12 : 1 }}
            onClick={() => onChange(on ? value.filter((c) => c !== name) : [...value, name])}
            className={`h-10 w-10 rounded-full shadow-soft ring-offset-2 ring-offset-white ${on ? "ring-3 ring-ink" : ""}`}
            style={{ background: hex }}
          />
        );
      })}
    </div>
  );
}

function KidsEditor({ kids, onChange }: { kids: Kid[]; onChange: (k: Kid[]) => void }) {
  const up = (id: string, patch: Partial<Kid>) => onChange(kids.map((k) => (k.id === id ? { ...k, ...patch } : k)));
  return (
    <div className="grid gap-4">
      <AnimatePresence initial={false}>
        {kids.map((k) => (
          <motion.div key={k.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="rounded-3xl bg-white/70 p-4">
              <div className="flex gap-2">
                <Input value={k.name} onChange={(e) => up(k.id, { name: e.target.value })} placeholder="Child's first name" />
                <button type="button" onClick={() => onChange(kids.filter((x) => x.id !== k.id))} className="rounded-2xl px-3 text-ink-soft hover:bg-white" aria-label="Remove child">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3">
                <DateField label="Birthday" value={k.birthday} onChange={(v) => up(k.id, { birthday: v })} />
              </div>
              <Group label="Clothing size">
                <ChipGroup label="Clothing size" options={KIDS_SIZES} value={k.top as (typeof KIDS_SIZES)[number]} onChange={(v) => up(k.id, { top: v, bottom: v })} />
              </Group>
              <Group label="Shoe size (US kids)">
                <ChipGroup label="Kids shoe" options={shoeSizes("kids")} value={k.shoe} onChange={(v) => up(k.id, { shoe: v })} />
              </Group>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <Button variant="soft" onClick={() => onChange([...kids, { id: newId(), name: "", birthday: {} }])}>
        <Plus className="h-4 w-4" /> Add a child
      </Button>
      <p className="text-xs text-ink-soft">Kids don't get their own login. You manage their profile and can update sizes as they grow — we'll nudge you every few months.</p>
    </div>
  );
}

function Review({ form, invite, jump }: { form: FormState; invite: PublicInvite; jump: (id: StepId) => void }) {
  const complete = (d: PD) =>
    d.month && d.day ? formatPartialDate({ month: d.month, day: d.day, year: d.year && d.year >= 1900 ? d.year : undefined }) : undefined;
  const a = form.address;
  const section: Partial<Record<StepId, keyof PublicInvite["ask"]>> = { tops: "sizes", address: "address", dates: "dates", favorites: "favorites", kids: "kids" };
  const rows: [string, string | undefined, StepId][] = [
    ["Name", form.name, "welcome"],
    ["Sizes", summarizeSizes(form.sizes) || undefined, "tops"],
    ["Address", isCompleteAddress(a) ? formatAddress(a).join(", ") : undefined, "address"],
    ["Birthday", complete(form.birthday), "dates"],
    ["Anniversary", complete(form.anniversary), "dates"],
    ["Loves", form.likes || form.colors.join(", ") || undefined, "favorites"],
    ["Wish lists", cleanWishlistLinks(form.wishlists).map(linkLabel).join(", ") || undefined, "favorites"],
    ["Kids", form.kids.map((k) => k.name).filter(Boolean).join(", ") || undefined, "kids"],
  ];
  return (
    <div className="divide-y divide-white">
      {rows
        .filter(([, , id]) => {
          const key = section[id];
          return key ? invite.ask[key] : true;
        })
        .map(([label, val, id]) => (
          <div key={label} className="flex items-center gap-3 py-3">
            <span className="w-28 shrink-0 text-sm font-bold text-ink-soft">{label}</span>
            <span className={`flex-1 ${val ? "" : "text-ink-soft/60 italic"}`}>{val ?? "Skipped"}</span>
            <button type="button" onClick={() => jump(id)} className="rounded-full p-2 text-ink-soft hover:bg-white" aria-label={`Edit ${label}`}>
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        ))}
    </div>
  );
}

const PERKS = [
  { icon: Ruler, text: "Everyone's sizes in one place" },
  { icon: BellRing, text: "Reminder emails before birthdays and holidays" },
  { icon: Gift, text: "Lock in each gift once it's bought" },
  { icon: Users, text: "Reuse these answers in gift exchanges" },
];

function Success({ name, from, person }: { name: string; from: string; person: Person | null }) {
  const user = useUser();
  const [saved, setSaved] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const bits = Array.from({ length: 28 });
  const saveMine = async () => {
    if (!user || !person) return;
    setSaved("saving");
    try {
      await saveSelfProfile(user.sub, person);
      setSaved("saved");
    } catch {
      setSaved("error");
    }
  };
  return (
    <motion.section
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 180, damping: 16 }}
      className="glass relative w-full rounded-[32px] p-8 text-center shadow-lift md:p-10"
    >
      {bits.map((_, i) => {
        const angle = (i / bits.length) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            className="absolute top-1/3 left-1/2 h-3 w-2 rounded-sm"
            style={{ background: ["#E9779F", "#FFC9A8", "#D9C8FF", "#CDEFE3", "#FFE7B8"][i % 5] }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{ x: Math.cos(angle) * (160 + (i % 4) * 40), y: Math.sin(angle) * (120 + (i % 3) * 40) + 80, opacity: 0, rotate: 360 + i * 30 }}
            transition={{ duration: 1.6, ease: [0.2, 0.7, 0.3, 1], delay: 0.15 }}
          />
        );
      })}
      <motion.div initial={{ y: 20, rotate: -10 }} animate={{ y: 0, rotate: 0 }} transition={{ type: "spring", delay: 0.1 }} className="mx-auto mb-5 w-fit">
        <LogoMark size={80} />
      </motion.div>
      <h1 className="font-display text-4xl font-semibold">Thank you, {name.split(" ")[0]}!</h1>
      <p className="mx-auto mt-3 max-w-md text-ink-soft">
        {from} can now shop for you with confidence. Now do the same for the people <em>you</em> love.
      </p>

      {user ? (
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {person && (
            <Button onClick={saveMine} disabled={saved === "saving" || saved === "saved"} variant={saved === "saved" ? "soft" : undefined}>
              {saved === "saved" ? (
                <>
                  <Check className="h-4 w-4" /> Saved as my profile
                </>
              ) : saved === "saving" ? (
                "Saving…"
              ) : (
                "Save these answers as my profile"
              )}
            </Button>
          )}
          <Button href="/locker" variant="soft">
            Open my locker
          </Button>
          {saved === "error" && <p className="w-full text-sm font-bold text-rose-deep">Couldn't save. Try again.</p>}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mx-auto mt-7 max-w-md rounded-3xl bg-white/75 p-6 text-left shadow-soft"
        >
          <p className="font-display text-2xl font-semibold">Start your own locker, free</p>
          <ul className="mt-3 grid gap-2.5">
            {PERKS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-ink">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blush">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-ink-soft">What you just filled in becomes your own profile, so you won't type it again.</p>
          <Button href="/sign-in?next=/locker" className="mt-5 w-full">
            Create my free locker
          </Button>
        </motion.div>
      )}
    </motion.section>
  );
}
