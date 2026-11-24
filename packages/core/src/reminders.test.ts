import { describe, expect, it } from "vitest";
import { buildReminderEmail, dateKey, dueReminders, todayInTimeZone, type Person } from "./index";

const person = (id: string, name: string, extra: Partial<Person> = {}): Person => ({
  id,
  name,
  kind: "adult",
  color: "#fff",
  sizes: {},
  updatedAt: "2026-01-01T00:00:00Z",
  ...extra,
});

const TODAY = new Date(2026, 10, 24); // Nov 24, 2026

const maya = person("m", "Maya Chen", {
  birthday: { month: 12, day: 1, year: 1991 }, // in 7 days, turning 35
  sizes: { top: "S", shoe: 7.5 },
  favorites: { wishes: ["Pottery class", "Matcha set", "Linen robe", "Extra"], avoid: "Scented <candles>" },
  address: { line1: "1 Main", city: "Portland", region: "OR", postalCode: "97205", country: "US" },
});
const james = person("j", "James Okafor", { anniversary: { month: 11, day: 25 } }); // tomorrow
const lily = person("l", "Lily", { birthday: { month: 11, day: 27 } }); // in 3 days: no reminder
const otto = person("o", "Otto", { otherDates: [{ label: "Graduation", date: { month: 11, day: 25 } }] });

describe("reminders", () => {
  it("picks events exactly a week out or tomorrow", () => {
    const due = dueReminders([maya, james, lily, otto], TODAY);
    expect(due.map((r) => `${r.personId}:${r.days}`)).toEqual(["j:1", "o:1", "m:7"]);
    expect(due[2]!.person.name).toBe("Maya Chen");
  });

  it("uses the calendar day in the given time zone", () => {
    // 03:00 UTC on Nov 25 is still Nov 24 in New York.
    const d = todayInTimeZone("America/New_York", new Date(Date.UTC(2026, 10, 25, 3, 0)));
    expect(dateKey(d)).toBe("2026-11-24");
  });

  it("builds a single-event email with details and escaped HTML", () => {
    const [r] = dueReminders([maya], TODAY);
    const email = buildReminderEmail({ ownerName: "Rico Alexander", reminders: [r!], lockerUrl: "https://x/locker", unsubscribeUrl: "https://x/u?t=1&a=2" });
    expect(email.subject).toBe("🎂 Maya's birthday is in a week, on Tuesday, Dec 1 · turning 35");
    expect(email.text).toContain("Hi Rico,");
    expect(email.text).toContain("Wishes: Pottery class, Matcha set, Linen robe");
    expect(email.text).not.toContain("Extra");
    expect(email.text).toContain("Ships to: Portland, OR");
    expect(email.html).toContain("Scented &lt;candles&gt;");
    expect(email.html).toContain('href="https://x/u?t=1&amp;a=2"');
  });

  it("summarizes several reminders in the subject", () => {
    const email = buildReminderEmail({ reminders: dueReminders([james, otto], TODAY), lockerUrl: "l", unsubscribeUrl: "u" });
    expect(email.subject).toBe("🎁 2 special days coming up: James, Otto");
    expect(email.text).toContain("James's anniversary is tomorrow");
    expect(email.text).toContain("Otto: Graduation is tomorrow");
    expect(email.text.startsWith("Hi,")).toBe(true);
  });
});
