/*
  Every sound is synthesised in the browser with the Web Audio API. No
  recordings, nothing to download, nothing copyrighted.

  A preset is a mix of four layers. Values are linear gains 0..1.
*/

export type Layer = "rain" | "brown" | "pink" | "wind" | "thunder";

export type Mix = Record<Layer, number>;

export type SoundPreset = "rain" | "brown" | "pink" | "wind" | "storm" | "night";

export interface PresetInfo {
  id: SoundPreset;
  name: string;
  /** One phrase, no sales language. */
  note: string;
  mix: Mix;
}

export const presets: PresetInfo[] = [
  { id: "rain", name: "Soft rain", note: "Steady, close, no thunder", mix: { rain: 0.8, brown: 0.12, pink: 0, wind: 0, thunder: 0 } },
  { id: "brown", name: "Brown noise", note: "Deep and even", mix: { rain: 0, brown: 0.9, pink: 0, wind: 0, thunder: 0 } },
  { id: "pink", name: "Pink noise", note: "Lighter than brown", mix: { rain: 0, brown: 0, pink: 0.7, wind: 0, thunder: 0 } },
  { id: "wind", name: "Gentle wind", note: "Slow, moving, outside", mix: { rain: 0, brown: 0.25, pink: 0, wind: 0.8, thunder: 0 } },
  { id: "storm", name: "Distant thunder", note: "Rain with far-off weather", mix: { rain: 0.7, brown: 0.15, pink: 0, wind: 0.2, thunder: 0.7 } },
  { id: "night", name: "Night", note: "Low, quiet, mostly stillness", mix: { rain: 0, brown: 0.35, pink: 0.08, wind: 0.3, thunder: 0 } },
];

export const presetById: Record<SoundPreset, PresetInfo> = Object.fromEntries(presets.map((p) => [p.id, p])) as Record<
  SoundPreset,
  PresetInfo
>;

export function soundName(id: SoundPreset): string {
  return presetById[id].name;
}

export const layerLabel: Record<Layer, string> = {
  rain: "Rain",
  brown: "Brown noise",
  pink: "Pink noise",
  wind: "Wind",
  thunder: "Thunder",
};

export const layerOrder: Layer[] = ["rain", "brown", "pink", "wind", "thunder"];

export function isPreset(v: unknown): v is SoundPreset {
  return typeof v === "string" && v in presetById;
}

export function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

/** Perceptual volume curve so the slider feels even. */
export function volumeToGain(v: number): number {
  const c = clamp01(v);
  return c * c;
}

export const timerOptions: { minutes: number | null; label: string }[] = [
  { minutes: 15, label: "15 min" },
  { minutes: 30, label: "30 min" },
  { minutes: 60, label: "1 hour" },
  { minutes: null, label: "No timer" },
];
