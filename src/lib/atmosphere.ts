import { useSyncExternalStore } from "react";

/*
  The atmosphere is the one piece of shared visual state: where the horizon
  sits, how dark the ground is, and how heavy the dim veil is. Screens set it;
  the Atmosphere component renders it. It is intentionally not persisted.
*/

export type Ground = "home" | "deep" | "drift";

export interface Atmosphere {
  /** 0..1 fraction of viewport height. */
  horizon: number;
  /** 0..1 opacity of the horizon glow. */
  glow: number;
  ground: Ground;
  /** 0..0.85 opacity of the black veil. */
  veil: number;
}

/*
  On the opening screen the horizon is the composition: it sits between the
  sentence and the actions. On task screens it keeps out of the content and
  lives in the footer zone, so the primary action always stands on the ground.
  Through a session it sinks and dims: last light leaving the room.
*/
export const atmospheres = {
  home: { horizon: 0.58, glow: 1, ground: "home", veil: 0 },
  choose: { horizon: 0.8, glow: 0.85, ground: "home", veil: 0 },
  unload: { horizon: 0.82, glow: 0.75, ground: "home", veil: 0 },
  unwind: { horizon: 0.82, glow: 0.6, ground: "deep", veil: 0 },
  drift: { horizon: 0.74, glow: 0.4, ground: "drift", veil: 0 },
  morning: { horizon: 0.86, glow: 0.9, ground: "home", veil: 0 },
  quiet: { horizon: 0.86, glow: 0.55, ground: "home", veil: 0 },
} as const satisfies Record<string, Atmosphere>;

let current: Atmosphere = atmospheres.home;
const listeners = new Set<() => void>();

export function setAtmosphere(next: Partial<Atmosphere>) {
  current = { ...current, ...next };
  listeners.forEach((l) => l());
}

export function useAtmosphere(): Atmosphere {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => atmospheres.home,
  );
}
