import { describe, expect, it } from "vitest";
import { SESSION_STALE_MS, initialSession, isResumable, reduce, type Session } from "./session";

const T = 1_700_000_000_000;

function run(events: Parameters<typeof reduce>[1][]): Session {
  return events.reduce((s, e) => reduce(s, e), initialSession);
}

describe("session state machine", () => {
  it("walks the full path: choose → unload → unwind → drift → ended", () => {
    const s = run([
      { type: "START", at: T },
      { type: "CHOOSE", path: "racing", skipUnload: false },
    ]);
    expect(s.step).toBe("unload");
    const s2 = reduce(s, { type: "UNLOAD_DONE" });
    expect(s2.step).toBe("unwind");
    const s3 = reduce(reduce(s2, { type: "UNWIND_START", length: "short" }), { type: "UNWIND_DONE", at: T + 1 });
    expect(s3.step).toBe("drift");
    expect(s3.length).toBe("short");
    expect(s3.driftStartedAt).toBe(T + 1);
    const s4 = reduce(s3, { type: "END", at: T + 2 });
    expect(s4.step).toBe("ended");
  });

  it("skips the brain dump for paths that ask to", () => {
    const s = run([
      { type: "START", at: T },
      { type: "CHOOSE", path: "settle", skipUnload: true },
    ]);
    expect(s.step).toBe("unwind");
    expect(s.path).toBe("settle");
  });

  it("skipping the choice lands on unload with the open path", () => {
    const s = run([{ type: "START", at: T }, { type: "SKIP_CHOICE" }]);
    expect(s.step).toBe("unload");
    expect(s.path).toBe("unsure");
  });

  it("'just play something' goes straight to drift with the sound and a default timer", () => {
    const s = reduce(initialSession, { type: "PLAY_SOUND", at: T, sound: "brown" });
    expect(s.step).toBe("drift");
    expect(s.sound).toBe("brown");
    expect(s.timerMinutes).toBe(30);
  });

  it("remembers the beat reached so a return resumes nearby", () => {
    const s = run([
      { type: "START", at: T },
      { type: "CHOOSE", path: "racing", skipUnload: false },
      { type: "UNLOAD_DONE" },
      { type: "UNWIND_START", length: "longer" },
      { type: "BEAT", index: 4 },
    ]);
    expect(s.beatIndex).toBe(4);
  });

  it("a timer of null means no timer", () => {
    const s = reduce(reduce(initialSession, { type: "PLAY_SOUND", at: T, sound: "rain" }), { type: "SET_TIMER", minutes: null });
    expect(s.timerMinutes).toBeNull();
  });

  it("START after END begins a fresh session", () => {
    const ended = run([{ type: "START", at: T }, { type: "END", at: T + 5 }]);
    const fresh = reduce(ended, { type: "START", at: T + 10 });
    expect(fresh.step).toBe("choose");
    expect(fresh.endedAt).toBeNull();
    expect(fresh.path).toBeNull();
  });
});

describe("isResumable", () => {
  it("is false for idle and ended sessions", () => {
    expect(isResumable(initialSession)).toBe(false);
    expect(isResumable(run([{ type: "START", at: T }, { type: "END", at: T }]), T)).toBe(false);
  });

  it("is true for a recent in-progress session and false once stale", () => {
    const s = run([{ type: "START", at: T }]);
    const recent = { ...s, updatedAt: T };
    expect(isResumable(recent, T + 60_000)).toBe(true);
    expect(isResumable(recent, T + SESSION_STALE_MS + 1)).toBe(false);
  });
});
