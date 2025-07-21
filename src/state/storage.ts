// utils/storageSignal.ts
import { createSignal } from "solid-js";
import { debounce } from "lodash-es";

export const storage: "sync" | "local" | "managed" | "session" = "local";

// Debounce duration in milliseconds
const DEBOUNCE_MS = 100;

export function createStorageSignal<T extends Object>(
  key: string,
  defaultValue: T
) {
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
