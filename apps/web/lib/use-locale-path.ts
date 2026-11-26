import { useLocale } from "next-intl";
import { localePath } from "./site";

/** Address of a public page in the current language (works in server and client components). */
export function useLocalePath(): (path: string) => string {
  const locale = useLocale();
  return (path) => localePath(locale, path);
}
