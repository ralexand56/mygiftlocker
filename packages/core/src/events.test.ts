import { describe, expect, it } from "vitest";
import { describeDays, eventsInMonth, filterPeopleByName, nextEvent, sortPeople, upcomingEvents, type Person } from "./index";

const person = (id: string, name: string, extra: Partial<Person> = {}): Person => ({
  id,
  name,
  kind: "adult",
  color: "#fff",
  sizes: {},
  updatedAt: "2026-01-01T00:00:00Z",
  ...extra,
});

// Reference day: Nov 23, 2026 (local time).
const NOW = new Date(2026, 10, 23, 15, 30);

const ava = person("a", "Ava Chen", { birthday: { month: 12, day: 9, year: 2020 } }); // in 16 days, turns 6
const ben = person("b", "ben ortiz", { birthday: { month: 3, day: 14 }, anniversary: { month: 11, day: 23 } }); // anniversary today
const cal = person("c", "Cal Price", { otherDates: [{ label: "Gotcha day", date: { month: 1, day: 2 } }] }); // next year
const dee = person("d", "Dee"); // no dates
const leap = person("e", "Leap Lee", { birthday: { month: 2, day: 29, year: 2000 } });

describe("events", () => {
  it("finds each person's next event, including today and next year", () => {
    expect(nextEvent(ben, NOW)).toMatchObject({ kind: "anniversary", days: 0 });
    expect(nextEvent(ava, NOW)).toMatchObject({ kind: "birthday", days: 16, milestone: 6 });
    const c = nextEvent(cal, NOW)!;
    expect(c.label).toBe("Gotcha day");
    expect(c.date.getFullYear()).toBe(2027);
    expect(nextEvent(dee, NOW)).toBeUndefined();
  });

  it("sorts by next event with undated people last, or by name case-insensitively", () => {
    expect(sortPeople([dee, cal, ava, ben], "next", NOW).map((p) => p.id)).toEqual(["b", "a", "c", "d"]);
    expect(sortPeople([dee, cal, ava, ben], "name", NOW).map((p) => p.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("filters by any part of the name", () => {
    expect(filterPeopleByName([ava, ben, cal], "  ORT ").map((p) => p.id)).toEqual(["b"]);
    expect(filterPeopleByName([ava, ben], "")).toHaveLength(2);
  });

  it("lists everyone's upcoming events soonest first within a window", () => {
    expect(upcomingEvents([ava, ben, cal, dee], NOW, 30).map((e) => `${e.personId}:${e.kind}`)).toEqual(["b:anniversary", "a:birthday"]);
  });

  it("builds a month view and moves Feb 29 to Feb 28 in non-leap years", () => {
    expect(eventsInMonth([ava, ben], 2026, 12).map((e) => [e.personId, e.day, e.milestone])).toEqual([["a", 9, 6]]);
    expect(eventsInMonth([leap], 2027, 2)[0]).toMatchObject({ day: 28, milestone: 27 });
    expect(eventsInMonth([leap], 2028, 2)[0]).toMatchObject({ day: 29 });
  });

  it("describes day counts", () => {
    expect([0, 1, 5].map((d) => describeDays(d))).toEqual(["today", "tomorrow", "in 5 days"]);
  });
});
