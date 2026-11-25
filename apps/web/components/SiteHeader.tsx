import Link from "next/link";
import { useTranslations } from "next-intl";
import { AuthButton } from "./AuthButton";
import { LanguagePicker } from "./LanguagePicker";
import { Logo } from "./Logo";
import { NamePrompt } from "./NamePrompt";

export function SiteHeader() {
  const t = useTranslations("common");
  return (
    <>
      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" aria-label={t("home")}>
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 text-[15px] font-bold text-ink-soft">
          <Link href="/locker" className="hidden rounded-full px-4 py-2 hover:bg-white/70 hover:text-ink sm:block">
            {t("myLocker")}
          </Link>
          <Link href="/exchange" className="hidden rounded-full px-4 py-2 hover:bg-white/70 hover:text-ink sm:block">
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
