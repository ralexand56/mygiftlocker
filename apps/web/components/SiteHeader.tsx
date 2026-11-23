import Link from "next/link";
import { Logo } from "./Logo";

export function SiteHeader() {
  return (
    <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
      <Link href="/" aria-label="My Gift Locker home">
        <Logo />
      </Link>
      <nav className="flex items-center gap-1 text-[15px] font-bold text-ink-soft">
        <Link href="/locker" className="hidden rounded-full px-4 py-2 hover:bg-white/70 hover:text-ink sm:block">
          My locker
        </Link>
        <Link href="/exchange" className="hidden rounded-full px-4 py-2 hover:bg-white/70 hover:text-ink sm:block">
          Gift exchange
        </Link>
        <Link href="/sign-in" className="rounded-full bg-white/80 px-4 py-2 text-ink shadow-soft hover:bg-white">
          Sign in
        </Link>
      </nav>
    </header>
  );
}
