/** UI text for every language (ICU messages), shared by apps/web (next-intl) and apps/mobile. */
import en from "./en.json";
import es from "./es.json";
import fr from "./fr.json";
import pt from "./pt.json";
import ru from "./ru.json";

export type Messages = typeof en;
export const MESSAGES = { en, es, fr, pt, ru } as const;
