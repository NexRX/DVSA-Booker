import { setPersistentEngine } from "nanostores-persistent-solid";
import type {
  PersistentListener,
  PersistentEvent,
} from "nanostores-persistent-solid";
export const STATE_LOADED = "dvsaBooker:state:loaded";

/**
 * Sets up Chrome Storage as the persistent engine for nanostores
 * Call this once at the start of your extension
 */
export function setupChromeStorage(storageArea: "local" | "sync" = "local") {
  const storage = chrome.storage[storageArea];
  const listeners: PersistentListener[] = [];
  // Flag to prevent feedback loop between local writes and storage change events
  let ignoreNextStorageEvent: Record<string, boolean> = {};

  // Create a storage-like object that nanostores can use
  const storageEngine = new Proxy(
    {},
    {
      set(target, key: string, value: string) {
        console.log(
          `Setting ${key} to ${value} in chrome.storage.${storageArea}`
        );
        target[key] = value;

        // Save to Chrome storage
        ignoreNextStorageEvent[key] = true;
        storage.set({ [key]: value }).catch((error) => {
          console.error(
            `Failed to set ${key} in chrome.storage.${storageArea}:`,
            error
          );
        });

        // Notify listeners
        const event: PersistentEvent = { key, newValue: value };
        listeners.forEach((listener) => listener(event));

        return true;
      },

      get(target, key: string) {
        console.log("get key");
        return target[key];
      },

      deleteProperty(target, key: string) {
        delete target[key];

        // Remove from Chrome storage
        storage.remove(key).catch((error) => {
          console.error(
            `Failed to remove ${key} from chrome.storage.${storageArea}:`,
            error
          );
        });

        // Notify listeners
        const event: PersistentEvent = { key, newValue: null };
        listeners.forEach((listener) => listener(event));

        return true;
      },
    }
  );

  // Event system for cross-tab synchronization
  const events = {
    addEventListener(key: string, callback: PersistentListener) {
      console.log(`Adding listener for ${key}`);
      listeners.push(callback);
    },

    removeEventListener(key: string, callback: PersistentListener) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    },

    // Chrome storage changes are global, so one listener for all keys is enough
    perKey: false,
  };

  // Listen for Chrome storage changes (from other tabs/contexts)
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === storageArea) {
      Object.keys(changes).forEach((key) => {
        // Prevent feedback loop: ignore events caused by our own writes
        if (ignoreNextStorageEvent[key]) {
          ignoreNextStorageEvent[key] = false;
          return;
        }
        const change = changes[key];
        const event: PersistentEvent = {
          key,
          newValue: change.newValue,
        };

        // Update local proxy cache
        if (change.newValue !== undefined) {
          storageEngine[key] = change.newValue;
          // Notify listeners
          listeners.forEach((listener) => listener(event));
        } else {
          delete storageEngine[key];
          // Notify listeners with null instead of undefined
          const event: PersistentEvent = { key, newValue: null };
          listeners.forEach((listener) => listener(event));
        }
      });
    }
  });

  // Load existing data from Chrome storage
  storage
    .get()
    .then((items) => {
      Object.assign(storageEngine, items);
    })
    .catch((error) => {
      console.error(
        `Failed to load data from chrome.storage.${storageArea}:`,
        error
      );
    });

  // Set the engine globally for nanostores
  setPersistentEngine(storageEngine, events);
  console.log(
    `Initialized chrome.storage.${storageArea} engine for persistent state`
  );
}
