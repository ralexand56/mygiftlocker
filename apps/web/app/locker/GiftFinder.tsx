"use client";

import { DAILY_GIFT_RUNS, LOCALE_TAGS, giftShopUrl, hasAffiliate, unsplashLink, type GiftCategory, type GiftIdea, type Person } from "@mgl/core";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, ExternalLink, RotateCcw, Sparkles, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { LogoMark } from "@/components/Logo";
import { Avatar } from "@/components/ui";
import { GiftRunError, findGifts, giftAffiliate, type GiftError } from "@/lib/gifts";

const EMOJI: Record<GiftCategory, string> = {
  clothing: "👕",
  accessories: "👜",
  home: "🏡",
  experience: "🎟️",
  hobby: "🎨",
  tech: "🎧",
  beauty: "🧴",
  books: "📚",
  food: "🍫",
  kids: "🧸",
  other: "🎁",
};
const TINT: Record<GiftCategory, string> = {
  clothing: "bg-blush",
  accessories: "bg-peach",
  home: "bg-mint",
  experience: "bg-butter",
  hobby: "bg-lavender",
  tech: "bg-sky",
  beauty: "bg-blush",
  books: "bg-butter",
  food: "bg-peach",
  kids: "bg-mint",
  other: "bg-lavender",
};
const CHIPS = ["under50", "experience", "handmade", "lastMinute", "splurge"] as const;
const STEPS = 4;

