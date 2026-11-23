import { SiteHeader } from "@/components/SiteHeader";
import { HeroCollage } from "@/components/HeroCollage";
import { Button } from "@/components/ui";
import { CalendarHeart, Gift, Ruler, Shuffle, Users, Baby } from "lucide-react";

const FEATURES = [
  { icon: Ruler, title: "Sizes that are always right", body: "Friends and family share their own sizes — tops, pants, shoes, rings — with conversions for US, UK, EU and Japan.", tint: "bg-blush" },
  { icon: CalendarHeart, title: "Never miss a date", body: "Birthdays and anniversaries (year optional) with gentle reminders before they sneak up on you.", tint: "bg-lavender" },
  { icon: Shuffle, title: "Gift exchanges in a minute", body: "Start a Secret Santa, collect top-3 wishlists, set exclusions, and draw names with one tap.", tint: "bg-mint" },
  { icon: Users, title: "Invite your way", body: "Send by text, email, WhatsApp, a QR code, or your phone's share sheet.", tint: "bg-butter" },
  { icon: Baby, title: "Little ones included", body: "Parents keep their kids' fast-changing sizes up to date — and stay in control of what's shared.", tint: "bg-sky" },
  { icon: Gift, title: "One locker, every device", body: "Web, iPhone and iPad stay perfectly in sync.", tint: "bg-peach" },
];

export default function Home() {
  return (
    <main className="pastel-wash min-h-dvh overflow-x-clip">
      <SiteHeader />

      <section className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pt-6 pb-20 md:grid-cols-[1.1fr_1fr] md:pt-16">
        <div className="relative z-10">
          <p className="mb-4 inline-flex rounded-full bg-white/70 px-4 py-1.5 text-sm font-bold text-plum shadow-soft">
            Gifting, beautifully organized
          </p>
          <h1 className="font-display text-5xl leading-[1.02] font-semibold tracking-tight text-balance md:text-7xl">
            Every size, every date, <em className="text-rose not-italic">every</em> person you love.
          </h1>
          <p className="mt-6 max-w-lg text-lg text-ink-soft">
            My Gift Locker keeps the details that make a gift feel personal — and makes gift exchanges with friends,
            family and coworkers effortless.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button href="/invite">Invite someone</Button>
            <Button href="/exchange" variant="soft">
              Start a gift exchange
            </Button>
          </div>
        </div>
        <HeroCollage />
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-28">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass rounded-[28px] p-7 shadow-soft">
              <span className={`mb-5 inline-grid h-12 w-12 place-items-center rounded-2xl ${f.tint}`}>
                <f.icon className="h-6 w-6 text-ink" strokeWidth={2.2} />
              </span>
              <h3 className="font-display text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-ink-soft">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="pb-10 text-center text-sm text-ink-soft">© {new Date().getFullYear()} My Gift Locker · mygiftlocker.com</footer>
    </main>
  );
}
