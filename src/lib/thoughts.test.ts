import { describe, expect, it } from "vitest";
import { addThought, deleteAllThoughts, deleteThought, lastNightStart, openThoughts, thoughtsStore, updateThought } from "./thoughts";
import { storageKeyName } from "./storage";

describe("thoughts", () => {
  it("adds trimmed thoughts newest first and persists them", () => {
    thoughtsStore.set([]);
    addThought("  Finish the report tomorrow  ");
    addThought("Reply to that message");
    const list = thoughtsStore.get();
    expect(list.map((t) => t.text)).toEqual(["Reply to that message", "Finish the report tomorrow"]);
    const raw = window.localStorage.getItem(storageKeyName("thoughts"));
    expect(raw).toContain("Finish the report tomorrow");
  });

  it("ignores empty input", () => {
    thoughtsStore.set([]);
    expect(addThought("   ")).toBeNull();
    expect(thoughtsStore.get()).toHaveLength(0);
  });

  it("edits, flags for tomorrow, marks done and deletes", () => {
    thoughtsStore.set([]);
    const t = addThought("Book the appointment");
    expect(t).not.toBeNull();
    if (!t) return;
    updateThought(t.id, { text: "Book the dentist " });
    expect(thoughtsStore.get()[0]?.text).toBe("Book the dentist");
    updateThought(t.id, { tomorrow: true });
    expect(thoughtsStore.get()[0]?.tomorrow).toBe(true);
    updateThought(t.id, { doneAt: 123 });
    expect(openThoughts(thoughtsStore.get())).toHaveLength(0);
    deleteThought(t.id);
    expect(thoughtsStore.get()).toHaveLength(0);
  });

  it("delete all clears storage too", () => {
    thoughtsStore.set([]);
    addThought("a");
    addThought("b");
    deleteAllThoughts();
    expect(thoughtsStore.get()).toHaveLength(0);
    expect(window.localStorage.getItem(storageKeyName("thoughts"))).toBe("[]");
  });

  it("last night starts at 6pm yesterday in the morning, 6pm today in the evening", () => {
    const morning = new Date(2026, 9, 29, 8, 0, 0);
    const evening = new Date(2026, 9, 29, 23, 0, 0);
    expect(new Date(lastNightStart(morning))).toEqual(new Date(2026, 9, 28, 18, 0, 0));
    expect(new Date(lastNightStart(evening))).toEqual(new Date(2026, 9, 29, 18, 0, 0));
  });
});
