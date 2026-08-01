"use client";
import { useCallback, useSyncExternalStore } from "react";

// One tiny external store per localStorage key, so reads go through
// useSyncExternalStore (SSR-safe: server/first-paint snapshot is always the
// default, real data attaches after) instead of a setState-in-effect hydration
// dance.
const stores = new Map();

function getStore(key, defaultValue) {
  let store = stores.get(key);
  if (store) return store;

  let cache = defaultValue;
  let hydrated = false;
  const listeners = new Set();

  function readFromStorage() {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  store = {
    getSnapshot() {
      if (!hydrated) {
        cache = readFromStorage();
        hydrated = true;
      }
      return cache;
    },
    getServerSnapshot() {
      return defaultValue;
    },
    subscribe(callback) {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    setValue(updater) {
      const next = typeof updater === "function" ? updater(cache) : updater;
      cache = next;
      hydrated = true;
      try { window.localStorage.setItem(key, JSON.stringify(next)); } catch { /* storage unavailable */ }
      listeners.forEach((l) => l());
    },
  };
  stores.set(key, store);
  return store;
}

export function useLocalStorageState(key, defaultValue) {
  const store = getStore(key, defaultValue);
  const value = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const setValue = useCallback((updater) => store.setValue(updater), [store]);
  return [value, setValue];
}
