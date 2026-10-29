"use client";

interface Option<T> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string | number | null> {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
  size?: "md" | "sm";
}

/**
 * A row of text options with a lamp-coloured underline on the current one.
 * Radiogroup semantics; arrow keys move between options.
 */
export function Segmented<T extends string | number | null>({ options, value, onChange, ariaLabel, size = "md" }: SegmentedProps<T>) {
  const idx = options.findIndex((o) => o.value === value);
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex w-full border-b border-line">
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active || (idx === -1 && i === 0) ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                e.preventDefault();
                const dir = e.key === "ArrowRight" ? 1 : -1;
                const next = options[(i + dir + options.length) % options.length];
                if (next) {
                  onChange(next.value);
                  (e.currentTarget.parentElement?.children[(i + dir + options.length) % options.length] as HTMLElement | undefined)?.focus();
                }
              }
            }}
            className={`relative flex-1 whitespace-nowrap px-1 pb-3 pt-2 text-center transition-colors duration-200 ${
              size === "sm" ? "text-[0.875rem]" : "text-[0.9375rem]"
            } ${active ? "text-ink" : "text-ink-3 hover:text-ink-2"}`}
          >
            {o.label}
            <span
              aria-hidden="true"
              className={`absolute inset-x-1 -bottom-px h-px transition-colors duration-300 ${active ? "bg-lamp" : "bg-transparent"}`}
            />
          </button>
        );
      })}
    </div>
  );
}
