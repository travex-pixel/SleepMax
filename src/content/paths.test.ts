import { describe, expect, it } from "vitest";
import { buildSequence, paths, sequenceSeconds } from "./paths";

const banned = [/empty your mind/i, /hold your breath/i, /cure/i, /guarantee/i, /adhd/i, /you must/i, /you should/i];

describe("unwind content", () => {
  it("has five paths with original, gentle copy", () => {
    expect(paths).toHaveLength(5);
    for (const p of paths) {
      expect(p.beats.length).toBeGreaterThanOrEqual(10);
      for (const b of p.beats) {
        for (const re of banned) expect(b.text).not.toMatch(re);
        expect(b.seconds).toBeGreaterThanOrEqual(10);
      }
      expect(p.beats.filter((b) => b.quick).length).toBeGreaterThanOrEqual(5);
    }
  });

  it("every path closes by handing over to the sound", () => {
    for (const p of paths) {
      const last = p.beats[p.beats.length - 1];
      expect(last?.quick).toBe(true);
      expect(last?.text).toMatch(/sound/i);
    }
  });

  it("builds sequences that land exactly on the target length", () => {
    for (const p of paths) {
      expect(sequenceSeconds(buildSequence(p.id, "quick"))).toBe(120);
      expect(sequenceSeconds(buildSequence(p.id, "short"))).toBe(300);
      expect(sequenceSeconds(buildSequence(p.id, "longer"))).toBe(600);
    }
  });

  it("the quick version keeps only quick beats, the longer version adds quiet stretches", () => {
    const quick = buildSequence("racing", "quick");
    const quickTexts = quick.map((b) => b.text);
    for (const t of quickTexts) expect(paths[0]?.beats.find((b) => b.text === t)?.quick).toBe(true);
    const longer = buildSequence("racing", "longer");
    expect(longer.some((b) => b.quiet)).toBe(true);
    expect(longer[longer.length - 1]?.quiet).toBe(false);
  });

  it("no beat is shorter than six seconds after scaling", () => {
    for (const p of paths) {
      for (const len of ["quick", "short", "longer"] as const) {
        for (const b of buildSequence(p.id, len)) expect(b.seconds).toBeGreaterThanOrEqual(6);
      }
    }
  });
});
