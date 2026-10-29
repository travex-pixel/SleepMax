"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Settings2 } from "lucide-react";
import { Screen } from "@/components/ui/screen";
import { Button, LinkButton } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";
import { atmospheres, setAtmosphere } from "@/lib/atmosphere";
import { dispatch, isResumable, sessionStore, stepPath, hadSessionLastNight } from "@/lib/session";
import { useHydrated, useStore } from "@/lib/store";
import { lastNightStart, openThoughts, thoughtsStore } from "@/lib/thoughts";
import { checkinsStore, isMorning, localDay } from "@/lib/checkins";
import { prefsStore, setPref } from "@/lib/prefs";

const stepName: Record<string, string> = {
  choose: "choosing",
  unload: "putting things down",
  unwind: "the wind-down",
  drift: "the sound",
};

export function HomeScreen() {
  const router = useRouter();
  const session = useStore(sessionStore);
  const thoughts = useStore(thoughtsStore);
  const checkins = useStore(checkinsStore);
  const prefs = useStore(prefsStore);
  const hydrated = useHydrated(sessionStore);

  useEffect(() => {
    setAtmosphere(atmospheres.home);
  }, []);

  const resumable = hydrated && isResumable(session);
  const morning = hydrated && isMorning();
  const checkedInToday = checkins.some((c) => c.day === localDay());
  const offerCheckIn = morning && hadSessionLastNight(session, lastNightStart()) && !checkedInToday;
  const forToday = openThoughts(thoughts).filter((t) => t.tomorrow);
  const parkedCount = openThoughts(thoughts).length;

  const start = () => {
    dispatch({ type: "START", at: Date.now() });
    if (!prefs.returning) setPref("returning", true);
    router.push("/tonight/choose");
  };

  const playSomething = () => {
    dispatch({ type: "PLAY_SOUND", at: Date.now(), sound: prefs.sound });
    if (!prefs.returning) setPref("returning", true);
    router.push("/sounds");
  };

  return (
    <Screen
      center
      horizon="fixed"
      lead={<Wordmark />}
      aside={
        <Link
          href="/settings"
          aria-label="Settings"
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-ink-3 hover:text-ink"
        >
          <Settings2 className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </Link>
      }
      footer={
        <div className="flex flex-col gap-3">
          <Button variant="primary" size="lg" onClick={start}>
            Help me switch off
          </Button>
          <Button variant="ghost" size="lg" onClick={playSomething}>
            Just play something calming
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-10 pb-10">
        <h1 className="voice text-[2rem] leading-[1.2] text-ink sm:text-[2.25rem]">
          Nothing else needs you right now.
        </h1>

        {hydrated ? (
          <div className="flex flex-col gap-3 text-[0.9375rem] text-ink-2">
            {resumable ? (
              <LinkButton href={stepPath[session.step as keyof typeof stepPath]} variant="secondary" size="md" className="self-start">
                Pick up where you left off · {stepName[session.step]}
              </LinkButton>
            ) : null}
            {offerCheckIn ? (
              <p>
                Good morning.{" "}
                <Link href="/morning" className="text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                  A quick check-in?
                </Link>
              </p>
            ) : null}
            {forToday.length > 0 && morning ? (
              <p>
                You parked {forToday.length === 1 ? "one thing" : `${forToday.length} things`} for today.{" "}
                <Link href="/thoughts" className="text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                  Have a look
                </Link>
              </p>
            ) : parkedCount > 0 ? (
              <p>
                <Link href="/thoughts" className="text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink">
                  {parkedCount === 1 ? "One thought parked" : `${parkedCount} thoughts parked`}
                </Link>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </Screen>
  );
}
