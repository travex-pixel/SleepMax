import { describe, expect, it } from "vitest";
import { describePatterns, isMorning, localDay, type CheckIn } from "./checkins";

const c = (over: Partial<CheckIn>): CheckIn => ({
  id: Math.random().toString(36),
  day: "2026-10-29",
  at: 0,
  rested: 3,
  helped: [],
  nextTime: "same",
  path: null,
  sound: null,
  ...over,
});

describe("check-ins", () => {
  it("says nothing until there are at least three mornings", () => {
    expect(describePatterns([c({}), c({})], () => "", () => "")).toEqual([]);
  });

  it("describes only groups with enough data, in the user's own words", () => {
    const list = [
      c({ rested: 4, sound: "rain" }),
      c({ rested: 4, sound: "rain" }),
      c({ rested: 5, sound: "rain" }),
      c({ rested: 2, sound: "wind" }),
    ];
    const out = describePatterns(list, (s) => (s === "rain" ? "Soft rain" : "Gentle wind"), () => "");
    const texts = out.map((p) => p.text).join("\n");
    expect(texts).toContain("Across 4 mornings");
    expect(texts).toContain("3 nights with Soft rain");
    expect(texts).not.toContain("Gentle wind");
    expect(texts).not.toMatch(/sleep stage|REM|deep sleep/i);
  });

  it("formats the local day and recognises morning hours", () => {
    expect(localDay(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(isMorning(new Date(2026, 0, 5, 7))).toBe(true);
    expect(isMorning(new Date(2026, 0, 5, 23))).toBe(false);
  });
});
