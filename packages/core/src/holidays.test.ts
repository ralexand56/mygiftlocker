import { describe, expect, it } from "vitest";
import { buildReminderEmail, cleanHolidays, dueReminders, eventsInMonth, holiday, nextEvent, nextHoliday, sortPeople, type Person } from "./index";

const ymd = (d: Date) => [d.getFullYear(), d.getMonth() + 1, d.getDate()];

const person = (id: string, name: string, extra: Partial<Person> = {}): Person => ({
  id,
  name,
  kind: "adult",
  color: "#fff",
  sizes: {},
  updatedAt: "2026-01-01T00:00:00Z",
  ...extra,
});

describe("holidays", () => {
  it("computes fixed and floating US dates", () => {
    expect(ymd(holiday("christmas").dateIn(2026))).toEqual([2026, 12, 25]);
    expect(ymd(holiday("valentines").dateIn(2027))).toEqual([2027, 2, 14]);
    expect(ymd(holiday("mothers-day").dateIn(2026))).toEqual([2026, 5, 10]);
    expect(ymd(holiday("mothers-day").dateIn(2027))).toEqual([2027, 5, 9]);
    expect(ymd(holiday("fathers-day").dateIn(2026))).toEqual([2026, 6, 21]);
    expect(ymd(holiday("fathers-day").dateIn(2028))).toEqual([2028, 6, 18]);
  });

  it("finds the next occurrence, today included, rolling into next year", () => {
    expect(ymd(nextHoliday("christmas", new Date(2026, 11, 25, 18)))).toEqual([2026, 12, 25]);
    expect(ymd(nextHoliday("christmas", new Date(2026, 11, 26)))).toEqual([2027, 12, 25]);
  });

  it("cleans stored tags", () => {
    expect(cleanHolidays(["christmas", "bogus", "valentines", "christmas", 3])).toEqual(["valentines", "christmas"]);
    expect(cleanHolidays(null)).toEqual([]);
  });

  it("treats tagged holidays as events for sorting and the calendar", () => {
    const now = new Date(2026, 10, 24);
    const mom = person("m", "Mom", { birthday: { month: 3, day: 1 }, holidays: ["mothers-day", "christmas"] });
    const pal = person("p", "Pal", { birthday: { month: 1, day: 5 } });
    expect(nextEvent(mom, now)).toMatchObject({ kind: "holiday", holidayId: "christmas", label: "Christmas", days: 31 });
    expect(sortPeople([pal, mom], "next", now).map((p) => p.id)).toEqual(["m", "p"]);
    expect(eventsInMonth([mom], 2027, 5).map((e) => [e.label, e.day])).toEqual([["Mother's Day", 9]]);
  });
});

describe("holiday reminders", () => {
  const maya = person("a", "Maya Chen", { holidays: ["christmas"], sizes: { top: "S" }, ownerNote: "Has the green scarf already" });
  const james = person("b", "James Okafor", { holidays: ["christmas"] });
  const lily = person("c", "Lily", { birthday: { month: 12, day: 5 } });

  it("reminds three weeks and one week before, not the day before", () => {
    const days = (d: Date) => dueReminders([maya], d).map((r) => r.days);
    expect(days(new Date(2026, 11, 4))).toEqual([21]);
    expect(days(new Date(2026, 11, 18))).toEqual([7]);
    expect(days(new Date(2026, 11, 24))).toEqual([]);
  });

  it("groups everyone tagged for a holiday into one block with notes", () => {
    const reminders = dueReminders([maya, james, lily], new Date(2026, 11, 4)); // Christmas in 21 days, Lily tomorrow
    const email = buildReminderEmail({ reminders, lockerUrl: "l", unsubscribeUrl: "u" });
    expect(email.subject).toBe("🎁 2 special days coming up: Lily, Christmas");
    expect(email.text).toContain("🎄 Christmas is in 3 weeks, on Friday, Dec 25");
    expect(email.text.match(/Christmas is/g)).toHaveLength(1);
    expect(email.text).toContain("Your note: Has the green scarf already");
    expect(email.html).toContain("James Okafor");
  });

  it("names who you're shopping for when Christmas is the only reminder", () => {
    const email = buildReminderEmail({ reminders: dueReminders([maya, james], new Date(2026, 11, 18)), lockerUrl: "l", unsubscribeUrl: "u" });
    expect(email.subject).toBe("🎄 Christmas is in a week, on Friday, Dec 25 · shopping for James and Maya");
  });
});
