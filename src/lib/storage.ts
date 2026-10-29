/*
  Local-first persistence. Everything OFFMODE remembers lives in this browser's
  localStorage under versioned keys. Nothing here is ever sent anywhere.

  Browser storage is honest about its limits: clearing site data, private
  windows and some storage-pressure situations can empty it. The UI says so.
*/

const PREFIX = "offmode:v1:";

export type StorageKey = "thoughts" | "prefs" | "session" | "checkins" | "draft";

function available(): boolean {
  try {
    if (typeof window === "undefined") return false;
    const probe = `${PREFIX}probe`;
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

let cachedAvailable: boolean | null = null;
export function storageAvailable(): boolean {
  if (cachedAvailable === null) cachedAvailable = available();
  return cachedAvailable;
}

export function readJSON<T>(key: StorageKey, fallback: T, validate?: (v: unknown) => v is T): T {
  if (!storageAvailable()) return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (validate && !validate(parsed)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: StorageKey, value: T): void {
  if (!storageAvailable()) return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Quota or privacy mode: the in-memory state still works for this visit.
  }
}

export function remove(key: StorageKey): void {
  if (!storageAvailable()) return;
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}

export function clearAll(): void {
  if (!storageAvailable()) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
    for (const k of keys) window.localStorage.removeItem(k);
  } catch {
    // ignore
  }
}

export function storageKeyName(key: StorageKey): string {
  return PREFIX + key;
}
