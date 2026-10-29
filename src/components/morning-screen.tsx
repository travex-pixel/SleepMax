"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { Screen } from "@/components/ui/screen";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { atmospheres, setAtmosphere } from "@/lib/atmosphere";
import { pathName } from "@/content/paths";
import { soundName } from "@/lib/audio/presets";
import {
  checkinsStore,
  describePatterns,
  localDay,
  restedLabel,
  type Helped,
  type NextTime,
  type Rested,
} from "@/lib/checkins";
import { newId } from "@/lib/id";
import { sessionStore } from "@/lib/session";
import { useHydrated, useStore } from "@/lib/store";
import { openThoughts, thoughtsStore } from "@/lib/thoughts";

const helpedOptions: { id: Helped; label: string }[] = [
  { id: "writing", label: "Writing things down" },
  { id: "guidance", label: "The wind-down" },
  { id: "sound", label: "The sound" },
  { id: "nothing", label: "Nothing much, honestly" },
];

export function MorningScreen() {
  const router = useRouter();
  const checkins = useStore(checkinsStore);
  const session = useStore(sessionStore);
  const thoughts = useStore(thoughtsStore);
  const hydrated = useHydrated(checkinsStore);

  const [rested, setRested] = useState<Rested>(3);
  const [helped, setHelped] = useState<Helped[]>([]);
  const [next, setNext] = useState<NextTime>("same");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setAtmosphere(atmospheres.morning);
  }, []);

  const today = localDay();
  const already = checkins.find((c) => c.day === today);
  const forToday = openThoughts(thoughts).filter((t) => t.tomorrow);
  const patterns = describePatterns(checkins, soundName, pathName);

  const toggleHelped = (id: Helped) => {
    setHelped((h) => {
      if (id === "nothing") return h.includes("nothing") ? [] : ["nothing"];
      const without = h.filter((x) => x !== "nothing");
      return without.includes(id) ? without.filter((x) => x !== id) : [...without, id];
    });
  };

  const save = () => {
    checkinsStore.set((prev) => [
      {
        id: newId(),
        day: today,
        at: Date.now(),
        rested,
        helped,
        nextTime: next,
        path: session.path,
        sound: session.sound,
      },
      ...prev.filter((c) => c.day !== today),
    ]);
    setSaved(true);
  };

  const done = saved || !!already;

  return (
    <Screen
      back="/"
      title="Morning"
      footer={
        !done ? (
          <Button variant="primary" size="lg" onClick={save}>
            That’s it
          </Button>
        ) : (
          <Button variant="secondary" size="lg" onClick={() => router.push("/")}>
            Back to start
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-8 pt-4">
        {!done ? (
          <>
            <h1 className="voice text-[1.625rem] leading-[1.25]">Morning. Three quick things, then you’re done.</h1>

            <section className="flex flex-col gap-3">
              <h2 className="text-[1rem] text-ink-2">How rested do you feel?</h2>
              <Segmented<Rested>
                ariaLabel="How rested"
                size="sm"
                value={rested}
                onChange={setRested}
                options={([1, 2, 3, 4, 5] as Rested[]).map((r) => ({ value: r, label: restedLabel[r].replace("Fairly rested", "Fairly") }))}
              />
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-[1rem] text-ink-2">Did anything help last night?</h2>
              <ul role="list" aria-label="What helped" className="divide-y divide-line border-y border-line">
                {helpedOptions.map((o) => {
                  const on = helped.includes(o.id);
                  return (
                    <li key={o.id}>
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleHelped(o.id)}
                        className="flex min-h-14 w-full items-center justify-between gap-4 px-1 py-3 text-left"
                      >
                        <span className={on ? "text-ink" : "text-ink-2"}>{o.label}</span>
                        <span
                          aria-hidden="true"
                          className={`flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${
                            on ? "border-lamp text-lamp" : "border-line-strong text-transparent"
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-[1rem] text-ink-2">Next time, would you like it…</h2>
              <Segmented<NextTime>
                ariaLabel="Next time"
                size="sm"
                value={next}
                onChange={setNext}
                options={[
                  { value: "same", label: "The same" },
                  { value: "shorter", label: "Shorter" },
                  { value: "longer", label: "Longer" },
                  { value: "quieter", label: "Quieter" },
                ]}
              />
            </section>
          </>
        ) : (
          <>
            <h1 className="voice text-[1.625rem] leading-[1.25]">Thanks. That’s all for this morning.</h1>
            {already && !saved ? <p className="text-[0.9375rem] text-ink-2">You’ve already checked in today.</p> : null}
          </>
        )}

        {hydrated && forToday.length > 0 ? (
          <section className="flex flex-col gap-2 border-t border-line pt-5">
            <h2 className="text-[1rem] text-ink-2">Parked for today</h2>
            <ul role="list" className="flex flex-col gap-1">
              {forToday.map((t) => (
                <li key={t.id} className="text-[1.0625rem]">
                  {t.text}
                </li>
              ))}
            </ul>
            <Link href="/thoughts" className="self-start text-[0.9375rem] text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink">
              Open the list
            </Link>
          </section>
        ) : null}

        {hydrated && patterns.length > 0 ? (
          <section className="flex flex-col gap-2 border-t border-line pt-5">
            <h2 className="text-[1rem] text-ink-2">What you’ve told us so far</h2>
            <ul role="list" className="flex flex-col gap-2 text-[0.9375rem] text-ink-2">
              {patterns.map((p) => (
                <li key={p.text}>{p.text}</li>
              ))}
            </ul>
            <p className="text-[0.8125rem] text-ink-3">These are your own words, summarised. They don’t measure sleep.</p>
          </section>
        ) : hydrated && checkins.length > 0 ? (
          <p className="border-t border-line pt-5 text-[0.875rem] text-ink-3">
            After a few more mornings this page can describe what you’ve said helped. Nothing is guessed.
          </p>
        ) : null}
      </div>
    </Screen>
  );
}
