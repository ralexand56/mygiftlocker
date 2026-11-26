import Link from "next/link";
import { useTranslations } from "next-intl";
import { useLocalePath } from "@/lib/use-locale-path";
import { AuthButton } from "./AuthButton";
import { LanguagePicker } from "./LanguagePicker";
import { Logo } from "./Logo";
import { NamePrompt } from "./NamePrompt";

export function SiteHeader() {
  const t = useTranslations("common");
  const href = useLocalePath();
  return (
    <>
      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-5 sm:px-5">
        <Link href={href("/")} aria-label={t("home")}>
          <Logo />
        </Link>
        <nav className="flex shrink-0 items-center gap-0.5 sm:gap-1 text-[15px] font-bold text-ink-soft">
          <Link href="/locker" className="hidden rounded-full px-4 py-2 hover:bg-white/70 hover:text-ink sm:block">
            {t("myLocker")}
          </Link>
          <Link href={href("/exchange")} className="hidden rounded-full px-4 py-2 hover:bg-white/70 hover:text-ink sm:block">
            {t("giftExchange")}
          </Link>
          <LanguagePicker />
          <AuthButton />
        </nav>
      </header>
      <div className="relative z-10 px-5">
        <NamePrompt />
      </div>
    </>
  );
}
