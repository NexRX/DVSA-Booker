import {
  persistentMap,
  setPersistentEngine,
} from "nanostores-persistent-solid";
import { STATE_LOADED } from "./chromeStorageEngine";

export type TState = {
  version: 0;
  enabled: boolean;
  loaded: boolean;
};

const initialStateV0 = {
  version: 0,
  enabled: true,
  loaded: false,
} as const;

export const $state = persistentMap<TState>("state:", initialStateV0, {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export function updateEnabled(enable?: boolean) {
  const current = $state.get().enabled;
  const enabled = enable ?? current;
  if (enabled !== current) {
    $state.setKey("enabled", enabled);
  }
}

const unsubscribe = $state.listen((newState) => {
  if (newState.loaded) {
    console.log("Loaded state");
    window.dispatchEvent(new Event(STATE_LOADED));
    unsubscribe(); // Only fire once
  }
});
