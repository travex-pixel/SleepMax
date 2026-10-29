"use client";

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  note?: string;
}

export function ToggleRow({ checked, onChange, label, note }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-14 w-full items-center justify-between gap-4 py-3 text-left"
    >
      <span className="flex flex-col">
        <span className="text-[1rem]">{label}</span>
        {note ? <span className="mt-0.5 text-[0.875rem] text-ink-3">{note}</span> : null}
      </span>
      <span
        aria-hidden="true"
        className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors duration-300 ${
          checked ? "border-lamp bg-lamp/25" : "border-line-strong bg-transparent"
        }`}
      >
        <span
          className={`absolute top-1 h-[18px] w-[18px] rounded-full transition-[left,background-color] duration-300 ease-[var(--ease-settle)] ${
            checked ? "left-[25px] bg-lamp" : "left-1 bg-ink-3"
          }`}
        />
      </span>
    </button>
  );
}
