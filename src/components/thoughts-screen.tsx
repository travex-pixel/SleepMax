"use client";

import { useEffect, useState } from "react";
import { Screen } from "@/components/ui/screen";
import { Button } from "@/components/ui/button";
import { BrainDump } from "@/components/brain-dump";
import { ThoughtRow } from "@/components/thought-row";
import { atmospheres, setAtmosphere } from "@/lib/atmosphere";
import { buildIcs, downloadIcs, tomorrowAt } from "@/lib/ics";
import { deleteAllThoughts, openThoughts, thoughtsStore } from "@/lib/thoughts";
import { useHydrated, useStore } from "@/lib/store";

export function ThoughtsScreen() {
  const thoughts = useStore(thoughtsStore);
  const hydrated = useHydrated(thoughtsStore);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    setAtmosphere(atmospheres.quiet);
  }, []);

  const open = openThoughts(thoughts);
  const forTomorrow = open.filter((t) => t.tomorrow);
  const done = thoughts.filter((t) => t.doneAt !== null);

  const calendar = () => {
    const when = tomorrowAt(9);
    downloadIcs(buildIcs(forTomorrow, when));
  };

  return (
    <Screen back="/" title="Parked">
      <div className="flex flex-col gap-8 pt-4">
        <div className="flex flex-col gap-2">
          <h1 className="voice text-[1.625rem] leading-[1.25]">Things you’ve put down.</h1>
          <p className="text-[0.9375rem] text-ink-2">They live on this phone only. Tap one to change it. Nothing here is urgent.</p>
        </div>

        <BrainDump autoFocus={false} tonightOnly={false} allowDone />

        {hydrated && forTomorrow.length > 0 ? (
          <div className="flex flex-col gap-2 border-t border-line pt-5">
            <p className="text-[0.9375rem] text-ink-2">
              {forTomorrow.length === 1 ? "One thing" : `${forTomorrow.length} things`} marked for tomorrow.
            </p>
            <Button variant="secondary" size="md" onClick={calendar} className="self-start">
              Add a 9am calendar reminder
            </Button>
            <p className="text-[0.8125rem] text-ink-3">
              Saves a calendar file to open with your calendar app. A web page can’t set alarms on its own, so your calendar does the reminding.
            </p>
          </div>
        ) : null}

        {hydrated && done.length > 0 ? (
          <div className="flex flex-col gap-2 border-t border-line pt-5">
            <p className="text-[0.9375rem] text-ink-3">Let go</p>
            <ul role="list" className="divide-y divide-line">
              {done.map((t) => (
                <li key={t.id}>
                  <ThoughtRow thought={t} allowDone />
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {hydrated && thoughts.length > 0 ? (
          <div className="border-t border-line pt-5">
            {confirm ? (
              <div className="flex items-center gap-3">
                <p className="text-[0.9375rem] text-ink-2">Delete every thought on this phone?</p>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    deleteAllThoughts();
                    setConfirm(false);
                  }}
                >
                  Delete all
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirm(false)}>
                  Keep
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setConfirm(true)} className="-ml-3 text-ink-3">
                Delete all thoughts
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </Screen>
  );
}
