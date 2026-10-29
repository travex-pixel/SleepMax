"use client";

import { useRouter } from "next/navigation";
import { Pause, Play } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Screen } from "@/components/ui/screen";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { buildSequence, pathById, sequenceSeconds, type PathId } from "@/content/paths";
import { atmospheres, setAtmosphere } from "@/lib/atmosphere";
import { getEngine } from "@/lib/audio/engine";
import { prefsStore, sessionLengthLabel, setPref, type SessionLength } from "@/lib/prefs";
import { dispatch, sessionStore } from "@/lib/session";
import { useStore } from "@/lib/store";

/*
  Unwind. A sequence of short beats, one on screen at a time, with a hairline
  of progress. Pause and Skip are always within reach. When the last beat
  ends, Drift begins and the sound carries on.
*/

type Phase = "ready" | "running" | "paused";

export function UnwindScreen() {
  const router = useRouter();
  const session = useStore(sessionStore);
  const prefs = useStore(prefsStore);
  const pathId: PathId = session.path ?? "unsure";
  const path = pathById[pathId];

  // A length picked on this screen overrides the stored one, which overrides the preference.
  const [pickedLength, setLength] = useState<SessionLength | null>(null);
  const length: SessionLength = pickedLength ?? session.length ?? prefs.length;
  const [phase, setPhase] = useState<Phase>("ready");
  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0); // seconds within the whole sequence
  const startRef = useRef<number>(0); // wall clock at (re)start
  const baseRef = useRef<number>(0); // elapsed at (re)start

  useEffect(() => {
    setAtmosphere(atmospheres.unwind);
  }, []);

  useEffect(() => {
    if (session.step === "idle" || session.step === "ended") dispatch({ type: "START", at: Date.now() });
  }, [session.step]);

  const sequence = useMemo(() => buildSequence(pathId, length), [pathId, length]);
  const total = useMemo(() => sequenceSeconds(sequence), [sequence]);

  const starts = useMemo(() => {
    const out: number[] = [];
    let acc = 0;
    for (const b of sequence) {
      out.push(acc);
      acc += b.seconds;
    }
    return out;
  }, [sequence]);

  const finish = useCallback(() => {
    dispatch({ type: "UNWIND_DONE", at: Date.now() });
    router.push("/tonight/drift");
  }, [router]);

  // Clock. Wall-time based so a throttled background tab still lands right.
  useEffect(() => {
    if (phase !== "running") return;
    const tick = () => {
      const e = baseRef.current + (Date.now() - startRef.current) / 1000;
      setElapsed(e);
      if (e >= total) {
        finish();
        return;
      }
      let i = 0;
      for (let k = 0; k < starts.length; k++) if ((starts[k] ?? 0) <= e) i = k;
      setIndex((prev) => {
        if (prev !== i) dispatch({ type: "BEAT", index: i });
        return i;
      });
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [phase, starts, total, finish]);

  const begin = () => {
    // The gesture that starts Unwind also unlocks audio for Drift.
    void getEngine().unlock();
    if (prefs.length !== length) setPref("length", length);
    dispatch({ type: "UNWIND_START", length });
    const resumeFrom = session.length === length && session.beatIndex > 0 ? (starts[session.beatIndex] ?? 0) : 0;
    baseRef.current = resumeFrom;
    startRef.current = Date.now();
    setElapsed(resumeFrom);
    setPhase("running");
  };

  const pause = () => {
    baseRef.current = elapsed;
    setPhase("paused");
  };

  const resume = () => {
    startRef.current = Date.now();
    setPhase("running");
  };

  const skipBeat = () => {
    const nextStart = starts[index + 1];
    if (nextStart === undefined) {
      finish();
      return;
    }
    baseRef.current = nextStart;
    startRef.current = Date.now();
    setElapsed(nextStart);
    setIndex(index + 1);
  };

  const skipToSound = () => {
    void getEngine().unlock();
    finish();
  };

  const beat = sequence[index];
  const remainingMin = Math.max(1, Math.ceil((total - elapsed) / 60));
  const canResume = session.length === length && session.beatIndex > 0;

  if (phase === "ready") {
    return (
      <Screen
        back={path.skipUnload ? "/tonight/choose" : "/tonight/unload"}
        title="Wind down"
        footer={
          <div className="flex flex-col gap-3">
            <Button variant="primary" size="lg" onClick={begin}>
              {canResume ? "Continue where you were" : "Begin"}
            </Button>
            <Button variant="ghost" size="lg" onClick={skipToSound}>
              Skip to the sound
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-10 pt-4">
          <h1 className="voice text-[1.625rem] leading-[1.25]">{path.opening}</h1>
          <div className="flex flex-col gap-3">
            <Segmented<SessionLength>
              ariaLabel="How long"
              value={length}
              onChange={setLength}
              options={[
                { value: "quick", label: "2 min" },
                { value: "short", label: "5 min" },
                { value: "longer", label: "10 min" },
              ]}
            />
            <p className="text-[0.875rem] text-ink-3">
              {sessionLengthLabel[length]}. {prefs.guidance ? "A few short lines, one at a time." : "Quiet, no words. Just time."} Stop whenever you like.
            </p>
          </div>
        </div>
      </Screen>
    );
  }

  return (
    <Screen
      center
      title="Wind down"
      footer={
        <div className="flex flex-col gap-4">
          <div className="relative h-px w-full bg-line" aria-hidden="true">
            <div
              className="absolute inset-y-0 left-0 bg-lamp/70 transition-[width] duration-500 ease-linear"
              style={{ width: `${Math.min(100, (elapsed / total) * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" size="md" onClick={skipToSound} className="whitespace-nowrap">
              Skip to the sound
            </Button>
            <button
              type="button"
              onClick={phase === "running" ? pause : resume}
              aria-label={phase === "running" ? "Pause" : "Resume"}
              className="flex h-14 w-14 items-center justify-center rounded-full border border-line-strong text-ink transition-colors hover:border-ink-3"
            >
              {phase === "running" ? (
                <Pause className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <Play className="ml-0.5 h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              )}
            </button>
            <Button variant="ghost" size="md" onClick={skipBeat} disabled={!prefs.guidance} className="whitespace-nowrap">
              Next line
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex min-h-[14rem] flex-col justify-center gap-6" aria-live="polite" aria-atomic="true">
        <AnimatePresence mode="wait">
          {phase === "paused" ? (
            <motion.p
              key="paused"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="voice text-[1.5rem] leading-[1.35] text-ink-2"
            >
              Paused. Take your time.
            </motion.p>
          ) : !prefs.guidance ? (
            <motion.div key="quiet" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
              <p className="voice text-[1.5rem] leading-[1.35]">Nothing to do. Stay as long as you like.</p>
              <p className="mt-4 text-[0.9375rem] text-ink-3">
                {remainingMin} {remainingMin === 1 ? "minute" : "minutes"} left, then the sound carries on.
              </p>
            </motion.div>
          ) : beat && beat.quiet ? (
            <motion.p
              key={`quiet-${index}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="text-[0.9375rem] text-ink-3"
            >
              …
            </motion.p>
          ) : beat ? (
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              className="voice text-[1.625rem] leading-[1.35] sm:text-[1.75rem]"
            >
              {beat.text}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </Screen>
  );
}
