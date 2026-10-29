import { createStore } from "./store";
import { newId } from "./id";

export interface Thought {
  id: string;
  text: string;
  createdAt: number;
  /** The user wants this surfaced tomorrow. */
  tomorrow: boolean;
  /** Set when the user has dealt with it or let it go. */
  doneAt: number | null;
}

function isThought(v: unknown): v is Thought {
  if (!v || typeof v !== "object") return false;
  const t = v as Record<string, unknown>;
  return (
    typeof t.id === "string" &&
    typeof t.text === "string" &&
    typeof t.createdAt === "number" &&
    typeof t.tomorrow === "boolean" &&
    (t.doneAt === null || typeof t.doneAt === "number")
  );
}

function isThoughtList(v: unknown): v is Thought[] {
  return Array.isArray(v) && v.every(isThought);
}

export const thoughtsStore = createStore<Thought[]>("thoughts", [], isThoughtList);

export function addThought(text: string): Thought | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const thought: Thought = { id: newId(), text: trimmed, createdAt: Date.now(), tomorrow: false, doneAt: null };
  thoughtsStore.set((prev) => [thought, ...prev]);
  return thought;
}

export function updateThought(id: string, patch: Partial<Pick<Thought, "text" | "tomorrow" | "doneAt">>): void {
  thoughtsStore.set((prev) =>
    prev.map((t) => {
      if (t.id !== id) return t;
      const next = { ...t, ...patch };
      if (typeof patch.text === "string") next.text = patch.text.trim();
      return next;
    }),
  );
}

export function deleteThought(id: string): void {
  thoughtsStore.set((prev) => prev.filter((t) => t.id !== id));
}

export function deleteAllThoughts(): void {
  thoughtsStore.set([]);
}

/** Thoughts parked since the given time that have not been dealt with. */
export function openThoughts(list: Thought[]): Thought[] {
  return list.filter((t) => t.doneAt === null);
}

/** Start of "last night": 6pm yesterday if it is morning, otherwise 6pm today. */
export function lastNightStart(now = new Date()): number {
  const d = new Date(now);
  if (d.getHours() < 18) d.setDate(d.getDate() - 1);
  d.setHours(18, 0, 0, 0);
  return d.getTime();
}

/* Draft autosave so an accidental swipe away loses nothing. */
export const draftStore = createStore<string>("draft", "", (v): v is string => typeof v === "string");
