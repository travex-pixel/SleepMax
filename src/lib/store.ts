import { useSyncExternalStore } from "react";
import { readJSON, writeJSON, type StorageKey } from "./storage";

/*
  A small persisted store built on useSyncExternalStore. The server snapshot is
  always the default value so the first client render matches the HTML; the
  real value loads right after mount and `hydrated` flips to true.
*/

export interface Store<T> {
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  subscribe: (listener: () => void) => () => void;
  isHydrated: () => boolean;
}

export function createStore<T>(key: StorageKey, initial: T, validate?: (v: unknown) => v is T): Store<T> {
  let state = initial;
  let hydrated = false;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  const hydrate = () => {
    if (hydrated) return;
    hydrated = true;
    state = readJSON(key, initial, validate);
    // Defer: subscribe() runs during commit and must not update synchronously.
    queueMicrotask(emit);
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key && e.key.endsWith(":" + key)) {
        state = readJSON(key, initial, validate);
        emit();
      }
    });
  }

  return {
    get: () => state,
    set: (next) => {
      state = typeof next === "function" ? (next as (prev: T) => T)(state) : next;
      writeJSON(key, state);
      emit();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      if (!hydrated) hydrate();
      return () => listeners.delete(listener);
    },
    isHydrated: () => hydrated,
  };
}

export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

export function useHydrated<T>(store: Store<T>): boolean {
  return useSyncExternalStore(store.subscribe, store.isHydrated, () => false);
}
