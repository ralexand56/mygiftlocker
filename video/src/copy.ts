import { createContext, useContext } from "react";

export type Lang = "en" | "es";
type XY = { x: number; y: number };

/** Everything the video says, per language. Screens live in public/screens/<lang>/. */
export const COPY = {
  en: {
    chat: ["Hey! What size are you now? 🎁", "Umm… medium? 😅", "Wait, US or EU size?"],
    headline: ["Never guess a gift size ", "again."],
    tagline: "Everyone's sizes, birthdays and wish lists in one place.",
    locker: { kicker: "Your gift locker", title: "Everyone you shop for, in one place", sub: "Sizes, birthdays and wish lists for every person on your list." },
    person: { kicker: "No more guessing", title: "Every size, right when you need it", chips: ["👕 Clothing", "👟 Shoes", "💍 Rings", "🎂 Birthdays", "💝 Favorites", "📝 Wish lists"] },
    ai: { kicker: "✨ AI gift ideas", title: "Ideas picked for them, not for anyone", sub: "Made from everything in their locker: what they love, their sizes, even what to avoid.", chips: ["💸 Any budget", "🛍️ Shop in one tap"] },
    dates: {
      kicker: "Never miss a date",
      title: "A heads-up before every birthday",
      sub: "An email a week ahead and the day before, with their sizes and what they love. Holidays get three weeks.",
      notification: { title: "🎂 Lily's birthday is in a week", body: "Wed, Dec 9 · turning 6 · Shoe 12" },
      now: "now",
    },
    invite: { kicker: "They fill it in", title: "Send a link. They add their own sizes.", sub: "So it's always right, and they choose what you see." },
    convert: {
      kicker: "Sizes that travel",
      title: "Shopping for someone abroad?",
      source: { code: "US", note: "women's shoe" },
      places: ["UK", "EU", "Japan", "Brazil", "Mexico", "Colombia"],
      footer: "Every size converts across 7 countries, automatically.",
    },
    santa: { kicker: "Holiday bonus", title: "Secret Santa in seconds", sub: "One invite link, top-3 wish lists and exclusions. Only the organizer needs an account." },
    cta: { line: "Free. In five languages.", pills: ["👕 Sizes", "🎂 Date reminders", "✨ AI gift ideas", "🎅 Secret Santa"], url: "mygiftlockers.com" },
    taps: {
      maya: { d: { x: 0.23, y: 0.484 }, m: { x: 0.41, y: 0.752 } },
      find: { d: { x: 0.304, y: 0.628 }, m: { x: 0.5, y: 0.433 } },
      shoe: { d: { x: 0.752, y: 0.346 }, m: { x: 0.339, y: 0.599 } },
      draw: { d: { x: 0.741, y: 0.84 } },
    },
  },
  es: {
    chat: ["¡Hola! ¿Qué talla usas ahora? 🎁", "Mmm… ¿mediana? 😅", "Espera, ¿talla de EE. UU. o europea?"],
    headline: ["Nunca más adivines ", "una talla."],
    tagline: "Las tallas, cumpleaños y listas de deseos de todos, en un solo lugar.",
    locker: { kicker: "Tu casillero de regalos", title: "Toda tu lista, en un solo lugar", sub: "Tallas, cumpleaños y listas de deseos de cada persona de tu lista." },
    person: { kicker: "Se acabó adivinar", title: "Cada talla, justo cuando la necesitas", chips: ["👕 Ropa", "👟 Calzado", "💍 Anillos", "🎂 Cumpleaños", "💝 Favoritos", "📝 Deseos"] },
    ai: { kicker: "✨ Ideas de regalo con IA", title: "Ideas pensadas para esa persona", sub: "Salen de todo lo que hay en su casillero: lo que le encanta, sus tallas y hasta lo que debes evitar.", chips: ["💸 Para todo bolsillo", "🛍️ Compra en un toque"] },
    dates: {
      kicker: "Nunca olvides una fecha",
      title: "Un aviso antes de cada cumpleaños",
      sub: "Un correo una semana antes y el día anterior, con sus tallas y lo que le encanta. Las fiestas, con tres semanas.",
      notification: { title: "🎂 El cumpleaños de Lily es en una semana", body: "mié, 9 dic · cumple 6 · Zapato 12" },
      now: "ahora",
    },
    invite: { kicker: "Lo llenan ellos", title: "Envía un enlace. Ellos ponen sus tallas.", sub: "Así siempre es correcto, y deciden qué puedes ver." },
    convert: {
      kicker: "Tallas sin fronteras",
      title: "¿Le compras a alguien en otro país?",
      source: { code: "EE. UU.", note: "zapato de mujer" },
      places: ["Reino Unido", "Europa", "Japón", "Brasil", "México", "Colombia"],
      footer: "Cada talla se convierte a 7 países, automáticamente.",
    },
    santa: { kicker: "Extra para las fiestas", title: "Amigo secreto en segundos", sub: "Un enlace de invitación, top 3 de deseos y exclusiones. Solo quien organiza necesita cuenta." },
    cta: { line: "Gratis. En cinco idiomas.", pills: ["👕 Tallas", "🎂 Recordatorios", "✨ Ideas con IA", "🎅 Amigo secreto"], url: "mygiftlockers.com/es" },
    taps: {
      maya: { d: { x: 0.23, y: 0.474 }, m: { x: 0.41, y: 0.727 } },
      find: { d: { x: 0.304, y: 0.628 }, m: { x: 0.5, y: 0.433 } },
      shoe: { d: { x: 0.753, y: 0.424 }, m: { x: 0.341, y: 0.67 } },
      draw: { d: { x: 0.729, y: 0.887 } },
    },
  },
} satisfies Record<Lang, unknown>;

export type Copy = (typeof COPY)["en"];
export type { XY };

export const LangContext = createContext<Lang>("en");

export function useCopy() {
  const lang = useContext(LangContext);
  return { lang, c: COPY[lang] as Copy, screen: (name: string) => `screens/${lang}/${name}.jpg` };
}
