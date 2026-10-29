import { createStore } from "./store";
import type { PathId } from "@/content/paths";
import type { SoundPreset } from "./audio/presets";

export type Rested = 1 | 2 | 3 | 4 | 5;
export type Helped = "writing" | "guidance" | "sound" | "nothing";
export type NextTime = "same" | "shorter" | "longer" | "quieter";

export interface CheckIn {
  id: string;
  /** Local calendar day, YYYY-MM-DD, so one check-in per morning. */
  day: string;
  at: number;
  rested: Rested;
  helped: Helped[];
  nextTime: NextTime;
  /** What last night’s session used, copied so patterns can be described later. */
  path: PathId | null;
  sound: SoundPreset | null;
}

export const restedLabel: Record<Rested, string> = {
  1: "Rough",
  2: "Not great",
  3: "Okay",
  4: "Fairly rested",
  5: "Rested",
};

function isCheckIn(v: unknown): v is CheckIn {
  if (!v || typeof v !== "object") return false;
  const c = v as Record<string, unknown>;
  return typeof c.id === "string" && typeof c.day === "string" && typeof c.rested === "number";
}

export const checkinsStore = createStore<CheckIn[]>("checkins", [], (v): v is CheckIn[] =>
  Array.isArray(v) && v.every(isCheckIn),
);

export function localDay(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isMorning(d = new Date()): boolean {
  const h = d.getHours();
  return h >= 5 && h < 13;
}

/*
  Patterns are descriptive only, from the user’s own words, and only once
  there is enough to describe. Nothing here measures sleep.
*/
export interface Pattern {
  text: string;
}

const MIN_FOR_PATTERN = 3;

export function describePatterns(list: CheckIn[], soundName: (s: SoundPreset) => string, pathName: (p: PathId) => string): Pattern[] {
  if (list.length < MIN_FOR_PATTERN) return [];
  const out: Pattern[] = [];

  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const overall = avg(list.map((c) => c.rested));

  const bySound = new Map<SoundPreset, number[]>();
  const byPath = new Map<PathId, number[]>();
  const helpedCount = new Map<Helped, number>();
  for (const c of list) {
    if (c.sound) bySound.set(c.sound, [...(bySound.get(c.sound) ?? []), c.rested]);
    if (c.path) byPath.set(c.path, [...(byPath.get(c.path) ?? []), c.rested]);
    for (const h of c.helped) helpedCount.set(h, (helpedCount.get(h) ?? 0) + 1);
  }

  out.push({
    text: `Across ${list.length} mornings you’ve described waking as "${describeAvg(overall)}" on average.`,
  });

  for (const [sound, xs] of bySound) {
    if (xs.length >= MIN_FOR_PATTERN) {
      out.push({
        text: `On the ${xs.length} nights with ${soundName(sound)}, you said "${describeAvg(avg(xs))}".`,
      });
    }
  }
  for (const [path, xs] of byPath) {
    if (xs.length >= MIN_FOR_PATTERN) {
      out.push({
        text: `After "${pathName(path)}" (${xs.length} nights), you said "${describeAvg(avg(xs))}".`,
      });
    }
  }

  const helpedLabel: Record<Helped, string> = {
    writing: "writing things down",
    guidance: "the wind-down",
    sound: "the sound",
    nothing: "nothing much",
  };
  const topHelped = [...helpedCount.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topHelped && topHelped[1] >= MIN_FOR_PATTERN) {
    out.push({ text: `The thing you most often said helped: ${helpedLabel[topHelped[0]]} (${topHelped[1]} mornings).` });
  }

  return out;
}

function describeAvg(x: number): string {
  if (x < 1.5) return restedLabel[1].toLowerCase();
  if (x < 2.5) return restedLabel[2].toLowerCase();
  if (x < 3.5) return restedLabel[3].toLowerCase();
  if (x < 4.5) return restedLabel[4].toLowerCase();
  return restedLabel[5].toLowerCase();
}
