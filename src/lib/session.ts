import { createStore } from "./store";
import type { PathId } from "@/content/paths";
import type { SessionLength } from "./prefs";
import type { SoundPreset } from "./audio/presets";

/*
  One night's session as an explicit state machine.

    idle → choose → unload → unwind → drift → ended
                       ↘ (skip) ↗       ↗
                 choose → unwind (direct for "calming")
    home "Just play something" → drift

  The machine is pure so it can be tested; the store persists the current
  state so a refresh, a locked phone or a switched app lands back where the
  user was. Sessions older than eight hours are treated as finished.
*/

export type Step = "idle" | "choose" | "unload" | "unwind" | "drift" | "ended";

export interface Session {
  step: Step;
  startedAt: number | null;
  updatedAt: number;
  path: PathId | null;
  length: SessionLength | null;
  /** Beat index reached inside Unwind so a return resumes nearby. */
  beatIndex: number;
  sound: SoundPreset | null;
  /** Minutes the sound runs for, or null for no timer. Defaults to half an hour. */
  timerMinutes: number | null;
  driftStartedAt: number | null;
  endedAt: number | null;
}

export type SessionEvent =
  | { type: "START"; at: number }
  | { type: "PLAY_SOUND"; at: number; sound: SoundPreset }
  | { type: "CHOOSE"; path: PathId; skipUnload: boolean }
  | { type: "SKIP_CHOICE" }
  | { type: "UNLOAD_DONE" }
  | { type: "UNWIND_START"; length: SessionLength }
  | { type: "BEAT"; index: number }
  | { type: "UNWIND_DONE"; at: number }
  | { type: "SET_SOUND"; sound: SoundPreset }
  | { type: "SET_TIMER"; minutes: number | null }
  | { type: "END"; at: number }
  | { type: "RESET" };

export const initialSession: Session = {
  step: "idle",
  startedAt: null,
  updatedAt: 0,
  path: null,
  length: null,
  beatIndex: 0,
  sound: null,
  timerMinutes: 30,
  driftStartedAt: null,
  endedAt: null,
};

export const SESSION_STALE_MS = 8 * 60 * 60 * 1000;

export function reduce(s: Session, e: SessionEvent): Session {
  const touched = (next: Partial<Session>): Session => ({ ...s, ...next, updatedAt: Date.now() });
  switch (e.type) {
    case "START":
      return { ...initialSession, step: "choose", startedAt: e.at, updatedAt: e.at };
    case "PLAY_SOUND":
      return {
        ...initialSession,
        step: "drift",
        startedAt: e.at,
        updatedAt: e.at,
        sound: e.sound,
        driftStartedAt: e.at,
      };
    case "CHOOSE":
      return touched({ path: e.path, step: e.skipUnload ? "unwind" : "unload" });
    case "SKIP_CHOICE":
      return touched({ path: "unsure", step: "unload" });
    case "UNLOAD_DONE":
      return touched({ step: "unwind", path: s.path ?? "unsure" });
    case "UNWIND_START":
      return touched({ length: e.length, beatIndex: 0 });
    case "BEAT":
      return touched({ beatIndex: e.index });
    case "UNWIND_DONE":
      return touched({ step: "drift", driftStartedAt: e.at });
    case "SET_SOUND":
      return touched({ sound: e.sound });
    case "SET_TIMER":
      return touched({ timerMinutes: e.minutes });
    case "END":
      return touched({ step: "ended", endedAt: e.at });
    case "RESET":
      return { ...initialSession };
  }
}

export function isResumable(s: Session, now = Date.now()): boolean {
  if (s.step === "idle" || s.step === "ended") return false;
  if (!s.startedAt) return false;
  return now - s.updatedAt < SESSION_STALE_MS;
}

/** True when a session happened last night, finished or not, for the morning check-in. */
export function hadSessionLastNight(s: Session, nightStart: number): boolean {
  return s.startedAt !== null && s.startedAt >= nightStart;
}

export const stepPath: Record<Exclude<Step, "idle" | "ended">, string> = {
  choose: "/tonight/choose",
  unload: "/tonight/unload",
  unwind: "/tonight/unwind",
  drift: "/tonight/drift",
};

function isSession(v: unknown): v is Session {
  if (!v || typeof v !== "object") return false;
  const s = v as Record<string, unknown>;
  return typeof s.step === "string" && typeof s.updatedAt === "number";
}

export const sessionStore = createStore<Session>("session", initialSession, isSession);

export function dispatch(e: SessionEvent): void {
  sessionStore.set((s) => reduce(s, e));
}
