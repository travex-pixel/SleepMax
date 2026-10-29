"use client";

import { useEffect, useState } from "react";
import { Screen } from "@/components/ui/screen";
import { Button } from "@/components/ui/button";
import { ChoiceList } from "@/components/ui/choice-list";
import { Segmented } from "@/components/ui/segmented";
import { ToggleRow } from "@/components/ui/toggle";
import { atmospheres, setAtmosphere } from "@/lib/atmosphere";
import { presets, type SoundPreset } from "@/lib/audio/presets";
import { checkinsStore } from "@/lib/checkins";
import { defaultPrefs, prefsStore, setPref, type MotionPref, type SessionLength } from "@/lib/prefs";
import { initialSession, sessionStore } from "@/lib/session";
import { clearAll, storageAvailable } from "@/lib/storage";
import { useStore } from "@/lib/store";
import { deleteAllThoughts, draftStore, thoughtsStore } from "@/lib/thoughts";

export function SettingsScreen() {
  const prefs = useStore(prefsStore);
  const [confirmAll, setConfirmAll] = useState(false);
  const [confirmThoughts, setConfirmThoughts] = useState(false);
  const [cleared, setCleared] = useState<string | null>(null);

  useEffect(() => {
    setAtmosphere(atmospheres.quiet);
  }, []);

  const wipeThoughts = () => {
    deleteAllThoughts();
    draftStore.set("");
    setConfirmThoughts(false);
    setCleared("Thoughts deleted.");
  };

  const wipeEverything = () => {
    clearAll();
    thoughtsStore.set([]);
    draftStore.set("");
    prefsStore.set(defaultPrefs);
    sessionStore.set(initialSession);
    checkinsStore.set([]);
    setConfirmAll(false);
    setCleared("Everything deleted. OFFMODE has forgotten you.");
  };

  return (
    <Screen back="/" title="Settings">
      <div className="flex flex-col gap-10 pt-4 pb-6">
        <section className="flex flex-col gap-1">
          <h2 className="mb-2 text-[0.9375rem] text-ink-3">Wind-down</h2>
          <ToggleRow
            label="Guidance text"
            note={prefs.guidance ? "A few short lines, one at a time" : "Quiet. Just time, then the sound"}
            checked={prefs.guidance}
            onChange={(v) => setPref("guidance", v)}
          />
          <div className="flex flex-col gap-3 py-3">
            <p className="text-[1rem]">Usual length</p>
            <Segmented<SessionLength>
              ariaLabel="Usual length"
              value={prefs.length}
              onChange={(v) => setPref("length", v)}
              options={[
                { value: "quick", label: "2 min" },
                { value: "short", label: "5 min" },
                { value: "longer", label: "10 min" },
              ]}
            />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-[0.9375rem] text-ink-3">Sound to start with</h2>
          <ChoiceList<SoundPreset>
            ariaLabel="Sound to start with"
            selected={prefs.sound}
            choices={presets.map((p) => ({ id: p.id, label: p.name, note: p.note }))}
            onChoose={(id) => setPref("sound", id)}
          />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-[0.9375rem] text-ink-3">Screen</h2>
          <div className="flex flex-col gap-1 py-2">
            <div className="flex items-baseline justify-between">
              <label htmlFor="dim" className="text-[1rem]">
                How dark &ldquo;Dim screen&rdquo; goes
              </label>
              <span className="text-[0.9375rem] tabular-nums text-ink-3">{Math.round(prefs.dim * 100)}%</span>
            </div>
            <input
              id="dim"
              type="range"
              className="slider"
              min={0.2}
              max={0.75}
              step={0.05}
              value={prefs.dim}
              onChange={(e) => setPref("dim", Number(e.target.value))}
            />
            <p className="text-[0.8125rem] text-ink-3">Capped so the controls always stay readable.</p>
          </div>
          <div className="flex flex-col gap-3 py-2">
            <p className="text-[1rem]">Motion</p>
            <Segmented<MotionPref>
              ariaLabel="Motion"
              value={prefs.motion}
              onChange={(v) => setPref("motion", v)}
              options={[
                { value: "system", label: "Follow my device" },
                { value: "reduce", label: "Keep it still" },
              ]}
            />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-[0.9375rem] text-ink-3">Your data</h2>
          <p className="text-[0.9375rem] text-ink-2">
            Thoughts, preferences and check-ins are stored in this browser only. Nothing is sent anywhere, there is no account, and
            there are no analytics.{" "}
            {storageAvailable()
              ? "Clearing this site’s data, or a private window, will empty them, so they’re not a permanent record."
              : "Storage is unavailable in this browser right now, so nothing will be kept after you close the page."}
          </p>
          <div className="flex flex-col gap-2 pt-1">
            {confirmThoughts ? (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-[0.9375rem] text-ink-2">Delete every thought?</p>
                <Button variant="danger" size="sm" onClick={wipeThoughts}>
                  Delete thoughts
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmThoughts(false)}>
                  Keep
                </Button>
              </div>
            ) : (
              <Button variant="secondary" size="md" onClick={() => setConfirmThoughts(true)} className="self-start">
                Delete all thoughts
              </Button>
            )}
            {confirmAll ? (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-[0.9375rem] text-ink-2">Delete thoughts, check-ins and preferences?</p>
                <Button variant="danger" size="sm" onClick={wipeEverything}>
                  Delete everything
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmAll(false)}>
                  Keep
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="md" onClick={() => setConfirmAll(true)} className="self-start text-ink-3">
                Delete everything
              </Button>
            )}
            {cleared ? (
              <p className="text-[0.9375rem] text-ink-2" role="status">
                {cleared}
              </p>
            ) : null}
          </div>
        </section>

        <section className="flex flex-col gap-3 text-[0.9375rem] text-ink-2">
          <h2 className="text-[0.9375rem] text-ink-3">About</h2>
          <p>
            OFFMODE is a place to put the day down. It isn’t a medical tool and can’t tell you why you’re awake. Racing thoughts,
            restlessness and trouble switching off have many causes; if they keep getting in the way, someone qualified can help in
            ways an app can’t.
          </p>
          <p>
            The sounds are made on your phone as you listen, so there are no recordings to download. Browsers can pause sound when
            the screen locks or another app takes over, especially on iPhone. If that happens, the screen offers a single tap to
            start it again.
          </p>
        </section>
      </div>
    </Screen>
  );
}
