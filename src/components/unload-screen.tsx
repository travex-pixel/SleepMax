"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Screen } from "@/components/ui/screen";
import { Button } from "@/components/ui/button";
import { BrainDump } from "@/components/brain-dump";
import { atmospheres, setAtmosphere } from "@/lib/atmosphere";
import { dispatch, sessionStore } from "@/lib/session";
import { useStore } from "@/lib/store";
import { lastNightStart, openThoughts, thoughtsStore } from "@/lib/thoughts";

export function UnloadScreen() {
  const router = useRouter();
  const session = useStore(sessionStore);
  const thoughts = useStore(thoughtsStore);

  useEffect(() => {
    setAtmosphere(atmospheres.unload);
  }, []);

  useEffect(() => {
    if (session.step === "idle" || session.step === "ended") dispatch({ type: "START", at: Date.now() });
  }, [session.step]);

  const tonight = openThoughts(thoughts).filter((t) => t.createdAt >= lastNightStart());
  const hasSome = tonight.length > 0;

  const next = () => {
    dispatch({ type: "UNLOAD_DONE" });
    router.push("/tonight/unwind");
  };

  return (
    <Screen
      back="/tonight/choose"
      title="Put it down"
      footer={
        <div className="flex flex-col gap-3">
          <Button variant={hasSome ? "primary" : "secondary"} size="lg" onClick={next}>
            {hasSome ? "That’s enough. Keep going" : "Nothing to put down. Keep going"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 pt-4">
        <div className="flex flex-col gap-2">
          <h1 className="voice text-[1.625rem] leading-[1.25]">You don’t have to solve any of this tonight.</h1>
          <p className="text-[0.9375rem] text-ink-2">Put it here instead. It stays on this phone and will be here in the morning.</p>
        </div>
        <BrainDump />
      </div>
    </Screen>
  );
}
