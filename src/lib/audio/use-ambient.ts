"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getEngine, type EngineSnapshot } from "./engine";
import { type Mix, type SoundPreset, presetById } from "./presets";

/*
  React binding for the engine. Owns the sleep timer: when it expires, the
  sound fades over 30 seconds and the `onTimerEnd` callback fires. Timers are
  wall-clock based so a locked phone that throttles timers still ends close to
  the right moment when the page wakes.
*/

const TIMER_FADE_SECONDS = 30;

export interface AmbientControls {
  snapshot: EngineSnapshot;
  play: (preset: SoundPreset | Mix, volume: number) => Promise<boolean>;
  stop: () => void;
  setVolume: (v: number) => void;
  setMix: (m: Mix) => void;
  /** Minutes from now, or null to clear. */
  setTimer: (minutes: number | null) => void;
  /** Seconds remaining on the timer, or null. */
  remaining: number | null;
  /** Try to resume after the browser suspended us. Call from a gesture. */
  resume: () => Promise<boolean>;
}

export function useAmbient(onTimerEnd?: () => void): AmbientControls {
  const engine = getEngine();
  const [snapshot, setSnapshot] = useState<EngineSnapshot>(() => engine.snapshot());
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const fadeStarted = useRef(false);
  const onEnd = useRef(onTimerEnd);

  useEffect(() => {
    onEnd.current = onTimerEnd;
  });

  useEffect(() => engine.subscribe(setSnapshot), [engine]);

  useEffect(() => {
    if (endsAt === null) return;
    fadeStarted.current = false;
    const tick = () => {
      const left = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= TIMER_FADE_SECONDS && !fadeStarted.current && engine.isPlayingIntent()) {
        fadeStarted.current = true;
        engine.fadeOut(Math.max(1, left));
      }
      if (left <= 0) {
        setEndsAt(null);
        onEnd.current?.();
      }
    };
    const id = window.setInterval(tick, 1000);
    const first = window.setTimeout(tick, 0);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(first);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [endsAt, engine]);

  const play = useCallback(
    async (preset: SoundPreset | Mix, volume: number) => {
      const mix = typeof preset === "string" ? presetById[preset].mix : preset;
      fadeStarted.current = false;
      return engine.play(mix, volume);
    },
    [engine],
  );

  const stop = useCallback(() => {
    engine.stop(1.0);
    setEndsAt(null);
  }, [engine]);

  const setVolume = useCallback((v: number) => engine.setVolume(v), [engine]);
  const setMix = useCallback((m: Mix) => engine.setMix(m), [engine]);
  const setTimer = useCallback((minutes: number | null) => {
    const next = minutes === null ? null : Date.now() + minutes * 60_000;
    setEndsAt(next);
    setSecondsLeft(minutes === null ? 0 : minutes * 60);
  }, []);
  const resume = useCallback(() => engine.unlock(), [engine]);

  useEffect(() => {
    engine.setMediaHandlers({
      play: () => {
        void engine.resumePlayback();
      },
      pause: () => engine.stop(0.5),
    });
  }, [engine]);

  return {
    snapshot,
    play,
    stop,
    setVolume,
    setMix,
    setTimer,
    remaining: endsAt === null ? null : secondsLeft,
    resume,
  };
}
