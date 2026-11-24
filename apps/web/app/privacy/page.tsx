import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What My Gift Lockers collects, why, and the choices you have.",
};

const UPDATED = "November 23, 2026";
const CONTACT = "privacy@mygiftlockers.com";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 text-ink-soft [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="pastel-wash min-h-dvh">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-5 pt-6 pb-24">
        <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">Privacy Policy</h1>
        <p className="mt-3 text-sm text-ink-soft">Last updated {UPDATED}</p>

        <p className="mt-8 text-lg text-ink-soft">
          My Gift Lockers (“we”, “us”) helps you keep the sizes, dates and wishes of the people you love in one place,
          and run gift exchanges. This policy explains what we collect on mygiftlockers.com and in our apps, how we use
          it, and the choices you have. We don’t sell your information and we don’t show ads.
        </p>

        <Section title="What we collect">
          <ul>
            <li>
              <strong>Account details.</strong> If you sign in, your email address. If you sign in with Google, we also
              receive your name and profile picture from Google. We never see your Google password.
            </li>
            <li>
              <strong>What you put in your locker.</strong> Names, relationships, clothing and shoe sizes, birthdays and
              anniversaries, mailing addresses, favorites and notes for you and the people you add, including children
              you manage as a parent or guardian.
            </li>
            <li>
              <strong>Gift exchanges.</strong> The exchange name, date, budget and message; each participant’s name,
              optional email and wishlist; exclusions; and who drew whom.
            </li>
            <li>
              <strong>Invites.</strong> When someone fills in an invite you sent, the details they choose to share with
              you.
            </li>
            <li>
              <strong>Technical data.</strong> Our hosting provider keeps standard server logs (such as IP address,
              browser type and request time) to run and secure the service. We don’t use advertising or analytics
              trackers.
            </li>
          </ul>
        </Section>

        <Section title="How we use it">
          <ul>
            <li>To provide the service: show your locker, run exchanges, draw names and reveal matches.</li>
            <li>To sign you in and keep your account secure.</li>
            <li>To respond when you contact us.</li>
          </ul>
          <p>We don’t sell or rent personal information, and we don’t use it for advertising.</p>
        </Section>

        <Section title="Who can see what">
          <ul>
            <li>Your locker is private to you (and to co-guardians you add for a child’s profile).</li>
            <li>
              Exchange participants can see the exchange details and, after names are drawn, only their own match and
              that person’s wishlist, through their private link. Organizers can manage participants and may view
              assignments.
            </li>
            <li>
              Anyone holding a private exchange or invite link can use it, so share links only with the people they’re
              meant for.
            </li>
          </ul>
        </Section>

        <Section title="Service providers">
          <p>
            We store and process data with Amazon Web Services (hosting, sign-in and database, in the United States).
            If you choose Google sign-in, Google processes that sign-in under its own privacy policy. Invites you send
            by text, email, WhatsApp or other apps go through those apps, not through us.
          </p>
        </Section>

        <Section title="Google user data">
          <p>
            With Google sign-in we request only your basic profile (name, email address and profile picture) to create
            and identify your account. We don’t access Gmail, Contacts, Drive or any other Google data, and we don’t
            share Google user data with anyone except as needed to run the service. Our use of information received
            from Google APIs adheres to the{" "}
            <a
              className="font-bold text-plum underline"
              href="https://developers.google.com/terms/api-services-user-data-policy"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>
        </Section>

        <Section title="Children">
          <p>
            My Gift Lockers is meant for adults. Parents and guardians may add their children’s sizes and dates to their
            own locker; children don’t create accounts. If you believe a child has given us personal information
            directly, contact us and we’ll delete it.
          </p>
        </Section>

        <Section title="Keeping and deleting your data">
          <p>
            We keep your information while your account is active. You can edit or delete profiles and exchanges at any
            time, and you can ask us to delete your account and everything in it by emailing us. We’ll do so within 30
            days, apart from anything we must keep by law.
          </p>
        </Section>

        <Section title="Security">
          <p>
            Data is encrypted in transit (HTTPS) and at rest with our hosting provider, and access is limited to what
            each person is allowed to see. No system is perfectly secure, but we work to protect your information.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            If we make material changes, we’ll update this page and the date above, and tell signed-in users in the
            app.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions or requests:{" "}
            <a className="font-bold text-plum underline" href={`mailto:${CONTACT}`}>
              {CONTACT}
            </a>
          </p>
        </Section>

        <p className="mt-14 text-sm">
          <Link href="/" className="font-bold text-plum underline">
            ← Back to My Gift Lockers
          </Link>
        </p>
      </article>
    </main>
  );
}
