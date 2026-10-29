import { createStore } from "./store";
import type { SoundPreset } from "./audio/presets";

export type SessionLength = "quick" | "short" | "longer";
export type MotionPref = "system" | "reduce";

export interface Prefs {
  /** Show the guidance text during Unwind, or keep it quiet. */
  guidance: boolean;
  length: SessionLength;
  sound: SoundPreset;
  volume: number; // 0..1
  /** How dark the dim veil goes in Drift. 0..0.85 */
  dim: number;
  motion: MotionPref;
  /** Set once the user has started a session. Lets the home screen relax. */
  returning: boolean;
}

export const defaultPrefs: Prefs = {
  guidance: true,
  length: "short",
  sound: "rain",
  volume: 0.6,
  dim: 0.55,
  motion: "system",
  returning: false,
};

function isPrefs(v: unknown): v is Prefs {
  if (!v || typeof v !== "object") return false;
  const p = v as Record<string, unknown>;
  return typeof p.guidance === "boolean" && typeof p.length === "string" && typeof p.sound === "string";
}

export const prefsStore = createStore<Prefs>("prefs", defaultPrefs, (v): v is Prefs => isPrefs(v));

export function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]): void {
  prefsStore.set((p) => ({ ...defaultPrefs, ...p, [key]: value }));
}

export const sessionLengthMinutes: Record<SessionLength, number> = { quick: 2, short: 5, longer: 10 };
export const sessionLengthLabel: Record<SessionLength, string> = {
  quick: "A couple of minutes",
  short: "About five minutes",
  longer: "About ten minutes",
};
