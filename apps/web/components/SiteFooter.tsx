import Link from "next/link";
import { useTranslations } from "next-intl";
import { useLocalePath } from "@/lib/use-locale-path";

/** Links to the public pages (helps visitors and search engines find them). */
export function SiteFooter() {
  const t = useTranslations("footer");
  const href = useLocalePath();
  const links = [
    { href: href("/size-charts"), label: t("sizeCharts") },
    { href: href("/exchange"), label: t("secretSanta") },
    { href: href("/privacy"), label: t("privacy") },
  ];
  return (
    <footer className="px-5 pb-10 text-center text-sm text-ink-soft">
      <nav className="mb-3 flex flex-wrap justify-center gap-x-5 gap-y-2 font-bold">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="hover:text-ink hover:underline">
            {l.label}
          </Link>
        ))}
      </nav>
      © {new Date().getFullYear()} My Gift Lockers · mygiftlockers.com
    </footer>
  );
}
