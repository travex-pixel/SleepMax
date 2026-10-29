import { describe, expect, it } from "vitest";
import { buildIcs, escapeText, fold, formatLocal, tomorrowAt } from "./ics";
import type { Thought } from "./thoughts";

const thought = (text: string): Thought => ({ id: "x", text, createdAt: 0, tomorrow: true, doneAt: null });

describe("ics", () => {
  it("formats floating local times", () => {
    expect(formatLocal(new Date(2026, 9, 30, 9, 0, 0))).toBe("20261030T090000");
  });

  it("tomorrow at nine is nine local time on the next calendar day", () => {
    const d = tomorrowAt(9, new Date(2026, 9, 29, 23, 45));
    expect(d.getDate()).toBe(30);
    expect(d.getHours()).toBe(9);
    expect(d.getMinutes()).toBe(0);
  });

  it("escapes commas, semicolons and newlines", () => {
    expect(escapeText("a, b; c\nd")).toBe("a\\, b\\; c\\nd");
  });

  it("folds long lines under 75 octets", () => {
    const folded = fold("DESCRIPTION:" + "x".repeat(200));
    for (const line of folded.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });

  it("builds a calendar with one event and an alarm", () => {
    const ics = buildIcs([thought("Finish the report"), thought("Call mum")], new Date(2026, 9, 30, 9), new Date(2026, 9, 29, 23));
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("DTSTART:20261030T090000");
    expect(ics).toContain("SUMMARY:2 things you parked last night");
    expect(ics).toContain("BEGIN:VALARM");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
});
