"use client";

import { useEffect } from "react";
import { MotionConfig } from "motion/react";
import { prefsStore } from "@/lib/prefs";
import { useStore } from "@/lib/store";

/**
 * Applies the user’s motion choice to the document. "system" defers to
 * prefers-reduced-motion; "reduce" forces it. Also sets `data-motion` so the
 * CSS transitions can honour the override.
 */
export function MotionPreference({ children }: { children?: React.ReactNode }) {
  const prefs = useStore(prefsStore);
  useEffect(() => {
    document.documentElement.dataset.motion = prefs.motion === "reduce" ? "reduce" : "system";
  }, [prefs.motion]);
  return <MotionConfig reducedMotion={prefs.motion === "reduce" ? "always" : "user"}>{children}</MotionConfig>;
}
