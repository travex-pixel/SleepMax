"use client";

import { Check, Sun, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { deleteThought, updateThought, type Thought } from "@/lib/thoughts";

interface ThoughtRowProps {
  thought: Thought;
  /** Show the "done" control (thoughts page). */
  allowDone?: boolean;
}

/**
 * One parked thought. Tap the text to edit in place. The sun marks it for
 * tomorrow. The cross deletes, with a second tap to confirm so a sleepy thumb
 * can’t lose something by accident.
 */
export function ThoughtRow({ thought, allowDone = false }: ThoughtRowProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(thought.text);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const confirmTimer = useRef<number | null>(null);

  useEffect(() => {
    if (editing) {
      const el = inputRef.current;
      el?.focus();
      el?.setSelectionRange(el.value.length, el.value.length);
    }
  }, [editing]);

  const startEditing = () => {
    setText(thought.text);
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    const next = text.trim();
    if (!next) {
      deleteThought(thought.id);
      return;
    }
    if (next !== thought.text) updateThought(thought.id, { text: next });
  };

  const askDelete = () => {
    if (confirmDelete) {
      deleteThought(thought.id);
      return;
    }
    setConfirmDelete(true);
    confirmTimer.current = window.setTimeout(() => setConfirmDelete(false), 3000);
  };

  useEffect(() => () => {
    if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
  }, []);

  const done = thought.doneAt !== null;

  return (
    <div className={`flex items-start gap-2 py-3 ${done ? "opacity-50" : ""}`}>
      <div className="min-w-0 flex-1">
        {editing ? (
          <>
            <label htmlFor={`edit-${thought.id}`} className="sr-only">
              Edit thought
            </label>
            <textarea
              id={`edit-${thought.id}`}
              ref={inputRef}
              value={text}
              rows={1}
              onChange={(e) => setText(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  commit();
                }
                if (e.key === "Escape") {
                  setText(thought.text);
                  setEditing(false);
                }
              }}
              className="block w-full resize-none bg-transparent text-[1.0625rem] leading-relaxed text-ink focus:outline-none"
            />
          </>
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className={`block w-full whitespace-pre-wrap break-words text-left text-[1.0625rem] leading-relaxed ${
              done ? "line-through decoration-ink-3" : "text-ink"
            }`}
            aria-label={`Edit: ${thought.text}`}
          >
            {thought.text}
          </button>
        )}
        {thought.tomorrow ? <p className="mt-0.5 text-[0.8125rem] text-lamp-deep">For tomorrow</p> : null}
      </div>

      <div className="flex shrink-0 items-center">
        {allowDone ? (
          <button
            type="button"
            onClick={() => updateThought(thought.id, { doneAt: done ? null : Date.now() })}
            aria-label={done ? "Mark as still open" : "Done with this"}
            aria-pressed={done}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
              done ? "text-lamp" : "text-ink-3 hover:text-ink"
            }`}
          >
            <Check className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => updateThought(thought.id, { tomorrow: !thought.tomorrow })}
          aria-label={thought.tomorrow ? "Don’t remind me tomorrow" : "Remind me tomorrow"}
          aria-pressed={thought.tomorrow}
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
            thought.tomorrow ? "text-lamp" : "text-ink-3 hover:text-ink"
          }`}
        >
          <Sun className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={askDelete}
          aria-label={confirmDelete ? "Tap again to delete" : "Delete thought"}
          className={`flex h-10 items-center justify-center rounded-full transition-[color,width] duration-200 ${
            confirmDelete ? "w-auto px-3 text-[0.8125rem] text-danger" : "w-10 text-ink-3 hover:text-ink"
          }`}
        >
          {confirmDelete ? "Delete?" : <X className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
