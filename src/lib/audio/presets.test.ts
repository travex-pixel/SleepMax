import { describe, expect, it } from "vitest";
import { isPreset, presets, volumeToGain } from "./presets";

describe("sound presets", () => {
  it("has six presets with every layer between 0 and 1", () => {
    expect(presets).toHaveLength(6);
    for (const p of presets) {
      for (const v of Object.values(p.mix)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
      expect(p.name.length).toBeGreaterThan(0);
    }
  });

  it("recognises preset ids", () => {
    expect(isPreset("rain")).toBe(true);
    expect(isPreset("whale song")).toBe(false);
  });

  it("volume curve is monotonic and bounded", () => {
    let prev = -1;
    for (let v = 0; v <= 1.0001; v += 0.1) {
      const g = volumeToGain(v);
      expect(g).toBeGreaterThanOrEqual(prev);
      expect(g).toBeLessThanOrEqual(1);
      prev = g;
    }
    expect(volumeToGain(-1)).toBe(0);
    expect(volumeToGain(2)).toBe(1);
  });
});
