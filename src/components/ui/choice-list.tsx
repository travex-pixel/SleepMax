"use client";

import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

interface Choice<T extends string> {
  id: T;
  label: ReactNode;
  note?: ReactNode;
}

interface ChoiceListProps<T extends string> {
  choices: Choice<T>[];
  onChoose: (id: T) => void;
  /** When given, rows are selectable and the current one is marked. Otherwise rows navigate. */
  selected?: T | null;
  /** Larger rows for the one-decision screens. */
  large?: boolean;
  ariaLabel: string;
}

/**
 * A column of tappable rows separated by hairlines. No cards, no pills: the
 * text is the control. Navigating rows end in a chevron; selectable rows end
 * in a mark on the current one.
 */
export function ChoiceList<T extends string>({ choices, onChoose, selected, large, ariaLabel }: ChoiceListProps<T>) {
  const selectable = selected !== undefined;
  return (
    <ul role="list" aria-label={ariaLabel} className="divide-y divide-line border-y border-line">
      {choices.map((c) => {
        const active = selectable && selected === c.id;
        return (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onChoose(c.id)}
              aria-pressed={selectable ? active : undefined}
              className={`group flex w-full items-center justify-between gap-4 px-1 text-left text-ink transition-colors duration-200 ${
                large ? "min-h-[4.25rem] py-4" : "min-h-14 py-3"
              }`}
            >
              <span className="flex flex-col">
                <span className={large ? "text-[1.125rem] leading-snug" : "text-[1rem] leading-snug"}>{c.label}</span>
                {c.note ? <span className="mt-0.5 text-[0.875rem] text-ink-3">{c.note}</span> : null}
              </span>
              {selectable ? (
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-300 ${
                    active ? "bg-lamp" : "bg-transparent group-hover:bg-line-strong"
                  }`}
                />
              ) : (
                <ChevronRight
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="h-5 w-5 shrink-0 text-ink-4 transition-[color,transform] duration-200 group-hover:translate-x-0.5 group-hover:text-ink-3"
                />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
