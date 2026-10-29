"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Screen } from "@/components/ui/screen";
import { ChoiceList } from "@/components/ui/choice-list";
import { Button } from "@/components/ui/button";
import { paths, type PathId } from "@/content/paths";
import { atmospheres, setAtmosphere } from "@/lib/atmosphere";
import { dispatch, sessionStore } from "@/lib/session";
import { useStore } from "@/lib/store";

export function ChooseScreen() {
  const router = useRouter();
  const session = useStore(sessionStore);

  useEffect(() => {
    setAtmosphere(atmospheres.choose);
  }, []);

  useEffect(() => {
    // Landing here without a session (deep link, stale tab) starts one quietly.
    if (session.step === "idle" || session.step === "ended") dispatch({ type: "START", at: Date.now() });
  }, [session.step]);

  const choose = (id: PathId) => {
    const path = paths.find((p) => p.id === id);
    if (!path) return;
    dispatch({ type: "CHOOSE", path: id, skipUnload: path.skipUnload });
    router.push(path.skipUnload ? "/tonight/unwind" : "/tonight/unload");
  };

  const skip = () => {
    dispatch({ type: "SKIP_CHOICE" });
    router.push("/tonight/unload");
  };

  return (
    <Screen
      back="/"
      backLabel="Back to start"
      title="Tonight"
      footer={
        <Button variant="ghost" size="lg" onClick={skip}>
          Skip this
        </Button>
      }
    >
      <div className="flex flex-col gap-8 pt-4">
        <h1 className="voice text-[1.625rem] leading-[1.25]">What’s going on tonight?</h1>
        <ChoiceList
          ariaLabel="What’s going on tonight"
          large
          choices={paths.map((p) => ({ id: p.id, label: p.choice }))}
          onChoose={choose}
        />
        <p className="text-[0.875rem] text-ink-3">Pick whatever’s closest. You can’t get this wrong.</p>
      </div>
    </Screen>
  );
}
