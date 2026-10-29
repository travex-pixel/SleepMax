import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createStore, useHydrated, useStore } from "./store";
import { storageKeyName } from "./storage";

describe("persisted store", () => {
  it("renders the default first, then the stored value after hydration", async () => {
    window.localStorage.setItem(storageKeyName("draft"), JSON.stringify("saved text"));
    const store = createStore<string>("draft", "", (v): v is string => typeof v === "string");
    function View() {
      const v = useStore(store);
      const h = useHydrated(store);
      return (
        <p>
          {h ? "hydrated" : "fresh"}:{v}
        </p>
      );
    }
    render(<View />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText("hydrated:saved text")).toBeTruthy();
  });

  it("falls back to the default when stored data fails validation", async () => {
    window.localStorage.setItem(storageKeyName("draft"), JSON.stringify({ not: "a string" }));
    const store = createStore<string>("draft", "fallback", (v): v is string => typeof v === "string");
    store.subscribe(() => undefined);
    await act(async () => {
      await Promise.resolve();
    });
    expect(store.get()).toBe("fallback");
  });

  it("writes through to storage on set", () => {
    const store = createStore<string>("draft", "");
    store.set("hello");
    expect(window.localStorage.getItem(storageKeyName("draft"))).toBe('"hello"');
  });
});
