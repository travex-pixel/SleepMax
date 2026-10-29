"use client";

import { useRouter } from "next/navigation";
import { Moon, Pause, Play, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { SoundPicker } from "@/components/sound-picker";
import { Segmented } from "@/components/ui/segmented";
import { Wordmark } from "@/components/wordmark";
import { atmospheres, setAtmosphere } from "@/lib/atmosphere";
import { useAmbient } from "@/lib/audio/use-ambient";
import { type Mix, type SoundPreset, presetById, soundName, timerOptions } from "@/lib/audio/presets";
import { prefsStore, setPref } from "@/lib/prefs";
import { dispatch, sessionStore } from "@/lib/session";
import { useHydrated, useStore } from "@/lib/store";
import { formatRemaining } from "@/lib/time";

/*
  Drift. The screen gets progressively less demanding: the horizon sinks, the
  sentence fades, and after a while the controls settle to a low glow. A tap
  anywhere brings them back. Dim adds a veil. The user can leave the phone
  face-up and nothing will ask anything of them.

  Sound, volume and timer live in the stores, so a refresh or a return to the
  tab lands on the same settings.
*/

const IDLE_MS = 40_000;

interface DriftProps {
  /** Entered from "Just play something calming", not from a wind-down. */
  standalone?: boolean;
}

export function Drift({ standalone = false }: DriftProps) {
  const router = useRouter();
  const session = useStore(sessionStore);
  const prefs = useStore(prefsStore);
  const hydrated = useHydrated(sessionStore);

  const preset: SoundPreset = session.sound ?? prefs.sound;
  const volume = prefs.volume;
  const timerMinutes = session.timerMinutes;

  const [customMix, setCustomMix] = useState<Mix | null>(null);
  const [dim, setDim] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [idle, setIdle] = useState(false);
  const [ended, setEnded] = useState(false);
  const [sentence, setSentence] = useState(true);
  const idleTimer = useRef<number | null>(null);

  const onTimerEnd = useCallback(() => {
    setEnded(true);
    dispatch({ type: "END", at: Date.now() });
  }, []);
  const { play, stop, setTimer, setVolume: setEngineVolume, setMix, snapshot, remaining, resume } = useAmbient(onTimerEnd);

  // Latest values for the one-time start effect, without re-running it.
  const latest = useRef({ preset, volume, timerMinutes, step: session.step });
  useEffect(() => {
    latest.current = { preset, volume, timerMinutes, step: session.step };
  });

  // Atmosphere: sink the horizon, then let the dim veil follow the toggle.
  useEffect(() => {
    setAtmosphere({ ...atmospheres.drift, veil: dim ? Math.min(0.75, prefs.dim) : 0 });
  }, [dim, prefs.dim]);
  useEffect(() => () => setAtmosphere({ veil: 0 }), []);

  // Start the sound once the stored session has loaded. Works without a tap
  // when the AudioContext was unlocked earlier in the session; otherwise the
  // screen offers a single tap.
  const started = useRef(false);
  useEffect(() => {
    if (!hydrated || started.current) return;
    started.current = true;
    const { preset: p, volume: v, timerMinutes: t, step } = latest.current;
    if (step === "idle" || step === "ended") dispatch({ type: "PLAY_SOUND", at: Date.now(), sound: p });
    void play(p, v).then((ok) => {
      if (ok) setTimer(t);
    });
  }, [hydrated, play, setTimer]);

  // The sentence fades after a while; the screen asks for less and less.
  useEffect(() => {
    const id = window.setTimeout(() => setSentence(false), 24_000);
    return () => window.clearTimeout(id);
  }, []);

  // Idle: controls settle to a low glow until the user touches the screen.
  useEffect(() => {
    const arm = () => {
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => setIdle(true), IDLE_MS);
    };
    const wake = () => {
      setIdle(false);
      arm();
    };
    arm();
    document.addEventListener("pointerdown", wake, { passive: true });
    document.addEventListener("keydown", wake);
    return () => {
      document.removeEventListener("pointerdown", wake);
      document.removeEventListener("keydown", wake);
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
    };
  }, []);

  const choosePreset = (id: SoundPreset) => {
    setCustomMix(null);
    setPref("sound", id);
    dispatch({ type: "SET_SOUND", sound: id });
    if (snapshot.playing) setMix(presetById[id].mix);
    else void play(id, volume).then((ok) => ok && setTimer(timerMinutes));
  };

  const changeMix = (mix: Mix) => {
    setCustomMix(mix);
    setMix(mix);
  };

  const changeVolume = (v: number) => {
    setPref("volume", v);
    setEngineVolume(v);
  };

  const changeTimer = (m: number | null) => {
    setTimer(m);
    dispatch({ type: "SET_TIMER", minutes: m });
    setEnded(false);
  };

  const toggle = async () => {
    if (snapshot.playing) {
      stop();
    } else {
      setEnded(false);
      const ok = await play(customMix ?? preset, volume);
      if (ok) setTimer(timerMinutes);
    }
  };

  const tapToStart = async () => {
    const ok = await resume();
    if (!ok) return;
    const playing = await play(customMix ?? preset, volume);
    if (playing) setTimer(timerMinutes);
  };

  const end = () => {
    stop();
    dispatch({ type: "END", at: Date.now() });
    router.push("/");
  };

  const controlsOpacity = idle && !sheet ? 0.38 : 1;
  const needsTap = snapshot.needsGesture;

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="mx-auto flex w-full max-w-[30rem] flex-1 flex-col px-5"
    >
      <header className="flex h-14 shrink-0 items-center justify-between">
        <Wordmark />
        <button
          type="button"
          onClick={end}
          aria-label={standalone ? "Stop and go back" : "End for tonight"}
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-ink-3 transition-opacity duration-1000 hover:text-ink"
          style={{ opacity: controlsOpacity }}
        >
          <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </button>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center text-center" aria-live="polite">
        <AnimatePresence mode="wait">
          {needsTap ? (
            <motion.button
              key="tap"
              type="button"
              onClick={() => void tapToStart()}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="voice rounded-[var(--radius-control)] px-6 py-4 text-[1.375rem] text-ink underline decoration-lamp/60 underline-offset-8"
            >
              Tap to start the sound
            </motion.button>
          ) : ended ? (
            <motion.p
              key="ended"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="voice text-[1.5rem] text-ink-2"
            >
              The sound has stopped. Nothing else needs you.
            </motion.p>
          ) : sentence ? (
            <motion.p
              key="sentence"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 4 } }}
              transition={{ duration: 1.5 }}
              className="voice text-[1.5rem] leading-[1.35] text-ink-2"
            >
              Nothing else needs you right now.
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="shrink-0 pb-5 transition-opacity duration-[1500ms]" style={{ opacity: controlsOpacity }}>
        <div className="flex flex-col gap-5">
          <div className="flex items-baseline justify-between gap-4">
            <button
              type="button"
              onClick={() => setSheet(true)}
              aria-haspopup="dialog"
              aria-expanded={sheet}
              className="text-left text-[1rem] text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
            >
              {customMix ? "Your mix" : soundName(preset)}
            </button>
            <p className="text-[0.9375rem] tabular-nums text-ink-3">
              {remaining !== null ? formatRemaining(remaining) : timerMinutes === null ? "No timer" : ""}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setDim((d) => !d)}
              aria-pressed={dim}
              className={`flex h-12 items-center gap-2 rounded-[var(--radius-control)] px-3 text-[0.9375rem] transition-colors ${
                dim ? "text-lamp" : "text-ink-2 hover:text-ink"
              }`}
            >
              <Moon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
              {dim ? "Dimmed" : "Dim screen"}
            </button>
            <button
              type="button"
              onClick={() => void toggle()}
              aria-label={snapshot.playing ? "Pause sound" : "Play sound"}
              className="flex h-16 w-16 items-center justify-center rounded-full border border-line-strong text-ink transition-colors hover:border-ink-3"
            >
              {snapshot.playing ? (
                <Pause className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
              ) : (
                <Play className="ml-0.5 h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={end}
              className="flex h-12 items-center rounded-[var(--radius-control)] px-3 text-[0.9375rem] text-ink-2 transition-colors hover:text-ink"
            >
              {standalone ? "Stop" : "End"}
            </button>
          </div>

          <div>
            <label htmlFor="volume" className="sr-only">
              Volume
            </label>
            <input
              id="volume"
              type="range"
              className="slider"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => changeVolume(Number(e.target.value))}
              aria-valuetext={`${Math.round(volume * 100)} percent`}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {sheet ? (
          <>
            <motion.button
              key="scrim"
              type="button"
              aria-label="Close"
              onClick={() => setSheet(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[5] bg-black/40"
            />
            <motion.div
              key="sheet"
              role="dialog"
              aria-label="Sound and timer"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 bottom-0 z-[6] mx-auto max-h-[85dvh] w-full max-w-[30rem] overflow-y-auto rounded-t-[20px] border-t border-line bg-ground px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[0.9375rem] text-ink-2">Sound and timer</p>
                <button
                  type="button"
                  onClick={() => setSheet(false)}
                  aria-label="Done"
                  className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-ink-3 hover:text-ink"
                >
                  <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                </button>
              </div>
              <div className="flex flex-col gap-6">
                <Segmented<number | null>
                  ariaLabel="Timer"
                  size="sm"
                  value={timerMinutes}
                  onChange={changeTimer}
                  options={timerOptions.map((o) => ({ value: o.minutes, label: o.label }))}
                />
                <SoundPicker preset={preset} customMix={customMix} onPreset={choosePreset} onMix={changeMix} />
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </motion.main>
  );
}
