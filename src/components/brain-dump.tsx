"use client";

import { ArrowUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ThoughtRow } from "@/components/thought-row";
import { addThought, draftStore, lastNightStart, openThoughts, thoughtsStore } from "@/lib/thoughts";
import { useHydrated, useStore } from "@/lib/store";

/*
  Brain Dump. The field is ready the moment the screen opens. Enter parks the
  thought; Shift+Enter makes a new line. The draft autosaves so an accidental
  swipe away loses nothing. Thoughts are kept on this device only.
*/

const settled = [
  "It’s parked.",
  "Written down. You can stop holding it.",
  "Kept for tomorrow.",
  "That one can wait.",
  "Parked. Nothing to do with it tonight.",
];

interface BrainDumpProps {
  /** Autofocus the field (opens the keyboard on phones). */
  autoFocus?: boolean;
  /** Only show thoughts from tonight. */
  tonightOnly?: boolean;
  /** Show the "done" control on each row. */
  allowDone?: boolean;
}

export function BrainDump({ autoFocus = true, tonightOnly = true, allowDone = false }: BrainDumpProps) {
  const thoughts = useStore(thoughtsStore);
  const draft = useStore(draftStore);
  const hydrated = useHydrated(thoughtsStore);
  const [settledMsg, setSettledMsg] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLTextAreaElement>(null);
  const msgTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!autoFocus) return;
    // Slight delay so the screen transition finishes before the keyboard rises.
    // Never steal focus from something the user has already tapped.
    const id = window.setTimeout(() => {
      const active = document.activeElement;
      if (active && active !== document.body && active !== ref.current) return;
      ref.current?.focus({ preventScroll: true });
    }, 250);
    return () => window.clearTimeout(id);
  }, [autoFocus]);

  // Grow with content, up to a few lines.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 168) + "px";
  }, [draft]);

  const park = () => {
    const t = addThought(draft);
    if (!t) return;
    draftStore.set("");
    setCount((c) => c + 1);
    setSettledMsg(settled[count % settled.length] ?? settled[0] ?? null);
    if (msgTimer.current) window.clearTimeout(msgTimer.current);
    msgTimer.current = window.setTimeout(() => setSettledMsg(null), 3200);
    ref.current?.focus({ preventScroll: true });
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      park();
    }
  };

  const since = tonightOnly ? lastNightStart() : 0;
  const list = openThoughts(thoughts).filter((t) => t.createdAt >= since);
  const canPark = draft.trim().length > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative border-b border-line-strong transition-colors duration-300 focus-within:border-lamp/70">
        <label htmlFor="brain-dump" className="sr-only">
          What’s still on your mind?
        </label>
        <textarea
          id="brain-dump"
          ref={ref}
          value={draft}
          onChange={(e) => draftStore.set(e.target.value)}
          onKeyDown={onKey}
          placeholder="What’s still on your mind?"
          rows={1}
          enterKeyHint="send"
          autoCapitalize="sentences"
          autoCorrect="on"
          spellCheck={false}
          className="block w-full resize-none bg-transparent py-3 pr-14 text-[1.125rem] leading-relaxed text-ink placeholder:text-ink-3 focus:outline-none"
        />
        <button
          type="button"
          onClick={park}
          disabled={!canPark}
          aria-label="Park this thought"
          className={`absolute bottom-2 right-0 flex h-10 w-10 items-center justify-center rounded-full transition-[background-color,color,opacity] duration-200 ${
            canPark ? "bg-lamp text-lamp-ink" : "bg-ground-raise text-ink-4"
          }`}
        >
          <ArrowUp className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      <div className="min-h-6 pb-2 text-[0.9375rem] text-ink-2" aria-live="polite">
        <AnimatePresence mode="wait">
          {settledMsg ? (
            <motion.p
              key={settledMsg + count}
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {settledMsg}
            </motion.p>
          ) : list.length === 0 && hydrated ? (
            <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-ink-3">
              One thing at a time. Press enter to park it.
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      {hydrated && list.length > 0 ? (
        <ul role="list" aria-label="Parked tonight" className="flex flex-col divide-y divide-line border-t border-line">
          <AnimatePresence initial={false}>
            {list.map((t) => (
              <motion.li
                key={t.id}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <ThoughtRow thought={t} allowDone={allowDone} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : null}
    </div>
  );
}