/** "Find the perfect gift": an animated list of ideas for one person, refined in plain words. */
export function GiftFinder({
  person: p,
  onClose,
  onSaved,
  onAddWish,
}: {
  person: Person;
  onClose: () => void;
  onSaved: (saved: NonNullable<Person["giftIdeas"]>) => void;
  /** Your own profile: add an idea to your wishes. */
  onAddWish?: (idea: GiftIdea) => Promise<void>;
}) {
  const forSelf = p.id === "self";
  const [wished, setWished] = useState<Set<string>>(() => new Set((p.favorites?.wishes ?? []).map((w) => w.toLocaleLowerCase())));
  const t = useTranslations("gifts");
  const locale = useLocale();
  const first = p.name.split(" ")[0]!;
  const [ideas, setIdeas] = useState<GiftIdea[]>(p.giftIdeas?.ideas ?? []);
  const [shown, setShown] = useState(p.giftIdeas?.request ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<GiftError | null>(null);
  const [request, setRequest] = useState("");
  const [step, setStep] = useState(0);
  const [round, setRound] = useState(0);
  const started = useRef(false);

  const money = (n: number) => new Intl.NumberFormat(LOCALE_TAGS[locale], { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  const price = (i: GiftIdea) => (i.priceMax > i.priceMin ? `${money(i.priceMin)}–${money(i.priceMax)}` : money(i.priceMin));

  const run = async (ask: string) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setStep(0);
    try {
      const next = await findGifts(p, ask, locale);
      setIdeas(next);
      setShown(ask);
      setRound((r) => r + 1);
      setRequest("");
      onSaved({ ideas: next, request: ask || undefined, at: new Date().toISOString() });
    } catch (e) {
      setError(e instanceof GiftRunError ? e.key : "failed");
    } finally {
      setLoading(false);
    }
  };

  // First visit: start right away. Later visits show the saved list.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!ideas.length) void run("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Rotate the "thinking" lines while waiting.
  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setStep((s) => (s + 1) % STEPS), 2600);
    return () => clearInterval(id);
  }, [loading]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (request.trim()) void run(request);
  };

  return (
    <>
      <motion.div className="fixed inset-0 z-[60] bg-ink/30 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <div className="pointer-events-none fixed inset-0 z-[70] grid place-items-center p-3 sm:p-6">
        <motion.section
          role="dialog"
          aria-modal
          aria-label={forSelf ? t("titleSelf") : t("title", { name: first })}
          data-gift-finder
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="pointer-events-auto relative flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-[32px] bg-cream shadow-lift"
        >
          <header className="relative flex shrink-0 items-center gap-4 overflow-hidden px-6 pt-6 pb-4 sm:px-8">
            <div className="absolute inset-0 -z-0" style={{ background: `radial-gradient(120% 140% at 0% 0%, ${p.color}, transparent 60%)` }} />
            <div className="relative">
              <Avatar name={p.name} color="#fffaf6" size={52} />
            </div>
            <div className="relative min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-xs font-extrabold tracking-wide text-rose uppercase">
                <Sparkles className="h-3.5 w-3.5" /> {t("eyebrow")}
              </p>
              <h2 className="truncate font-display text-2xl font-semibold sm:text-3xl">{forSelf ? t("titleSelf") : t("title", { name: first })}</h2>
              {!loading && shown && <p className="truncate text-sm text-ink-soft">“{shown}”</p>}
            </div>
            <button onClick={onClose} className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/80 shadow-soft" aria-label={t("close")}>
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-8">
            {loading ? (
              <Thinking name={first} step={step} forSelf={forSelf} />
            ) : error ? (
              <div className="grid place-items-center py-16 text-center">
                <LogoMark size={52} className="mx-auto" />
                <p className="mt-3 max-w-sm font-bold">{t(`errors.${error}`, { n: DAILY_GIFT_RUNS })}</p>
                {error !== "limit" && (
                  <button onClick={() => run(shown)} className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 font-bold shadow-soft">
                    <RotateCcw className="h-4 w-4" /> {t("retry")}
                  </button>
                )}
              </div>
            ) : (
              <motion.ul layout className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <AnimatePresence mode="popLayout">
                  {ideas.map((idea, i) => (
                    <motion.li
                      key={`${round}-${idea.id}`}
                      layout
                      initial={{ opacity: 0, y: 28, scale: 0.94, rotate: i % 2 ? 1.5 : -1.5 }}
                      animate={{ opacity: 1, y: 0, scale: 1, rotate: 0, transition: { type: "spring", stiffness: 220, damping: 22, delay: Math.min(i, 12) * 0.07 } }}
                      exit={{ opacity: 0, scale: 0.9, x: 40, transition: { duration: 0.22 } }}
                      whileHover={{ y: -4 }}
                      className="group relative flex flex-col overflow-hidden rounded-3xl bg-white p-4 shadow-soft"
                    >
                      {idea.image && (
                        <div className="relative -mx-4 -mt-4 mb-3 aspect-[16/9] overflow-hidden" style={{ background: idea.image.color ?? "#f6eedc" }}>
                          {/* Shown straight from Unsplash, as their guidelines require. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={idea.image.url} alt={idea.image.alt ?? idea.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/45 to-transparent" />
                          <p className="absolute right-2.5 bottom-1.5 left-2.5 truncate text-right text-[10px] text-white/90">
                            {t.rich("photoBy", {
                              name: idea.image.by,
                              who: (c) => (
                                <a href={unsplashLink(idea.image!.byUrl)} target="_blank" rel="noopener noreferrer" className="underline">
                                  {c}
                                </a>
                              ),
                              site: (c) => (
                                <a href={unsplashLink("https://unsplash.com/")} target="_blank" rel="noopener noreferrer" className="underline">
                                  {c}
                                </a>
                              ),
                            })}
                          </p>
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <motion.span
                          initial={{ scale: 0, rotate: -30 }}
                          animate={{ scale: 1, rotate: 0, transition: { type: "spring", delay: 0.15 + Math.min(i, 12) * 0.07 } }}
                          className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl ${TINT[idea.category]}`}
                          aria-hidden
                        >
                          {EMOJI[idea.category]}
                        </motion.span>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display text-lg leading-snug font-semibold">{idea.title}</h3>
                          <p className="mt-0.5 text-xs font-bold text-ink-soft">
                            {price(idea)} · {t(`stores.${idea.store}`)}
                          </p>
                        </div>
                        <button
                          onClick={() => setIdeas((xs) => xs.filter((x) => x.id !== idea.id))}
                          className={`rounded-full p-1.5 ${idea.image ? "absolute top-2.5 right-2.5 z-10 bg-white/85 text-ink shadow-soft hover:bg-white" : "-mt-1 -mr-1 text-ink-soft opacity-60 hover:bg-cream hover:opacity-100"}`}
                          aria-label={t("notThis", { title: idea.title })}
                          title={t("notThisShort")}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mt-2 flex-1 text-sm text-ink-soft">{idea.why}</p>
                      <a
                        href={giftShopUrl(idea, giftAffiliate)}
                        target="_blank"
                        rel="sponsored noopener noreferrer"
                        className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-gradient-to-br from-rose to-plum px-4 py-2 text-sm font-bold text-white shadow-lift transition-transform hover:-translate-y-0.5"
                      >
                        {t("shop", { store: t(`stores.${idea.store}`) })} <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      {onAddWish && (
                        <button
                          type="button"
                          disabled={wished.has(idea.title.toLocaleLowerCase())}
                          onClick={async () => {
                            setWished((w) => new Set(w).add(idea.title.toLocaleLowerCase()));
                            await onAddWish(idea).catch(() =>
                              setWished((w) => {
                                const n = new Set(w);
                                n.delete(idea.title.toLocaleLowerCase());
                                return n;
                              }),
                            );
                          }}
                          className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-cream px-3.5 py-1.5 text-sm font-bold text-ink ring-1 ring-lavender/60 hover:bg-blush/40 disabled:opacity-70"
                        >
                          {wished.has(idea.title.toLocaleLowerCase()) ? <>✓ {t("inWishes")}</> : <>＋ {t("addWish")}</>}
                        </button>
                      )}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </motion.ul>
            )}
            {!loading && !error && !ideas.length && <p className="py-10 text-center text-ink-soft">{t("allHidden")}</p>}
          </div>

          <form onSubmit={submit} className="shrink-0 border-t border-white bg-white/70 px-4 pt-3 pb-4 sm:px-8">
            <div className="mb-2.5 flex gap-2 overflow-x-auto pb-1">
              {CHIPS.map((c) => (
                <button
                  key={c}
                  type="button"
                  disabled={loading}
                  onClick={() => run(t(`chips.${c}`))}
                  className="shrink-0 rounded-full bg-cream px-3.5 py-1.5 text-sm font-bold text-ink ring-1 ring-lavender/60 hover:bg-blush/50 disabled:opacity-50"
                >
                  {t(`chips.${c}`)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white p-1.5 pl-5 shadow-soft ring-1 ring-lavender/50 focus-within:ring-2 focus-within:ring-rose/60">
              <Sparkles className="h-4 w-4 shrink-0 text-rose" aria-hidden />
              <input
                value={request}
                onChange={(e) => setRequest(e.target.value)}
                maxLength={300}
                disabled={loading}
                placeholder={forSelf ? t("placeholderSelf") : t("placeholder", { name: first })}
                aria-label={t("askLabel")}
                className="min-w-0 flex-1 bg-transparent py-2 outline-none placeholder:text-ink-soft/70"
              />
              <button type="submit" disabled={loading || !request.trim()} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-white disabled:opacity-40" aria-label={t("send")}>
                <ArrowUp className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-ink-soft">
              {t("aiNote")}
              {hasAffiliate(giftAffiliate) && ` ${t("disclosure")}`}
            </p>
          </form>
        </motion.section>
      </div>
    </>
  );
}

/** While Claude thinks: rotating status lines over shimmering placeholder cards. */
function Thinking({ name, step, forSelf }: { name: string; step: number; forSelf: boolean }) {
  const t = useTranslations("gifts");
  return (
    <div className="py-4">
      <div className="mb-5 flex items-center justify-center gap-3" aria-live="polite">
        <motion.span animate={{ rotate: [0, 10, -8, 0], y: [0, -4, 0], scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 1.6 }} className="inline-flex" aria-hidden>
          <LogoMark size={34} />
        </motion.span>
        <AnimatePresence mode="wait">
          <motion.p key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="font-bold text-ink-soft">
            {forSelf ? t(`thinkingSelf.${(step % STEPS) as 0 | 1 | 2 | 3}`) : t(`thinking.${(step % STEPS) as 0 | 1 | 2 | 3}`, { name })}
          </motion.p>
        </AnimatePresence>
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.45, 0.9, 0.45] }}
            transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.15 }}
            className="h-36 rounded-3xl bg-white/80 p-4 shadow-soft"
          >
            <div className="flex gap-3">
              <div className="h-11 w-11 rounded-2xl bg-blush/60" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3.5 w-3/4 rounded-full bg-lavender/50" />
                <div className="h-3 w-1/3 rounded-full bg-lavender/40" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-3 rounded-full bg-cream" />
              <div className="h-3 w-5/6 rounded-full bg-cream" />
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
