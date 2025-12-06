// utils/storageSignal.ts
import { createSignal } from "solid-js";
import { debounce } from "lodash-es";

export const storage: "sync" | "local" | "managed" | "session" = "local";

// Debounce duration in milliseconds
const DEBOUNCE_MS = 100;

export function createStorageSignal<T extends Object>(key: string, defaultValue: T) {
  const [value, setValue] = createSignal<T>(defaultValue, { equals: false });

  // Load initial value from chrome.storage
  chrome.storage[storage].get(key, (result) => {
    if (result[key]) {
      setValue(result[key]);
    } else {
      chrome.storage[storage].set({ [key]: defaultValue });
    }
  });

  // Watch for external changes (e.g. other tabs or extension pages)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === storage && changes[key]) {
      setValue(changes[key].newValue);
    }
  });

  // Debounced persist function
  const debouncedSet = debounce((newVal: T) => {
    chrome.storage[storage].set({ [key]: newVal });
  }, DEBOUNCE_MS);

  // Persist on local change
  const updateValue = (newVal: T) => {
    setValue(newVal as any);
    debouncedSet(newVal);
  };

  return [value, updateValue] as const;
}

export const storageNative = {
  /**
   * Get a value from browser.storage.local, falling back to defaultValue if not set.
   * @param key The storage key.
   * @param defaultValue The value to return if nothing is stored.
   */
  async get<T>(key: string, defaultValue: T): Promise<T> {
    // @ts-ignore
    const api = typeof browser !== "undefined" ? browser : chrome;
    const result = await api.storage.local.get(key);
    return result[key] ?? defaultValue;
  },

  /**
   * Set a value in browser.storage.local.
   * @param key The storage key.
   * @param value The value to store.
   */
  async set<T>(key: string, value: T): Promise<void> {
    // @ts-ignore
    const api = typeof browser !== "undefined" ? browser : chrome;
    await api.storage.local.set({ [key]: value });
  },
};

export async function ifNeededMigrate<T>(value: T, defaultValue: T, setter: (value: T) => Promise<void>): Promise<TConfig> {
  let migrated = false;
  for (const key in defaultValue) {
    if (
      value[key as keyof T] === undefined &&
      defaultValue[key as keyof T] !== undefined &&
      value[key as keyof T] !== defaultValue[key as keyof T]
    ) {
      // @ts-ignore
      config[key as keyof TConfig] = configDefaultV0[key as keyof TConfig];
      migrated = true;
    }
  }

  if (migrated) await setter(value);
  return value;
}
